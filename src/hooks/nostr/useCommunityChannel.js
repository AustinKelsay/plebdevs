import { useState, useEffect, useCallback } from 'react';
import { useNDKContext } from '@/context/NDKContext';
import { NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';
import { validateChannelMessage } from '@/utils/nip28';

// Default PlebDevs channel ID - this would be set after creating the channel
// For now, we'll look for any existing channels or create one
const DEFAULT_CHANNEL_ID = null;

export function useCommunityChannel(channelId = DEFAULT_CHANNEL_ID) {
  const [channelMessages, setChannelMessages] = useState([]);
  const [channelMetadata, setChannelMetadata] = useState(null);
  const [currentChannelId, setCurrentChannelId] = useState(channelId);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { ndk } = useNDKContext();

  const addMessage = useCallback(messageEvent => {
    if (!validateChannelMessage(messageEvent)) return;
    
    setChannelMessages(prevMessages => {
      if (prevMessages.some(msg => msg.id === messageEvent.id)) return prevMessages;
      const newMessages = [messageEvent, ...prevMessages];
      newMessages.sort((a, b) => b.created_at - a.created_at);
      return newMessages;
    });
  }, []);

  const updateChannelMetadata = useCallback(metadataEvent => {
    try {
      const metadata = JSON.parse(metadataEvent.content);
      setChannelMetadata({
        id: metadataEvent.id,
        name: metadata.name,
        about: metadata.about,
        picture: metadata.picture,
        created_at: metadataEvent.created_at,
        author: metadataEvent.pubkey,
        tags: metadataEvent.tags
      });
    } catch (error) {
      console.error('Error parsing channel metadata:', error);
    }
  }, []);

  // Find or create PlebDevs channel
  useEffect(() => {
    let findChannelSub;

    async function findOrCreateChannel() {
      if (!ndk) return;

      try {
        await ndk.connect();

        // First, try to find existing PlebDevs channel
        const channelFilter = {
          kinds: [40, 41],
          '#t': ['plebdevs'],
          limit: 10
        };

        findChannelSub = ndk.subscribe(channelFilter, {
          closeOnEose: true,
          cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
        });

        const foundChannels = [];

        findChannelSub.on('event', (event) => {
          foundChannels.push(event);
        });

        findChannelSub.on('eose', () => {
          // Find the most recent PlebDevs channel
          if (foundChannels.length > 0) {
            const latestChannel = foundChannels.sort((a, b) => b.created_at - a.created_at)[0];
            
            // Check if it's a kind 40 (creation) or kind 41 (update)
            let channelId;
            if (latestChannel.kind === 40) {
              channelId = latestChannel.id;
            } else if (latestChannel.kind === 41) {
              // For kind 41, the channel ID is in the 'e' tag
              const eTag = latestChannel.tags.find(tag => tag[0] === 'e' && tag[3] === 'root');
              channelId = eTag ? eTag[1] : null;
            }

            if (channelId) {
              setCurrentChannelId(channelId);
              updateChannelMetadata(latestChannel);
            }
          } else {
            console.log('No existing PlebDevs NIP-28 channel found');
            // Set a fallback channel metadata for display purposes
            setChannelMetadata({
              name: 'PlebDevs Community',
              about: 'Bitcoin and Lightning developer discussions (transitioning to NIP-28)',
              created_at: Date.now() / 1000,
              tags: [['t', 'plebdevs']]
            });
            // We'll still show the message input for when a channel gets created
          }
        });

        await findChannelSub.start();

      } catch (err) {
        console.error('Error finding channel:', err);
        setError(err.message);
      }
    }

    findOrCreateChannel();

    return () => {
      if (findChannelSub) {
        findChannelSub.stop();
      }
    };
  }, [ndk, updateChannelMetadata]);

  // Subscribe to channel messages
  useEffect(() => {
    let messageSubscription;
    const messageIds = new Set();
    let timeoutId;

    async function subscribeToChannelMessages() {
      if (!ndk || !currentChannelId) return;

      try {
        await ndk.connect();

        // Subscribe to messages in this channel
        const filter = {
          kinds: [42],
          '#e': [currentChannelId],
        };

        messageSubscription = ndk.subscribe(filter, {
          closeOnEose: false,
          cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
        });

        messageSubscription.on('event', messageEvent => {
          if (!messageIds.has(messageEvent.id)) {
            messageIds.add(messageEvent.id);
            addMessage(messageEvent);
            setIsLoading(false);
            clearTimeout(timeoutId);
          }
        });

        messageSubscription.on('close', () => {
          setIsLoading(false);
        });

        messageSubscription.on('eose', () => {
          setIsLoading(false);
        });

        await messageSubscription.start();

        // Set a 4-second timeout to stop loading state if no messages are received
        timeoutId = setTimeout(() => {
          setIsLoading(false);
        }, 4000);

      } catch (err) {
        console.error('Error subscribing to channel messages:', err);
        setError(err.message);
        setIsLoading(false);
      }
    }

    // Reset messages when channel changes
    setChannelMessages([]);
    setIsLoading(true);
    setError(null);
    
    subscribeToChannelMessages();

    return () => {
      if (messageSubscription) {
        messageSubscription.stop();
      }
      clearTimeout(timeoutId);
    };
  }, [ndk, currentChannelId, addMessage]);

  return { 
    channelMessages, 
    channelMetadata,
    currentChannelId,
    isLoading, 
    error 
  };
}