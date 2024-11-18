import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/db/prisma";
import nodemailer from 'nodemailer';
import { findKind0Fields } from "@/utils/nostr";
import { generateSecretKey, getPublicKey } from 'nostr-tools/pure'
import { bytesToHex } from '@noble/hashes/utils'
import { updateUser, getUserByPubkey, createUser } from "@/db/models/userModels";
import { createRole } from "@/db/models/roleModels";
import appConfig from "@/config/appConfig";
import GithubProvider from "next-auth/providers/github";
import { SimplePool } from "nostr-tools";
import { finalizeEvent } from "nostr-tools";

// todo: currently email accounts ephemeral privkey gets saved to db but not anon user, is this required at all given the newer auth setup?

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
                const updatedUser = await updateUser(dbUser.id, { username: fields.username });
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
                const payload = { pubkey, username: fields.username, avatar: fields.avatar };

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
            clientSecret: process.env.GITHUB_CLIENT_SECRET
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
                        username: pubkey.slice(0, 8), // Use first 8 characters of pubkey as username
                    });
                }

                // Return user object with pubkey and privkey
                return { ...dbUser, pubkey, privkey };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, account, trigger }) {
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

                // Update the user in the database
                await prisma.user.update({
                    where: { id: user.id },
                    data: { pubkey, privkey, name: user.name, username: user.name, avatar: user.image || null }
                });

                // Publish kind0 event to nostr
                try {
                    const pool = new SimplePool();
                    const relays = [
                        "wss://relay.damus.io",
                        "wss://relay.nostr.band",
                        "wss://relay.primal.net",
                        "wss://relay.devs.tools"
                    ];

                    const event = finalizeEvent({
                        kind: 0,
                        created_at: Math.floor(Date.now() / 1000),
                        tags: [],
                        content: JSON.stringify({
                            name: user.name,
                            picture: user.image
                        })
                    }, privkey);

                    await Promise.any(pool.publish(relays, event));
                } catch (error) {
                    console.error('Failed to publish kind0 event:', error);
                }

                // Update user object with nostr keys
                user.pubkey = pubkey;
                user.privkey = privkey;
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
            session.user = token.user;
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
