import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { parseCourseEvent, parseEvent, findKind0Fields } from '@/utils/nostr';
import CourseDetails from '@/components/content/courses/CourseDetails';
import VideoLesson from '@/components/content/courses/VideoLesson';
import DocumentLesson from '@/components/content/courses/DocumentLesson';
import CombinedLesson from '@/components/content/courses/CombinedLesson';
import CourseSidebar from '@/components/content/courses/CourseSidebar';
import { useNDKContext } from '@/context/NDKContext';
import { useSession } from 'next-auth/react';
import { nip19 } from 'nostr-tools';
import { useToast } from '@/hooks/useToast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useDecryptContent } from '@/hooks/encryption/useDecryptContent';
import dynamic from 'next/dynamic';
import { Button } from 'primereact/button';
import useWindowWidth from '@/hooks/useWindowWidth';

const MDDisplay = dynamic(() => import('@uiw/react-markdown-preview'), { ssr: false });

const useCourseData = (ndk, fetchAuthor, router) => {
  const [course, setCourse] = useState(null);
  const [lessonIds, setLessonIds] = useState([]);
  const [paidCourse, setPaidCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    if (!router.isReady) return;

    const { slug } = router.query;
    let id;

    const fetchCourseId = async () => {
      if (slug.includes('naddr')) {
        const { data } = nip19.decode(slug);
        if (!data?.identifier) {
          showToast('error', 'Error', 'Resource not found');
          return null;
        }
        return data.identifier;
      } else {
        return slug;
      }
    };

    const fetchCourse = async courseId => {
      try {
        await ndk.connect();
        const event = await ndk.fetchEvent({ '#d': [courseId] });
        if (!event) return null;

        const author = await fetchAuthor(event.pubkey);
        const lessonIds = event.tags.filter(tag => tag[0] === 'a').map(tag => tag[1].split(':')[2]);

        const parsedCourse = { ...parseCourseEvent(event), author };
        return { parsedCourse, lessonIds };
      } catch (error) {
        console.error('Error fetching event:', error);
        return null;
      }
    };

    const initializeCourse = async () => {
      setLoading(true);
      id = await fetchCourseId();
      if (!id) {
        setLoading(false);
        return;
      }

      const courseData = await fetchCourse(id);
      if (courseData) {
        const { parsedCourse, lessonIds } = courseData;
        setCourse(parsedCourse);
        setLessonIds(lessonIds);
        setPaidCourse(parsedCourse.price && parsedCourse.price > 0);
      }
      setLoading(false);
    };

    initializeCourse();
  }, [router.isReady, router.query, ndk, fetchAuthor, showToast]);

  return { course, lessonIds, paidCourse, loading };
};

const useLessons = (ndk, fetchAuthor, lessonIds, pubkey) => {
  const [lessons, setLessons] = useState([]);
  const [uniqueLessons, setUniqueLessons] = useState([]);
  const { showToast } = useToast();
  useEffect(() => {
    if (lessonIds.length > 0) {
      const fetchLesson = async lessonId => {
        try {
          await ndk.connect();
          const filter = { '#d': [lessonId], kinds: [30023, 30402], authors: [pubkey] };
          const event = await ndk.fetchEvent(filter);
          if (event) {
            const author = await fetchAuthor(event.pubkey);
            const parsedLesson = { ...parseEvent(event), author };
            setLessons(prev => {
              // Check if the lesson already exists in the array
              const exists = prev.some(lesson => lesson.id === parsedLesson.id);
              if (!exists) {
                return [...prev, parsedLesson];
              }
              return prev;
            });
          }
        } catch (error) {
          console.error('Error fetching event:', error);
        }
      };
      lessonIds.forEach(lessonId => fetchLesson(lessonId));
    }
  }, [lessonIds, ndk, fetchAuthor, pubkey]);

  useEffect(() => {
    const newUniqueLessons = Array.from(
      new Map(lessons.map(lesson => [lesson.id, lesson])).values()
    );
    setUniqueLessons(newUniqueLessons);
  }, [lessons]);

  return { lessons, uniqueLessons, setLessons };
};

const useDecryption = (session, paidCourse, course, lessons, setLessons) => {
  const [decryptionPerformed, setDecryptionPerformed] = useState(false);
  const [loading, setLoading] = useState(true);
  const { decryptContent } = useDecryptContent();

  useEffect(() => {
    const decrypt = async () => {
      if (session?.user && paidCourse && !decryptionPerformed) {
        setLoading(true);
        const canAccess =
          session.user.purchased?.some(purchase => purchase.courseId === course?.d) ||
          session.user?.role?.subscribed ||
          session.user?.pubkey === course?.pubkey;

        if (canAccess && lessons.length > 0) {
          try {
            const decryptedLessons = await Promise.all(
              lessons.map(async lesson => {
                const decryptedContent = await decryptContent(lesson.content);
                return { ...lesson, content: decryptedContent };
              })
            );
            setLessons(decryptedLessons);
            setDecryptionPerformed(true);
          } catch (error) {
            console.error('Error decrypting lessons:', error);
          }
        }
        setLoading(false);
      }
      setLoading(false);
    };
    decrypt();
  }, [session, paidCourse, course, lessons, decryptionPerformed, setLessons]);

  return { decryptionPerformed, loading };
};

