import React, { useEffect } from 'react';
import { Menu } from 'primereact/menu';
import GenericButton from '@/components/buttons/GenericButton';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import useWindowWidth from '@/hooks/useWindowWidth';
import { useNDKContext } from "@/context/NDKContext";
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

const LinkAccountsCard = ({ session }) => {
    const isNostrLinked = session?.user?.pubkey && !session?.user?.privkey;
    const isGithubLinked = session?.account?.provider === 'github';
    const isEmailLinked = Boolean(session?.user?.email);
    const windowWidth = useWindowWidth();
    const { ndk, addSigner } = useNDKContext();
    const { showToast } = useToast();
    const router = useRouter();
    const { update } = useSession();

    // Check for email verification success
    useEffect(() => {
        const checkEmailVerification = async () => {
            if (router.query.emailVerified === 'true') {
                await update(); // Update the session
                showToast('success', 'Success', 'Email verified successfully');
                // Remove the query parameter
                router.replace('/profile', undefined, { shallow: true });
            } else if (router.query.error === 'VerificationFailed') {
                showToast('error', 'Error', 'Email verification failed');
                router.replace('/profile', undefined, { shallow: true });
            }
        };

        checkEmailVerification();
    }, [router.query, update, showToast, router]);

    const handleGithubLink = async () => {
        if (!isGithubLinked) {
            try {
                await signIn("github", { 
                    redirect: false,
                    // Pass existing user data for linking
                    userId: session?.user?.id,
                    pubkey: session?.user?.pubkey,
                    privkey: session?.user?.privkey || null
                });
            } catch (error) {
                console.error("Error linking GitHub:", error);
                showToast('error', 'Error', 'Failed to link GitHub account');
            }
        }
    };

    const handleNostrLink = async () => {
        if (!isNostrLinked) {
            try {
                if (!ndk.signer) {
                    await addSigner();
                }
                const user = await ndk.signer.user();
                const pubkey = user?._pubkey;
                
                if (pubkey) {
                    const response = await fetch('/api/user/link-nostr', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            nostrPubkey: pubkey,
                            userId: session?.user?.id
                        })
                    });

                    if (response.ok) {
                        showToast('success', 'Success', 'Nostr account linked successfully');
                        // Refresh the session to get updated user data
                        await update();
                    } else {
                        throw new Error('Failed to link Nostr account');
                    }
                }
            } catch (error) {
                console.error("Error linking Nostr:", error);
                showToast('error', 'Error', 'Failed to link Nostr account');
            }
        }
    };

    const handleEmailLink = async () => {
        if (!isEmailLinked) {
            try {
                const email = prompt("Please enter your email address:");
                if (email) {
                    const response = await fetch('/api/user/link-email', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            email,
                            userId: session?.user?.id
                        })
                    });

                    if (response.ok) {
                        showToast('success', 'Success', 'Verification email sent');
                        // The user will need to verify their email through the link sent
                    } else {
                        throw new Error('Failed to initiate email linking');
                    }
                }
            } catch (error) {
                console.error("Error linking email:", error);
                showToast('error', 'Error', 'Failed to link email');
            }
        }
    };

    const MobileCard = () => (
        <div className="bg-gray-800 rounded-xl p-6 flex flex-col items-start w-full h-[420px] border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-white">Link Accounts</h2>
            
            <div className="flex flex-col gap-4 w-full">
                <GenericButton
                    label={isGithubLinked ? "Github Linked" : "Link Github"}
                    icon="pi pi-github"
                    onClick={handleGithubLink}
                    disabled={isGithubLinked}
                    className={`w-full min-w-[240px] border-none ${
                        isGithubLinked 
                            ? "bg-gray-600 opacity-70 cursor-not-allowed" 
                            : "bg-[#24292e] hover:bg-[#2f363d]"
                    }`}
                />

                <GenericButton
                    label={isNostrLinked ? "Nostr Linked" : "Link Nostr"}
                    icon={<Image src="/images/nostr.png" width={20} height={20} alt="Nostr" className="mr-2" />}
                    onClick={handleNostrLink}
                    disabled={isNostrLinked}
                    className={`w-full min-w-[240px] border-none flex items-center justify-center ${
                        isNostrLinked 
                            ? "bg-gray-600 opacity-70 cursor-not-allowed" 
                            : "bg-[#6B4E71] hover:bg-[#6B4E71]/80"
                    }`}
                />

                <GenericButton
                    label={isEmailLinked ? "Email Linked" : "Link Email"}
                    icon="pi pi-envelope"
                    onClick={handleEmailLink}
                    disabled={isEmailLinked}
                    className={`w-full min-w-[240px] border-none ${
                        isEmailLinked 
                            ? "bg-gray-600 opacity-70 cursor-not-allowed" 
                            : "bg-[#4A5568] hover:bg-[#4A5568]/80"
                    }`}
                />
            </div>
        </div>
    );

    const DesktopCard = () => (
        <div className="bg-gray-800 rounded-xl p-6 flex flex-col items-start w-full max-w-[400px] mt-2 border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-white">Link Accounts</h2>
            
            <div className="flex flex-col gap-4 w-full">
                <GenericButton
                    label={isGithubLinked ? "Github Linked" : "Link Github"}
                    icon="pi pi-github"
                    onClick={handleGithubLink}
                    disabled={isGithubLinked}
                    className={`w-full border-none ${
                        isGithubLinked 
                            ? "bg-gray-600 opacity-70 cursor-not-allowed" 
                            : "bg-[#24292e] hover:bg-[#2f363d]"
                    }`}
                />

                <GenericButton
                    label={isNostrLinked ? "Nostr Linked" : "Link Nostr"}
                    icon={<Image src="/images/nostr.png" width={20} height={20} alt="Nostr" className="mr-2" />}
                    onClick={handleNostrLink}
                    disabled={isNostrLinked}
                    className={`w-full border-none flex items-center justify-center ${
                        isNostrLinked 
                            ? "bg-gray-600 opacity-70 cursor-not-allowed" 
                            : "bg-[#6B4E71] hover:bg-[#6B4E71]/80"
                    }`}
                />

                <GenericButton
                    label={isEmailLinked ? "Email Linked" : "Link Email"}
                    icon="pi pi-envelope"
                    onClick={handleEmailLink}
                    disabled={isEmailLinked}
                    className={`w-full border-none ${
                        isEmailLinked 
                            ? "bg-gray-600 opacity-70 cursor-not-allowed" 
                            : "bg-[#4A5568] hover:bg-[#4A5568]/80"
                    }`}
                />
            </div>
        </div>
    );

    return windowWidth <= 1440 ? <MobileCard /> : <DesktopCard />;
};

export default LinkAccountsCard;
