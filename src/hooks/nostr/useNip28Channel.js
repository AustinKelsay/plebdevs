/**
 * Hook for managing NIP-28 public chat channels
 * 
 * Automatically discovers existing channels by admin pubkeys and provides channel
 * creation and metadata management functionality. Uses a state machine approach
 * to prevent multiple concurrent initializations.
 * 
 * @returns {Object} Channel state and management functions
 * @returns {NDKEvent|null} channel - The discovered channel event
 * @returns {Object|null} channelMetadata - Parsed channel metadata (name, about, picture, etc.)
 * @returns {string|null} channelId - Channel ID for message posting
 * @returns {boolean} isLoading - Loading state during channel discovery
 * @returns {string|null} error - Error message if initialization failed  
 * @returns {string} initStatus - Initialization status ('idle'|'initializing'|'completed'|'error')
 * @returns {boolean} canCreateChannel - Whether current user can create channels
 * @returns {boolean} hasChannel - Whether a channel is available
 * @returns {Function} createChannel - Create a new channel (admin only)
 * @returns {Function} updateChannelMetadata - Update channel metadata (admin only)
 * @returns {Function} refreshChannel - Force re-initialization of channel discovery
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNDKContext } from '@/context/NDKContext';
import { NDKEvent, NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { parseChannelEvent, parseChannelMetadataEvent, getEventId } from '@/utils/nostr';
import appConfig from '@/config/appConfig';

export function useNip28Channel() {
  const [channel, setChannel] = useState(null);
  const [channelMetadata, setChannelMetadata] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initStatus, setInitStatus] = useState('idle'); // idle, initializing, completed, error
  const { ndk, addSigner } = useNDKContext();
  const { isAdmin: canCreateChannel } = useIsAdmin();





  /**
   * Create a new PlebDevs channel (kind 40)
   * Only available to admin users with connected Nostr extension
   */
  const createChannel = useCallback(async () => {
    if (!canCreateChannel) {
      throw new Error('Not authorized to create channels - admin permissions required');
    }

    if (!ndk) {
      throw new Error('NDK not available - please refresh the page');
    }

    // Ensure NDK is connected
    try {
      await ndk.connect();
    } catch (connectErr) {
      console.warn('NDK connect failed:', connectErr);
    }

    // Ensure signer is available
    if (!ndk.signer) {
      try {
        await addSigner();
      } catch (signerErr) {
        throw new Error('Nostr extension not connected - please connect your wallet extension');
      }
    }

    if (!ndk.signer) {
      throw new Error('Nostr signer unavailable - please connect your Nostr extension (Alby, nos2x, etc.)');
    }

    try {
      const event = new NDKEvent(ndk);
      event.kind = 40;
      event.content = JSON.stringify(appConfig.nip28.channelMetadata);
      event.tags = [
        ['t', 'plebdevs'],
        ['t', 'bitcoin'],
        ['t', 'lightning'],
        ['t', 'development']
      ];

      await event.sign();
      await event.publish();

      return event;
    } catch (err) {
      console.error('Error creating channel:', err);
      throw err;
    }
  }, [ndk, canCreateChannel, addSigner]);

  /**
   * Update channel metadata (kind 41)
   */
  const updateChannelMetadata = useCallback(async (channelId, newMetadata) => {
    if (!canCreateChannel) {
      throw new Error('Not authorized to update channel metadata - admin permissions required');
    }

    if (!ndk) {
      throw new Error('NDK not available - please refresh the page');
    }

    if (!channelId) {
      throw new Error('Channel ID is required to update metadata');
    }

    // Ensure signer is available
    if (!ndk.signer) {
      try {
        await addSigner();
      } catch (signerErr) {
        throw new Error('Nostr extension not connected - please connect your wallet extension');
      }
    }

    try {
      const event = new NDKEvent(ndk);
      event.kind = 41;
      event.content = JSON.stringify(newMetadata);
      event.tags = [
        ['e', channelId, '', 'root'],
        ['t', 'plebdevs']
      ];

      await event.sign();
      await event.publish();

      setChannelMetadata(newMetadata);
      return event;
    } catch (err) {
      console.error('Error updating channel metadata:', err);
      throw err;
    }
  }, [ndk, canCreateChannel, addSigner]);



  /**
   * Get channel ID for message posting
   */
  const getChannelId = useCallback(() => {
    return channel?.id || null;
  }, [channel]);

  /**
   * Check if channel is available
   */
  const hasChannel = useCallback(() => {
    return !!channel;
  }, [channel]);

    /**
   * Initialize channel discovery when NDK becomes available
   */
  useEffect(() => {
    if (!ndk || initStatus !== 'idle') {
      return;
    }

    setInitStatus('initializing');
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        await ndk.connect();

        // Search for existing channels by admin pubkeys
        const events = await ndk.fetchEvents({
          kinds: [40],
          authors: appConfig.nip28.adminPubkeys,
          limit: 10
        });
        
        // Find channel matching our community metadata
        let foundChannel = null;
        for (const event of events) {
          try {
            const parsed = parseChannelEvent(event);
            if (parsed.metadata?.name === appConfig.nip28.channelMetadata.name) {
              foundChannel = { ...event, id: parsed.id };
              break;
            }
          } catch (err) {
            console.warn('Error parsing channel event:', err);
          }
        }

        // Set channel state and metadata
        if (foundChannel) {
          setChannel(foundChannel);
          
          try {
            const metadata = JSON.parse(foundChannel.content);
            setChannelMetadata(metadata);
          } catch (err) {
            console.warn('Error parsing channel metadata, using default:', err);
            setChannelMetadata(appConfig.nip28.channelMetadata);
          }
          
          setInitStatus('completed');
        } else {
          // No channel found - normal state for new communities
          setChannelMetadata(appConfig.nip28.channelMetadata);
          setInitStatus('completed');
        }
        
      } catch (err) {
        console.error('Channel initialization failed:', err);
        setError(err.message);
        setInitStatus('error');
        setChannelMetadata(appConfig.nip28.channelMetadata);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [ndk, initStatus]);

  /**
   * Force re-initialization of channel discovery
   * Useful for retrying after errors or when channels are updated
   */
  const refreshChannel = useCallback(() => {
    setInitStatus('idle');
    setChannel(null);
    setChannelMetadata(null);
    setError(null);
  }, []);

  return {
    channel,
    channelMetadata,
    channelId: getChannelId(),
    isLoading,
    error,
    initStatus,
    canCreateChannel,
    hasChannel: hasChannel(),
    // Actions
    createChannel,
    updateChannelMetadata,
    refreshChannel
  };
} 