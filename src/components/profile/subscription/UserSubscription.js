import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useToast } from '@/hooks/useToast';
import axios from 'axios';
import { Card } from 'primereact/card';
import useWindowWidth from '@/hooks/useWindowWidth';
import SubscribeModal from '@/components/profile/subscription/SubscribeModal';
import { ProgressSpinner } from 'primereact/progressspinner';
import UserProfileCard from '@/components/profile/UserProfileCard';
import SubscriptionPaymentButtons from '@/components/bitcoinConnect/SubscriptionPaymentButton';
import Image from 'next/image';
import NostrIcon from '../../../../public/images/nostr.png';
import GenericButton from '@/components/buttons/GenericButton';
import CancelSubscription from '@/components/profile/subscription/CancelSubscription';
import CalendlyEmbed from '@/components/profile/subscription/CalendlyEmbed';
import Nip05Form from '@/components/profile/subscription/Nip05Form';
import LightningAddressForm from '@/components/profile/subscription/LightningAddressForm';
import RenewSubscription from '@/components/profile/subscription/RenewSubscription';

const UserSubscription = () => {
    const { data: session, update } = useSession();
    const { showToast } = useToast();
    const router = useRouter();
    const windowWidth = useWindowWidth();
    const menu = useRef(null);
    const [user, setUser] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [subscribed, setSubscribed] = useState(false);
    const [subscribedUntil, setSubscribedUntil] = useState(null);
    const [subscriptionExpiredAt, setSubscriptionExpiredAt] = useState(null);
    const [calendlyVisible, setCalendlyVisible] = useState(false);
    const [lightningAddressVisible, setLightningAddressVisible] = useState(false);
    const [nip05Visible, setNip05Visible] = useState(false);
    const [cancelSubscriptionVisible, setCancelSubscriptionVisible] = useState(false);
    const [renewSubscriptionVisible, setRenewSubscriptionVisible] = useState(false);

    useEffect(() => {
        if (session && session?.user) {
            setUser(session.user);
        }
    }, [session])

    useEffect(() => {
        if (user && user.role) {
            setSubscribed(user.role.subscribed);
            const subscribedAt = new Date(user.role.lastPaymentAt);
            const subscribedUntil = new Date(subscribedAt.getTime() + 31 * 24 * 60 * 60 * 1000);
            setSubscribedUntil(subscribedUntil);
            if (user.role.subscriptionExpiredAt) {
                const expiredAt = new Date(user.role.subscriptionExpiredAt)
                setSubscriptionExpiredAt(expiredAt);
            }
        }
    }, [user]);

    const handleSubscriptionSuccess = async (response) => {
        setIsProcessing(true);
        try {
            const apiResponse = await axios.put('/api/users/subscription', {
                userId: session.user.id,
                isSubscribed: true,
            });
            if (apiResponse.data) {
                await update();
                showToast('success', 'Subscription Successful', 'Your subscription has been activated.');
            } else {
                throw new Error('Failed to update subscription status');
            }
        } catch (error) {
            console.error('Subscription update error:', error);
            showToast('error', 'Subscription Update Failed', `Error: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubscriptionError = (error) => {
        console.error('Subscription error:', error);
        showToast('error', 'Subscription Failed', `An error occurred: ${error.message}`);
        setIsProcessing(false);
    };

    const handleRecurringSubscriptionSuccess = async () => {
        setIsProcessing(true);
        try {
            await update();
            showToast('success', 'Recurring Subscription Activated', 'Your recurring subscription has been set up successfully.');
        } catch (error) {
            console.error('Session update error:', error);
            showToast('error', 'Session Update Failed', `Error: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="p-4">
            {windowWidth < 768 && (
                <h1 className="text-3xl font-bold mb-6">Subscription Management</h1>
            )}
            <div className="w-full flex flex-row max-lap:flex-col">
                {/* Left Column - 22% */}
                <div className="w-[21%] h-full max-lap:w-full">
                    {user && <UserProfileCard user={user} />}
                    <div className="mt-4">
                        <SubscribeModal />
                    </div>
                </div>

                {/* Right Column - 78% */}
                <div className="w-[78%] flex flex-col justify-center mx-auto max-lap:w-full">
                    {!subscribed && (
                        <Card title="Subscribe to PlebDevs" className="mb-4">
                            {isProcessing ? (
                                <div className="w-full flex flex-col mx-auto justify-center items-center mt-4">
                                    <div className='w-full h-full flex items-center justify-center'><ProgressSpinner /></div>
                                    <span className="ml-2">Processing subscription...</span>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    <div className="mb-4">
                                        <h2 className="text-2xl font-bold text-primary">Unlock Premium Benefits</h2>
                                        <p className="text-gray-400">Subscribe now and elevate your development journey!</p>
                                    </div>
                                    <div className="flex flex-col gap-4 mb-4">
                                        <div className="flex items-center">
                                            <i className="pi pi-book text-2xl text-primary mr-2 text-blue-400"></i>
                                            <span>Access ALL current and future PlebDevs content</span>
                                        </div>
                                        <div className="flex items-center">
                                            <i className="pi pi-calendar text-2xl text-primary mr-2 text-red-400"></i>
                                            <span>Personal mentorship & guidance and access to exclusive 1:1 booking calendar</span>
                                        </div>
                                        <div className="flex items-center">
                                            <i className="pi pi-bolt text-2xl text-primary mr-2 text-yellow-500"></i>
                                            <span>Claim your own personal plebdevs.com Lightning Address</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Image src={NostrIcon} alt="Nostr" width={25} height={25} className='mr-2' />
                                            <span>Claim your own personal plebdevs.com Nostr NIP-05 identity</span>
                                        </div>
                                        <div className="flex items-center">
                                        <i className="pi pi-star text-2xl text-primary mr-2 text-yellow-500"></i>
                                        <span>I WILL MAKE SURE YOU WIN HARD AND LEVEL UP AS A DEV!</span>
                                    </div>
                                    </div>
                                    <SubscriptionPaymentButtons
                                        onSuccess={handleSubscriptionSuccess}
                                        onRecurringSubscriptionSuccess={handleRecurringSubscriptionSuccess}
                                        onError={handleSubscriptionError}
                                        setIsProcessing={setIsProcessing}
                                        layout={windowWidth < 768 ? "col" : "row"}
                                    />
                                </div>
                            )}
                        </Card>
                    )}
                    
                    {subscribed && (
                        <>
                            <Card title="Subscription Benefits" className="mb-4">
                                {isProcessing ? (
                                    <div className="w-full flex flex-col mx-auto justify-center items-center mt-4">
                                        <div className='w-full h-full flex items-center justify-center'><ProgressSpinner /></div>
                                        <span className="ml-2">Processing subscription...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col">
                                        <div className="flex flex-col gap-4">
                                            <GenericButton severity="info" outlined className="w-fit text-start" label="Schedule 1:1" icon="pi pi-calendar" onClick={() => setCalendlyVisible(true)} />
                                            <GenericButton severity="help" outlined className="w-fit text-start" label={user?.nip05 ? "Update Nostr NIP-05" : "Claim PlebDevs Nostr NIP-05"} icon="pi pi-at" onClick={() => setNip05Visible(true)} />
                                            <GenericButton severity="warning" outlined className="w-fit text-start" label={user?.lightningAddress ? "Update Lightning Address" : "Claim PlebDevs Lightning Address"} icon={<i style={{ color: "orange" }} className="pi pi-bolt mr-2"></i>} onClick={() => setLightningAddressVisible(true)} />
                                        </div>
                                    </div>
                                )}
                            </Card>
                            <Card title="Manage Subscription" className="mb-4">
                                <div className='flex flex-col gap-4'>
                                        <GenericButton outlined className="w-fit" label="Renew Subscription" icon="pi pi-sync" onClick={() => setRenewSubscriptionVisible(true)} />
                                        <GenericButton severity="danger" outlined className="w-fit" label="Cancel Subscription" icon="pi pi-trash" onClick={() => setCancelSubscriptionVisible(true)} />
                                </div>
                            </Card>
                        </>
                    )}

                    <Card title="Frequently Asked Questions" className="mb-6">
                        <div className="flex flex-col gap-4">
                            <div>
                                <h3 className="text-lg font-semibold">How does the subscription work?</h3>
                                <p>Think of the subscriptions as a paetreon type model. You pay a monthly fee and in return you get access to premium features and all of the paid content. You can cancel at any time.</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">How do I Subscribe? (Pay as you go)</h3>
                                <p>The pay as you go subscription is a one-time payment that gives you access to all of the premium features for one month. You will need to manually renew your subscription every month.</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">How do I Subscribe? (Recurring)</h3>
                                <p>The recurring subscription option allows you to submit a Nostr Wallet Connect URI that will be used to automatically send the subscription fee every month. You can cancel at any time.</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Can I cancel my subscription?</h3>
                                <p>Yes, you can cancel your subscription at any time. Your access will remain active until the end of the current billing period.</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">What happens if I don&apos;t renew my subscription?</h3>
                                <p>If you don&apos;t renew your subscription, your access to 1:1 calendar and paid content will be removed. However, you will still have access to your plebdevs Lightning Address, NIP-05, and any content that you paid for.</p>
                            </div>
                            {/* Add more FAQ items as needed */}
                        </div>
                    </Card>
                </div>
            </div>

            <CalendlyEmbed
                visible={calendlyVisible}
                onHide={() => setCalendlyVisible(false)}
                userId={session?.user?.id}
                userName={session?.user?.name || user?.kind0?.username}
                userEmail={session?.user?.email}
            />
            <CancelSubscription
                visible={cancelSubscriptionVisible}
                onHide={() => setCancelSubscriptionVisible(false)}
            />
            <RenewSubscription
                visible={renewSubscriptionVisible}
                onHide={() => setRenewSubscriptionVisible(false)}
                subscribedUntil={subscribedUntil}
            />
            <Nip05Form
                visible={nip05Visible}
                onHide={() => setNip05Visible(false)}
            />
            <LightningAddressForm
                visible={lightningAddressVisible}
                onHide={() => setLightningAddressVisible(false)}
            />
        </div>
    );
};

export default UserSubscription;
