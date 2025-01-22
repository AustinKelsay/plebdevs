import React, { useState, useEffect } from 'react';
import { track } from '@vercel/analytics';
import { initializeBitcoinConnect } from './BitcoinConnect';
import { LightningAddress } from '@getalby/lightning-tools';
import { useToast } from '@/hooks/useToast';
import { useSession } from 'next-auth/react';
import { webln, nwc } from '@getalby/sdk';
import { useRouter } from 'next/router';
import { Divider } from 'primereact/divider';
import dynamic from 'next/dynamic';
import AlbyButton from '@/components/buttons/AlbyButton';
import GenericButton from '@/components/buttons/GenericButton';
import axios from 'axios';
import Image from 'next/image';

const PaymentModal = dynamic(
    () => import('@getalby/bitcoin-connect-react').then((mod) => mod.Payment),
    { ssr: false }
);

const SubscriptionPaymentButtons = ({ onSuccess, onError, onRecurringSubscriptionSuccess, setIsProcessing, oneTime = false, recurring = false, layout = "row", selectedPlan = 'monthly' }) => {
    const [invoice, setInvoice] = useState(null);
    const [showRecurringOptions, setShowRecurringOptions] = useState(false);
    const [nwcInput, setNwcInput] = useState('');
    const { showToast } = useToast();
    const { data: session, status } = useSession();
    const router = useRouter();

    const lnAddress = process.env.NEXT_PUBLIC_LIGHTNING_ADDRESS;
    const amount = selectedPlan === 'yearly' ? 500000 : 50000;

    useEffect(() => {
        initializeBitcoinConnect();
    }, []);

    useEffect(() => {
        let intervalId;
        if (invoice) {
            intervalId = setInterval(async () => {
                const paid = await invoice.verifyPayment();

                if (paid && invoice.preimage) {
                    clearInterval(intervalId);
                    // handle success
                    onSuccess();
                }
            }, 1000);
        } else {
            console.error('no invoice');
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [invoice]);

    const fetchInvoice = async () => {
        try {
            const ln = new LightningAddress(lnAddress);
            await ln.fetch();
            const newInvoice = await ln.requestInvoice({ satoshi: amount });
            return newInvoice;
        } catch (error) {
            console.error('Error fetching invoice:', error);
            showToast('error', 'Invoice Error', `Failed to fetch the invoice: ${error.message}`);
            if (onError) onError(error);
            return null;
        }
    };

    const handlePaymentSuccess = async (response) => {
        track('Subscription Payment', { method: "pay_as_you_go", userId: session?.user?.id });
        showToast('success', 'Payment Successful', 'Your payment has been processed successfully.');
        if (onSuccess) onSuccess(response);
    };

    const handlePaymentError = async (error) => {
        console.error('Payment error', error);
        showToast('error', 'Payment Failed', `An error occurred during payment: ${error.message}`);
        if (onError) onError(error);
    };

    const handleRecurringSubscription = async () => {
        setIsProcessing(true);
        const newNwc = nwc.NWCClient.withNewSecret();
        const yearFromNow = new Date();
        yearFromNow.setFullYear(yearFromNow.getFullYear() + 1);

        try {
            const initNwcOptions = {
                name: "plebdevs.com",
                requestMethods: ['pay_invoice'],
                maxAmount: selectedPlan === 'yearly' ? 500000 : 50000,
                editable: false,
                budgetRenewal: selectedPlan === 'yearly' ? 'yearly' : 'monthly',
                expiresAt: yearFromNow,
            };
            await newNwc.initNWC(initNwcOptions);
            showToast('info', 'Alby', 'Alby connection window opened.');
            const newNWCUrl = newNwc.getNostrWalletConnectUrl();

            if (newNWCUrl) {
                const nwc = new webln.NostrWebLNProvider({
                    nostrWalletConnectUrl: newNWCUrl,
                });

                await nwc.enable();

                const invoice = await fetchInvoice();

                if (!invoice || !invoice.paymentRequest) {
                    showToast('error', 'NWC', `Failed to fetch invoice from ${lnAddress}`);
                    return;
                }

                const paymentResponse = await nwc.sendPayment(invoice.paymentRequest);

                if (!paymentResponse || !paymentResponse?.preimage) {
                    showToast('error', 'NWC', 'Payment failed');
                    return;
                }

                const subscriptionResponse = await axios.put('/api/users/subscription', {
                    userId: session.user.id,
                    isSubscribed: true,
                    nwc: newNWCUrl,
                });

                if (subscriptionResponse.status === 200) {
                    track('Subscription Payment', { method: "recurring", userId: session?.user?.id });
                    showToast('success', 'Subscription Setup', 'Recurring subscription setup successful!');
                    if (onRecurringSubscriptionSuccess) onRecurringSubscriptionSuccess();
                } else {
                    throw new Error(`Unexpected response status: ${subscriptionResponse.status}`);
                }
            } else {
                throw new Error('Failed to generate NWC URL');
            }
        } catch (error) {
            console.error('Error initializing NWC:', error);
            showToast('error', 'Subscription Setup Failed', `Error: ${error.message}`);
            if (onError) onError(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleManualNwcSubmit = async () => {
        if (!nwcInput) {
            showToast('error', 'NWC', 'Please enter a valid NWC URL');
            return;
        }

        setIsProcessing(true);
        try {
            const nwc = new webln.NostrWebLNProvider({
                nostrWalletConnectUrl: nwcInput,
            });

            await nwc.enable();

            const invoice = await fetchInvoice();
            if (!invoice || !invoice.paymentRequest) {
                showToast('error', 'NWC', `Failed to fetch invoice from ${lnAddress}`);
                return;
            }

            const payResponse = await nwc.sendPayment(invoice.paymentRequest);
            if (!payResponse || !payResponse.preimage) {
                showToast('error', 'NWC', 'Payment failed');
                return;
            }

            showToast('success', 'NWC', 'Payment successful!');

            try {
                const subscriptionResponse = await axios.put('/api/users/subscription', {
                    userId: session.user.id,
                    isSubscribed: true,
                    nwc: nwcInput,
                });

                if (subscriptionResponse.status === 200) {
                    track('Subscription Payment', { method: "recurring-manual", userId: session?.user?.id });
                    showToast('success', 'NWC', 'Subscription setup successful!');
                    if (onRecurringSubscriptionSuccess) onRecurringSubscriptionSuccess();
                } else {
                    throw new Error('Unexpected response status');
                }
            } catch (error) {
                console.error('Subscription setup error:', error);
                showToast('error', 'NWC', 'Subscription setup failed. Please contact support.');
                if (onError) onError(error);
            }
        } catch (error) {
            console.error('NWC error:', error);
            showToast('error', 'NWC', `An error occurred: ${error.message}`);
            if (onError) onError(error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            {!invoice && (
                <div className={`w-full flex ${layout === "row" ? "flex-row justify-between" : "flex-col items-center"}`}>
                    {(oneTime || (!oneTime && !recurring)) && (
                        <GenericButton
                            label="Pay as you go"
                            icon="pi pi-bolt"
                            onClick={async () => {
                                if (status === 'unauthenticated') {
                                    console.log('unauthenticated');
                                    router.push('/auth/signin');
                                } else {
                                    const invoice = await fetchInvoice();
                                    setInvoice(invoice);
                                }
                            }}
                            severity='primary'
                            className="w-fit mt-4 text-[#f8f8ff]"
                        />
                    )}
                    {(recurring || (!oneTime && !recurring)) && (
                        <GenericButton
                            label="Setup Recurring Subscription"
                            icon={
                                <Image
                                    src="/images/nwc-logo.svg"
                                    alt="NWC Logo"
                                    width={16}
                                    height={16}
                                    className="mr-2"
                                />
                            }
                            severity='help'
                            className="w-fit mt-4 text-[#f8f8ff] bg-purple-600"
                            onClick={() => {
                                if (status === 'unauthenticated') {
                                    console.log('unauthenticated');
                                    router.push('/auth/signin');
                                } else {
                                    setShowRecurringOptions(!showRecurringOptions);
                                }
                            }}
                        />
                    )}
                </div>
            )}
            {showRecurringOptions && (
                <>
                    <Divider />
                    <div className="w-fit mx-auto flex flex-col items-center mt-24">
                        <AlbyButton handleSubmit={handleRecurringSubscription} />
                        <span className='my-4 text-lg font-bold'>or</span>
                        <p className='text-lg font-bold'>Manually enter NWC URL</p>
                        <span className='text-sm text-gray-500'>
                            *make sure you set a budget of at least {selectedPlan === 'yearly' ? '500,000' : '50,000'} sats 
                            and set budget renewal to {selectedPlan === 'yearly' ? 'yearly' : 'monthly'}
                        </span>
                        <input
                            type="text"
                            value={nwcInput}
                            onChange={(e) => setNwcInput(e.target.value)}
                            placeholder="Enter NWC URL"
                            className="w-full p-2 mb-4 border rounded"
                        />
                        <GenericButton
                            label="Submit"
                            onClick={handleManualNwcSubmit}
                            className="mt-4 w-fit text-[#f8f8ff]"
                        />
                    </div>
                </>
            )}
            {invoice && invoice.paymentRequest && (
                <div className="w-full mx-auto mt-8">
                    <PaymentModal
                        invoice={invoice?.paymentRequest}
                        onPaid={handlePaymentSuccess}
                        onError={handlePaymentError}
                        paymentMethods='external'
                        title={`Pay ${amount} sats`}
                    />
                </div>
            )}
        </>
    );
};

export default SubscriptionPaymentButtons;