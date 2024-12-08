import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import GithubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/db/prisma";
import nodemailer from 'nodemailer';
import { findKind0Fields } from "@/utils/nostr";
import { generateSecretKey, getPublicKey } from 'nostr-tools/pure';
import { bytesToHex } from '@noble/hashes/utils';
import { updateUser, getUserByPubkey, createUser, getUserById, getUserByEmail } from "@/db/models/userModels";
import { createRole } from "@/db/models/roleModels";
import appConfig from "@/config/appConfig";
import NDK from "@nostr-dev-kit/ndk";

// Initialize NDK for Nostr interactions
const ndk = new NDK({
    explicitRelayUrls: appConfig.defaultRelayUrls
});

/**
 * Handles Nostr profile synchronization and user creation/update
 * @param {string} pubkey - User's public key
 * @returns {Promise<Object|null>} User object or null if failed
 */
const syncNostrProfile = async (pubkey) => {
    await ndk.connect();
    const user = ndk.getUser({ pubkey });

    try {
        const profile = await user.fetchProfile();
        const fields = await findKind0Fields(profile);
        let dbUser = await getUserByPubkey(pubkey);

        if (dbUser) {
            // Update existing user if kind0 fields differ
            if (fields.avatar !== dbUser.avatar || fields.username !== dbUser.username) {
                const updates = {
                    ...(fields.avatar !== dbUser.avatar && { avatar: fields.avatar }),
                    ...(fields.username !== dbUser.username && { 
                        username: fields.username, 
                        name: fields.username 
                    })
                };
                await updateUser(dbUser.id, updates);
                dbUser = await getUserByPubkey(pubkey);
            }
        } else {
            // Create new user
            const username = fields.username || pubkey.slice(0, 8);
            const payload = { 
                pubkey, 
                username, 
                avatar: fields.avatar, 
                name: username 
            };

            dbUser = await createUser(payload);

            // Create author role if applicable
            if (appConfig.authorPubkeys.includes(pubkey)) {
                const role = await createRole({
                    userId: dbUser.id,
                    admin: true,
                    subscribed: false,
                });
                
                if (role) {
                    await updateUser(dbUser.id, { role: role.id });
                    dbUser = await getUserByPubkey(pubkey);
                }
            }
        }

        return { ...dbUser, kind0: fields };
    } catch (error) {
        console.error("Nostr profile sync error:", error);
        return null;
    }
};

/**
 * Generates an ephemeral keypair for non-Nostr login methods
 * @returns {Object} Object containing public and private keys
 */
const generateEphemeralKeypair = () => {
    const privkey = generateSecretKey();
    const pubkey = getPublicKey(privkey);
    // pubkey is hex, privkey is bytes need to convert to hex
    return {
        pubkey,
        privkey: bytesToHex(privkey)
    };
};

export const authOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        // Nostr login provider
        CredentialsProvider({
            id: "nostr",
            name: "Nostr",
            credentials: {
                pubkey: { label: "Public Key", type: "text" }
            },
            authorize: async (credentials) => {
                if (!credentials?.pubkey) return null;
                return await syncNostrProfile(credentials.pubkey);
            }
        }),

        // Anonymous login provider
        CredentialsProvider({
            id: "anonymous",
            name: "Anonymous",
            credentials: {
                pubkey: { label: "Public Key", type: "text" },
                privkey: { label: "Private Key", type: "text" }
            },
            authorize: async (credentials) => {
                const keys = (credentials?.pubkey && credentials?.pubkey !== 'null' && credentials?.privkey && credentials?.privkey !== 'null') ? 
                    { pubkey: credentials.pubkey, privkey: credentials.privkey } : 
                    generateEphemeralKeypair();

                let user = await getUserByPubkey(keys.pubkey);
                if (!user) {
                    user = await createUser({
                        ...keys,
                        username: `anon-${keys.pubkey.slice(0, 8)}`,
                        name: `anon-${keys.pubkey.slice(0, 8)}`
                    });
                }
                return { ...user, privkey: keys.privkey };
            }
        }),

        // Email provider with simpler configuration
        EmailProvider({
            server: {
                host: process.env.EMAIL_SERVER_HOST,
                port: process.env.EMAIL_SERVER_PORT,
                auth: {
                    user: process.env.EMAIL_SERVER_USER,
                    pass: process.env.EMAIL_SERVER_PASSWORD
                }
            },
            from: process.env.EMAIL_FROM
        }),

        // Github provider with ephemeral keypair generation
        GithubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            profile: async (profile) => {
                const keys = generateEphemeralKeypair();
                return {
                    id: profile.id.toString(),
                    pubkey: keys.pubkey,
                    privkey: keys.privkey,
                    name: profile.login,
                    email: profile.email,
                    avatar: profile.avatar_url
                };
            }
        })
    ],
    callbacks: {
        // Move email handling to the signIn callback
        async signIn({ user, account, profile, email }) {
            // Only handle email provider sign ins
            if (account?.provider === "email") {
                try {
                    // Check if this is an existing user
                    const existingUser = await getUserByEmail(user.email);
                    
                    if (!existingUser && user) {
                        // First time login: generate keypair
                        const keys = generateEphemeralKeypair();

                        const newUser = {
                            pubkey: keys.pubkey,
                            privkey: keys.privkey,
                            username: user.email.split('@')[0],
                            email: user.email,
                            avatar: user.image,
                            name: user.email.split('@')[0],
                        }
                        
                        // Update the user with the new keypair
                        const createdUser = await createUser(newUser);
                        console.log("Created user", createdUser);
                        return createdUser;
                    } else {
                        console.log("User already exists", existingUser);
                    }
                    
                    return true;
                } catch (error) {
                    console.error("Email sign in error:", error);
                    return false;
                }
            }
            
            return true; // Allow other provider sign ins
        },
        async session({ session, user, token }) {
            const userData = token.user || user;
            
            if (userData) {
                const fullUser = await getUserById(userData.id);
                
                // Get the user's GitHub account if it exists
                const githubAccount = await prisma.account.findFirst({
                    where: {
                        userId: fullUser.id,
                        provider: 'github'
                    }
                });
                
                session.user = {
                    ...session.user,
                    id: fullUser.id,
                    pubkey: fullUser.pubkey,
                    privkey: fullUser.privkey,
                    role: fullUser.role,
                    username: fullUser.username,
                    avatar: fullUser.avatar,
                    name: fullUser.name,
                    userCourses: fullUser.userCourses,
                    userLessons: fullUser.userLessons,
                    purchased: fullUser.purchased,
                    nip05: fullUser.nip05,
                    lightningAddress: fullUser.lightningAddress
                };

                // Add GitHub account info to session if it exists
                if (githubAccount) {
                    session.account = {
                        provider: githubAccount.provider,
                        type: githubAccount.type,
                        providerAccountId: githubAccount.providerAccountId,
                        access_token: githubAccount.access_token,
                        token_type: githubAccount.token_type,
                        scope: githubAccount.scope,
                    };
                }
            }
            return session;
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.user = user;
            }
            // Also store the account info in the token if it exists
            if (account) {
                token.account = account;
            }
            return token;
        }
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);
