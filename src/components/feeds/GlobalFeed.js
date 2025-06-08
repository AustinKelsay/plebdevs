import React, { useState, useEffect } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useDiscordQuery } from '@/hooks/communityQueries/useDiscordQuery';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useCommunityChannel } from '@/hooks/nostr/useCommunityChannel';
import { useNDKContext } from '@/context/NDKContext';
import { findKind0Fields } from '@/utils/nostr';
import NostrIcon from '../../../public/images/nostr.png';
import Image from 'next/image';
import { useImageProxy } from '@/hooks/useImageProxy';
import { nip19 } from 'nostr-tools';
import CommunityMessage from '@/components/feeds/messages/CommunityMessage';
import useWindowWidth from '@/hooks/useWindowWidth';

const StackerNewsIconComponent = () => (
  <svg
    width="16"
    height="16"
    className="mr-2"
    viewBox="0 0 256 256"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill="#facc15"
      fillRule="evenodd"
      d="m41.7 91.4 41.644 59.22-78.966 69.228L129.25 155.94l-44.083-58.14 54.353-65.441Z"
    />
    <path
      fill="#facc15"
      fillRule="evenodd"
      d="m208.355 136.74-54.358-64.36-38.4 128.449 48.675-74.094 64.36 65.175L251.54 42.497Z"
    />
  </svg>
);

const fetchStackerNews = async () => {
  const response = await axios.get('/api/stackernews');
  return response.data.data.items.items;
};

const GlobalFeed = ({ searchQuery }) => {
  const router = useRouter();
  const {
    data: discordData,
    error: discordError,
    isLoading: discordLoading,
  } = useDiscordQuery({ page: router.query.page });
  const {
    data: stackerNewsData,
    error: stackerNewsError,
    isLoading: stackerNewsLoading,
  } = useQuery({ queryKey: ['stackerNews'], queryFn: fetchStackerNews });
  const {
    channelMessages: nostrData,
    error: nostrError,
    isLoading: nostrLoading,
  } = useCommunityChannel();
  const { ndk } = useNDKContext();
  const { returnImageProxy } = useImageProxy();
  const windowWidth = useWindowWidth();

  const [authorData, setAuthorData] = useState({});

  useEffect(() => {
    const fetchAuthors = async () => {
      const authorDataMap = {};
      for (const message of nostrData) {
        const author = await fetchAuthor(message.pubkey);
        authorDataMap[message.pubkey] = author;
      }
      setAuthorData(authorDataMap);
    };

    if (nostrData && nostrData.length > 0) {
      fetchAuthors();
    }
  }, [nostrData]);

  const fetchAuthor = async pubkey => {
    try {
      await ndk.connect();

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
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching author:', error);
    }
  };

  if (discordLoading || stackerNewsLoading || nostrLoading) {
    return (
      <div className="h-[100vh] min-bottom-bar:w-[86vw] max-sidebar:w-[100vw]">
        <ProgressSpinner className="w-full mt-24 mx-auto" />
      </div>
    );
  }

  if (discordError || stackerNewsError || nostrError) {
    return (
      <div className="text-red-500 text-center p-4">
        Failed to load feed. Please try again later.
      </div>
    );
  }

  const combinedFeed = [
    ...(discordData || []).map(item => ({ ...item, type: 'discord' })),
    ...(stackerNewsData || []).map(item => ({ ...item, type: 'stackernews' })),
    ...(nostrData || []).map(item => ({ ...item, type: 'nostr' })),
  ]
    .sort((a, b) => {
      const dateA = a.type === 'nostr' ? a.created_at * 1000 : new Date(a.timestamp || a.createdAt);
      const dateB = b.type === 'nostr' ? b.created_at * 1000 : new Date(b.timestamp || b.createdAt);
      return dateB - dateA;
    })
    .filter(item => {
      if (!searchQuery) return true;
      const searchLower = searchQuery.toLowerCase();
      if (item.type === 'discord' || item.type === 'nostr') {
        return item.content.toLowerCase().includes(searchLower);
      } else if (item.type === 'stackernews') {
        return item.title.toLowerCase().includes(searchLower);
      }
      return false;
    });

  return (
    <div className="h-full w-full">
      <div className="mx-0 mt-4">
        {combinedFeed.length > 0 ? (
          combinedFeed.map(item => (
            <CommunityMessage
              key={item.id}
              message={{
                id: item.id,
                author:
                  item.type === 'discord'
                    ? item.author
                    : item.type === 'stackernews'
                      ? item.user.name
                      : authorData[item.pubkey]?.username || item.pubkey.substring(0, 12) + '...',
                avatar:
                  item.type === 'discord'
                    ? item.avatar
                    : item.type === 'stackernews'
                      ? 'https://pbs.twimg.com/profile_images/1403162883941359619/oca7LMQ2_400x400.png'
                      : authorData[item.pubkey]?.avatar,
                content: item.type === 'stackernews' ? item.title : item.content,
                timestamp:
                  item.type === 'nostr'
                    ? item.created_at * 1000
                    : new Date(item.timestamp || item.createdAt),
                channel:
                  item.type === 'discord'
                    ? item.channel
                    : item.type === 'stackernews'
                      ? '~devs'
                      : 'PlebDevs Community',
              }}
              searchQuery={searchQuery}
              windowWidth={windowWidth}
              platform={item.type}
              platformIcon={
                item.type === 'stackernews' ? (
                  <StackerNewsIconComponent />
                ) : item.type === 'nostr' ? (
                  <Image src={NostrIcon} alt="Nostr" width={14} height={14} className="mr-[1px]" />
                ) : null
              }
              platformLink={
                item.type === 'discord'
                  ? `https://discord.com/channels/${item.channelId}/${item.id}`
                  : item.type === 'stackernews'
                    ? `https://stacker.news/items/${item.id}`
                    : `https://nostr.band/${nip19.noteEncode(item.id)}`
              }
              additionalContent={item.type === 'stackernews' ? `Sats: ${item.sats}` : null}
            />
          ))
        ) : (
          <div className="text-gray-400 text-center p-4">
            {searchQuery ? 'No matching items found.' : 'No items available.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalFeed;
