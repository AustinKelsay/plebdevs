import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/useToast';
import { Tag } from 'primereact/tag';
import Image from 'next/image';
import { useRouter } from 'next/router';
import ResourcePaymentButton from '@/components/bitcoinConnect/ResourcePaymentButton';
import ZapDisplay from '@/components/zaps/ZapDisplay';
import GenericButton from '@/components/buttons/GenericButton';
import { useImageProxy } from '@/hooks/useImageProxy';
import { useZapsSubscription } from '@/hooks/nostrQueries/zaps/useZapsSubscription';
import { getTotalFromZaps } from '@/utils/lightning';
import { useSession } from 'next-auth/react';
import useWindowWidth from '@/hooks/useWindowWidth';
import { Toast } from 'primereact/toast';
import MoreOptionsMenu from '@/components/ui/MoreOptionsMenu';
import ZapThreadsWrapper from '@/components/ZapThreadsWrapper';
import appConfig from '@/config/appConfig';
import { nip19 } from 'nostr-tools';
import MarkdownDisplay from '@/components/markdown/MarkdownDisplay';
import PromoFreeBadge from '@/components/pricing/PromoFreeBadge';
import { PROMO_PRICING_MESSAGE } from '@/constants/promoPricing';

const CombinedDetails = ({
  processedEvent,
  topics,
  title,
  summary,
  image,
  price,
  author,
  paidResource,
  decryptedContent,
  nAddress,
  handlePaymentSuccess,
  handlePaymentError,
  authorView,
  isLesson,
}) => {
  const [zapAmount, setZapAmount] = useState(0);
  const [course, setCourse] = useState(null);
  const router = useRouter();
  const { returnImageProxy } = useImageProxy();
  const { zaps, zapsLoading } = useZapsSubscription({ event: processedEvent });
  const { data: session } = useSession();
  const { showToast } = useToast();
  const windowWidth = useWindowWidth();
  const isMobileView = windowWidth <= 768;
  const menuRef = useRef(null);
  const toastRef = useRef(null);
  const [nsec, setNsec] = useState(null);
  const [npub, setNpub] = useState(null);

  const handleDelete = async () => {
    try {
      const response = await axios.delete(`/api/resources/${processedEvent.d}`);
      if (response.status === 204) {
        showToast('success', 'Success', 'Resource deleted successfully.');
        router.push('/');
      }
    } catch (error) {
      if (error.response?.data?.error?.includes('Invalid `prisma.resource.delete()`')) {
        showToast(
          'error',
          'Error',
          'Resource cannot be deleted because it is part of a course, delete the course first.'
        );
      } else {
        showToast('error', 'Error', 'Failed to delete resource. Please try again.');
      }
    }
  };

  const authorMenuItems = [
    {
      label: 'Edit',
      icon: 'pi pi-pencil',
      command: () => router.push(`/details/${processedEvent.id}/edit`),
    },
    {
      label: 'Delete',
      icon: 'pi pi-trash',
      command: handleDelete,
    },
    {
      label: 'View Nostr note',
      icon: 'pi pi-globe',
      command: () => {
        window.open(`https://habla.news/a/${nAddress}`, '_blank');
      },
    },
  ];

  const userMenuItems = [
    {
      label: 'View Nostr note',
      icon: 'pi pi-globe',
      command: () => {
        window.open(`https://habla.news/a/${nAddress}`, '_blank');
      },
    },
  ];

  if (course) {
    userMenuItems.unshift({
      label: isMobileView ? 'Course' : 'Open Course',
      icon: 'pi pi-external-link',
      command: () => window.open(`/course/${course}`, '_blank'),
    });
  }

  useEffect(() => {
    if (isLesson) {
      axios
        .get(`/api/resources/${processedEvent.d}`)
        .then(res => {
          if (res.data && res.data.lessons[0]?.courseId) {
            setCourse(res.data.lessons[0]?.courseId);
          }
        })
        .catch(err => {
          console.error('err', err);
        });
    }
  }, [processedEvent.d, isLesson]);

  useEffect(() => {
    if (zaps.length > 0) {
      const total = getTotalFromZaps(zaps, processedEvent);
      setZapAmount(total);
    }
  }, [zaps, processedEvent]);

  useEffect(() => {
    // reset first to avoid key‑leak across session changes
    setNsec(null);
    setNpub(null);

    if (session?.user?.privkey) {
      const privkeyBuffer = Buffer.from(session.user.privkey, 'hex');
      setNsec(nip19.nsecEncode(privkeyBuffer));
      setNpub(null);
    } else if (session?.user?.pubkey) {
      setNsec(null);
      setNpub(nip19.npubEncode(session.user.pubkey));
    } else {
      setNsec(null);
      setNpub(null);
    }
  }, [session]);

  const renderPaymentMessage = () => {
    if (session?.user?.role?.subscribed && decryptedContent) {
      return (
        <GenericButton
          tooltipOptions={{ position: 'top' }}
          tooltip="You are subscribed so you can access all paid content"
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
      isLesson &&
      course &&
      session?.user?.purchased?.some(purchase => purchase.courseId === course)
    ) {
      return (
        <div className="flex items-center gap-2 text-green-400">
          <i className="pi pi-check text-sm" />
          <PromoFreeBadge
            wrapperClassName="flex items-center gap-1 text-sm"
            labelClassName="text-green-400 font-semibold"
          />
        </div>
      );
    }

    if (
      paidResource &&
      decryptedContent &&
      author &&
      processedEvent?.pubkey !== session?.user?.pubkey &&
      !session?.user?.role?.subscribed
    ) {
      return (
        <div className="flex items-center gap-2 text-green-400">
          <i className="pi pi-check text-sm" />
          <PromoFreeBadge
            wrapperClassName="flex items-center gap-1 text-sm"
            labelClassName="text-green-400 font-semibold"
          />
        </div>
      );
    }

    if (paidResource && author && processedEvent?.pubkey === session?.user?.pubkey) {
      return (
        <div className="flex items-center gap-2 text-green-400">
          <i className="pi pi-check text-sm" />
          <PromoFreeBadge
            wrapperClassName="flex items-center gap-1 text-sm"
            labelClassName="text-green-400 font-semibold"
          />
        </div>
      );
    }

    return null;
  };

  const renderContent = () => {
    if (decryptedContent) {
      return <MarkdownDisplay content={decryptedContent} className="p-2 rounded-lg w-full" />;
    }

    if (paidResource && !decryptedContent) {
      return (
        <div className="w-full px-4">
          <div className="w-full p-8 rounded-lg flex flex-col items-center justify-center bg-gray-800">
            <div className="mx-auto py-auto">
              <i className="pi pi-gift text-[60px] text-green-400"></i>
            </div>
            <p className="text-center text-xl text-green-400 mt-4">{PROMO_PRICING_MESSAGE}</p>
            <div className="flex flex-row items-center justify-center w-full mt-4">
            <ResourcePaymentButton
              lnAddress={author?.lud16}
              amount={price}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                resourceId={processedEvent.d}
              />
            </div>
          </div>
        </div>
      );
    }

    if (processedEvent?.content) {
      return <MarkdownDisplay content={processedEvent.content} className="p-4 rounded-lg w-full" />;
    }

    return null;
  };

  return (
    <div className="w-full">
      <Toast ref={toastRef} />
      <div className="relative w-full h-[400px] mb-8">
        <Image alt="background image" src={returnImageProxy(image)} fill className="object-cover" />
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      </div>
      <div className="w-full mx-auto px-4 py-8 -mt-32 relative z-10 max-mob:px-0 max-tab:px-0">
        <div className="mb-8 bg-gray-800/70 rounded-lg p-4 max-mob:rounded-t-none max-tab:rounded-t-none">
          <div className="flex flex-row items-center justify-between w-full">
            <h1 className="text-4xl font-bold text-white">{title}</h1>
            <ZapDisplay
              zapAmount={zapAmount}
              event={processedEvent}
              zapsLoading={zapsLoading && zapAmount === 0}
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-2 mb-4">
            {topics?.map((topic, index) => (
              <Tag className="text-[#f8f8ff]" key={index} value={topic} />
            ))}
            {isLesson && <Tag size="small" className="text-[#f8f8ff]" value="lesson" />}
          </div>
          {summary?.split('\n').map((line, index) => (
            <p key={index}>{line}</p>
          ))}
          <div className="flex items-center justify-between mt-8">
            <div className="flex items-center">
              <Image
                alt="avatar image"
                src={returnImageProxy(author?.avatar, author?.username)}
                width={50}
                height={50}
                className="rounded-full mr-4"
              />
              <p className="text-lg text-white">
                By{' '}
                <a
                  rel="noreferrer noopener"
                  target="_blank"
                  className="text-blue-300 hover:underline"
                >
                  {author?.username}
                </a>
              </p>
            </div>
            <div className="flex justify-end">
              <MoreOptionsMenu
                menuItems={authorView ? authorMenuItems : userMenuItems}
                additionalLinks={processedEvent?.additionalLinks || []}
                isMobileView={isMobileView}
              />
            </div>
          </div>
          <div className="w-full mt-4">{renderPaymentMessage()}</div>
          {nAddress && (
            <div className="mt-8">
              {!paidResource || decryptedContent || session?.user?.role?.subscribed ? (
                <ZapThreadsWrapper
                  anchor={nAddress}
                  user={session?.user ? nsec || npub : null}
                  relays={appConfig.defaultRelayUrls.join(',')}
                  disable="zaps"
                  isAuthorized={true}
                />
              ) : (
                <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                  <p className="text-gray-400">
                    Comments are only available to content purchasers, subscribers, and the content
                    creator.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default CombinedDetails;