const Course = () => {
  const router = useRouter();
  const { ndk, addSigner } = useNDKContext();
  const { data: session, update } = useSession();
  const { showToast } = useToast();
  const [activeIndex, setActiveIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const windowWidth = useWindowWidth();
  const isMobileView = windowWidth <= 968;
  const [activeTab, setActiveTab] = useState('content'); // Default to content tab on mobile

  const setCompleted = useCallback(lessonId => {
    setCompletedLessons(prev => [...prev, lessonId]);
  }, []);

  const fetchAuthor = useCallback(
    async pubkey => {
      const author = await ndk.getUser({ pubkey });
      const profile = await author.fetchProfile();
      const fields = await findKind0Fields(profile);
      return fields;
    },
    [ndk]
  );

  const {
    course,
    lessonIds,
    paidCourse,
    loading: courseLoading,
  } = useCourseData(ndk, fetchAuthor, router);
  const { lessons, uniqueLessons, setLessons } = useLessons(
    ndk,
    fetchAuthor,
    lessonIds,
    course?.pubkey
  );
  const { decryptionPerformed, loading: decryptionLoading } = useDecryption(
    session,
    paidCourse,
    course,
    lessons,
    setLessons
  );

  useEffect(() => {
    if (router.isReady) {
      const { active } = router.query;
      if (active !== undefined) {
        setActiveIndex(parseInt(active, 10));
      } else {
        setActiveIndex(0);
      }

      // Auto-open sidebar on desktop, close on mobile
      setSidebarVisible(!isMobileView);

      // Reset to content tab when switching to mobile
      if (isMobileView) {
        setActiveTab('content');
      }
    }
  }, [router.isReady, router.query, isMobileView]);

  const handleLessonSelect = index => {
    setActiveIndex(index);
    router.push(`/course/${router.query.slug}?active=${index}`, undefined, { shallow: true });

    // On mobile, switch to content tab after selection
    if (isMobileView) {
      setActiveTab('content');
      setSidebarVisible(false);
    }
  };

  const handlePaymentSuccess = async response => {
    if (response && response?.preimage) {
      const updated = await update();
      showToast('success', 'Payment Success', 'You have successfully purchased this course');
    } else {
      showToast('error', 'Error', 'Failed to purchase course. Please try again.');
    }
  };

  const handlePaymentError = error => {
    showToast(
      'error',
      'Payment Error',
      `Failed to purchase course. Please try again. Error: ${error}`
    );
  };

  const toggleTab = tab => {
    setActiveTab(tab);
    if (tab === 'lessons') {
      setSidebarVisible(true);
    } else {
      setSidebarVisible(false);
    }
  };

  if (courseLoading || decryptionLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <ProgressSpinner />
      </div>
    );
  }

  const renderLesson = lesson => {
    if (lesson.topics?.includes('video') && lesson.topics?.includes('document')) {
      return (
        <CombinedLesson
          lesson={lesson}
          course={course}
          decryptionPerformed={decryptionPerformed}
          isPaid={paidCourse}
          setCompleted={setCompleted}
        />
      );
    } else if (lesson.type === 'video' && !lesson.topics?.includes('document')) {
      return (
        <VideoLesson
          lesson={lesson}
          course={course}
          decryptionPerformed={decryptionPerformed}
          isPaid={paidCourse}
          setCompleted={setCompleted}
        />
      );
    } else if (lesson.type === 'document' && !lesson.topics?.includes('video')) {
      return (
        <DocumentLesson
          lesson={lesson}
          course={course}
          decryptionPerformed={decryptionPerformed}
          isPaid={paidCourse}
          setCompleted={setCompleted}
        />
      );
    }
  };

  return (
    <>
      {course && paidCourse !== null && (
        <CourseDetails
          processedEvent={course}
          paidCourse={paidCourse}
          lessons={uniqueLessons}
          decryptionPerformed={decryptionPerformed}
          handlePaymentSuccess={handlePaymentSuccess}
          handlePaymentError={handlePaymentError}
        />
      )}

      <div className="mx-4">
        {/* Mobile tab navigation */}
        {isMobileView && (
          <div className="flex w-full border-b border-gray-200 dark:border-gray-700 mb-4">
            <button
              className={`flex-1 py-3 font-medium text-center border-b-2 ${
                activeTab === 'lessons'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => toggleTab('lessons')}
            >
              Course Lessons
            </button>
            <button
              className={`flex-1 py-3 font-medium text-center border-b-2 ${
                activeTab === 'content'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => toggleTab('content')}
            >
              Lesson Content
            </button>
          </div>
        )}

        <div className="flex relative">
          {/* Course Sidebar Component */}
          <CourseSidebar
            lessons={uniqueLessons}
            activeIndex={activeIndex}
            onLessonSelect={handleLessonSelect}
            completedLessons={completedLessons}
            isMobileView={isMobileView}
            onClose={() => {
              setSidebarVisible(false);
              if (isMobileView) setActiveTab('content');
            }}
            sidebarVisible={sidebarVisible}
          />

          {/* Main content */}
          <div
            className={`transition-all duration-200 ${
              !isMobileView ? 'ml-8 flex-1' : activeTab === 'content' ? 'w-full' : 'w-full hidden'
            }`}
          >
            {uniqueLessons.length > 0 && uniqueLessons[activeIndex] ? (
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                {renderLesson(uniqueLessons[activeIndex])}
              </div>
            ) : (
              <div className="text-center bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
                <p>Select a lesson from the sidebar to begin learning.</p>
              </div>
            )}

            {course?.content && (
              <div className="mt-8 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <MDDisplay className="p-4 rounded-lg" source={course.content} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Course;
