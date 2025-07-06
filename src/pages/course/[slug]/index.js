import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { findKind0Fields } from '@/utils/nostr';
import { useNDKContext } from '@/context/NDKContext';
import { useSession } from 'next-auth/react';
import { nip19 } from 'nostr-tools';
import { useToast } from '@/hooks/useToast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Buffer } from 'buffer';

// Hooks
import useCourseDecryption from '@/hooks/encryption/useCourseDecryption';
import useCourseData from '@/hooks/courses/useCourseData';
import useLessons from '@/hooks/courses/useLessons';
import useCourseNavigation from '@/hooks/courses/useCourseNavigation';
import useWindowWidth from '@/hooks/useWindowWidth';

// Components
import CourseSidebar from '@/components/content/courses/layout/CourseSidebar';
import CourseContent from '@/components/content/courses/tabs/CourseContent';
import CourseQA from '@/components/content/courses/tabs/CourseQA';
import CourseOverview from '@/components/content/courses/tabs/CourseOverview';
import MenuTab from '@/components/menutab/MenuTab';

// Config
import appConfig from '@/config/appConfig';

const Course = () => {
  const router = useRouter();
  const { ndk, addSigner } = useNDKContext();
  const { data: session, update } = useSession();
  const { showToast } = useToast();
  const [completedLessons, setCompletedLessons] = useState([]);
  const [nAddresses, setNAddresses] = useState({});
  const [nsec, setNsec] = useState(null);
  const [npub, setNpub] = useState(null);
  const [nAddress, setNAddress] = useState(null);
  const windowWidth = useWindowWidth();
  const isMobileView = windowWidth <= 968;
  const navbarHeight = 60; // Match the height from Navbar component

  // Use our navigation hook
  const {
    activeIndex,
    activeTab,
    sidebarVisible,
    setSidebarVisible,
    handleLessonSelect,
    toggleTab,
    toggleSidebar,
    getActiveTabIndex,
    getTabItems,
  } = useCourseNavigation(router, isMobileView);

  useEffect(() => {
    if (router.isReady && router.query.slug) {
      const { slug } = router.query;
      if (slug.includes('naddr')) {
        setNAddress(slug);
      } else {
        console.warn('No naddress found in slug');
        showToast('error', 'Error', 'Course identifier not found in URL');
        setTimeout(() => {
          router.push('/courses'); // Redirect to courses page
        }, 3000);
      }
    }
  }, [router.isReady, router.query.slug, showToast, router]);

  // Load completed lessons from localStorage when course is loaded
  useEffect(() => {
    if (router.isReady && router.query.slug && session?.user) {
      const courseId = router.query.slug;
      const storageKey = `course_${courseId}_${session.user.pubkey}_completed`;
      const savedCompletedLessons = localStorage.getItem(storageKey);
      
      if (savedCompletedLessons) {
        try {
          const parsedLessons = JSON.parse(savedCompletedLessons);
          setCompletedLessons(parsedLessons);
        } catch (error) {
          console.error('Error parsing completed lessons from storage:', error);
        }
      }
    }
  }, [router.isReady, router.query.slug, session]);

  const setCompleted = useCallback(lessonId => {
    setCompletedLessons(prev => {
      // Avoid duplicates
      if (prev.includes(lessonId)) {
        return prev;
      }
      
      const newCompletedLessons = [...prev, lessonId];
      
      // Save to localStorage
      if (router.query.slug && session?.user) {
        const courseId = router.query.slug;
        const storageKey = `course_${courseId}_${session.user.pubkey}_completed`;
        localStorage.setItem(storageKey, JSON.stringify(newCompletedLessons));
      }
      
      return newCompletedLessons;
    });
  }, [router.query.slug, session]);

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
  
  const { decryptionPerformed, loading: decryptionLoading, decryptedLessonIds } = useCourseDecryption(
    session,
    paidCourse,
    course,
    uniqueLessons,
    setLessons,
    router,
    activeIndex
  );

  // Replace useState + useEffect with useMemo for derived state
  const isDecrypting = useMemo(() => {
    if (!paidCourse || uniqueLessons.length === 0) return false;
    const current = uniqueLessons[activeIndex];
    return current && decryptedLessonIds && !decryptedLessonIds[current.id];
  }, [paidCourse, uniqueLessons, activeIndex, decryptedLessonIds]);

  useEffect(() => {
    if (uniqueLessons.length > 0) {
      const addresses = {};
      uniqueLessons.forEach(lesson => {
        const addr = nip19.naddrEncode({
          pubkey: lesson.pubkey,
          kind: lesson.kind,
          identifier: lesson.d,
          relays: appConfig.defaultRelayUrls,
        });
        addresses[lesson.id] = addr;
      });
      setNAddresses(addresses);
    }
  }, [uniqueLessons]);

  useEffect(() => {
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

  const isAuthorized = 
    session?.user?.role?.subscribed || 
    session?.user?.pubkey === course?.pubkey || 
    !paidCourse || 
    session?.user?.purchased?.some(purchase => purchase.courseId === course?.d);

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

  if (courseLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto px-8 max-mob:px-0 mb-12 mt-2">
        {/* Tab navigation using MenuTab component */}
        <div className="z-10 bg-transparent"
             style={{ 
               top: `${navbarHeight}px`,
               height: `${navbarHeight}px`
             }}> 
          <MenuTab 
            items={getTabItems()}
            activeIndex={getActiveTabIndex()}
            onTabChange={(index) => toggleTab(index)}
            sidebarVisible={sidebarVisible}
            onToggleSidebar={toggleSidebar}
            isMobileView={isMobileView}
          />
        </div>

        {/* Main content area with flex layout */}
        <div className={`relative mt-4 ${!isMobileView ? 'flex items-start gap-x-8' : ''}`}>
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Overview tab content */}
            <div className={`${activeTab === 'overview' ? 'block' : 'hidden'}`}>
              <CourseOverview
                course={course}
                paidCourse={paidCourse}
                lessons={uniqueLessons}
                decryptionPerformed={decryptionPerformed}
                handlePaymentSuccess={handlePaymentSuccess}
                handlePaymentError={handlePaymentError}
                isMobileView={isMobileView}
                completedLessons={completedLessons}
                onLessonSelect={handleLessonSelect}
                toggleToContentTab={() => toggleTab(1)} // Assuming content tab is at index 1
              />
            </div>

            {/* Content tab content */}
            <div className={`${activeTab === 'content' ? 'block' : 'hidden'}`}>
              {!isAuthorized ? (
                <div className="w-full py-12 bg-gray-800 rounded-lg flex flex-col items-center justify-center">
                  <div className="mx-auto py-auto z-10">
                    <i className="pi pi-lock text-[100px] text-red-500"></i>
                  </div>
                  <p className="text-center text-xl text-red-500 z-10 mt-4">
                    This content is paid and needs to be purchased before viewing.
                  </p>
                </div>
              ) : isDecrypting || decryptionLoading ? (
                <div className="w-full py-12 bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                    <p className="mt-4 text-gray-300">Decrypting lesson content...</p>
                  </div>
                </div>
              ) : (
                <CourseContent
                  lessons={uniqueLessons}
                  activeIndex={activeIndex}
                  course={course}
                  paidCourse={paidCourse}
                  decryptedLessonIds={decryptedLessonIds || {}}
                  setCompleted={setCompleted}
                />
              )}
            </div>

            {/* QA tab content */}
            <div className={`${activeTab === 'qa' ? 'block' : 'hidden'}`}>
              <CourseQA nAddress={nAddress} isAuthorized={isAuthorized} nsec={nsec} npub={npub} />
            </div>

            {/* Mobile: Lessons are a tab */}
            {isMobileView && (
              <div className={`${activeTab === 'lessons' ? 'block' : 'hidden'}`}>
                <CourseSidebar
                  lessons={[...uniqueLessons].sort((a, b) => a.index - b.index)}
                  activeIndex={activeIndex}
                  onLessonSelect={handleLessonSelect}
                  completedLessons={completedLessons}
                  isMobileView={isMobileView}
                  onClose={() => {
                    setSidebarVisible(false);
                    toggleTab(getActiveTabIndex());
                  }}
                  sidebarVisible={sidebarVisible}
                  setSidebarVisible={setSidebarVisible}
                  hideToggleButton={true}
                />
              </div>
            )}
          </div>

          {/* Desktop: Sidebar */}
          {!isMobileView && (
            <div
              className={`flex-shrink-0 transition-all duration-300 ease-in-out ${
                sidebarVisible ? 'w-80 opacity-100' : 'w-0 opacity-0'
              }`}
              style={{
                pointerEvents: sidebarVisible ? 'auto' : 'none',
              }}
            >
              {sidebarVisible && (
                <CourseSidebar
                  lessons={[...uniqueLessons].sort((a, b) => a.index - b.index)}
                  activeIndex={activeIndex}
                  onLessonSelect={handleLessonSelect}
                  completedLessons={completedLessons}
                  isMobileView={isMobileView}
                  sidebarVisible={sidebarVisible}
                  setSidebarVisible={setSidebarVisible}
                  hideToggleButton={true}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Course;
