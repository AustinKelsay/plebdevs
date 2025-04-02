import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { useToast } from "@/hooks/useToast";
import { Tag } from "primereact/tag";
import Image from "next/image";
import { useRouter } from "next/router";
import CoursePaymentButton from "@/components/bitcoinConnect/CoursePaymentButton";
import ZapDisplay from "@/components/zaps/ZapDisplay";
import GenericButton from "@/components/buttons/GenericButton";
import { nip19 } from "nostr-tools";
import { useImageProxy } from "@/hooks/useImageProxy";
import { useZapsSubscription } from "@/hooks/nostrQueries/zaps/useZapsSubscription";
import { getTotalFromZaps } from "@/utils/lightning";
import { useSession } from "next-auth/react";
import useWindowWidth from "@/hooks/useWindowWidth";
import { useNDKContext } from "@/context/NDKContext";
import { findKind0Fields } from "@/utils/nostr";
import appConfig from "@/config/appConfig";
import useTrackCourse from "@/hooks/tracking/useTrackCourse";
import WelcomeModal from "@/components/onboarding/WelcomeModal";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import MoreOptionsMenu from "@/components/ui/MoreOptionsMenu";
import ZapThreadsWrapper from "@/components/ZapThreadsWrapper";

export default function CourseDetails({
  processedEvent,
  paidCourse,
  lessons,
  decryptionPerformed,
  handlePaymentSuccess,
  handlePaymentError,
}) {
  const [zapAmount, setZapAmount] = useState(0);
  const [author, setAuthor] = useState(null);
  const [nAddress, setNAddress] = useState(null);
  const [nsec, setNsec] = useState(null);
  const [npub, setNpub] = useState(null);
  const router = useRouter();
  const { returnImageProxy } = useImageProxy();
  const { zaps, zapsLoading, zapsError } = useZapsSubscription({
    event: processedEvent,
  });
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const windowWidth = useWindowWidth();
  const isMobileView = windowWidth <= 768;
  const { ndk } = useNDKContext();
  const menuRef = useRef(null);
  const toastRef = useRef(null);

  const handleDelete = async () => {
    try {
      const response = await axios.delete(`/api/courses/${processedEvent.d}`);
      if (response.status === 204) {
        showToast("success", "Success", "Course deleted successfully.");
        router.push("/");
      }
    } catch (error) {
      showToast("error", "Error", "Failed to delete course. Please try again.");
    }
  };

  const menuItems = [
    {
      label: processedEvent?.pubkey === session?.user?.pubkey ? "Edit" : null,
      icon: "pi pi-pencil",
      command: () => router.push(`/course/${processedEvent.d}/edit`),
      visible: processedEvent?.pubkey === session?.user?.pubkey,
    },
    {
      label: processedEvent?.pubkey === session?.user?.pubkey ? "Delete" : null,
      icon: "pi pi-trash",
      command: handleDelete,
      visible: processedEvent?.pubkey === session?.user?.pubkey,
    },
    {
      label: "View Nostr note",
      icon: "pi pi-globe",
      command: () => window.open(`https://nostr.band/${nAddress}`, "_blank"),
    },
  ];

  const { isCompleted } = useTrackCourse({
    courseId: processedEvent?.d,
    paidCourse,
    decryptionPerformed,
  });

  const fetchAuthor = useCallback(
    async (pubkey) => {
      if (!pubkey) return;
      const author = await ndk.getUser({ pubkey });
      const profile = await author.fetchProfile();
      const fields = await findKind0Fields(profile);
      if (fields) {
        setAuthor(fields);
      }
    },
    [ndk]
  );

  useEffect(() => {
    if (processedEvent) {
      const naddr = nip19.naddrEncode({
        pubkey: processedEvent.pubkey,
        kind: processedEvent.kind,
        identifier: processedEvent.d,
        relays: appConfig.defaultRelayUrls,
      });
      setNAddress(naddr);
    }
  }, [processedEvent]);

  useEffect(() => {
    if (processedEvent) {
      fetchAuthor(processedEvent.pubkey);
    }
  }, [fetchAuthor, processedEvent]);

  useEffect(() => {
    if (zaps.length > 0) {
      const total = getTotalFromZaps(zaps, processedEvent);
      setZapAmount(total);
    }
  }, [zaps, processedEvent]);

  useEffect(() => {
    if (session?.user?.privkey) {
      const privkeyBuffer = Buffer.from(session.user.privkey, "hex");
      setNsec(nip19.nsecEncode(privkeyBuffer));
    } else if (session?.user?.pubkey) {
      setNpub(nip19.npubEncode(session.user.pubkey));
    }
  }, [session]);

  const renderPaymentMessage = () => {
    if (
      session?.user &&
      session.user?.role?.subscribed &&
      decryptionPerformed
    ) {
      return (
        <GenericButton
          tooltipOptions={{ position: "top" }}
          tooltip={`You are subscribed so you can access all paid content`}
          icon="pi pi-check"
          label="Subscribed"
          severity="success"
          outlined
          size="small"
          className="cursor-default hover:opacity-100 hover:bg-transparent focus:ring-0"
        />
      );
    }

    if (
      paidCourse &&
      decryptionPerformed &&
      author &&
      processedEvent?.pubkey !== session?.user?.pubkey &&
      !session?.user?.role?.subscribed
    ) {
      return (
        <GenericButton
          icon="pi pi-check"
          label={`Paid`}
          severity="success"
          outlined
          size="small"
          tooltip={`You paid ${processedEvent.price} sats to access this course (or potentially less if a discount was applied)`}
          tooltipOptions={{ position: "top" }}
          className="cursor-default hover:opacity-100 hover:bg-transparent focus:ring-0"
        />
      );
    }

    if (
      paidCourse &&
      author &&
      processedEvent?.pubkey === session?.user?.pubkey
    ) {
      return (
        <GenericButton
          tooltipOptions={{ position: "top" }}
          tooltip={`You created this paid course, users must pay ${processedEvent.price} sats to access it`}
          icon="pi pi-check"
          label={`Price ${processedEvent.price} sats`}
          severity="success"
          outlined
          size="small"
          className="cursor-default hover:opacity-100 hover:bg-transparent focus:ring-0"
        />
      );
    }

    if (paidCourse && !decryptionPerformed) {
      return (
        <div className="w-fit">
          <CoursePaymentButton
            lnAddress={author?.lud16}
            amount={processedEvent.price}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            courseId={processedEvent.d}
          />
        </div>
      );
    }

    return null;
  };

  if (!processedEvent || !author) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="w-full">
      <Toast ref={toastRef} />
      <WelcomeModal />
      <div className="relative w-full h-[400px] mb-8">
        <Image
          alt="course image"
          src={returnImageProxy(processedEvent.image)}
          fill
          className="object-cover rounded-b-lg"
        />
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      </div>
      <div className="w-full mx-auto px-4 py-8 -mt-32 relative z-10 max-mob:px-0 max-tab:px-0">
        <i
          className={`pi pi-arrow-left cursor-pointer hover:opacity-75 absolute top-0 left-4`}
          onClick={() => router.push("/")}
        />
        <div className="mb-8 bg-gray-800/70 rounded-lg p-4 max-mob:rounded-t-none max-tab:rounded-t-none">
          {isCompleted && <Tag severity="success" value="Completed" />}
          <div className="flex flex-row items-center justify-between w-full">
            <h1 className="text-4xl font-bold text-white">
              {processedEvent.name}
            </h1>
            <ZapDisplay
              zapAmount={zapAmount}
              event={processedEvent}
              zapsLoading={zapsLoading && zapAmount === 0}
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-2 mb-4">
            {processedEvent.topics &&
              processedEvent.topics.length > 0 &&
              processedEvent.topics.map((topic, index) => (
                <Tag className="text-white" key={index} value={topic}></Tag>
              ))}
          </div>
          <div className="text-xl text-gray-200 mb-4 mt-4 max-mob:text-base">
            {processedEvent.description &&
              processedEvent.description
                .split("\n")
                .map((line, index) => <p key={index}>{line}</p>)}
          </div>
          <div className="flex items-center justify-between mt-8">
            <div className="flex items-center">
              <Image
                alt="avatar image"
                src={returnImageProxy(author?.avatar, author?.pubkey)}
                width={50}
                height={50}
                className="rounded-full mr-4"
              />
              <p className="text-lg text-white">
                By{" "}
                <a
                  rel="noreferrer noopener"
                  target="_blank"
                  className="text-blue-300 hover:underline"
                >
                  {author?.username || author?.name || author?.pubkey}
                </a>
              </p>
            </div>
            <div className="flex justify-end">
              <MoreOptionsMenu
                menuItems={menuItems}
                additionalLinks={processedEvent?.additionalLinks || []}
                isMobileView={isMobileView}
              />
            </div>
          </div>
          <div className="w-full mt-4">{renderPaymentMessage()}</div>
        </div>
        {nAddress !== null && (
          <div className="px-4">
            {paidCourse ? (
              // For paid content, only show ZapThreads if user has access
              processedEvent?.pubkey === session?.user?.pubkey ||
              decryptionPerformed ||
              session?.user?.role?.subscribed ? (
                <ZapThreadsWrapper
                  anchor={nAddress}
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
              )
            ) : (
              // For free content, show ZapThreads to everyone
              <ZapThreadsWrapper
                anchor={nAddress}
                user={session?.user ? nsec || npub : null}
                relays={appConfig.defaultRelayUrls.join(",")}
                disable="zaps"
                isAuthorized={true}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
