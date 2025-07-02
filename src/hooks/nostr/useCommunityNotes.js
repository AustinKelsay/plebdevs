import { useState, useEffect, useCallback } from 'react';
import { useNDKContext } from '@/context/NDKContext';
import { NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';
import { useNip28Channel } from './useNip28Channel';
import { useMessageModeration } from './useMessageModeration';
import { useUserModeration } from './useUserModeration';
import { parseChannelMessageEvent } from '@/utils/nostr';
import appConfig from '@/config/appConfig';

export function useCommunityNotes() {
  const [communityNotes, setCommunityNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { ndk } = useNDKContext();
  
  // NIP-28 integration
  const { 
    channelId, 
    hasChannel, 
    isLoading: channelLoading, 
    error: channelError 
  } = useNip28Channel();
  
  const { 
    filterHiddenMessages, 
    isLoading: moderationLoading 
  } = useMessageModeration();
  
  const { 
    filterMutedUsers, 
    isLoading: userModerationLoading 
  } = useUserModeration();

  const addNote = useCallback(noteEvent => {
    setCommunityNotes(prevNotes => {
      if (prevNotes.some(note => note.id === noteEvent.id)) return prevNotes;
      const newNotes = [noteEvent, ...prevNotes];
      newNotes.sort((a, b) => b.created_at - a.created_at);
      return newNotes;
    });
  }, []);

  /**
   * Apply moderation filters to the community notes
   */
  const getFilteredNotes = useCallback(() => {
    let filteredNotes = communityNotes;
    
    // Filter out hidden messages
    filteredNotes = filterHiddenMessages(filteredNotes);
    
    // Filter out messages from muted users
    filteredNotes = filterMutedUsers(filteredNotes);
    
    return filteredNotes;
  }, [communityNotes, filterHiddenMessages, filterMutedUsers]);

  useEffect(() => {
    let subscription;
    const noteIds = new Set();
    let timeoutId;

    async function subscribeToNotes() {
      if (!ndk) return;

      // Don't start subscription until channel initialization is complete
      if (channelLoading) {
        return;
      }
      
      // Start subscription even if moderation is still loading - it will filter later

      try {
        await ndk.connect();

        console.log('Channel ID check:', {
          channelId,
          hasChannel,
          channelIdType: typeof channelId,
          channelIdLength: channelId?.length
        });

        if (!channelId) {
          // No channel available - this is normal, not an error
          console.log('No channel available for community notes');
          setIsLoading(false);
          return;
        }

        // Use NIP-28 channel messages (kind 42) only
        console.log('Using NIP-28 channel mode for community notes, channel:', channelId);
        const filter = {
          kinds: [42],
          '#e': [channelId],
        };

        subscription = ndk.subscribe(filter, {
          closeOnEose: false,
          cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
        });

        subscription.on('event', noteEvent => {
          try {
            const parsedMessage = parseChannelMessageEvent(noteEvent);
            console.log('Received channel message:', parsedMessage);
            
            if (!noteIds.has(parsedMessage.id)) {
              noteIds.add(parsedMessage.id);
              // Add both parsed data and original event
              const enrichedEvent = {
                ...noteEvent,
                ...parsedMessage
              };
              addNote(enrichedEvent);
              setIsLoading(false);
              clearTimeout(timeoutId);
            }
          } catch (err) {
            console.warn('Error parsing channel message:', err);
            // Fallback to original event if parsing fails
            if (!noteIds.has(noteEvent.id)) {
              noteIds.add(noteEvent.id);
              addNote(noteEvent);
              setIsLoading(false);
              clearTimeout(timeoutId);
            }
          }
        });

        subscription.on('close', () => {
          setIsLoading(false);
        });

        subscription.on('eose', () => {
          setIsLoading(false);
        });

        await subscription.start();

        // Set a 4-second timeout to stop loading state if no notes are received
        timeoutId = setTimeout(() => {
          setIsLoading(false);
        }, 4000);
      } catch (err) {
        console.error('Error subscribing to notes:', err);
        setError(err.message);
        setIsLoading(false);
      }
    }

    // Reset state when dependencies change
    setCommunityNotes([]);
    setIsLoading(true);
    setError(channelError); // Propagate channel errors
    
    subscribeToNotes();

    return () => {
      if (subscription) {
        subscription.stop();
      }
      clearTimeout(timeoutId);
    };
  }, [
    ndk, 
    addNote, 
    channelId, 
    hasChannel, 
    channelLoading, 
    channelError
  ]); // Removed moderation loading deps to prevent unnecessary re-subs

  return { 
    communityNotes: getFilteredNotes(), 
    rawCommunityNotes: communityNotes,
    isLoading: isLoading || channelLoading,
    error,
    // NIP-28 specific info
    channelId,
    hasChannel,
    channelMode: 'nip28',
    // Moderation state
    isModerationLoading: moderationLoading || userModerationLoading
  };
}
