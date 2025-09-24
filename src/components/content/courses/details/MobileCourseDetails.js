import React from 'react';
import Image from 'next/image';
import { Tag } from 'primereact/tag';
import ZapDisplay from '@/components/zaps/ZapDisplay';
import MoreOptionsMenu from '@/components/ui/MoreOptionsMenu';
import { Divider } from 'primereact/divider';
import GenericButton from '@/components/buttons/GenericButton';
import PromoFreeBadge from '@/components/pricing/PromoFreeBadge';

export default function MobileCourseDetails({
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
}) {
  // Calculate next lesson to start/continue
  const getNextLessonIndex = () => {
    if (!lessons || lessons.length === 0) return 0;

    // If no completed lessons, start with the first one
    if (completedLessons.length === 0) return 0;

    // Find the highest completed lesson index
    const lessonIndices = lessons.map((lesson, index) => {
      return { id: lesson.id, index };
    });

    // Get indices of completed lessons
    const completedIndices = lessonIndices
      .filter(item => completedLessons.includes(item.id))
      .map(item => item.index);

    // Get the max completed index
    const maxCompletedIndex = Math.max(...completedIndices);

    // Return the next lesson index (or the last one if all completed)
    return Math.min(maxCompletedIndex + 1, lessons.length - 1);
  };

  const nextLessonIndex = getNextLessonIndex();
  const buttonLabel = completedLessons.length === 0
    ? "Start Lesson 1"
    : `Continue to Lesson ${nextLessonIndex + 1}`;

  const handleContinueClick = () => {
    onLessonSelect(nextLessonIndex);
    toggleToContentTab();
  };

  return (
    <>
      {/* Mobile-specific layout */}
      <div className="mb-4">
        {/* Topics/tags right below image (image is in parent component) */}
        <div className="flex flex-wrap gap-2 mb-3 mt-2">
          {processedEvent.topics &&
            processedEvent.topics.length > 0 &&
            processedEvent.topics.map((topic, index) => (
              <Tag className="text-white" key={index} value={topic}></Tag>
            ))}
          {isCompleted && showCompletedTag && (
            <Tag severity="success" value="Completed" />
          )}
        </div>
        
        {/* Title and zaps in same row */}
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-xl font-bold text-white mr-3">{processedEvent.name}</h1>
          <ZapDisplay
            zapAmount={zapAmount}
            event={processedEvent}
            zapsLoading={zapsLoading && zapAmount === 0}
          />
        </div>
        
        {/* Author info and more options in bottom row */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <Image
              alt="avatar image"
              src={returnImageProxy(author?.avatar, author?.pubkey)}
              width={32}
              height={32}
              className="rounded-full mr-2"
            />
            <p className="text-gray-300 text-sm">
              Created by{' '}
              <a
                rel="noreferrer noopener"
                target="_blank"
                href={`/profile/${author?.pubkey}`}
                className="text-blue-300 hover:underline"
              >
                {author?.username || author?.name || author?.pubkey}
              </a>
            </p>
          </div>
          <MoreOptionsMenu
            menuItems={menuItems}
            additionalLinks={processedEvent?.additionalLinks || []}
            isMobileView={true}
          />
        </div>
      </div>
      
      <Divider className="my-4" />
      
      {/* Course details */}
      <div className="grid grid-cols-1 gap-4">
        {/* Description */}
        <div>
          <h2 className="text-xl font-semibold mb-3 text-white">About This Course</h2>
          <div className="text-gray-300 mb-4">
            {processedEvent.description &&
              processedEvent.description
                .split('\n')
                .map((line, index) => <p key={index} className="text-sm mb-2">{line}</p>)}
          </div>
          
          {/* Payment section */}
          <div className="mt-4">
            {renderPaymentMessage()}
          </div>
        </div>
        
        {/* Course details */}
        <div className="bg-gray-800 rounded-lg h-fit p-3 pl-0">
          <h2 className="text-lg font-semibold mb-3 text-white">Course Information</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-gray-300 font-medium mb-2">Course Content</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Lessons</p>
                  <p className="font-semibold text-white">{lessons.length}</p>
                </div>
                {paidCourse && (
                  <div>
                    <p className="text-sm text-gray-400">Price</p>
                    <PromoFreeBadge
                      wrapperClassName="flex items-center gap-2 text-white"
                      labelClassName="font-semibold text-blue-300"
                      iconClassName="pi pi-question-circle text-xs text-blue-300"
                    />
                  </div>
                )}
              </div>
            </div>
            
            {processedEvent.published && (
              <div>
                <h3 className="text-gray-300 font-medium mb-2">Details</h3>
                <div>
                  <p className="text-sm text-gray-400">Published</p>
                  <p className="font-semibold text-white">
                    {new Date(processedEvent.published * 1000).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Continue/Start button */}
          {lessons && lessons.length > 0 && !isCompleted && (
            <div className="mt-4 flex justify-start">
              <GenericButton
                label={buttonLabel}
                icon="pi pi-play"
                onClick={handleContinueClick}
                outlined={true}
                disabled={paidCourse && (!decryptionPerformed || paidCourse === 'loading')}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
} 
