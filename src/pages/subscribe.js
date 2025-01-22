import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useToast } from '@/hooks/useToast';
import axios from 'axios';
import { Card } from 'primereact/card';
import SubscribeModal from '@/components/profile/subscription/SubscribeModal';
import useWindowWidth from '@/hooks/useWindowWidth';
import GenericButton from '@/components/buttons/GenericButton';
import { ProgressSpinner } from 'primereact/progressspinner';
import SubscriptionPaymentButtons from '@/components/bitcoinConnect/SubscriptionPaymentButton';
import Image from 'next/image';
import NostrIcon from '../../public/images/nostr.png';
import CalendlyEmbed from '@/components/profile/subscription/CalendlyEmbed';
import CancelSubscription from '@/components/profile/subscription/CancelSubscription';
import RenewSubscription from '@/components/profile/subscription/RenewSubscription';
import Nip05Form from '@/components/profile/subscription/Nip05Form';
import LightningAddressForm from '@/components/profile/subscription/LightningAddressForm';

const Subscribe = () => {
    const { data: session, update } = useSession();
    const { showToast } = useToast();
    const router = useRouter();
    const windowWidth = useWindowWidth();
    const [user, setUser] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [subscribed, setSubscribed] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('monthly');
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
                selectedPlan: selectedPlan,
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
            <div className="mb-4 p-4 bg-gray-800 rounded-lg w-fit">
                <SubscribeModal />
            </div>

            {!session?.user && (
                <>
                    <Card title="Start Your PlebDevs Journey" className="mb-6">
                        <p className='mb-4 text-xl'>
                            The PlebDevs subscription unlocks all paid content, grants access to our 1:1 calendar for tutoring, support, and mentorship, and grants you your own personal plebdevs.com Lightning Address and Nostr NIP-05 identity.
                        </p>
                        <p className='text-xl mb-4'>
                            Subscribe monthly with a pay-as-you-go option or set up an auto-recurring subscription using Nostr Wallet Connect.
                        </p>
                    </Card>
                    <Card title="Ready to level up?" className="mb-4">
                        <p className='text-xl pb-4'>Login to start your subscription!</p>
                        <GenericButton label="Login" onClick={() => router.push('/auth/signin')} className='text-[#f8f8ff] w-fit' rounded icon="pi pi-user" />
                    </Card>
                </>
            )}

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

                        <div className="flex justify-start gap-8 mb-4">
                            <div 
                                className={`p-4 px-12 border rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-400
                                    ${selectedPlan === 'monthly' ? 'border-blue-400 bg-blue-900/20' : 'border-gray-600'}`}
                                onClick={() => setSelectedPlan('monthly')}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                                        ${selectedPlan === 'monthly' ? 'border-blue-400' : 'border-gray-400'}`}>
                                        {selectedPlan === 'monthly' && <div className="w-2 h-2 rounded-full bg-blue-400"></div>}
                                    </div>
                                    <span className="font-semibold">Monthly</span>
                                </div>
                                <div className="text-lg font-bold">50,000 sats</div>
                            </div>

                            <div 
                                className={`p-4 px-12 border rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-400
                                    ${selectedPlan === 'yearly' ? 'border-blue-400 bg-blue-900/20' : 'border-gray-600'}`}
                                onClick={() => setSelectedPlan('yearly')}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                                        ${selectedPlan === 'yearly' ? 'border-blue-400' : 'border-gray-400'}`}>
                                        {selectedPlan === 'yearly' && <div className="w-2 h-2 rounded-full bg-blue-400"></div>}
                                    </div>
                                    <span className="font-semibold">Yearly</span>
                                </div>
                                <div className="text-lg font-bold">500,000 sats</div>
                            </div>
                        </div>

                        <SubscriptionPaymentButtons
                            onSuccess={handleSubscriptionSuccess}
                            onRecurringSubscriptionSuccess={handleRecurringSubscriptionSuccess}
                            onError={handleSubscriptionError}
                            setIsProcessing={setIsProcessing}
                            selectedPlan={selectedPlan}
                            layout={windowWidth < 768 ? "col" : "row"}
                        />
                    </div>
                )}
            </Card>

            {session?.user && subscribed && (
                <>
                    <Card title="Subscription Benefits" className="mb-4">
                        <div className="flex flex-col gap-4">
                            <GenericButton severity="info" outlined className="w-fit text-start" label="Schedule 1:1" icon="pi pi-calendar" onClick={() => setCalendlyVisible(true)} />
                            <GenericButton severity="help" outlined className="w-fit text-start" label={session?.user?.nip05 ? "Update Nostr NIP-05" : "Claim PlebDevs Nostr NIP-05"} icon="pi pi-at" onClick={() => setNip05Visible(true)} />
                            <GenericButton severity="warning" outlined className="w-fit text-start" label={session?.user?.lightningAddress ? "Update Lightning Address" : "Claim PlebDevs Lightning Address"} icon={<i style={{ color: "orange" }} className="pi pi-bolt mr-2"></i>} onClick={() => setLightningAddressVisible(true)} />
                        </div>
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
                <div className="flex flex-col gap-4 max-w-[80%] max-mob:max-w-full">
                    <div>
                        <h3 className="text-lg font-semibold">How does the subscription work?</h3>
                        <p>Think of the subscriptions as a Patreon-type model. You pay a monthly fee and in return you get access to premium features and all of the paid content. You can cancel at any time.</p>
                    </div>
                    <div className='flex flex-col gap-2'>
                        <h3 className="text-lg font-semibold">What are the benefits of a subscription?</h3>
                        <p>The subscription gives you access to all of the premium features and all of the paid content. You can cancel at any time.</p>
                    </div>
                    <div className='flex flex-col gap-2'>
                        <h3 className="text-lg font-semibold">How much does the subscription cost?</h3>
                        <p>The subscription is 50,000 sats per month.</p>
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
                        <p>If you don&apos;t renew your subscription, your access to 1:1 calendar and paid content will be removed. However, you will still have access to your PlebDevs Lightning Address, NIP-05, and any content that you paid for.</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">What is Nostr Wallet Connect?</h3>
                        <p>Nostr Wallet Connect is a Nostr-based authentication method that allows you to connect your Nostr wallet to the PlebDevs platform. This will allow you to subscribe to the platform in an auto recurring manner which still gives you full control over your wallet and the ability to cancel at any time from your wallet.</p>
                    </div>
                </div>
            </Card>

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
                selectedPlan={selectedPlan}
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

export default Subscribe;
