import React, { useState, useEffect } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useNDKContext } from '@/context/NDKContext';
import { useSession } from 'next-auth/react';
import { findKind0Fields } from '@/utils/nostr';
import NostrIcon from '../../../public/images/nostr.png';
import Image from 'next/image';
import useWindowWidth from '@/hooks/useWindowWidth';
import { nip19 } from 'nostr-tools';
import { useCommunityChannel } from '@/hooks/nostr/useCommunityChannel';
import CommunityMessage from '@/components/feeds/messages/CommunityMessage';
import ChannelMessageInput from '@/components/feeds/ChannelMessageInput';
import ChannelCreator from '@/components/admin/ChannelCreator';
import appConfig from '@/config/appConfig';

const NostrFeed = ({ searchQuery }) => {
  const { channelMessages, channelMetadata, currentChannelId, isLoading, error } = useCommunityChannel();
  const { ndk } = useNDKContext();
  const { data: session } = useSession();
  const [authorData, setAuthorData] = useState({});

  const windowWidth = useWindowWidth();

  // Check if current user is authorized to create channels
  const isAuthorized = session?.user?.pubkey && 
    appConfig.authorPubkeys.includes(session.user.pubkey);

  useEffect(() => {
    const fetchAuthors = async () => {
      for (const message of channelMessages) {
        if (!authorData[message.pubkey]) {
          const author = await fetchAuthor(message.pubkey);
          setAuthorData(prevData => ({
            ...prevData,
            [message.pubkey]: author,
          }));
        }
      }
    };

    if (channelMessages && channelMessages.length > 0) {
      fetchAuthors();
    }
  }, [channelMessages, authorData]);

  const fetchAuthor = async pubkey => {
    try {
      const filter = {
        kinds: [0],
        authors: [pubkey],
      };

      const author = await ndk.fetchEvent(filter);
      if (author) {
        try {
          const fields = await findKind0Fields(JSON.parse(author.content));
          return fields;
        } catch (error) {
          console.error('Error fetching author:', error);
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching author:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[100vh] min-bottom-bar:w-[86vw] max-sidebar:w-[100vw]">
        <ProgressSpinner className="w-full mt-24 mx-auto" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        Failed to load messages. Please try again later.
      </div>
    );
  }

  const filteredMessages = channelMessages
    .filter(message =>
      searchQuery ? message.content.toLowerCase().includes(searchQuery.toLowerCase()) : true
    )
    .sort((a, b) => b.created_at - a.created_at);

  return (
    <div className="h-full w-full">
      {channelMetadata && (
        <div className="mx-0 mt-2 mb-4 p-3 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold text-white">{channelMetadata.name}</h3>
          {channelMetadata.about && (
            <p className="text-sm text-gray-300 mt-1">{channelMetadata.about}</p>
          )}
        </div>
      )}
      
      {!currentChannelId && isAuthorized && !isLoading && (
        <div className="mx-0 mb-4">
          <ChannelCreator />
        </div>
      )}
      
      <div className="mx-0 mb-4">
        <ChannelMessageInput 
          channelId={currentChannelId}
          disabled={!currentChannelId || isLoading}
        />
      </div>
      
      <div className="mx-0 mt-4">
        {filteredMessages.length > 0 ? (
          filteredMessages.map(message => (
            <CommunityMessage
              key={message.id}
              message={{
                id: message.id,
                author:
                  authorData[message.pubkey]?.username || message.pubkey.substring(0, 12) + '...',
                avatar: authorData[message.pubkey]?.avatar,
                content: message.content,
                timestamp: message.created_at * 1000,
                channel: channelMetadata?.name || 'PlebDevs Community',
              }}
              searchQuery={searchQuery}
              windowWidth={windowWidth}
              platform="nostr"
              platformIcon={
                <Image src={NostrIcon} alt="Nostr" width={14} height={14} className="mr-[1px]" />
              }
              platformLink={`https://nostr.band/${nip19.noteEncode(message.id)}`}
            />
          ))
        ) : (
          <div className="text-gray-400 text-center p-4">
            {isLoading ? 'Loading channel messages...' : 'No messages available in this channel.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default NostrFeed;
