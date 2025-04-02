import React, { useEffect, useState, useRef } from "react";
import { Tag } from "primereact/tag";
import Image from "next/image";
import { useImageProxy } from "@/hooks/useImageProxy";
import { getTotalFromZaps } from "@/utils/lightning";
import ZapDisplay from "@/components/zaps/ZapDisplay";
import dynamic from "next/dynamic";
import { useZapsQuery } from "@/hooks/nostrQueries/zaps/useZapsQuery";
import { Toast } from "primereact/toast";
import useTrackDocumentLesson from "@/hooks/tracking/useTrackDocumentLesson";
import useWindowWidth from "@/hooks/useWindowWidth";
import { nip19 } from "nostr-tools";
import appConfig from "@/config/appConfig";
import MoreOptionsMenu from "@/components/ui/MoreOptionsMenu";
import { useSession } from "next-auth/react";
import ZapThreadsWrapper from "@/components/ZapThreadsWrapper";

const MDDisplay = dynamic(() => import("@uiw/react-markdown-preview"), {
  ssr: false,
});

const CourseLesson = ({
  lesson,
  course,
  decryptionPerformed,
  isPaid,
  setCompleted,
}) => {
  const [zapAmount, setZapAmount] = useState(0);
  const [nAddress, setNAddress] = useState(null);
  const [nsec, setNsec] = useState(null);
  const [npub, setNpub] = useState(null);
  const { zaps, zapsLoading, zapsError } = useZapsQuery({
    event: lesson,
    type: "lesson",
  });
  const { returnImageProxy } = useImageProxy();
  const menuRef = useRef(null);
  const toastRef = useRef(null);
  const windowWidth = useWindowWidth();
  const isMobileView = windowWidth <= 768;
  const { data: session } = useSession();

  const readTime = lesson?.content
    ? Math.max(30, Math.ceil(lesson.content.length / 20))
    : 60;

  const { isCompleted, isTracking, markLessonAsCompleted } =
    useTrackDocumentLesson({
      lessonId: lesson?.d,
      courseId: course?.d,
      readTime,
      paidCourse: isPaid,
      decryptionPerformed,
    });

  const buildMenuItems = () => {
    const items = [];

    const hasAccess =
      session?.user &&
      (!isPaid || decryptionPerformed || session.user.role?.subscribed);

    if (hasAccess) {
      items.push({
        label: "Mark as completed",
        icon: "pi pi-check-circle",
        command: async () => {
          try {
            await markLessonAsCompleted();
            setCompleted && setCompleted(lesson.id);
            toastRef.current.show({
              severity: "success",
              summary: "Success",
              detail: "Lesson marked as completed",
              life: 3000,
            });
          } catch (error) {
            console.error("Failed to mark lesson as completed:", error);
            toastRef.current.show({
              severity: "error",
              summary: "Error",
              detail: "Failed to mark lesson as completed",
              life: 3000,
            });
          }
        },
      });
    }

    items.push({
      label: "Open lesson",
      icon: "pi pi-arrow-up-right",
      command: () => {
        window.open(`/details/${lesson.id}`, "_blank");
      },
    });

    items.push({
      label: "View Nostr note",
      icon: "pi pi-globe",
      command: () => {
        if (lesson?.d) {
          const addr = nip19.naddrEncode({
            pubkey: lesson.pubkey,
            kind: lesson.kind,
            identifier: lesson.d,
            relays: appConfig.defaultRelayUrls || [],
          });
          window.open(`https://habla.news/a/${addr}`, "_blank");
        }
      },
    });

    return items;
  };

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

  useEffect(() => {
    if (session?.user?.privkey) {
      const privkeyBuffer = Buffer.from(session.user.privkey, "hex");
      setNsec(nip19.nsecEncode(privkeyBuffer));
    } else if (session?.user?.pubkey) {
      setNpub(nip19.npubEncode(session.user.pubkey));
    }
  }, [session]);

  useEffect(() => {
    if (lesson) {
      const addr = nip19.naddrEncode({
        pubkey: lesson.pubkey,
        kind: lesson.kind,
        identifier: lesson.d,
        relays: appConfig.defaultRelayUrls,
      });
      setNAddress(addr);
    }
  }, [lesson]);

  const renderContent = () => {
    if (isPaid && decryptionPerformed) {
      return (
        <MDDisplay className="p-4 rounded-lg w-full" source={lesson.content} />
      );
    }
    if (isPaid && !decryptionPerformed) {
      return (
        <p className="text-center text-xl text-red-500">
          This content is paid and needs to be purchased before viewing.
        </p>
      );
    }
    if (lesson?.content) {
      return (
        <MDDisplay className="p-4 rounded-lg w-full" source={lesson.content} />
      );
    }
    return null;
  };

  return (
    <div className="w-full px-24 pt-12 mx-auto mt-4 max-tab:px-0 max-mob:px-0 max-tab:pt-2 max-mob:pt-2">
      <Toast ref={toastRef} />
      <div className="w-full flex flex-row justify-between max-tab:flex-col max-mob:flex-col">
        <div className="w-[75vw] mx-auto flex flex-row items-start justify-between max-tab:flex-col max-mob:flex-col max-tab:w-[95vw] max-mob:w-[95vw]">
          <div className="flex flex-col items-start max-w-[45vw] max-tab:max-w-[100vw] max-mob:max-w-[100vw]">
            <div className="flex flex-row items-center justify-between w-full">
              <h1 className="text-4xl">{lesson?.title}</h1>
              <ZapDisplay
                zapAmount={zapAmount}
                event={lesson}
                zapsLoading={zapsLoading}
              />
            </div>
            <div className="pt-2 flex flex-row justify-start w-full mt-2 mb-4">
              {lesson &&
                lesson.topics &&
                lesson.topics.length > 0 &&
                lesson.topics.map((topic, index) => (
                  <Tag
                    className="mr-2 text-white"
                    key={index}
                    value={topic}
                  ></Tag>
                ))}
            </div>
            <div className="text-xl mt-6">
              {lesson?.summary && (
                <div className="text-xl mt-4">
                  {lesson.summary.split("\n").map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between w-full mt-8">
              <div className="flex flex-row w-fit items-center">
                <Image
                  alt="avatar thumbnail"
                  src={returnImageProxy(
                    lesson.author?.avatar,
                    lesson.author?.pubkey
                  )}
                  width={50}
                  height={50}
                  className="rounded-full mr-4"
                />
                <p className="text-lg">
                  Created by{" "}
                  <a
                    rel="noreferrer noopener"
                    target="_blank"
                    className="text-blue-500 hover:underline"
                  >
                    {lesson.author?.username || lesson.author?.pubkey}
                  </a>
                </p>
              </div>
              <div className="flex justify-end">
                <MoreOptionsMenu
                  menuItems={buildMenuItems()}
                  additionalLinks={lesson?.additionalLinks || []}
                  isMobileView={isMobileView}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col max-tab:mt-12 max-mob:mt-12">
            {lesson && (
              <div className="flex flex-col items-center justify-between rounded-lg h-72 p-4 bg-gray-700 drop-shadow-md">
                <Image
                  alt="course thumbnail"
                  src={returnImageProxy(lesson.image)}
                  width={344}
                  height={194}
                  className="w-[344px] h-[194px] object-cover object-top rounded-lg"
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="w-[75vw] mx-auto mt-12 p-12 border-t-2 border-gray-300 max-tab:p-0 max-mob:p-0 max-tab:max-w-[100vw] max-mob:max-w-[100vw]">
        {renderContent()}
      </div>
      {nAddress !== null &&
        (!isPaid || decryptionPerformed || session?.user?.role?.subscribed) && (
          <div className="px-4">
            {nsec || npub ? (
              <ZapThreadsWrapper
                anchor={nAddress}
                user={nsec || npub || null}
                relays={appConfig.defaultRelayUrls.join(",")}
                disable="zaps"
              />
            ) : (
              <ZapThreadsWrapper
                anchor={nAddress}
                user={npub}
                relays={appConfig.defaultRelayUrls.join(",")}
                disable="zaps"
              />
            )}
          </div>
        )}
    </div>
  );
};

export default CourseLesson;
