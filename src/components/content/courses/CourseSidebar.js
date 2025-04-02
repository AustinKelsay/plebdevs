import React from 'react';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import Image from 'next/image';
import { useImageProxy } from '@/hooks/useImageProxy';

const CourseSidebar = ({ 
    lessons, 
    activeIndex, 
    onLessonSelect, 
    completedLessons, 
    isMobileView, 
    onClose,
    sidebarVisible
}) => {
    const { returnImageProxy } = useImageProxy();

    const LessonItem = ({ lesson, index }) => (
        <li 
            className={`
                rounded-lg overflow-hidden transition-all duration-200
                ${activeIndex === index 
                    ? 'bg-blue-900/40 border-l-4 border-blue-500' 
                    : 'hover:bg-gray-700/50 active:bg-gray-700/80 border-l-4 border-transparent'}
                ${isMobileView ? 'mb-3' : 'mb-2'}
            `}
            onClick={() => onLessonSelect(index)}
        >
            <div className={`flex items-start p-3 cursor-pointer ${isMobileView ? 'p-4' : 'p-3'}`}>
                {lesson.image && (
                    <div className={`relative rounded-md overflow-hidden flex-shrink-0 mr-3 ${isMobileView ? 'w-16 h-16' : 'w-12 h-12'}`}>
                        <Image
                            src={returnImageProxy(lesson.image)}
                            alt={`Lesson ${index + 1} thumbnail`}
                            fill
                            className="object-cover"
                        />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start w-full">
                        <span className={`font-medium block mb-1 text-gray-300 ${isMobileView ? 'text-base' : 'text-sm'}`}>
                            Lesson {index + 1}
                        </span>
                        {completedLessons.includes(lesson.id) && (
                            <Tag severity="success" value="Completed" className="ml-1 py-1 text-xs" />
                        )}
                    </div>
                    <h3 className={`font-medium leading-tight line-clamp-2 text-[#f8f8ff] ${isMobileView ? 'text-base' : ''}`}>
                        {lesson.title}
                    </h3>
                </div>
            </div>
        </li>
    );

    // For desktop sidebar
    const DesktopSidebarContent = () => (
        <div className="h-full overflow-y-auto">
            <div className="flex flex-col p-4 h-full bg-gray-800 text-[#f8f8ff]">
                <div className="flex items-center justify-between border-b border-gray-700 pb-4 mb-4">
                    <h2 className="font-bold text-white text-lg">Course Lessons</h2>
                </div>
                <div className="overflow-y-auto flex-1 pb-16">
                    <ul className="space-y-2">
                        {lessons.map((lesson, index) => (
                            <LessonItem key={index} lesson={lesson} index={index} />
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );

    // For mobile sidebar
    const MobileSidebarContent = () => (
        <div className="bg-gray-800 text-[#f8f8ff] p-4">
            <div className="border-b border-gray-700 pb-4 mb-4">
                <h2 className="font-bold text-white text-xl">Course Lessons</h2>
            </div>
            <ul className="space-y-0">
                {lessons.map((lesson, index) => (
                    <LessonItem key={index} lesson={lesson} index={index} />
                ))}
            </ul>
        </div>
    );

    // Desktop sidebar
    if (!isMobileView) {
        return (
            <div className="w-80 h-[calc(100vh-400px)] sticky top-8 overflow-hidden rounded-lg border border-gray-800 shadow-sm bg-gray-900">
                <DesktopSidebarContent />
            </div>
        );
    }

    // Mobile sidebar - now integrated with tab system
    if (isMobileView && sidebarVisible) {
        return (
            <div className="w-full bg-gray-900 rounded-lg border border-gray-800 shadow-sm overflow-visible mb-4">
                <MobileSidebarContent />
            </div>
        );
    }

    return null;
};

export default CourseSidebar; 