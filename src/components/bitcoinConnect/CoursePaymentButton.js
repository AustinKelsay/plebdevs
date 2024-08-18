import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog'; // Import Dialog component
import { initializeBitcoinConnect } from './BitcoinConnect';
import { LightningAddress } from '@getalby/lightning-tools';
import { useToast } from '@/hooks/useToast';
import { useSession } from 'next-auth/react';
import axios from 'axios'; // Import axios for API calls

const Payment = dynamic(
    () => import('@getalby/bitcoin-connect-react').then((mod) => mod.Payment),
    {
        ssr: false,
    }
);

const CoursePaymentButton = ({ lnAddress, amount, onSuccess, onError, courseId }) => {
    const [invoice, setInvoice] = useState(null);
    const [userId, setUserId] = useState(null);
    const { showToast } = useToast();
    const { data: session } = useSession();
    const [dialogVisible, setDialogVisible] = useState(false); // New state for dialog visibility

    useEffect(() => {
        if (session?.user) {
            setUserId(session.user.id);
        }
    }, [session]);

    useEffect(() => {
        initializeBitcoinConnect();
    }, []);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const ln = new LightningAddress(lnAddress);
                await ln.fetch();
                const invoice = await ln.requestInvoice({ satoshi: amount });
                setInvoice(invoice);
            } catch (error) {
                console.error('Error fetching invoice:', error);
                showToast('error', 'Invoice Error', 'Failed to fetch the invoice.');
                if (onError) onError(error);
            }
        };

        fetchInvoice();
    }, [lnAddress, amount, onError, showToast]);

    const handlePaymentSuccess = async (response) => {
        try {
            const purchaseData = {
                userId: userId,
                courseId: courseId,
                amountPaid: parseInt(amount, 10)
            };

            const result = await axios.post('/api/purchase/course', purchaseData);

            if (result.status === 200) {
                showToast('success', 'Payment Successful', `Paid ${amount} sats and updated user purchases`);
                if (onSuccess) onSuccess(response);
            } else {
                throw new Error('Failed to update user purchases');
            }
        } catch (error) {
            console.error('Error updating user purchases:', error);
            showToast('error', 'Purchase Update Failed', 'Payment was successful, but failed to update user purchases.');
            if (onError) onError(error);
        }
        setDialogVisible(false); // Close the dialog on successful payment
    };

    return (
        <>
            <Button 
                label={`${amount} sats`} 
                onClick={() => setDialogVisible(true)} 
                disabled={!invoice}
                severity='primary'
                rounded
                icon='pi pi-wallet'
                className='text-[#f8f8ff] text-sm'
            />
            <Dialog 
                visible={dialogVisible} 
                onHide={() => setDialogVisible(false)}
                header="Make Payment"
                style={{ width: '50vw' }}
            >
                {invoice ? (
                    <Payment
                        invoice={invoice.paymentRequest}
                        onPaid={handlePaymentSuccess}
                        paymentMethods='all'
                        title={`Pay ${amount} sats`}
                    />
                ) : (
                    <p>Loading payment details...</p>
                )}
            </Dialog>
        </>
    );
};

export default CoursePaymentButton;