import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useToast } from "@/hooks/useToast";
import { Tag } from 'primereact/tag';
import Image from 'next/image';
import { useRouter } from 'next/router';
import CoursePaymentButton from "@/components/bitcoinConnect/CoursePaymentButton";
import ZapDisplay from '@/components/zaps/ZapDisplay';
import GenericButton from '@/components/buttons/GenericButton';
import { nip19 } from 'nostr-tools';
import { useImageProxy } from '@/hooks/useImageProxy';
import { useZapsSubscription } from '@/hooks/nostrQueries/zaps/useZapsSubscription';
import { getTotalFromZaps } from '@/utils/lightning';
import { useSession } from 'next-auth/react';
import useWindowWidth from "@/hooks/useWindowWidth";
import { useNDKContext } from "@/context/NDKContext";
import { findKind0Fields } from '@/utils/nostr';
import appConfig from "@/config/appConfig";
import useTrackCourse from '@/hooks/tracking/useTrackCourse';
import WelcomeModal from '@/components/onboarding/WelcomeModal';
import { ProgressSpinner } from 'primereact/progressspinner';

export default function CourseDetails({ processedEvent, paidCourse, lessons, decryptionPerformed, handlePaymentSuccess, handlePaymentError }) {
    const [zapAmount, setZapAmount] = useState(0);
    const [author, setAuthor] = useState(null);
    const [nAddress, setNAddress] = useState(null);
    const router = useRouter();
    const { returnImageProxy } = useImageProxy();
    const { zaps, zapsLoading, zapsError } = useZapsSubscription({ event: processedEvent });
    const { data: session, status } = useSession();
    const { showToast } = useToast();
    const windowWidth = useWindowWidth();
    const isMobileView = windowWidth <= 768;
    const { ndk } = useNDKContext();

    const { isCompleted } = useTrackCourse({
        courseId: processedEvent?.d,
        paidCourse,
        decryptionPerformed
    });

    const fetchAuthor = useCallback(async (pubkey) => {
        if (!pubkey) return;
        const author = await ndk.getUser({ pubkey });
        const profile = await author.fetchProfile();
        const fields = await findKind0Fields(profile);
        if (fields) {
            setAuthor(fields);
        }
    }, [ndk]);

    useEffect(() => {
        if (processedEvent) {
            const naddr = nip19.naddrEncode({
                pubkey: processedEvent.pubkey,
                kind: processedEvent.kind,
                identifier: processedEvent.d,
                relays: appConfig.defaultRelayUrls
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
    }

    const renderPaymentMessage = () => {
        if (session?.user && session.user?.role?.subscribed && decryptionPerformed) {
            return <GenericButton tooltipOptions={{ position: 'top' }} tooltip={`You are subscribed so you can access all paid content`} icon="pi pi-check" label="Subscribed" severity="success" outlined size="small" className="cursor-default hover:opacity-100 hover:bg-transparent focus:ring-0" />
        }

        if (paidCourse && decryptionPerformed && author && processedEvent?.pubkey !== session?.user?.pubkey && !session?.user?.role?.subscribed) {
            return <GenericButton icon="pi pi-check" label={`Paid`} severity="success" outlined size="small" tooltip={`You paid ${processedEvent.price} sats to access this course (or potentially less if a discount was applied)`} tooltipOptions={{ position: 'top' }} className="cursor-default hover:opacity-100 hover:bg-transparent focus:ring-0" />
        }

        if (paidCourse && author && processedEvent?.pubkey === session?.user?.pubkey) {
            return <GenericButton tooltipOptions={{ position: 'top' }} tooltip={`You created this paid course, users must pay ${processedEvent.price} sats to access it`} icon="pi pi-check" label={`Price ${processedEvent.price} sats`} severity="success" outlined size="small" className="cursor-default hover:opacity-100 hover:bg-transparent focus:ring-0" />
        }

        if (paidCourse && !decryptionPerformed) {
            return (
                <CoursePaymentButton
                    lnAddress={author?.lud16}
                    amount={processedEvent.price}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    courseId={processedEvent.d}
                />
            );
        }

        return null;
    };

    const renderAdditionalLinks = () => {
        if (processedEvent?.additionalLinks && processedEvent.additionalLinks.length > 0) {
            return (
                <div className="my-4">
                    <p>Additional Links:</p>
                    {processedEvent.additionalLinks.map((link, index) => (
                        <div key={index} className="mb-2">
                            <a 
                                className="text-blue-500 hover:underline hover:text-blue-600 break-words"
                                href={link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ 
                                    wordBreak: 'break-word', 
                                    overflowWrap: 'break-word',
                                    display: 'inline-block',
                                    maxWidth: '100%'
                                }}
                            >
                                {link}
                            </a>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (!processedEvent || !author) {
        return <div className='w-full h-full flex items-center justify-center'><ProgressSpinner /></div>;
    }

    return (
        <div className="w-full">
                  <WelcomeModal />
            <div className="relative w-full h-[400px] mb-8">
                <Image
                    alt="course image"
                    src={returnImageProxy(processedEvent.image)}
                    fill
                    className="object-cover rounded-b-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            </div>
            <div className="w-full mx-auto px-4 py-8 -mt-32 relative z-10 max-mob:px-0 max-tab:px-0">
                <i className={`pi pi-arrow-left cursor-pointer hover:opacity-75 absolute top-0 left-4`} onClick={() => router.push('/')} />
                <div className="mb-8 bg-gray-800/70 rounded-lg p-4 max-mob:rounded-t-none max-tab:rounded-t-none">
                    {isCompleted && <Tag severity="success" value="Completed" />}
                    <div className="flex flex-row items-center justify-between w-full">
                        <h1 className='text-4xl font-bold text-white'>{processedEvent.name}</h1>
                        <div className="flex flex-wrap gap-2">
                            {processedEvent.topics && processedEvent.topics.length > 0 && (
                                processedEvent.topics.map((topic, index) => (
                                    <Tag className='text-white' key={index} value={topic}></Tag>
                                ))
                            )}
                        </div>
                    </div>
                    <div className='text-xl text-gray-200 mb-4 mt-4 max-mob:text-base'>{processedEvent.description && (
                        processedEvent.description.split('\n').map((line, index) => (
                            <p key={index}>{line}</p>
                        ))
                    )}
                    </div>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center'>
                            <Image
                                alt="avatar image"
                                src={returnImageProxy(author?.avatar, author?.pubkey)}
                                width={50}
                                height={50}
                                className="rounded-full mr-4"
                            />
                            <p className='text-lg text-white'>
                                By{' '}
                                <a rel='noreferrer noopener' target='_blank' className='text-blue-300 hover:underline'>
                                    {author?.username || author?.name || author?.pubkey}
                                </a>
                            </p>
                        </div>
                        <ZapDisplay
                            zapAmount={zapAmount}
                            event={processedEvent}
                            zapsLoading={zapsLoading && zapAmount === 0}
                        />
                    </div>
                    <div className='w-full mt-8 flex flex-wrap justify-between items-center'>
                        {renderPaymentMessage()}
                        {processedEvent?.pubkey === session?.user?.pubkey ? (
                            <div className='flex space-x-2 mt-4 sm:mt-0'>
                                <GenericButton onClick={() => router.push(`/course/${processedEvent.d}/edit`)} label="Edit" severity='warning' outlined />
                                <GenericButton onClick={handleDelete} label="Delete" severity='danger' outlined />
                                <GenericButton outlined icon="pi pi-external-link" onClick={() => window.open(`https://nostr.band/${nAddress}`, '_blank')} tooltip={isMobileView ? null : "View Nostr Event"} tooltipOptions={{ position: paidCourse ? 'left' : 'right' }} />
                            </div>
                        ) : (
                            <div className='flex space-x-2 mt-4 sm:mt-0'>
                                <GenericButton className='my-2' outlined icon="pi pi-external-link" onClick={() => window.open(`https://nostr.band/${nAddress}`, '_blank')} tooltip={isMobileView ? null : "View Nostr Event"} tooltipOptions={{ position: paidCourse ? 'left' : 'right' }} />
                            </div>
                        )}
                        {renderAdditionalLinks()}
                    </div>
                </div>
            </div>
        </div>
    );
}
