import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/router';
import CoursePaymentButton from '@/components/bitcoinConnect/CoursePaymentButton';
import GenericButton from '@/components/buttons/GenericButton';
import { nip19 } from 'nostr-tools';
import { useImageProxy } from '@/hooks/useImageProxy';
import { useZapsSubscription } from '@/hooks/nostrQueries/zaps/useZapsSubscription';
import { getTotalFromZaps } from '@/utils/lightning';
import { useSession } from 'next-auth/react';
import useWindowWidth from '@/hooks/useWindowWidth';
import { useNDKContext } from '@/context/NDKContext';
import { findKind0Fields } from '@/utils/nostr';
import appConfig from '@/config/appConfig';
import useTrackCourse from '@/hooks/tracking/useTrackCourse';
import WelcomeModal from '@/components/onboarding/WelcomeModal';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';
import PromoFreeBadge from '@/components/pricing/PromoFreeBadge';
import { PROMO_PRICING_MESSAGE } from '@/constants/promoPricing';

// Import the desktop and mobile components
import DesktopCourseDetails from '@/components/content/courses/details/DesktopCourseDetails';
import MobileCourseDetails from './MobileCourseDetails';

export default function CourseDetails({
  processedEvent,
  paidCourse,
  lessons,
  decryptionPerformed,
  handlePaymentSuccess,
  handlePaymentError,
  isMobileView,
  showCompletedTag = true,
  completedLessons,
  onLessonSelect,
  toggleToContentTab
}) {
  const [zapAmount, setZapAmount] = useState(0);
  const [author, setAuthor] = useState(null);
  const [nAddress, setNAddress] = useState(null);
  const router = useRouter();
  const { returnImageProxy } = useImageProxy();
  const { zaps, zapsLoading, zapsError } = useZapsSubscription({ event: processedEvent });
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const windowWidth = useWindowWidth();
  const localIsMobileView = windowWidth <= 768; // Use as fallback
  const isPhone = isMobileView || localIsMobileView;
  const { ndk } = useNDKContext();
  const menuRef = useRef(null);
  const toastRef = useRef(null);

  const handleDelete = async () => {
    try {
      const response = await axios.delete(`/api/courses/${processedEvent.d}`);
      if (response.status === 204) {
        showToast('success', 'Success', 'Course deleted successfully.');
        router.push('/');
      }
    } catch (error) {
      showToast('error', 'Error', 'Failed to delete course. Please try again.');
    }
  };

  const menuItems = [
    {
      label: processedEvent?.pubkey === session?.user?.pubkey ? 'Edit' : null,
      icon: 'pi pi-pencil',
      command: () => router.push(`/course/${processedEvent.d}/edit`),
      visible: processedEvent?.pubkey === session?.user?.pubkey,
    },
    {
      label: processedEvent?.pubkey === session?.user?.pubkey ? 'Delete' : null,
      icon: 'pi pi-trash',
      command: handleDelete,
      visible: processedEvent?.pubkey === session?.user?.pubkey,
    },
    {
      label: 'View Nostr note',
      icon: 'pi pi-globe',
      command: () => window.open(`https://nostr.band/${nAddress}`, '_blank'),
    },
  ];

  const { isCompleted } = useTrackCourse({
    courseId: processedEvent?.d,
    paidCourse,
    decryptionPerformed,
  });

  const fetchAuthor = useCallback(
    async pubkey => {
      if (!pubkey) return;
      const author = await ndk.getUser({ pubkey });
      const profile = await author.fetchProfile();
      const fields = await findKind0Fields(profile);
      if (fields) {
        setAuthor(fields);
      }
    },
    [ndk]
  );

  useEffect(() => {
    if (processedEvent) {
      const naddr = nip19.naddrEncode({
        pubkey: processedEvent.pubkey,
        kind: processedEvent.kind,
        identifier: processedEvent.d,
        relays: appConfig.defaultRelayUrls,
      });
      setNAddress(naddr);
    }
  }, [processedEvent]);

  useEffect(() => {
    if (processedEvent) {
      fetchAuthor(processedEvent.pubkey);
    }
  }, [fetchAuthor, processedEvent]);

  useEffect(() => {
    if (zaps.length > 0) {
      const total = getTotalFromZaps(zaps, processedEvent);
      setZapAmount(total);
    }
  }, [zaps, processedEvent]);

  const renderPaymentMessage = () => {
    if (session?.user && session.user?.role?.subscribed && decryptionPerformed) {
      return (
        <GenericButton
          tooltipOptions={{ position: 'right' }}
          tooltip={`You are subscribed so you can access all paid content`}
          icon="pi pi-check"
          label="Subscribed"
          severity="success"
          outlined
          size="small"
          className="cursor-default hover:opacity-100 hover:bg-transparent focus:ring-0"
        />
      );
    }

    if (
      paidCourse &&
      decryptionPerformed &&
      author &&
      processedEvent?.pubkey !== session?.user?.pubkey &&
      !session?.user?.role?.subscribed
    ) {
      return (
        <div className="flex items-center gap-2">
          <i className="pi pi-check text-sm text-blue-300" />
          <PromoFreeBadge
            wrapperClassName="flex items-center gap-1 text-sm"
            labelClassName="text-blue-300 font-semibold"
            iconClassName="pi pi-question-circle text-xs text-blue-300"
          />
        </div>
      );
    }

    if (paidCourse && author && processedEvent?.pubkey === session?.user?.pubkey) {
      return (
        <div className="flex items-center gap-2">
          <i className="pi pi-check text-sm text-blue-300" />
          <PromoFreeBadge
            wrapperClassName="flex items-center gap-1 text-sm"
            labelClassName="text-blue-300 font-semibold"
            iconClassName="pi pi-question-circle text-xs text-blue-300"
          />
        </div>
      );
    }

    if (paidCourse && !decryptionPerformed) {
      return (
        <div className="w-fit">
          <CoursePaymentButton
            lnAddress={author?.lud16}
            amount={processedEvent.price}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            courseId={processedEvent.d}
          />
        </div>
      );
    }

    return null;
  };

  if (!processedEvent || !author) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <ProgressSpinner />
      </div>
    );
  }

  // Shared props for both mobile and desktop components
  const detailsProps = {
    processedEvent,
    paidCourse,
    lessons,
    decryptionPerformed,
    author,
    zapAmount,
    zapsLoading,
    menuItems,
    returnImageProxy,
    renderPaymentMessage,
    isCompleted,
    showCompletedTag,
    completedLessons,
    onLessonSelect,
    toggleToContentTab
  };

  return (
    <div className="w-full bg-gray-800 p-4 max-mob:px-0 rounded-lg">
      <Toast ref={toastRef} />
      <WelcomeModal />
      
      <div className="flex flex-col">
        {isPhone ? (
          <MobileCourseDetails {...detailsProps} />
        ) : (
          <DesktopCourseDetails {...detailsProps} />
        )}
      </div>
    </div>
  );
}
