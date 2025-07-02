import React, { useState, useEffect } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useNDKContext } from '@/context/NDKContext';
import { useSession } from 'next-auth/react';
import { findKind0Fields } from '@/utils/nostr';
import NostrIcon from '../../../public/images/nostr.png';
import Image from 'next/image';
import useWindowWidth from '@/hooks/useWindowWidth';
import { nip19 } from 'nostr-tools';
import { useCommunityNotes } from '@/hooks/nostr/useCommunityNotes';
import { useNip28Channel } from '@/hooks/nostr/useNip28Channel';
import CommunityMessage from '@/components/feeds/messages/CommunityMessage';
import ChannelEmptyState from './ChannelEmptyState';

const NostrFeed = ({ searchQuery }) => {
  const { communityNotes, isLoading, error, hasChannel } = useCommunityNotes();
  const { 
    canCreateChannel, 
    createChannel, 
    refreshChannel, 
    isLoading: channelLoading,
    error: channelError 
  } = useNip28Channel();
  const { ndk } = useNDKContext();
  const { data: session } = useSession();
  const [authorData, setAuthorData] = useState({});

  const windowWidth = useWindowWidth();

  /**
   * Handle admin channel creation
   */
  const handleCreateChannel = async () => {
    try {
      await createChannel();
      // Channel creation will trigger a refresh automatically
    } catch (error) {
      console.error('Failed to create channel:', error);
    }
  };

  useEffect(() => {
    const fetchAuthors = async () => {
      for (const message of communityNotes) {
        if (!authorData[message.pubkey]) {
          const author = await fetchAuthor(message.pubkey);
          setAuthorData(prevData => ({
            ...prevData,
            [message.pubkey]: author,
          }));
        }
      }
    };

    if (communityNotes && communityNotes.length > 0) {
      fetchAuthors();
    }
  }, [communityNotes, authorData]);

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

  // Show loading while channel is initializing
  if (isLoading || channelLoading) {
    return (
      <div className="h-[100vh] min-bottom-bar:w-[86vw] max-sidebar:w-[100vw]">
        <ProgressSpinner className="w-full mt-24 mx-auto" />
      </div>
    );
  }

  // Show channel empty state if no channel is available
  if (!hasChannel) {
    const mode = channelError ? 'error' : 'no-channel';
    return (
      <div className="h-full w-full p-4">
        <ChannelEmptyState
          mode={mode}
          error={channelError}
          onRetry={refreshChannel}
          canCreateChannel={canCreateChannel}
          onCreateChannel={handleCreateChannel}
        />
      </div>
    );
  }

  // Show error for message loading issues (not channel issues)
  if (error && hasChannel) {
    return (
      <div className="text-red-500 text-center p-4">
        Failed to load messages. Channel is available but message loading failed.
        <div className="mt-2">
          <button 
            onClick={refreshChannel}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const filteredNotes = communityNotes
    .filter(message =>
      searchQuery ? message.content.toLowerCase().includes(searchQuery.toLowerCase()) : true
    )
    .sort((a, b) => b.created_at - a.created_at);

  return (
    <div className="h-full w-full">
      <div className="mx-0 mt-4">
        {filteredNotes.length > 0 ? (
          filteredNotes.map(message => (
            <CommunityMessage
              key={message.id}
              message={{
                id: message.id,
                author:
                  authorData[message.pubkey]?.username || message.pubkey.substring(0, 12) + '...',
                avatar: authorData[message.pubkey]?.avatar,
                content: message.content,
                timestamp: message.created_at * 1000,
                channel: 'plebdevs',
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
          <div className="text-gray-400 text-center p-4">No messages available.</div>
        )}
      </div>
    </div>
  );
};

export default NostrFeed;
