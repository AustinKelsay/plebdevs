import React, { useEffect, useState } from "react";
import axios from "axios";
import { useToast } from "@/hooks/useToast";
import { Tag } from "primereact/tag";
import Image from "next/image";
import { useRouter } from "next/router";
import ResourcePaymentButton from "@/components/bitcoinConnect/ResourcePaymentButton";
import ZapDisplay from "@/components/zaps/ZapDisplay";
import GenericButton from "@/components/buttons/GenericButton";
import { useImageProxy } from "@/hooks/useImageProxy";
import { useZapsSubscription } from "@/hooks/nostrQueries/zaps/useZapsSubscription";
import { getTotalFromZaps } from "@/utils/lightning";
import { useSession } from "next-auth/react";
import useWindowWidth from "@/hooks/useWindowWidth";
import dynamic from "next/dynamic";

const MDDisplay = dynamic(
    () => import("@uiw/react-markdown-preview"),
    {
        ssr: false,
    }
);

const VideoDetails = ({ processedEvent, topics, title, summary, image, price, author, paidResource, decryptedContent, nAddress, handlePaymentSuccess, handlePaymentError, authorView, isLesson }) => {
    const [zapAmount, setZapAmount] = useState(0);
    const [course, setCourse] = useState(null);
    const router = useRouter();
    const { returnImageProxy } = useImageProxy();
    const { zaps, zapsLoading, zapsError } = useZapsSubscription({ event: processedEvent });
    const { data: session, status } = useSession();
    const { showToast } = useToast();
    const windowWidth = useWindowWidth();
    const isMobileView = windowWidth <= 768;

    useEffect(() => {
        if (isLesson) {
            axios.get(`/api/resources/${processedEvent.d}`).then(res => {
                if (res.data && res.data.lessons[0]?.courseId) {
                    setCourse(res.data.lessons[0]?.courseId);
                }
            }).catch(err => {
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

    const handleDelete = async () => {
        try {
            const response = await axios.delete(`/api/resources/${processedEvent.d}`);
            if (response.status === 204) {
                showToast('success', 'Success', 'Resource deleted successfully.');
                router.push('/');
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.error.includes("Invalid `prisma.resource.delete()`")) {
                showToast('error', 'Error', 'Resource cannot be deleted because it is part of a course, delete the course first.');
            }
            else if (error.response && error.response.data && error.response.data.error) {
                showToast('error', 'Error', error.response.data.error);
            } else {
                showToast('error', 'Error', 'Failed to delete resource. Please try again.');
            }
        }
    }

    const renderPaymentMessage = () => {
        if (session?.user && session.user?.role?.subscribed && decryptedContent) {
            return <GenericButton tooltipOptions={{ position: 'top' }} tooltip={`You are subscribed so you can access all paid content`} icon="pi pi-check" label="Subscribed" severity="success" outlined size="small" className="cursor-default hover:opacity-100 hover:bg-transparent focus:ring-0" />
        }
        // if the user paid for the course that this lesson is in, show a message that says you have this lesson through the course and show how much you paid for the course
        if (isLesson && course && session?.user?.purchased?.some(purchase => purchase.courseId === course)) {
            return <GenericButton tooltipOptions={{ position: 'top' }} tooltip={`You have this lesson through purchasing the course it belongs to. You paid ${session?.user?.purchased?.find(purchase => purchase.courseId === course)?.course?.price} sats for the course.`} icon="pi pi-check" label={`Paid ${session?.user?.purchased?.find(purchase => purchase.courseId === course)?.course?.price} sats`} severity="success" outlined size="small" className="cursor-default hover:opacity-100 hover:bg-transparent focus:ring-0" />
        }

        if (paidResource && decryptedContent && author && processedEvent?.pubkey !== session?.user?.pubkey && !session?.user?.role?.subscribed) {
            return <GenericButton icon="pi pi-check" label={`Paid ${processedEvent.price} sats`} severity="success" outlined size="small" className="cursor-default hover:opacity-100 hover:bg-transparent focus:ring-0" />
        }

        if (paidResource && author && processedEvent?.pubkey === session?.user?.pubkey) {
            return <GenericButton tooltipOptions={{ position: 'top' }} tooltip={`You created this paid content, users must pay ${processedEvent.price} sats to access it`} icon="pi pi-check" label={`Price ${processedEvent.price} sats`} severity="success" outlined size="small" className="cursor-default hover:opacity-100 hover:bg-transparent focus:ring-0" />
        }

        return null;
    };

    const renderContent = () => {
        if (decryptedContent) {
            return <MDDisplay className='p-0 rounded-lg w-full' source={decryptedContent} />;
        }
        if (paidResource && !decryptedContent) {
            return (
                <div className="w-full aspect-video rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
                    <div
                        className="absolute inset-0 opacity-50"
                        style={{
                            backgroundImage: `url(${image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    ></div>
                    <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                    <div className="mx-auto py-auto z-10">
                        <i className="pi pi-lock text-[100px] text-red-500"></i>
                    </div>
                    <p className="text-center text-xl text-red-500 z-10 mt-4">
                        This content is paid and needs to be purchased before viewing.
                    </p>
                    <div className="flex flex-row items-center justify-center w-full mt-4 z-10">
                        <ResourcePaymentButton
                            lnAddress={author?.lud16}
                            amount={price}
                            onSuccess={handlePaymentSuccess}
                            onError={handlePaymentError}
                            resourceId={processedEvent.d}
                        />
                    </div>
                </div>
            );
        }
        if (processedEvent?.content) {
            return <MDDisplay className='p-0 rounded-lg w-full' source={processedEvent.content} />;
        }
        return null;
    }

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

    return (
        <div className="w-full">
            {renderContent()}
            <div className="bg-gray-800/90 rounded-lg p-4 m-4 max-mob:m-0 max-tab:m-0 max-mob:rounded-t-none max-tab:rounded-t-none">
                <div className={`w-full flex flex-col items-start justify-start mt-2 px-2`}>
                    <div className="flex flex-col items-start gap-2 w-full">
                        <div className="flex flex-row items-center justify-between gap-2 w-full">
                            <h1 className='text-4xl flex-grow'>{title}</h1>
                            <ZapDisplay
                                zapAmount={zapAmount}
                                event={processedEvent}
                                zapsLoading={zapsLoading && zapAmount === 0}
                            />
                        </div>
                        <div className="flex flex-row items-center gap-2 w-full">
                            {topics && topics.length > 0 && (
                                topics.map((topic, index) => (
                                    <Tag className='mt-2 text-white' key={index} value={topic}></Tag>
                                ))
                            )}
                            {isLesson && <Tag className="mt-2 text-white" value="lesson" />}
                        </div>
                    </div>
                    <div className='flex flex-row items-center justify-between w-full'>
                        <div className="mt-4 max-mob:text-base max-tab:text-base">
                            {(summary)?.split('\n').map((line, index) => (
                                <p key={index}>{line}</p>
                            ))}
                            {renderAdditionalLinks()}
                        </div>
                    </div>
                    <div className='flex items-center'>
                        <Image
                            alt="avatar image"
                            src={returnImageProxy(author?.avatar, author?.username)}
                            width={50}
                            height={50}
                            className="rounded-full mr-4"
                        />
                        <p className='text-lg text-white'>
                            By{' '}
                            <a rel='noreferrer noopener' target='_blank' className='text-blue-300 hover:underline'>
                                {author?.username}
                            </a>
                        </p>
                    </div>
                </div>
                <div className="w-full flex flex-row justify-end mt-4">
                    {authorView ? (
                        <div className='flex space-x-2 mt-4 sm:mt-0'>
                            {renderPaymentMessage()}
                            <div className="flex flex-row justify-end">
                                <GenericButton onClick={() => router.push(`/details/${processedEvent.id}/edit`)} label="Edit" severity='warning' outlined />
                                <GenericButton onClick={handleDelete} label="Delete" severity='danger' outlined />
                                <GenericButton
                                    tooltip={isMobileView ? null : "View Nostr Note"}
                                    tooltipOptions={{ position: 'left' }}
                                    icon="pi pi-external-link"
                                    outlined
                                    onClick={() => {
                                        window.open(`https://habla.news/a/${nAddress}`, '_blank');
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="w-full flex flex-row justify-between">
                            {renderPaymentMessage()}
                            <div className="flex flex-row justify-end">
                                {course && <GenericButton size={isMobileView ? 'small' : null} outlined icon="pi pi-external-link" onClick={() => window.open(`/course/${course}`, '_blank')} label={isMobileView ? "Course" : "Open Course"} tooltip="This is a lesson in a course" tooltipOptions={{ position: 'top' }} />}
                                <GenericButton
                                    size={isMobileView ? 'small' : null}
                                    tooltip={isMobileView ? null : "View Nostr Note"}
                                    tooltipOptions={{ position: 'left' }}
                                    icon="pi pi-external-link"
                                    outlined
                                    onClick={() => {
                                        window.open(`https://habla.news/a/${nAddress}`, '_blank');
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default VideoDetails;



