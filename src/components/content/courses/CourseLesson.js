import React, { useEffect, useState, useRef } from "react";
import { Tag } from "primereact/tag";
import Image from "next/image";
import { useImageProxy } from "@/hooks/useImageProxy";
import { getTotalFromZaps } from "@/utils/lightning";
import ZapDisplay from "@/components/zaps/ZapDisplay";
import dynamic from "next/dynamic";
import { useZapsQuery } from "@/hooks/nostrQueries/zaps/useZapsQuery";
import { Menu } from "primereact/menu";
import { Toast } from "primereact/toast";
import GenericButton from "@/components/buttons/GenericButton";
import useTrackDocumentLesson from "@/hooks/tracking/useTrackDocumentLesson";
import useWindowWidth from "@/hooks/useWindowWidth";

const MDDisplay = dynamic(
    () => import("@uiw/react-markdown-preview"),
    {
        ssr: false,
    }
);

const CourseLesson = ({ lesson, course, decryptionPerformed, isPaid, setCompleted }) => {
    const [zapAmount, setZapAmount] = useState(0);
    const { zaps, zapsLoading, zapsError } = useZapsQuery({ event: lesson, type: "lesson" });
    const { returnImageProxy } = useImageProxy();
    const menuRef = useRef(null);
    const toastRef = useRef(null);
    const windowWidth = useWindowWidth();
    const isMobileView = windowWidth <= 768;
    
    const readTime = lesson?.content ? Math.max(30, Math.ceil(lesson.content.length / 20)) : 60;
    
    const { isCompleted, isTracking, markLessonAsCompleted } = useTrackDocumentLesson({
        lessonId: lesson?.d,
        courseId: course?.d,
        readTime,
        paidCourse: isPaid,
        decryptionPerformed
    });
    
    const menuItems = [
        {
            label: 'Mark as completed',
            icon: 'pi pi-check-circle',
            command: async () => {
                try {
                    await markLessonAsCompleted();
                    setCompleted && setCompleted(lesson.id);
                    toastRef.current.show({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Lesson marked as completed',
                        life: 3000
                    });
                } catch (error) {
                    console.error('Failed to mark lesson as completed:', error);
                    toastRef.current.show({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to mark lesson as completed',
                        life: 3000
                    });
                }
            }
        }
    ];

    useEffect(() => {
        if (!zaps || zapsLoading || zapsError) return;

        const total = getTotalFromZaps(zaps, lesson);

        setZapAmount(total);
    }, [zaps, zapsLoading, zapsError, lesson]);
    
    useEffect(() => {
        if (isCompleted && !isTracking && setCompleted) {
            setCompleted(lesson.id);
        }
    }, [isCompleted, isTracking, lesson.id, setCompleted]);

    const renderContent = () => {
        if (isPaid && decryptionPerformed) {
            return <MDDisplay className='p-4 rounded-lg w-full' source={lesson.content} />;
        }
        if (isPaid && !decryptionPerformed) {
            return <p className="text-center text-xl text-red-500">This content is paid and needs to be purchased before viewing.</p>;
        }
        if (lesson?.content) {
            return <MDDisplay className='p-4 rounded-lg w-full' source={lesson.content} />;
        }
        return null;
    }

    return (
        <div className='w-full px-24 pt-12 mx-auto mt-4 max-tab:px-0 max-mob:px-0 max-tab:pt-2 max-mob:pt-2'>
            <Toast ref={toastRef} />
            <div className='w-full flex flex-row justify-between max-tab:flex-col max-mob:flex-col'>
                <div className='w-[75vw] mx-auto flex flex-row items-start justify-between max-tab:flex-col max-mob:flex-col max-tab:w-[95vw] max-mob:w-[95vw]'>
                    <div className='flex flex-col items-start max-w-[45vw] max-tab:max-w-[100vw] max-mob:max-w-[100vw]'>
                        <div className='pt-2 flex flex-row justify-start w-full'>
                            {lesson && lesson.topics && lesson.topics.length > 0 && (
                                lesson.topics.map((topic, index) => (
                                    <Tag className='mr-2 text-white' key={index} value={topic}></Tag>
                                ))
                            )}
                        </div>
                        <h1 className='text-4xl mt-6'>{lesson?.title}</h1>
                        <p className='text-xl mt-6'>{lesson?.summary && (
                        <div className="text-xl mt-4">
                            {lesson.summary.split('\n').map((line, index) => (
                                <p key={index}>{line}</p>
                            ))}
                        </div>
                    )}
                    </p>
                        {lesson?.additionalLinks && lesson.additionalLinks.length > 0 && (
                            <div className='mt-6'>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className='text-lg font-semibold mb-2'>External links:</h3>
                                        <ul className='list-disc list-inside'>
                                            {lesson.additionalLinks.map((link, index) => (
                                                <li key={index}>
                                                    <a href={link} target="_blank" rel="noopener noreferrer" className='text-blue-500 hover:underline'>
                                                        {new URL(link).hostname}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <Menu model={menuItems} popup ref={menuRef} />
                                        <GenericButton
                                            icon="pi pi-ellipsis-v"
                                            onClick={(e) => menuRef.current.toggle(e)}
                                            aria-label="More options"
                                            className="p-button-text"
                                            tooltip={isMobileView ? null : "More options"}
                                            tooltipOptions={{ position: 'top' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        {!lesson?.additionalLinks || lesson.additionalLinks.length === 0 && (
                            <div className='mt-6 flex justify-end'>
                                <Menu model={menuItems} popup ref={menuRef} />
                                <GenericButton
                                    icon="pi pi-ellipsis-v"
                                    onClick={(e) => menuRef.current.toggle(e)}
                                    aria-label="More options"
                                    className="p-button-text"
                                    tooltip={isMobileView ? null : "More options"}
                                    tooltipOptions={{ position: 'top' }}
                                />
                            </div>
                        )}
                        <div className='flex flex-row w-full mt-6 items-center'>
                            <Image
                                alt="avatar thumbnail"
                                src={returnImageProxy(lesson.author?.avatar, lesson.author?.pubkey)}
                                width={50}
                                height={50}
                                className="rounded-full mr-4"
                            />
                            <p className='text-lg'>
                                Created by{' '}
                                <a rel='noreferrer noopener' target='_blank' className='text-blue-500 hover:underline'>
                                    {lesson.author?.username || lesson.author?.pubkey}
                                </a>
                            </p>
                        </div>
                    </div>
                    <div className='flex flex-col max-tab:mt-12 max-mob:mt-12'>
                        {lesson && (
                            <div className='flex flex-col items-center justify-between rounded-lg h-72 p-4 bg-gray-700 drop-shadow-md'>
                                <Image
                                    alt="course thumbnail"
                                    src={returnImageProxy(lesson.image)}
                                    width={344}
                                    height={194}
                                    className="w-[344px] h-[194px] object-cover object-top rounded-lg"
                                />
                                <div className="w-full flex justify-end">
                                    <ZapDisplay zapAmount={zapAmount} event={lesson} zapsLoading={zapsLoading} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className='w-[75vw] mx-auto mt-12 p-12 border-t-2 border-gray-300 max-tab:p-0 max-mob:p-0 max-tab:max-w-[100vw] max-mob:max-w-[100vw]'>
                {renderContent()}
            </div>
        </div>
    )
}

export default CourseLesson;
