import React, { useState, useRef, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import SubscriptionPaymentButtons from '@/components/bitcoinConnect/SubscriptionPaymentButton';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useToast } from '@/hooks/useToast';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import GenericButton from '@/components/buttons/GenericButton';
import { Menu } from "primereact/menu";
import { Message } from "primereact/message";
import CancelSubscription from '@/components/profile/subscription/CancelSubscription';
import CalendlyEmbed from '@/components/profile/subscription/CalendlyEmbed';
import Nip05Form from '@/components/profile/subscription/Nip05Form';
import LightningAddressForm from '@/components/profile/subscription/LightningAddressForm';
import NostrIcon from '../../../../public/images/nostr.png';
import Image from 'next/image';
import RenewSubscription from '@/components/profile/subscription/RenewSubscription';

const SubscribeModal = ({ user }) => {
    const { data: session, update } = useSession();
    const { showToast } = useToast();
    const router = useRouter();
    const menu = useRef(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [visible, setVisible] = useState(false);
    const [subscribed, setSubscribed] = useState(false);
    const [subscribedUntil, setSubscribedUntil] = useState(null);
    const [subscriptionExpiredAt, setSubscriptionExpiredAt] = useState(null);
    const [calendlyVisible, setCalendlyVisible] = useState(false);
    const [lightningAddressVisible, setLightningAddressVisible] = useState(false);
    const [nip05Visible, setNip05Visible] = useState(false);
    const [cancelSubscriptionVisible, setCancelSubscriptionVisible] = useState(false);
    const [renewSubscriptionVisible, setRenewSubscriptionVisible] = useState(false);

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
                onHide();
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
            onHide();
        } catch (error) {
            console.error('Session update error:', error);
            showToast('error', 'Session Update Failed', `Error: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const onHide = () => {
        setVisible(false);
        setIsProcessing(false);
    }

    const menuItems = [
        {
            label: "Schedule 1:1",
            icon: "pi pi-calendar",
            command: () => {
                setCalendlyVisible(true);
            },
        },
        {
            label: session?.user?.lightningAddress ? "Update PlebDevs Lightning Address" : "Claim PlebDevs Lightning Address",
            icon: "pi pi-bolt",
            command: () => {
                setLightningAddressVisible(true);
            },
        },
        {
            label: session?.user?.nip05 ? "Update PlebDevs Nostr NIP-05" : "Claim PlebDevs Nostr NIP-05",
            icon: "pi pi-at",
            command: () => {
                setNip05Visible(true);
            },
        },
        {
            label: "Renew Subscription",
            icon: "pi pi-sync",
            command: () => {
                setRenewSubscriptionVisible(true);
            },
        },
        {
            label: "Cancel Subscription",
            icon: "pi pi-trash",
            command: () => {
                setCancelSubscriptionVisible(true);
            },
        },
    ];

    const subscriptionCardTitle = (
        <div className="w-full flex flex-row justify-between items-center">
            <span className="text-xl text-900 font-bold text-white">Plebdevs Subscription</span>
            {subscribed && (
                <i
                    className="pi pi-ellipsis-h text-2xl cursor-pointer hover:opacity-75"
                    onClick={(e) => menu.current.toggle(e)}
                ></i>
            )}
            <Menu model={menuItems} popup ref={menu} className="w-fit" />
        </div>
    );

    return (
        <>
            <Card title={subscriptionCardTitle} className="w-full m-4 mx-auto border border-gray-700">
                {subscribed && !user?.role?.nwc && (
                    <div className="flex flex-col">
                        <Message className="w-fit" severity="success" text="Subscribed!" />
                        <p className="mt-4">Thank you for your support 🎉</p>
                        <p className="text-sm text-gray-400">Pay-as-you-go subscription will renew on {subscribedUntil.toLocaleDateString()}</p>
                    </div>
                )}
                {subscribed && user?.role?.nwc && (
                    <div className="flex flex-col">
                        <Message className="w-fit" severity="success" text="Subscribed!" />
                        <p className="mt-4">Thank you for your support 🎉</p>
                        <p className="text-sm text-gray-400">Recurring subscription will AUTO renew on {subscribedUntil.toLocaleDateString()}</p>
                    </div>
                )}
                {(!subscribed && !subscriptionExpiredAt) && (
                    <div className="flex flex-col">
                        <Message className="w-fit" severity="info" text="You currently have no active subscription" />
                        <GenericButton
                            label="Subscribe"
                            className="w-auto mt-4 text-[#f8f8ff]"
                            onClick={() => setVisible(true)}
                        />
                    </div>
                )}
                {subscriptionExpiredAt && (
                    <div className="flex flex-col">
                        <Message className="w-fit" severity="warn" text={`Your subscription expired on ${subscriptionExpiredAt.toLocaleDateString()}`} />
                        <GenericButton
                            label="Subscribe"
                            className="w-auto mt-4 text-[#f8f8ff]"
                            onClick={() => setVisible(true)}
                        />
                    </div>
                )}
            </Card>
            <Dialog
                header="Subscribe to PlebDevs"
                visible={visible}
                onHide={onHide}
                className="p-fluid pb-0 w-fit"
            >
                {isProcessing ? (
                    <div className="w-full flex flex-col mx-auto justify-center items-center mt-4">
                        <div className='w-full h-full flex items-center justify-center'><ProgressSpinner /></div>
                        <span className="ml-2">Processing subscription...</span>
                    </div>
                ) : (
                    <Card className="shadow-lg">
                        <div className="text-center mb-4">
                            <h2 className="text-2xl font-bold text-primary">Unlock Premium Benefits</h2>
                            <p className="text-gray-400">Subscribe now and elevate your development journey!</p>
                        </div>
                        <div className="flex flex-col gap-4 mb-4 w-[60%] mx-auto">
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
                                <Image src={NostrIcon} alt="Nostr" width={26} height={26} className='mr-2' />
                                <span>Claim your own personal plebdevs.com Nostr NIP-05 identity</span>
                            </div>
                        </div>
                        <div className="text-center mb-4 flex flex-row justify-center">
                            <Badge value="BONUS" severity="success" className="mr-2 text-[#f8f8ff] font-bold"></Badge>
                            <span className="text-center font-bold">I WILL MAKE SURE YOU WIN HARD AND LEVEL UP AS A DEV!</span>
                        </div>
                        <SubscriptionPaymentButtons
                            onSuccess={handleSubscriptionSuccess}
                            onRecurringSubscriptionSuccess={handleRecurringSubscriptionSuccess}
                            onError={handleSubscriptionError}
                            setIsProcessing={setIsProcessing}
                        />
                    </Card>
                )}
            </Dialog>
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
        </>
    );
};

export default SubscribeModal;