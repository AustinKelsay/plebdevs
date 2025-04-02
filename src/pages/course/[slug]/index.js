import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { parseCourseEvent, parseEvent, findKind0Fields } from "@/utils/nostr";
import CourseDetails from "@/components/content/courses/CourseDetails";
import VideoLesson from "@/components/content/courses/VideoLesson";
import DocumentLesson from "@/components/content/courses/DocumentLesson";
import CombinedLesson from "@/components/content/courses/CombinedLesson";
import { useNDKContext } from "@/context/NDKContext";
import { useSession } from "next-auth/react";
import axios from "axios";
import { nip04, nip19 } from "nostr-tools";
import { useToast } from "@/hooks/useToast";
import { ProgressSpinner } from "primereact/progressspinner";
import { Accordion, AccordionTab } from "primereact/accordion";
import { Tag } from "primereact/tag";
import { useDecryptContent } from "@/hooks/encryption/useDecryptContent";
import dynamic from "next/dynamic";
import ZapThreadsWrapper from "@/components/ZapThreadsWrapper";
import appConfig from "@/config/appConfig";

const MDDisplay = dynamic(() => import("@uiw/react-markdown-preview"), {
  ssr: false,
});

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
      if (slug.includes("naddr")) {
        const { data } = nip19.decode(slug);
        if (!data?.identifier) {
          showToast("error", "Error", "Resource not found");
          return null;
        }
        return data.identifier;
      } else {
        return slug;
      }
    };

    const fetchCourse = async (courseId) => {
      try {
        await ndk.connect();
        const event = await ndk.fetchEvent({ "#d": [courseId] });
        if (!event) return null;

        const author = await fetchAuthor(event.pubkey);
        const lessonIds = event.tags
          .filter((tag) => tag[0] === "a")
          .map((tag) => tag[1].split(":")[2]);

        const parsedCourse = { ...parseCourseEvent(event), author };
        return { parsedCourse, lessonIds };
      } catch (error) {
        console.error("Error fetching event:", error);
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
      const fetchLesson = async (lessonId) => {
        try {
          await ndk.connect();
          const filter = {
            "#d": [lessonId],
            kinds: [30023, 30402],
            authors: [pubkey],
          };
          const event = await ndk.fetchEvent(filter);
          if (event) {
            const author = await fetchAuthor(event.pubkey);
            const parsedLesson = { ...parseEvent(event), author };
            setLessons((prev) => {
              // Check if the lesson already exists in the array
              const exists = prev.some(
                (lesson) => lesson.id === parsedLesson.id
              );
              if (!exists) {
                return [...prev, parsedLesson];
              }
              return prev;
            });
          }
        } catch (error) {
          console.error("Error fetching event:", error);
        }
      };
      lessonIds.forEach((lessonId) => fetchLesson(lessonId));
    }
  }, [lessonIds, ndk, fetchAuthor, pubkey]);

  useEffect(() => {
    const newUniqueLessons = Array.from(
      new Map(lessons.map((lesson) => [lesson.id, lesson])).values()
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
          session.user.purchased?.some(
            (purchase) => purchase.courseId === course?.d
          ) ||
          session.user?.role?.subscribed ||
          session.user?.pubkey === course?.pubkey;

        if (canAccess && lessons.length > 0) {
          try {
            const decryptedLessons = await Promise.all(
              lessons.map(async (lesson) => {
                const decryptedContent = await decryptContent(lesson.content);
                return { ...lesson, content: decryptedContent };
              })
            );
            setLessons(decryptedLessons);
            setDecryptionPerformed(true);
          } catch (error) {
            console.error("Error decrypting lessons:", error);
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
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [nAddresses, setNAddresses] = useState({});
  const [nsec, setNsec] = useState(null);
  const [npub, setNpub] = useState(null);

  const setCompleted = useCallback((lessonId) => {
    setCompletedLessons((prev) => [...prev, lessonId]);
  }, []);

  const fetchAuthor = useCallback(
    async (pubkey) => {
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
        setExpandedIndex(parseInt(active, 10));
      } else {
        setExpandedIndex(null);
      }
    }
  }, [router.isReady, router.query]);

  useEffect(() => {
    if (uniqueLessons.length > 0) {
      const addresses = {};
      uniqueLessons.forEach((lesson) => {
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
      const privkeyBuffer = Buffer.from(session.user.privkey, "hex");
      setNsec(nip19.nsecEncode(privkeyBuffer));
    } else if (session?.user?.pubkey) {
      setNpub(nip19.npubEncode(session.user.pubkey));
    }
  }, [session]);

  const handleAccordionChange = (e) => {
    const newIndex = e.index === expandedIndex ? null : e.index;
    setExpandedIndex(newIndex);

    if (newIndex !== null) {
      router.push(
        `/course/${router.query.slug}?active=${newIndex}`,
        undefined,
        { shallow: true }
      );
    } else {
      router.push(`/course/${router.query.slug}`, undefined, { shallow: true });
    }
  };

  const handlePaymentSuccess = async (response) => {
    if (response && response?.preimage) {
      const updated = await update();
      showToast(
        "success",
        "Payment Success",
        "You have successfully purchased this course"
      );
    } else {
      showToast(
        "error",
        "Error",
        "Failed to purchase course. Please try again."
      );
    }
  };

  const handlePaymentError = (error) => {
    showToast(
      "error",
      "Payment Error",
      `Failed to purchase course. Please try again. Error: ${error}`
    );
  };

  if (courseLoading || decryptionLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <ProgressSpinner />
      </div>
    );
  }

  const renderLesson = (lesson) => {
    if (
      lesson.topics?.includes("video") &&
      lesson.topics?.includes("document")
    ) {
      return (
        <CombinedLesson
          lesson={lesson}
          course={course}
          decryptionPerformed={decryptionPerformed}
          isPaid={paidCourse}
          setCompleted={setCompleted}
        />
      );
    } else if (
      lesson.type === "video" &&
      !lesson.topics?.includes("document")
    ) {
      return (
        <VideoLesson
          lesson={lesson}
          course={course}
          decryptionPerformed={decryptionPerformed}
          isPaid={paidCourse}
          setCompleted={setCompleted}
        />
      );
    } else if (
      lesson.type === "document" &&
      !lesson.topics?.includes("video")
    ) {
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
      <Accordion
        activeIndex={expandedIndex}
        onTabChange={handleAccordionChange}
        className="mt-4 px-4 max-mob:px-0 max-tab:px-0"
      >
        {uniqueLessons.length > 0 &&
          uniqueLessons.map((lesson, index) => (
            <AccordionTab
              key={index}
              pt={{
                root: { className: "border-none" },
                header: { className: "border-none" },
                headerAction: { className: "border-none" },
                content: { className: "border-none max-mob:px-0 max-tab:px-0" },
                accordiontab: { className: "border-none" },
              }}
              header={
                <div className="flex align-items-center justify-between w-full">
                  <span
                    id={`lesson-${index}`}
                    className="font-bold text-xl"
                  >{`Lesson ${index + 1}: ${lesson.title}`}</span>
                  {completedLessons.includes(lesson.id) ? (
                    <Tag severity="success" value="Completed" />
                  ) : null}
                </div>
              }
            >
              <div className="w-full py-4 rounded-b-lg">
                {renderLesson(lesson)}
                {nAddresses[lesson.id] && (
                  <div className="mt-8">
                    {!paidCourse ||
                    decryptionPerformed ||
                    session?.user?.role?.subscribed ? (
                      <ZapThreadsWrapper
                        anchor={nAddresses[lesson.id]}
                        user={session?.user ? nsec || npub : null}
                        relays={appConfig.defaultRelayUrls.join(",")}
                        disable="zaps"
                        isAuthorized={true}
                      />
                    ) : (
                      <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                        <p className="text-gray-400">
                          Comments are only available to course purchasers,
                          subscribers, and the course creator.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </AccordionTab>
          ))}
      </Accordion>
      <div className="mx-auto my-6">
        {course?.content && (
          <MDDisplay className="p-4 rounded-lg" source={course.content} />
        )}
      </div>
    </>
  );
};

export default Course;
