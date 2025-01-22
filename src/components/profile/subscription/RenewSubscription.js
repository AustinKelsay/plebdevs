import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import SubscriptionPaymentButtons from '@/components/bitcoinConnect/SubscriptionPaymentButton';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/useToast';
import axios from 'axios';

const RenewSubscription = ({ visible, onHide, subscribedUntil, selectedPlan }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const { data: session, update } = useSession();
    const { showToast } = useToast();

    const handleSubscriptionSuccess = async (response) => {
        setIsProcessing(true);
        try {
            const apiResponse = await axios.put('/api/users/subscription', {
                userId: session.user.id,
                isSubscribed: true,
            });
            if (apiResponse.data) {
                await update();
                showToast('success', 'Subscription Renewed', 'Your subscription has been renewed successfully.');
                onHide();
            } else {
                throw new Error('Failed to update subscription status');
            }
        } catch (error) {
            console.error('Subscription renewal error:', error);
            showToast('error', 'Subscription Renewal Failed', `Error: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubscriptionError = (error) => {
        console.error('Subscription error:', error);
        showToast('error', 'Subscription Renewal Failed', `An error occurred: ${error.message}`);
        setIsProcessing(false);
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString();
    };

    return (
        <Dialog
            header="Renew Your PlebDevs Subscription"
            visible={visible}
            onHide={onHide}
            className="p-fluid pb-0 w-fit"
        >
            {isProcessing ? (
                <div className="w-full flex flex-col mx-auto justify-center items-center mt-4">
                    <div className='w-full h-full flex items-center justify-center'><ProgressSpinner /></div>
                    <span className="ml-2">Processing renewal...</span>
                </div>
            ) : (
                <Card className="shadow-lg">
                    <div className="text-center mb-4">
                        <h2 className="text-2xl font-bold text-primary">Renew Your Subscription</h2>
                        <p className="text-gray-400">Your current subscription is valid until {formatDate(subscribedUntil)}</p>
                        <p className="text-gray-400">Renew now to extend your access to premium benefits!</p>
                    </div>
                    <SubscriptionPaymentButtons
                        onSuccess={handleSubscriptionSuccess}
                        onRecurringSubscriptionSuccess={handleSubscriptionSuccess}
                        onError={handleSubscriptionError}
                        setIsProcessing={setIsProcessing}
                        layout="col"
                        selectedPlan={selectedPlan}
                    />
                </Card>
            )}
        </Dialog>
    );
};

export default RenewSubscription;