import React from 'react';
import { Tag } from 'primereact/tag';
import Image from 'next/image';
import { useImageProxy } from '@/hooks/useImageProxy';
import GenericButton from '@/components/buttons/GenericButton';

const CourseSidebar = ({
  lessons,
  activeIndex,
  onLessonSelect,
  completedLessons,
  isMobileView,
  onClose,
  sidebarVisible,
  setSidebarVisible,
  hideToggleButton = false,
}) => {
  const { returnImageProxy } = useImageProxy();
  const navbarHeight = 60; // Match the navbar height

  const handleToggle = () => {
    // Only use the parent's state setter
    if (setSidebarVisible) {
      setSidebarVisible(!sidebarVisible);
    }
  };

  const LessonItem = ({ lesson, index }) => (
    <li
      className={`
                rounded-lg overflow-hidden transition-all duration-200
                ${
                  activeIndex === index
                    ? 'bg-blue-900/40 border-l-4 border-blue-500'
                    : 'hover:bg-gray-700/50 active:bg-gray-700/80 border-l-4 border-transparent'
                }
                ${isMobileView ? 'mb-3' : 'mb-2'}
            `}
      onClick={() => {
        // Use smooth navigation function instead of forcing page refresh
        onLessonSelect(index);
      }}
    >
      <div className={`flex items-start p-3 cursor-pointer ${isMobileView ? 'p-4' : 'p-3'}`}>
        {lesson.image && (
          <div
            className={`relative rounded-md overflow-hidden flex-shrink-0 mr-3 ${isMobileView ? 'w-16 h-16' : 'w-12 h-12'}`}
          >
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
            <span
              className={`font-medium block mb-1 text-gray-300 ${isMobileView ? 'text-base' : 'text-sm'}`}
            >
              Lesson {index + 1}
            </span>
            {completedLessons.includes(lesson.id) && (
              <Tag severity="success" value="Completed" className="ml-1 py-1 text-xs" />
            )}
          </div>
          <h3
            className={`font-medium leading-tight line-clamp-2 text-[#f8f8ff] ${isMobileView ? 'text-base' : ''}`}
          >
            {lesson.title}
          </h3>
        </div>
      </div>
    </li>
  );

  // Sidebar content component for reuse
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gray-800 text-[#f8f8ff] pl-3 py-4">
      <div className="flex items-center justify-between border-b border-gray-700 pb-4 mb-4">
        <h2 className="font-bold text-white text-lg">Course Lessons</h2>
        {sidebarVisible && !hideToggleButton && !isMobileView && (
          <GenericButton
            icon="pi pi-times"
            onClick={handleToggle}
            className="p-button-rounded p-button-text text-gray-300 hover:text-white p-button-sm"
            tooltip="Close sidebar"
            tooltipOptions={{ position: 'left' }}
            rounded={true}
          />
        )}
      </div>
      <div className="flex-1 pr-2">
        <ul className="space-y-2">
          {lessons.map((lesson, index) => (
            <LessonItem key={index} lesson={lesson} index={index} />
          ))}
        </ul>
      </div>
    </div>
  );

  // Mobile content tab
  const MobileLessonsTab = () => (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-800 shadow-md mb-6">
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <h2 className="font-bold text-white text-xl">Course Lessons</h2>
      </div>
      <div className="p-4">
        <ul className="space-y-3">
          {lessons.map((lesson, index) => (
            <LessonItem key={index} lesson={lesson} index={index} />
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile view - direct content instead of sidebar */}
      {isMobileView && sidebarVisible && (
        <MobileLessonsTab />
      )}
      
      {/* Desktop sidebar */}
      {!isMobileView && sidebarVisible && (
        <div className="relative flex flex-row-reverse z-[999]">
          <div 
            className={`transition-all duration-500 ease-in-out opacity-100`}
          >
            <div className="ml-2 w-80 sticky rounded-lg border border-gray-800 shadow-md bg-gray-800"
                 style={{ top: `${navbarHeight + 70}px` }}> {/* Adjusted to match new header spacing */}
              <SidebarContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CourseSidebar;
