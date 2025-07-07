import React, { useState, useEffect } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useDiscordQuery } from '@/hooks/communityQueries/useDiscordQuery';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useCommunityNotes } from '@/hooks/nostr/useCommunityNotes';
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
    communityNotes: nostrData,
    error: nostrError,
    isLoading: nostrLoading,
    channelMode,
    hasChannel,
  } = useCommunityNotes();
  const { ndk } = useNDKContext();
  const { returnImageProxy } = useImageProxy();
  const windowWidth = useWindowWidth();

  const [authorData, setAuthorData] = useState({});

  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const authorDataMap = {};
        for (const message of nostrData) {
          try {
            const author = await fetchAuthor(message.pubkey);
            authorDataMap[message.pubkey] = author;
          } catch (err) {
            console.warn('Failed to fetch author for pubkey:', message.pubkey, err);
            // Continue with other authors
          }
        }
        setAuthorData(authorDataMap);
      } catch (error) {
        console.error('Error fetching authors in GlobalFeed:', error);
      }
    };

    if (nostrData && nostrData.length > 0) {
      fetchAuthors();
    }
  }, [nostrData]);

  const fetchAuthor = async pubkey => {
    try {
      if (!ndk) {
        console.warn('NDK not available for author fetch');
        return null;
      }

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
        } catch (parseError) {
          console.warn('Error parsing author content for', pubkey.slice(0, 8), parseError);
          return null;
        }
      } else {
        // No author profile found - this is normal
        return null;
      }
    } catch (error) {
      console.warn('Error fetching author profile for', pubkey.slice(0, 8), error);
      return null; // Return null instead of throwing
    }
  };

  // Show loading while core feeds are loading
  if (discordLoading || stackerNewsLoading) {
    return (
      <div className="h-[100vh] min-bottom-bar:w-[86vw] max-sidebar:w-[100vw]">
        <ProgressSpinner className="w-full mt-24 mx-auto" />
      </div>
    );
  }

  // Only show error if all feeds fail - allow partial failures
  if (discordError && stackerNewsError && nostrError) {
    return (
      <div className="text-red-500 text-center p-4">
        Failed to load all feeds. Please try again later.
        <div className="text-sm text-gray-400 mt-2">
          Discord: {discordError ? 'Failed' : 'OK'} | 
          StackerNews: {stackerNewsError ? 'Failed' : 'OK'} | 
          Nostr: {nostrError ? `Failed (${hasChannel ? 'channel available' : 'no channel'})` : 'OK'}
        </div>
      </div>
    );
  }

  // Show warnings for individual feed failures
  const warnings = [];
  if (discordError) warnings.push('Discord feed unavailable');
  if (stackerNewsError) warnings.push('StackerNews feed unavailable');
  if (nostrError) warnings.push(`Nostr feed unavailable (${hasChannel ? 'channel exists but failed' : 'no channel available'})`);

  console.log('GlobalFeed status:', {
    discord: discordError ? 'error' : 'ok',
    stackerNews: stackerNewsError ? 'error' : 'ok',
    nostr: nostrError ? 'error' : 'ok',
    nostrMode: channelMode,
    hasChannel,
    warnings
  });

  const combinedFeed = [
    ...(discordData || []).map(item => ({ ...item, type: 'discord' })),
    ...(stackerNewsData || []).map(item => ({ ...item, type: 'stackernews' })),
    // Only include Nostr data if it's available and no error
    ...(!nostrError && nostrData ? nostrData.map(item => ({ ...item, type: 'nostr' })) : []),
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
      {/* Show feed status warnings */}
      {warnings.length > 0 && (
        <div className="mx-0 mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center">
            <i className="pi pi-exclamation-triangle text-yellow-400 mr-2" />
            <span className="text-yellow-300 text-sm">
              Some feeds are unavailable: {warnings.join(', ')}
            </span>
          </div>
          {nostrError && !hasChannel && (
            <div className="text-xs text-yellow-200 mt-1">
              Nostr channel needs to be created by an admin
            </div>
          )}
        </div>
      )}

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
                      : '#plebdevs',
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
            {searchQuery ? (
              'No matching items found.'
            ) : warnings.length > 0 ? (
              <div>
                <div>No items available from working feeds.</div>
                <div className="text-sm mt-2">
                  {warnings.length} of 3 feeds are currently unavailable.
                </div>
              </div>
            ) : (
              'No items available.'
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalFeed;
