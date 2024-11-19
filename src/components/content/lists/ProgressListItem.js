import React, { useEffect, useState } from "react";
import { useNDKContext } from "@/context/NDKContext";
import { parseCourseEvent, parseEvent } from "@/utils/nostr";
import { ProgressSpinner } from "primereact/progressspinner";
import { nip19 } from "nostr-tools";
import appConfig from "@/config/appConfig";

const ProgressListItem = ({ dTag, category, type = 'course' }) => {
    const { ndk } = useNDKContext();
    const [event, setEvent] = useState(null);

    useEffect(() => {
        const fetchEvent = async () => {
            if (!dTag) return;

            try {
                await ndk.connect();
                const filter = {
                    kinds: type === 'course' ? [30004] : [30023, 30402],
                    authors: appConfig.authorPubkeys,
                    "#d": [dTag],
                }
                console.log("filter", filter);
                const event = await ndk.fetchEvent(filter);
                console.log("event", event);
                if (event) {
                    setEvent(type === 'course' ? parseCourseEvent(event) : parseEvent(event));
                }
            } catch (error) {
                console.error("Error fetching event:", error);
            }
        }
        fetchEvent();
    }, [dTag, ndk, type]);

    const encodeNaddr = () => {
        return nip19.naddrEncode({
            pubkey: event.pubkey,
            identifier: event.d,
            kind: type === 'course' ? 30004 : event.kind,
            relays: appConfig.defaultRelayUrls
        })
    }

    const renderContent = () => {
        if (!event) return null;

        if (category === "name") {
            const href = type === 'course' 
                ? `/course/${encodeNaddr()}`
                : `/details/${encodeNaddr()}`;
                
            return (
                <a className="text-blue-500 underline hover:text-blue-600" href={href}>
                    {event.name || event.title}
                </a>
            );
        } else if (category === "lessons") {
            const lessonsLength = event.tags.filter(tag => tag[0] === "a").length;
            return <span>{lessonsLength}</span>;
        }

        return null;
    }

    return !event || !ndk || !dTag ? (
        <ProgressSpinner className="w-[40px] h-[40px]" />
    ) : (
        renderContent()
    );
}

export default ProgressListItem;