import React, { useEffect } from 'react';
import Image from 'next/image';
import { Tag } from 'primereact/tag';
import ZapDisplay from '@/components/zaps/ZapDisplay';
import MoreOptionsMenu from '@/components/ui/MoreOptionsMenu';
import { Divider } from 'primereact/divider';
import GenericButton from '@/components/buttons/GenericButton';
import PromoFreeBadge from '@/components/pricing/PromoFreeBadge';

export default function DesktopCourseDetails({
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
      {/* Header with course image, title and options */}
      <div className="flex mb-6">
        {/* Course image */}
        <div className="relative w-52 h-32 mr-6 flex-shrink-0 rounded-lg overflow-hidden">
          <Image
            alt="course image"
            src={returnImageProxy(processedEvent.image)}
            fill
            className="object-cover"
          />
        </div>

        {/* Title and options */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              {isCompleted && showCompletedTag && (
                <Tag severity="success" value="Completed" className="mb-2" />
              )}
              <h1 className="text-2xl font-bold text-white">{processedEvent.name}</h1>
            </div>
            <div className="flex items-center space-x-2">
              <ZapDisplay
                zapAmount={zapAmount}
                event={processedEvent}
                zapsLoading={zapsLoading && zapAmount === 0}
              />
              <MoreOptionsMenu
                menuItems={menuItems}
                additionalLinks={processedEvent?.additionalLinks || []}
                isMobileView={false}
              />
            </div>
          </div>

          {/* Topics/tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {processedEvent.topics &&
              processedEvent.topics.length > 0 &&
              processedEvent.topics.map((topic, index) => (
                <Tag className="text-white" key={index} value={topic}></Tag>
              ))}
          </div>

          {/* Author info */}
          <div className="flex items-center">
            <Image
              alt="avatar image"
              src={returnImageProxy(author?.avatar, author?.pubkey)}
              width={32}
              height={32}
              className="rounded-full mr-2"
            />
            <p className="text-gray-300">
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
        </div>
      </div>

      <Divider className="my-4" />

      {/* Course details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Description */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-3 text-white">About This Course</h2>
          <div className="text-gray-300 mb-4">
            {processedEvent?.description?.split('\n')
              .map((line, index) => <p key={index} className="mb-2">{line}</p>)}
          </div>

          {/* Payment section */}
          <div className="mt-4">
            {renderPaymentMessage()}
          </div>
        </div>

        {/* Right column: Course details */}
        <div className="bg-gray-800 rounded-lg h-fit p-4">
          <h2 className="text-xl font-semibold mb-3 text-white">Course Information</h2>

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
