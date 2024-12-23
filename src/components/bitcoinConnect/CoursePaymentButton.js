import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Dialog } from 'primereact/dialog';
import { LightningAddress } from '@getalby/lightning-tools';
import { track } from '@vercel/analytics';
import { useToast } from '@/hooks/useToast';
import { useSession } from 'next-auth/react';
import { ProgressSpinner } from 'primereact/progressspinner';
import axios from 'axios';
import GenericButton from '@/components/buttons/GenericButton';
import { useRouter } from 'next/router';
import useWindowWidth from '@/hooks/useWindowWidth';
import { InputText } from 'primereact/inputtext';

const Payment = dynamic(
    () => import('@getalby/bitcoin-connect-react').then((mod) => mod.Payment),
    { ssr: false }
);

const DISCOUNT_CODE = process.env.NEXT_PUBLIC_DISCOUNT_CODE;
const COURSE_PASS = process.env.NEXT_PUBLIC_COURSE_PASS;

const CoursePaymentButton = ({ lnAddress, amount, onSuccess, onError, courseId }) => {
    const [invoice, setInvoice] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();
    const { data: session, status } = useSession();
    const [dialogVisible, setDialogVisible] = useState(false);
    const router = useRouter();
    const windowWidth = useWindowWidth();
    const isMobile = windowWidth < 768;
    const [discountCode, setDiscountCode] = useState('');
    const [discountApplied, setDiscountApplied] = useState(false);
    const [showDiscountInput, setShowDiscountInput] = useState(false);

    useEffect(() => {
        let intervalId;
        if (invoice) {
            intervalId = setInterval(async () => {
                const paid = await invoice.verifyPayment();

                if (paid && invoice.preimage) {
                    clearInterval(intervalId);
                    // handle success
                    handlePaymentSuccess({ paid, preimage: invoice.preimage });
                }
            }, 2000);
        } else {
            console.error('no invoice');
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [invoice]);

    const calculateDiscount = (originalAmount) => {
        if (discountCode === COURSE_PASS) {
            return { discountedAmount: 0, savedPercentage: 100 };
        }
        if (discountCode === DISCOUNT_CODE) {
            const discountedAmount = 21000;
            const savedPercentage = Math.round(((originalAmount - discountedAmount) / originalAmount) * 100);
            return { discountedAmount, savedPercentage };
        }
        return { discountedAmount: originalAmount, savedPercentage: 0 };
    };

    const fetchInvoice = async () => {
        setIsLoading(true);
        try {
            const ln = new LightningAddress(lnAddress);
            await ln.fetch();
            const invoice = await ln.requestInvoice({ satoshi: discountApplied ? calculateDiscount(amount).discountedAmount : amount });
            setInvoice(invoice);
            setDialogVisible(true);
        } catch (error) {
            console.error('Error fetching invoice:', error);
            showToast('error', 'Invoice Error', 'Failed to fetch the invoice.');
            if (onError) onError(error);
        }
        setIsLoading(false);
    };

    const handlePaymentSuccess = async (response) => {
        try {
            const purchaseData = {
                userId: session.user.id,
                courseId: courseId,
                amountPaid: discountApplied ? calculateDiscount(amount).discountedAmount : parseInt(amount, 10)
            };

            const result = await axios.post('/api/purchase/course', purchaseData);

            if (result.status === 200) {
                track('Course Payment', { courseId: courseId, userId: session?.user?.id });
                if (onSuccess) onSuccess(response);
            } else {
                throw new Error('Failed to update user purchases');
            }
        } catch (error) {
            console.error('Error updating user purchases:', error);
            showToast('error', 'Purchase Update Failed', 'Payment was successful, but failed to update user purchases.');
            if (onError) onError(error);
        }
        setDialogVisible(false);
    };

    const handleDiscountCode = (value) => {
        setDiscountCode(value);
        if (value.toLowerCase() === DISCOUNT_CODE.toLowerCase()) {
            setDiscountApplied(true);
            showToast('success', 'Discount Applied', `${calculateDiscount(amount).savedPercentage}% discount applied!`);
        } else if (value.toLowerCase() === COURSE_PASS.toLowerCase()) {
            setDiscountApplied(true);
            showToast('success', 'Course Pass Applied', '100% discount applied!');
        } else if (value) {
            setDiscountApplied(false);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            {!showDiscountInput ? (
                <button
                    onClick={() => setShowDiscountInput(true)}
                    className="text-sm text-blue-500 hover:text-blue-700 underline self-start flex items-center gap-1"
                >
                    <i className="pi pi-tag text-xs"></i>
                    Have a discount code?
                </button>
            ) : (
                <div className="flex flex-col gap-2 w-full">
                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                            <InputText
                                value={discountCode}
                                onChange={(e) => {
                                    setDiscountCode(e.target.value);
                                    setDiscountApplied(e.target.value === DISCOUNT_CODE);
                                }}
                                placeholder="Enter discount code"
                                className="text-sm w-full p-2"
                            />
                            <button
                                onClick={() => {
                                    setShowDiscountInput(false);
                                    setDiscountCode('');
                                    setDiscountApplied(false);
                                }}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <i className="pi pi-times text-xs"></i>
                            </button>
                        </div>
                        {discountApplied && (
                            <span className="text-green-500 text-sm whitespace-nowrap flex items-center gap-1">
                                <i className="pi pi-check-circle"></i>
                                {calculateDiscount(amount).savedPercentage}% off!
                            </span>
                        )}
                    </div>
                    {discountApplied && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                            <span className="line-through">{amount} sats</span>
                            <span className="text-green-500 font-semibold">→ {calculateDiscount(amount).discountedAmount} sats</span>
                        </div>
                    )}
                </div>
            )}
            <GenericButton
                label={`${discountApplied ? calculateDiscount(amount).discountedAmount : amount} sats`}
                icon="pi pi-wallet"
                onClick={() => {
                    if (status === 'unauthenticated') {
                        console.log('unauthenticated');
                        router.push('/auth/signin');
                    } else {
                        fetchInvoice();
                    }
                }}
                disabled={isLoading}
                severity='primary'
                rounded
                className={`text-[#f8f8ff] text-sm ${isLoading ? 'hidden' : ''}`}
            />
            {isLoading && (
                <div className='w-full h-full flex items-center justify-center'>
                    <ProgressSpinner
                        style={{ width: '30px', height: '30px' }}
                        strokeWidth="8"
                        animationDuration=".5s"
                    />
                </div>
            )}
            <Dialog
                visible={dialogVisible}
                onHide={() => setDialogVisible(false)}
                header="Make Payment"
                style={{ width: isMobile ? '90vw' : '50vw' }}
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
        </div>
    );
};

export default CoursePaymentButton;