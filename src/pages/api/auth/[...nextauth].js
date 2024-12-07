import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/db/prisma";
import nodemailer from 'nodemailer';
import { findKind0Fields } from "@/utils/nostr";
import { generateSecretKey, getPublicKey } from 'nostr-tools/pure'
import { bytesToHex } from '@noble/hashes/utils'
import { updateUser, getUserByPubkey, createUser, getUserById } from "@/db/models/userModels";
import { createRole } from "@/db/models/roleModels";
import appConfig from "@/config/appConfig";
import GithubProvider from "next-auth/providers/github";
import NDK from "@nostr-dev-kit/ndk";

// todo: currently email accounts ephemeral privkey gets saved to db but not anon user, is this required at all given the newer auth setup?

const ndk = new NDK({
    explicitRelayUrls: appConfig.defaultRelayUrls
})

const authorize = async (pubkey) => {
    await ndk.connect();
    const user = ndk.getUser({ pubkey });

    try {
        const profile = await user.fetchProfile();

        // Check if user exists, create if not
        let dbUser = await getUserByPubkey(pubkey);

        if (dbUser) {
            const fields = await findKind0Fields(profile);
            // Only update 'avatar' or 'username' if they are different from kind0 fields on the dbUser
            if (fields.avatar !== dbUser.avatar) {
                const updatedUser = await updateUser(dbUser.id, { avatar: fields.avatar });
                if (updatedUser) {
                    dbUser = await getUserByPubkey(pubkey);
                }
            } else if (fields.username !== dbUser.username) {
                const updatedUser = await updateUser(dbUser.id, { username: fields.username, name: fields.username });
                if (updatedUser) {
                    dbUser = await getUserByPubkey(pubkey);
                }
            }
            // add the kind0 fields to the user
            const combinedUser = { ...dbUser, kind0: fields };

            return combinedUser;
        } else {
            // Create user
            if (profile) {
                const fields = await findKind0Fields(profile);
                const payload = { pubkey, username: fields.username, avatar: fields.avatar, name: fields.username };

                if (appConfig.authorPubkeys.includes(pubkey)) {
                    // create a new author role for this user
                    const createdUser = await createUser(payload);
                    const role = await createRole({
                        userId: createdUser.id,
                        admin: true,
                        subscribed: false,
                    });

                    if (!role) {
                        console.error("Failed to create role");
                        return null;
                    }

                    const updatedUser = await updateUser(createdUser.id, { role: role.id });
                    if (!updatedUser) {
                        console.error("Failed to update user");
                        return null;
                    }

                    const fullUser = await getUserByPubkey(pubkey);

                    return { ...fullUser, kind0: fields };
                } else {
                    dbUser = await createUser(payload);
                    return { ...dbUser, kind0: fields };
                }
            }
        }
    } catch (error) {
        console.error("Nostr login error:", error);
    }
    return null;
}

