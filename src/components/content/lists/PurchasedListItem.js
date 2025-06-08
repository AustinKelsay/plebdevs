import React, { useEffect, useState } from 'react';
import { useNDKContext } from '@/context/NDKContext';
import { parseEvent, parseCourseEvent } from '@/utils/nostr';
import { ProgressSpinner } from 'primereact/progressspinner';
import { nip19 } from 'nostr-tools';
import appConfig from '@/config/appConfig';

const PurchasedListItem = ({ eventId, category }) => {
  const { ndk } = useNDKContext();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId || !ndk) return;

      try {
        const filter = category === 'courses'
          ? {
              kinds: [30004],
              authors: appConfig.authorPubkeys,
              '#d': [eventId],
            }
          : {
              kinds: [30023, 30402],
              authors: appConfig.authorPubkeys,
              '#d': [eventId],
            };

        const fetchedEvent = await ndk.fetchEvent(filter);
        if (fetchedEvent) {
          setEvent(category === 'courses' ? parseCourseEvent(fetchedEvent) : parseEvent(fetchedEvent));
        }
      } catch (error) {
        console.error('Error fetching event in PurchasedListItem:', error);
        setEvent(null);
      }
    };
    fetchEvent();
  }, [eventId, ndk, category]);

  const encodeNaddrForLink = () => {
    if (!event || !event.pubkey || !event.d) return null;
    try {
      return nip19.naddrEncode({
        pubkey: event.pubkey,
        identifier: event.d,
        kind: category === 'courses' ? 30004 : event.kind,
        relays: appConfig.defaultRelayUrls,
      });
    } catch (error) {
      console.error("Error encoding naddr:", error);
      return null;
    }
  };

  if (!ndk) {
    return <ProgressSpinner className="w-[40px] h-[40px]" title="Initializing..." />;
  }
  if (!eventId) {
    return <span className="text-gray-500">Missing item ID</span>
  }
  if (!event) {
    return <ProgressSpinner className="w-[40px] h-[40px]" />;
  }

  const naddrValue = encodeNaddrForLink();

  if (!naddrValue) {
    return <span className="text-red-500">Error generating link. (Invalid Event ID?)</span>;
  }

  return (
    <a
      className="text-blue-500 underline hover:text-blue-600"
      href={category === 'courses' ? `/course/${naddrValue}` : `/details/${naddrValue}`}
    >
      {event.name || event.title || 'Unnamed Item'}
    </a>
  );
};

export default PurchasedListItem;
