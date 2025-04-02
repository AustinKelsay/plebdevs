import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tag } from "primereact/tag";
import ZapDisplay from "@/components/zaps/ZapDisplay";
import ZapThreadsWrapper from "@/components/ZapThreadsWrapper";
import { nip19 } from "nostr-tools";
import Image from "next/image";
import { useZapsSubscription } from "@/hooks/nostrQueries/zaps/useZapsSubscription";
import { getTotalFromZaps } from "@/utils/lightning";
import { useImageProxy } from "@/hooks/useImageProxy";
import { useRouter } from "next/router";
import { formatTimestampToHowLongAgo } from "@/utils/time";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";
import useWindowWidth from "@/hooks/useWindowWidth";
import GenericButton from "@/components/buttons/GenericButton";
import appConfig from "@/config/appConfig";
import { BookOpen } from "lucide-react";
import { useSession } from "next-auth/react";

export function CourseTemplate({ course, showMetaTags = true }) {
  const { zaps, zapsLoading, zapsError } = useZapsSubscription({
    event: course,
  });
  const [zapAmount, setZapAmount] = useState(0);
  const [lessonCount, setLessonCount] = useState(0);
  const [nAddress, setNAddress] = useState(null);
  const [npub, setNpub] = useState(null);
  const [nsec, setNsec] = useState(null);
  const router = useRouter();
  const { returnImageProxy } = useImageProxy();
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 768;
  const { data: session } = useSession();

  useEffect(() => {
    if (zaps.length > 0) {
      const total = getTotalFromZaps(zaps, course);
      setZapAmount(total);
    }
  }, [zaps, course]);

  useEffect(() => {
    if (course && course?.tags) {
      const lessons = course.tags.filter((tag) => tag[0] === "a");
      setLessonCount(lessons.length);
    }
  }, [course]);

  useEffect(() => {
    if (course && course?.d) {
      const nAddress = nip19.naddrEncode({
        pubkey: course.pubkey,
        kind: course.kind,
        identifier: course.d,
        relays: appConfig.defaultRelayUrls,
      });
      setNAddress(nAddress);
    }
  }, [course]);

  useEffect(() => {
    if (session?.user?.privkey) {
      const privkeyBuffer = Buffer.from(session.user.privkey, "hex");
      setNsec(nip19.nsecEncode(privkeyBuffer));
    } else if (session?.user?.pubkey) {
      setNpub(nip19.npubEncode(session.user.pubkey));
    }
  }, [session]);

  const shouldShowMetaTags = (topic) => {
    if (!showMetaTags) {
      return !["lesson", "document", "video", "course"].includes(topic);
    }
    return true;
  };

  if (!nAddress)
    return (
      <div className="w-full h-full flex items-center justify-center">
        <ProgressSpinner />
      </div>
    );

  if (zapsError) return <div>Error: {zapsError}</div>;

  return (
    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 bg-gray-800 m-2 border-none">
      <div
        className="relative w-full h-0 hover:opacity-70 cursor-pointer"
        style={{ paddingBottom: "56.25%" }}
        onClick={() => router.push(`/course/${nAddress}`)}
      >
        <Image
          alt="video thumbnail"
          src={returnImageProxy(course.image)}
          quality={100}
          layout="fill"
          objectFit="cover"
          className="rounded-md"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary-foreground/50" />
        <div className="absolute bottom-4 left-4 flex gap-2">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
      </div>
      <CardHeader className="flex flex-row justify-between items-center p-4 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <CardTitle className="text-xl sm:text-2xl text-[#f8f8ff]">
            {course.name}
          </CardTitle>
        </div>
        <div className="text-[#f8f8ff]">
          <ZapDisplay
            zapAmount={zapAmount}
            event={course}
            zapsLoading={zapsLoading && zapAmount === 0}
          />
        </div>
      </CardHeader>
      <CardContent
        className={`${
          isMobile ? "px-3" : ""
        } pt-4 pb-2 w-full flex flex-row justify-between items-center`}
      >
        <div className="flex flex-wrap gap-2 max-w-[65%]">
          {course &&
            course.topics &&
            course.topics.map(
              (topic, index) =>
                shouldShowMetaTags(topic) && (
                  <Tag
                    size="small"
                    key={index}
                    className="px-2 py-1 text-sm text-[#f8f8ff]"
                  >
                    {topic}
                  </Tag>
                )
            )}
        </div>
        {course?.price && course?.price > 0 ? (
          <Message
            className={`${
              isMobile ? "py-1 text-xs" : "py-2"
            } whitespace-nowrap`}
            icon="pi pi-lock"
            severity="info"
            text={`${course.price} sats`}
          />
        ) : (
          <Message
            className={`${
              isMobile ? "py-1 text-xs" : "py-2"
            } whitespace-nowrap`}
            icon="pi pi-lock-open"
            severity="success"
            text="Free"
          />
        )}
      </CardContent>
      <CardDescription
        className={`${
          isMobile ? "w-full p-3" : "p-6"
        } py-2 pt-0 text-base text-neutral-50/90 dark:text-neutral-900/90 overflow-hidden min-h-[4em] flex items-center max-w-[100%]`}
        style={{
          overflow: "hidden",
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: "2",
        }}
      >
        <p className="line-clamp-2 text-wrap break-words">
          {(course.summary || course.description)
            ?.split("\n")
            .map((line, index) => (
              <span className="text-wrap break-words" key={index}>
                {line}
              </span>
            ))}
        </p>
      </CardDescription>
      <CardFooter
        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-gray-700 pt-4 ${
          isMobile ? "px-3" : ""
        }`}
      >
        <p className="text-sm text-gray-300">
          {course?.published_at && course.published_at !== ""
            ? formatTimestampToHowLongAgo(course.published_at)
            : formatTimestampToHowLongAgo(course.created_at)}
        </p>
        <GenericButton
          onClick={() => router.push(`/course/${nAddress}`)}
          size="small"
          label="Start Learning"
          icon="pi pi-chevron-right"
          iconPos="right"
          outlined
          className="items-center py-2"
        />
      </CardFooter>
      {nAddress !== null &&
        (!course?.price ||
          course.price === 0 ||
          session?.user?.role?.subscribed ||
          session?.user?.purchased?.some(
            (purchase) => purchase.resourceId === course.d
          )) && (
          <div className="px-4 pb-4">
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
    </Card>
  );
}