export const authOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            id: "nostr",
            name: "Nostr",
            credentials: {
                pubkey: { label: "Public Key", type: "text" },
            },
            authorize: async (credentials) => {
                if (credentials?.pubkey) {
                    return await authorize(credentials.pubkey);
                }
                return null;
            },
        }),
        EmailProvider({
            server: {
                host: process.env.EMAIL_SERVER_HOST,
                port: process.env.EMAIL_SERVER_PORT,
                auth: {
                    user: process.env.EMAIL_SERVER_USER,
                    pass: process.env.EMAIL_SERVER_PASSWORD
                }
            },
            from: process.env.EMAIL_FROM,
            sendVerificationRequest: async ({ identifier, url, provider }) => {
                // Use nodemailer to send the email
                const transport = nodemailer.createTransport(provider.server);
                await transport.sendMail({
                    to: identifier,
                    from: provider.from,
                    subject: `Sign in to ${new URL(url).host}`,
                    text: `Sign in to ${new URL(url).host}\n${url}\n\n`,
                    html: `<p>Sign in to <strong>${new URL(url).host}</strong></p><p><a href="${url}">Sign in</a></p>`,
                });
            }
        }),
        GithubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            profile: async (profile) => {
                return {
                    id: profile.id.toString(),
                    name: profile.login,
                    email: profile.email,
                    avatar: profile.avatar_url
                }
            }
        }),
        CredentialsProvider({
            id: "anonymous",
            name: "Anonymous",
            credentials: {
                pubkey: { label: "Public Key", type: "text" },
                privkey: { label: "Private Key", type: "text" },
            },
            authorize: async (credentials) => {
                let pubkey, privkey;

                if (credentials?.pubkey && credentials?.pubkey !== "null" && credentials?.privkey && credentials?.privkey !== "null") {
                    // Use provided keys
                    pubkey = credentials.pubkey;
                    privkey = credentials.privkey;
                } else {
                    // Generate new keys
                    const sk = generateSecretKey();
                    pubkey = getPublicKey(sk);
                    privkey = bytesToHex(sk);
                }

                // Check if user exists in the database
                let dbUser = await getUserByPubkey(pubkey);

                if (!dbUser) {
                    // Create new user if not exists
                    dbUser = await createUser({
                        pubkey: pubkey,
                        username: pubkey.slice(0, 8),
                    });
                } else {
                    // Check if this user has a linked GitHub account
                    const githubAccount = await prisma.account.findFirst({
                        where: {
                            userId: dbUser.id,
                            provider: 'github'
                        },
                        include: {
                            user: true
                        }
                    });

                    if (githubAccount) {
                        // Return the user with GitHub provider information
                        return {
                            ...dbUser,
                            pubkey,
                            privkey,
                            // Add these fields to switch to GitHub provider
                            provider: 'github',
                            type: 'oauth',
                            providerAccountId: githubAccount.providerAccountId
                        };
                    }
                }

                // Return user object with pubkey and privkey
                return { ...dbUser, pubkey, privkey };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, account, trigger, profile }) {
            if (user?.provider === 'github') {
                // User has a linked GitHub account, use that as the primary provider
                token.account = {
                    provider: 'github',
                    type: 'oauth',
                    providerAccountId: user.providerAccountId
                };
                // Add GitHub profile information
                token.githubProfile = {
                    login: user.username,
                    avatar_url: user.avatar,
                    email: user.email
                };
            } else if (account) {
                // Store GitHub-specific information
                if (account.provider === 'github') {
                    token.account = account;
                    token.githubProfile = {
                        login: profile?.login,
                        avatar_url: profile?.avatar_url,
                        email: profile?.email,
                    };
                }
            }

            if (trigger === "update" && account?.provider !== "anonymous") {
                // if we trigger an update call the authorize function again
                const newUser = await authorize(token.user.pubkey);
                token.user = newUser;
            }

            // if we sign up with email and we don't have a pubkey or privkey, we need to generate them
            if (trigger === "signUp" && account?.provider === "email" && !user.pubkey && !user.privkey) {
                const sk = generateSecretKey();
                const pubkey = getPublicKey(sk);
                const privkey = bytesToHex(sk);

                // Update the user in the database
                await prisma.user.update({
                    where: { id: user.id },
                    data: { pubkey, privkey }
                });

                // Update the user object
                user.pubkey = pubkey;
                user.privkey = privkey;
            }

            // Add new condition for first-time GitHub sign up
            if (trigger === "signUp" && account?.provider === "github") {
                const sk = generateSecretKey();
                const pubkey = getPublicKey(sk);
                const privkey = bytesToHex(sk);

                // Use GitHub login (username) from the profile stored in token
                const githubUsername = token.githubProfile?.login;

                // Update the user in the database with all GitHub details
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        pubkey,
                        privkey,
                        name: githubUsername,
                        username: githubUsername,
                        avatar: token.githubProfile?.avatar_url || null,
                        email: token.githubProfile?.email,
                    }
                });

                // Update the user object with all credentials
                user.pubkey = pubkey;
                user.privkey = privkey;
                user.name = githubUsername;
                user.username = githubUsername;
                user.avatar = token.githubProfile?.avatar_url;
                user.email = token.githubProfile?.email;
            }

            if (account && account.provider === "github" && user?.id && user?.pubkey) {
                // we are linking a github account to an existing account
                const updatedUser = await updateUser(user.id, {
                    name: profile?.login,
                    username: profile?.login,
                    avatar: profile?.avatar_url,
                    email: profile?.email,
                    privkey: user.privkey || token.privkey, // Preserve the existing privkey
                    image: profile?.avatar_url, // Also save to image field
                });
                
                if (updatedUser) {
                    user = await getUserById(user.id);
                }
            }

            if (user) {
                token.user = user;
                if (user.pubkey && user.privkey) {
                    token.pubkey = user.pubkey;
                    token.privkey = user.privkey;
                }
            }
            if (account?.provider === 'anonymous') {
                token.isAnonymous = true;
            }
            return token;
        },
        async session({ session, token }) {
            // If this is a GitHub session, get the full user data from DB first
            if (token.account?.provider === 'github') {
                const dbUser = await getUserById(token.user.id);
                
                // Start with the complete DB user as the base
                session.user = dbUser;
                
                // Override only the GitHub-specific fields
                session.user = {
                    ...dbUser, // This includes role, purchases, userCourses, userLessons, etc.
                    username: token.githubProfile?.login,
                    name: token.githubProfile?.login,
                    avatar: token.githubProfile?.avatar_url,
                    email: token.githubProfile?.email
                };
            } else {
                // For non-GitHub sessions, use the existing token.user
                session.user = token.user;
            }

            // Keep the rest of the session data
            if (token.account) {
                session.account = token.account;
                if (token.account.provider === 'github') {
                    session.githubProfile = token.githubProfile;
                }
            }
            if (token.pubkey && token.privkey) {
                session.pubkey = token.pubkey;
                session.privkey = token.privkey;
            }
            session.isAnonymous = token.isAnonymous;
            return session;
        },
        async redirect({ url, baseUrl }) {
            return baseUrl;
        },
        async signOut({ token, session }) {
            token = {}
            session = {}
            return true
        },
        async signIn({ user, account }) {
            if (account.provider === 'anonymous') {
                return {
                    ...user,
                    pubkey: user.pubkey,
                    privkey: user.privkey,
                };
            }
            return true;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    session: { strategy: "jwt" },
    jwt: {
        signingKey: process.env.JWT_SECRET,
    },
    pages: {
        signIn: "/auth/signin",
    }
};

export default NextAuth(authOptions);
