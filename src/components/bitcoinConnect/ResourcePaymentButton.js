import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Modal from '@/components/ui/Modal';
import { track } from '@vercel/analytics';
import { LightningAddress } from '@getalby/lightning-tools';
import { useToast } from '@/hooks/useToast';
import { useSession } from 'next-auth/react';
import { ProgressSpinner } from 'primereact/progressspinner';
import axios from 'axios';
import GenericButton from '@/components/buttons/GenericButton';
import useWindowWidth from '@/hooks/useWindowWidth';
import { useRouter } from 'next/router';
import PromoFreeBadge from '@/components/pricing/PromoFreeBadge';
import { PROMO_FREE_PRICE_SATS, PROMO_PRICING_MESSAGE } from '@/constants/promoPricing';

const Payment = dynamic(() => import('@getalby/bitcoin-connect-react').then(mod => mod.Payment), {
  ssr: false,
});

const ResourcePaymentButton = ({ lnAddress, amount, onSuccess, onError, resourceId }) => {
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const { data: session, status } = useSession();
  const [dialogVisible, setDialogVisible] = useState(false);
  const router = useRouter();
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 768;

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

  const fetchInvoice = async () => {
    setIsLoading(true);
    try {
      if (!session?.user?.id) {
        showToast('warn', 'Sign In Required', 'Please sign in to unlock this content.');
        router.push('/auth/signin');
        return;
      }

      if (PROMO_FREE_PRICE_SATS === 0) {
        await handlePaymentSuccess({ paid: true, preimage: 'promo-free-resource' });
        showToast('success', 'Free Access Granted', PROMO_PRICING_MESSAGE);
        return;
      }

      const ln = new LightningAddress(lnAddress);
      await ln.fetch();
      const invoice = await ln.requestInvoice({
        satoshi: amount,
        comment: `Resource Purchase: ${resourceId}, User: ${session?.user?.id}`,
      });
      setInvoice(invoice);
      setDialogVisible(true);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      showToast('error', 'Invoice Error', 'Failed to fetch the invoice.');
      if (onError) onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async response => {
    try {
      const purchaseData = {
        userId: session.user.id,
        resourceId: resourceId,
        amountPaid: PROMO_FREE_PRICE_SATS,
      };

      const result = await axios.post('/api/purchase/resource', purchaseData);

      if (result.status === 200) {
        track('Resource Payment', { resourceId: resourceId, userId: session?.user?.id });
        if (onSuccess) onSuccess(response);
      } else {
        throw new Error('Failed to update user purchases');
      }
    } catch (error) {
      console.error('Error updating user purchases:', error);
      showToast(
        'error',
        'Purchase Update Failed',
        'Payment was successful, but failed to update user purchases.'
      );
      if (onError) onError(error);
    }
    setDialogVisible(false);
    setInvoice(null);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <GenericButton
          label="Free"
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
          severity="primary"
          rounded
          className={`text-[#f8f8ff] text-sm ${isLoading ? 'hidden' : ''}`}
        />
        {!isLoading && (
          <PromoFreeBadge showLabel={false} wrapperClassName="flex items-center" />
        )}
      </div>
      {isLoading && (
        <div className="w-full h-full flex items-center justify-center">
          <ProgressSpinner
            style={{ width: '30px', height: '30px' }}
            strokeWidth="8"
            animationDuration=".5s"
          />
        </div>
      )}
      <Modal
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        header="Make Payment"
        width={isMobile ? '90vw' : '50vw'}
      >
        {invoice ? (
          <Payment
            invoice={invoice.paymentRequest}
            onPaid={handlePaymentSuccess}
            paymentMethods="all"
            title={`Pay ${amount} sats`}
          />
        ) : (
          <p>Loading payment details...</p>
        )}
      </Modal>
    </>
  );
};

export default ResourcePaymentButton;
