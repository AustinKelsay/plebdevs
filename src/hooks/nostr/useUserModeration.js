/**
 * useUserModeration - Hook for managing NIP-28 user moderation (kind 44)
 * 
 * Handles muting users using kind 44 events according to NIP-28 spec.
 * Provides functionality to mute users and filter out messages from muted users.
 * 
 * @returns {Object} User moderation state and functions
 */
import { useState, useEffect, useCallback } from 'react';
import { useNDKContext } from '@/context/NDKContext';
import { NDKEvent, NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';

export function useUserModeration() {
  const [mutedUsers, setMutedUsers] = useState(new Set());
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
   * Subscribe to the current user's mute user events (kind 44)
   */
  const subscribeToMutedUsers = useCallback(async () => {
    if (!ndk) return;

    const userPubkey = await getCurrentUserPubkey();
    if (!userPubkey) {
      setIsLoading(false);
      return;
    }

    try {
      await ndk.connect();

      const filter = {
        kinds: [44],
        authors: [userPubkey],
      };

      const subscription = ndk.subscribe(filter, {
        closeOnEose: false,
        cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
      });

      subscription.on('event', (event) => {
        try {
          // Extract the user pubkey being muted from the 'p' tag
          const userPubkeyTag = event.tags.find(tag => tag[0] === 'p');
          if (userPubkeyTag && userPubkeyTag[1]) {
            const mutedPubkey = userPubkeyTag[1];
            setMutedUsers(prev => new Set([...prev, mutedPubkey]));
            console.log('User muted:', mutedPubkey);
          }
        } catch (err) {
          console.error('Error processing mute user event:', err);
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
      console.error('Error subscribing to muted users:', err);
      setError(err.message);
      setIsLoading(false);
    }
  }, [ndk, getCurrentUserPubkey]);

  /**
   * Mute a specific user (create kind 44 event)
   * 
   * @param {string} userPubkey - The pubkey of the user to mute
   * @param {string} reason - Optional reason for muting the user
   */
  const muteUser = useCallback(async (userPubkey, reason = '') => {
    if (!ndk?.signer || !userPubkey) {
      throw new Error('Cannot mute user: No signer available or missing user pubkey');
    }

    // Don't allow muting yourself
    const currentUserPubkey = await getCurrentUserPubkey();
    if (currentUserPubkey === userPubkey) {
      throw new Error('Cannot mute yourself');
    }

    try {
      const event = new NDKEvent(ndk);
      event.kind = 44;
      event.content = reason ? JSON.stringify({ reason }) : '';
      event.tags = [
        ['p', userPubkey]
      ];

      await event.sign();
      await event.publish();

      // Immediately update local state
      setMutedUsers(prev => new Set([...prev, userPubkey]));
      
      console.log('User muted successfully:', userPubkey, reason ? `Reason: ${reason}` : '');
      return event;
    } catch (err) {
      console.error('Error muting user:', err);
      throw new Error(`Failed to mute user: ${err.message}`);
    }
  }, [ndk, getCurrentUserPubkey]);

  /**
   * Unmute a user (currently not part of NIP-28 spec, but useful for client-side management)
   * Note: This only removes from local state, doesn't create deletion events
   * 
   * @param {string} userPubkey - The pubkey of the user to unmute
   */
  const unmuteUser = useCallback((userPubkey) => {
    setMutedUsers(prev => {
      const newSet = new Set(prev);
      newSet.delete(userPubkey);
      return newSet;
    });
    console.log('User unmuted locally:', userPubkey);
  }, []);

  /**
   * Check if a specific user is muted
   * 
   * @param {string} userPubkey - The pubkey of the user to check
   * @returns {boolean} True if the user is muted
   */
  const isUserMuted = useCallback((userPubkey) => {
    return mutedUsers.has(userPubkey);
  }, [mutedUsers]);

  /**
   * Filter an array of messages to exclude those from muted users
   * 
   * @param {Array} messages - Array of message objects with 'pubkey' property
   * @returns {Array} Filtered array excluding messages from muted users
   */
  const filterMutedUsers = useCallback((messages) => {
    if (!Array.isArray(messages)) return messages;
    return messages.filter(message => !mutedUsers.has(message.pubkey));
  }, [mutedUsers]);

  /**
   * Get all muted user pubkeys
   * 
   * @returns {Array} Array of muted user pubkeys
   */
  const getMutedUserPubkeys = useCallback(() => {
    return Array.from(mutedUsers);
  }, [mutedUsers]);

  /**
   * Clear all muted users from local state
   */
  const clearMutedUsers = useCallback(() => {
    setMutedUsers(new Set());
    console.log('All muted users cleared from local state');
  }, []);

  /**
   * Get mute statistics
   * 
   * @returns {Object} Statistics about muted users
   */
  const getMuteStats = useCallback(() => {
    return {
      mutedUserCount: mutedUsers.size,
      mutedUsers: Array.from(mutedUsers)
    };
  }, [mutedUsers]);

  // Initialize subscription on mount and NDK changes
  useEffect(() => {
    setMutedUsers(new Set());
    setIsLoading(true);
    setError(null);

    let subscription;
    let isMounted = true;

    subscribeToMutedUsers().then(sub => {
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
  }, [subscribeToMutedUsers]);

  return {
    mutedUsers: Array.from(mutedUsers),
    mutedUserPubkeys: mutedUsers,
    isLoading,
    error,
    // Actions
    muteUser,
    unmuteUser,
    isUserMuted,
    filterMutedUsers,
    getMutedUserPubkeys,
    clearMutedUsers,
    getMuteStats
  };
} 