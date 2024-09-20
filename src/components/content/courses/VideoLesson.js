import React, { useEffect, useState, useRef, useCallback } from "react";
import { Tag } from "primereact/tag";
import Image from "next/image";
import ZapDisplay from "@/components/zaps/ZapDisplay";
import { useImageProxy } from "@/hooks/useImageProxy";
import GenericButton from "@/components/buttons/GenericButton";
import { useZapsQuery } from "@/hooks/nostrQueries/zaps/useZapsQuery";
import { nip19 } from "nostr-tools";
import { getTotalFromZaps } from "@/utils/lightning";
import dynamic from "next/dynamic";
import { Divider } from "primereact/divider";
import appConfig from "@/config/appConfig";
import useWindowWidth from "@/hooks/useWindowWidth";
import useTrackVideoLesson from '@/hooks/tracking/useTrackVideoLesson';

const MDDisplay = dynamic(
    () => import("@uiw/react-markdown-preview"),
    {
        ssr: false,
    }
);

const VideoLesson = ({ lesson, course, decryptionPerformed, isPaid, setCompleted }) => {
    const [zapAmount, setZapAmount] = useState(0);
    const [nAddress, setNAddress] = useState(null);
    const { zaps, zapsLoading, zapsError } = useZapsQuery({ event: lesson, type: "lesson" });
    const { returnImageProxy } = useImageProxy();
    const windowWidth = useWindowWidth();
    const isMobileView = windowWidth <= 768;
    const [videoDuration, setVideoDuration] = useState(null);
    const [videoPlayed, setVideoPlayed] = useState(false);
    const mdDisplayRef = useRef(null);

    const { isCompleted, isTracking } = useTrackVideoLesson({
        lessonId: lesson?.d,
        videoDuration,
        courseId: course?.d,
        videoPlayed
    });

    useEffect(() => {
        const handleYouTubeMessage = (event) => {
            if (event.origin !== "https://www.youtube.com") return;
            
            try {
                const data = JSON.parse(event.data);
                console.log('youtube data', data);
                if (data.event === "onReady") {
                    event.source.postMessage('{"event":"listening"}', "https://www.youtube.com");
                } else if (data.event === "infoDelivery" && data?.info && data?.info?.currentTime) {
                    setVideoPlayed(true);
                    setVideoDuration(data.info?.progressState?.duration);
                    event.source.postMessage('{"event":"command","func":"getDuration","args":""}', "https://www.youtube.com");
                }
            } catch (error) {
                console.error("Error parsing YouTube message:", error);
            }
        };

        window.addEventListener("message", handleYouTubeMessage);

        return () => {
            window.removeEventListener("message", handleYouTubeMessage);
        };
    }, []);

    useEffect(() => {
        if (videoDuration && videoPlayed) {
            console.log('videoDuration and videoPlayed', videoDuration, videoPlayed);
        }
    }, [videoDuration, videoPlayed]);

    useEffect(() => {
        if (videoPlayed) {
            console.log('videoPlayed', videoPlayed);
        }
    }, [videoPlayed]);

    const checkDuration = useCallback(() => {
        const videoElement = mdDisplayRef.current?.querySelector('video');
        const youtubeIframe = mdDisplayRef.current?.querySelector('iframe[src*="youtube.com"]');
        
        if (videoElement && videoElement.readyState >= 1) {
            setVideoDuration(Math.round(videoElement.duration));
            setVideoPlayed(true);
        } else if (youtubeIframe) {
            youtubeIframe.contentWindow.postMessage('{"event":"listening"}', '*');
        }
    }, []);

    useEffect(() => {
        if (isCompleted) {
            setCompleted(lesson.id);
        }
    }, [isCompleted, lesson.id]);  // Remove setCompleted from dependencies

    useEffect(() => {
        if (!zaps || zapsLoading || zapsError) return;
        const total = getTotalFromZaps(zaps, lesson);
        setZapAmount(total);
    }, [zaps, zapsLoading, zapsError, lesson]);

    useEffect(() => {
        const addr = nip19.naddrEncode({
            pubkey: lesson.pubkey,
            kind: lesson.kind,
            identifier: lesson.d,
            relayUrls: appConfig.defaultRelayUrls
        });
        setNAddress(addr);
    }, [lesson]);

    useEffect(() => {
        if (decryptionPerformed && isPaid) {
            const timer = setTimeout(checkDuration, 500);
            return () => clearTimeout(timer);
        } else {
            // For non-paid content, start checking after 3 seconds
            const timer = setTimeout(checkDuration, 3000);
            return () => clearTimeout(timer);
        }
    }, [decryptionPerformed, isPaid, checkDuration]);

    const renderContent = () => {
        if (isPaid && decryptionPerformed) {
            return (
                <div ref={mdDisplayRef}>
                    <MDDisplay className='p-0 rounded-lg w-full' source={lesson.content} />
                </div>
            );
        } else if (isPaid && !decryptionPerformed) {
            return (
                <div className="w-full aspect-video rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
                    <div 
                        className="absolute inset-0 opacity-50"
                        style={{
                            backgroundImage: `url(${lesson.image})`,
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
                </div>
            );
        } else if (lesson?.content) {
            return (
                <div ref={mdDisplayRef}>
                    <MDDisplay className='p-0 rounded-lg w-full' source={lesson.content} />
                </div>
            );
        }
        return null;
    }

    return (
        <div className="w-full">
            {renderContent()}
            <Divider />
            <div className="bg-gray-800/90 rounded-lg p-4 m-4">
                <div className="w-full flex flex-col items-start justify-start mt-2 px-2">
                    <div className="flex flex-row items-center gap-2 w-full">
                        <h1 className='text-3xl text-white'>{lesson.title}</h1>
                        {lesson.topics && lesson.topics.length > 0 && (
                            lesson.topics.map((topic, index) => (
                                <Tag className='mt-2 text-white' key={index} value={topic}></Tag>
                            ))
                        )}
                    </div>
                    <div className='flex flex-row items-center justify-between w-full'>
                        <div className='text-xl mt-4 text-gray-200'>{lesson.summary && (
                        <div className="text-xl mt-4">
                            {lesson.summary.split('\n').map((line, index) => (
                                <p key={index}>{line}</p>
                            ))}
                        </div>
                    )}
                    </div>
                        <ZapDisplay
                            zapAmount={zapAmount}
                            event={lesson}
                            zapsLoading={zapsLoading}
                        />
                    </div>
                </div>
                <div className='w-full flex flex-col space-y-4 mt-4'>
                    <div className='flex flex-row justify-between items-center'>
                        <div className='flex flex-row w-fit items-center'>
                            <Image
                                alt="avatar image"
                                src={returnImageProxy(lesson.author?.avatar, lesson.author?.username)}
                                width={50}
                                height={50}
                                className="rounded-full mr-4"
                            />
                            <p className='text-lg text-white'>
                                Created by{' '}
                                <a rel='noreferrer noopener' target='_blank' className='text-blue-300 hover:underline'>
                                    {lesson.author?.username || lesson.author?.name || lesson.author?.pubkey}
                                </a>
                            </p>
                        </div>
                        <GenericButton
                            tooltip={isMobileView ? null : "View Nostr Note"}
                            tooltipOptions={{ position: 'left' }}
                            icon="pi pi-external-link"
                            outlined
                            onClick={() => {
                                window.open(`https://nostr.com/${nAddress}`, '_blank');
                            }}
                        />
                    </div>
                </div>
                {lesson?.additionalLinks && lesson.additionalLinks.length > 0 && (
                    <div className='mt-6'>
                        <h3 className='text-lg font-semibold mb-2 text-white'>External links:</h3>
                        <ul className='list-disc list-inside text-white'>
                            {lesson.additionalLinks.map((link, index) => (
                                <li key={index}>
                                    <a href={link} target="_blank" rel="noopener noreferrer" className='text-blue-300 hover:underline'>
                                        {new URL(link).hostname}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}

export default VideoLesson;