/**
 * useMessageModeration - Hook for managing NIP-28 message moderation (kind 43)
 * 
 * Handles hiding individual messages using kind 43 events according to NIP-28 spec.
 * Provides functionality to hide messages and filter out hidden messages from display.
 * 
 * @returns {Object} Message moderation state and functions
 */
import { useState, useEffect, useCallback } from 'react';
import { useNDKContext } from '@/context/NDKContext';
import { NDKEvent, NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';

export function useMessageModeration() {
  const [hiddenMessages, setHiddenMessages] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { ndk } = useNDKContext();

  /**
   * Get current user's public key
   */
  const getCurrentUserPubkey = useCallback(async () => {
    if (!ndk?.signer) return null;
    
    try {
      const user = await ndk.signer.user();
      return user.pubkey;
    } catch (err) {
      console.error('Error getting current user pubkey:', err);
      return null;
    }
  }, [ndk]);

  /**
   * Subscribe to the current user's hide message events (kind 43)
   */
  const subscribeToHiddenMessages = useCallback(async () => {
    if (!ndk) return;

    const userPubkey = await getCurrentUserPubkey();
    if (!userPubkey) {
      setIsLoading(false);
      return;
    }

    try {
      await ndk.connect();

      const filter = {
        kinds: [43],
        authors: [userPubkey],
      };

      const subscription = ndk.subscribe(filter, {
        closeOnEose: false,
        cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
      });

      subscription.on('event', (event) => {
        try {
          // Extract the message ID being hidden from the 'e' tag
          const messageIdTag = event.tags.find(tag => tag[0] === 'e');
          if (messageIdTag && messageIdTag[1]) {
            const messageId = messageIdTag[1];
            setHiddenMessages(prev => new Set([...prev, messageId]));
            console.log('Message hidden:', messageId);
          }
        } catch (err) {
          console.error('Error processing hide message event:', err);
        }
      });

      subscription.on('eose', () => {
        setIsLoading(false);
      });

      subscription.on('close', () => {
        setIsLoading(false);
      });

      await subscription.start();

      return subscription;
    } catch (err) {
      console.error('Error subscribing to hidden messages:', err);
      setError(err.message);
      setIsLoading(false);
    }
  }, [ndk, getCurrentUserPubkey]);

  /**
   * Hide a specific message (create kind 43 event)
   * 
   * @param {string} messageId - The ID of the message to hide
   * @param {string} reason - Optional reason for hiding the message
   */
  const hideMessage = useCallback(async (messageId, reason = '') => {
    if (!ndk?.signer || !messageId) {
      throw new Error('Cannot hide message: No signer available or missing message ID');
    }

    try {
      const event = new NDKEvent(ndk);
      event.kind = 43;
      event.content = reason ? JSON.stringify({ reason }) : '';
      event.tags = [
        ['e', messageId]
      ];

      await event.sign();
      await event.publish();

      // Immediately update local state
      setHiddenMessages(prev => new Set([...prev, messageId]));
      
      console.log('Message hidden successfully:', messageId, reason ? `Reason: ${reason}` : '');
      return event;
    } catch (err) {
      console.error('Error hiding message:', err);
      throw new Error(`Failed to hide message: ${err.message}`);
    }
  }, [ndk]);

  /**
   * Unhide a message (currently not part of NIP-28 spec, but useful for client-side management)
   * Note: This only removes from local state, doesn't create deletion events
   * 
   * @param {string} messageId - The ID of the message to unhide
   */
  const unhideMessage = useCallback((messageId) => {
    setHiddenMessages(prev => {
      const newSet = new Set(prev);
      newSet.delete(messageId);
      return newSet;
    });
    console.log('Message unhidden locally:', messageId);
  }, []);

  /**
   * Check if a specific message is hidden
   * 
   * @param {string} messageId - The ID of the message to check
   * @returns {boolean} True if the message is hidden
   */
  const isMessageHidden = useCallback((messageId) => {
    return hiddenMessages.has(messageId);
  }, [hiddenMessages]);

  /**
   * Filter an array of messages to exclude hidden ones
   * 
   * @param {Array} messages - Array of message objects with 'id' property
   * @returns {Array} Filtered array excluding hidden messages
   */
  const filterHiddenMessages = useCallback((messages) => {
    if (!Array.isArray(messages)) return messages;
    return messages.filter(message => !hiddenMessages.has(message.id));
  }, [hiddenMessages]);

  /**
   * Get all hidden message IDs
   * 
   * @returns {Array} Array of hidden message IDs
   */
  const getHiddenMessageIds = useCallback(() => {
    return Array.from(hiddenMessages);
  }, [hiddenMessages]);

  /**
   * Clear all hidden messages from local state
   */
  const clearHiddenMessages = useCallback(() => {
    setHiddenMessages(new Set());
    console.log('All hidden messages cleared from local state');
  }, []);

  // Initialize subscription on mount and NDK changes
  useEffect(() => {
    setHiddenMessages(new Set());
    setIsLoading(true);
    setError(null);

    let subscription;
    let isMounted = true;

    subscribeToHiddenMessages().then(sub => {
      if (isMounted) {
        subscription = sub;
      } else if (sub) {
        // Component unmounted before subscription completed
        sub.stop();
      }
    });

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.stop();
      }
    };
  }, [subscribeToHiddenMessages]);

  return {
    hiddenMessages: Array.from(hiddenMessages),
    hiddenMessageIds: hiddenMessages,
    isLoading,
    error,
    // Actions
    hideMessage,
    unhideMessage,
    isMessageHidden,
    filterHiddenMessages,
    getHiddenMessageIds,
    clearHiddenMessages
  };
} 