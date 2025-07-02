/**
 * useNip28Channel - Hook for managing NIP-28 public chat channels
 * 
 * Handles channel discovery, creation, and metadata management according to NIP-28 spec.
 * Provides fallback mechanisms for graceful degradation when channels are unavailable.
 * 
 * @returns {Object} Channel state and management functions
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
  const { ndk, addSigner } = useNDKContext();
  const { isAdmin: canCreateChannel } = useIsAdmin();
  const initializationRef = useRef(false);
  const mountedRef = useRef(true);



  /**
   * Search for existing PlebDevs channel (kind 40)
   */
  const discoverChannel = useCallback(async () => {
    if (!ndk) return null;

    try {
      await ndk.connect();

      // Search for existing channels with our metadata
      const filter = {
        kinds: [40],
        authors: appConfig.nip28.adminPubkeys,
        limit: 10
      };

      console.log('Searching for channels with filter:', filter);
      const events = await ndk.fetchEvents(filter);
      console.log('Found channel events:', events.size);
      
      // Find channel that matches our community
      for (const event of events) {
        try {
          // Use the parsing function to get proper event data
          console.log('yayaya', event);
          const parsedChannel = parseChannelEvent(event);
          console.log('Parsed channel:', parsedChannel);
          
          if (parsedChannel.metadata?.name === appConfig.nip28.channelMetadata.name) {
            console.log('Found matching PlebDevs channel:', parsedChannel.id);
            
            // Return the original event but with proper ID handling
            const channelEvent = {
              ...event,
              id: parsedChannel.id
            };
            
            return channelEvent;
          }
        } catch (err) {
          console.warn('Error parsing channel event:', err);
        }
      }

      console.log('No matching channel found');
      return null;
    } catch (err) {
      console.error('Error discovering channel:', err);
      throw err;
    }
  }, [ndk]);

  /**
   * Fetch the latest channel metadata (kind 41)
   */
  const fetchChannelMetadata = useCallback(async (channelId) => {
    if (!ndk || !channelId) return null;

    try {
      const filter = {
        kinds: [41],
        '#e': [channelId],
        authors: appConfig.nip28.adminPubkeys,
        limit: 1
      };

      const events = await ndk.fetchEvents(filter);
      const latestMetadata = Array.from(events).sort((a, b) => b.created_at - a.created_at)[0];

      if (latestMetadata) {
        try {
          const parsedMetadata = parseChannelMetadataEvent(latestMetadata);
          console.log('Found channel metadata:', parsedMetadata.metadata);
          return parsedMetadata.metadata;
        } catch (err) {
          console.warn('Error parsing channel metadata:', err);
        }
      }

      return null;
    } catch (err) {
      console.error('Error fetching channel metadata:', err);
      return null;
    }
  }, [ndk]);

  /**
   * Create a new PlebDevs channel (kind 40)
   */
  const createChannel = useCallback(async () => {
    console.log('createChannel called - Debug info:', {
      hasNdk: !!ndk,
      hasSigner: !!ndk?.signer,
      canCreateChannel,
      ndkStatus: ndk ? 'available' : 'missing'
    });

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
      
      // The ID should be available after signing
      console.log('Signed channel event - ID:', event.id);
      
      await event.publish();

      console.log('Created new PlebDevs channel:', event.id);
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

      console.log('Updated channel metadata for:', channelId);
      setChannelMetadata(newMetadata);
      return event;
    } catch (err) {
      console.error('Error updating channel metadata:', err);
      throw err;
    }
  }, [ndk, canCreateChannel, addSigner]);

  /**
   * Initialize channel - discover existing or create new
   */
  const initializeChannel = useCallback(async () => {
    if (!ndk) return;

    setIsLoading(true);
    setError(null);

    try {
      // Try to discover existing channel
      let channelEvent = await discoverChannel();

      // If no channel exists and user can create, create one
      if (!channelEvent && canCreateChannel && appConfig.nip28.requireChannel) {
        console.log('No channel found, creating new one...');
        try {
          channelEvent = await createChannel();
        } catch (createError) {
          console.warn('Failed to create channel:', createError);
          // Continue with fallback logic
        }
      }

      if (channelEvent) {
        setChannel(channelEvent);
        
        // Fetch latest metadata
        const metadata = await fetchChannelMetadata(channelEvent.id);
        if (metadata) {
          setChannelMetadata(metadata);
        } else {
          // Use channel creation content as fallback
          try {
            const content = JSON.parse(channelEvent.content);
            setChannelMetadata(content);
          } catch (err) {
            setChannelMetadata(appConfig.nip28.channelMetadata);
          }
        }
        
        console.log('Channel initialized successfully:', channelEvent.id);
      } else {
        // No channel available - this is expected for new communities
        console.log('No channel found - awaiting admin creation');
        // Don't set error - this is a normal state, not an error
        setChannelMetadata(appConfig.nip28.channelMetadata); // For display purposes
      }

    } catch (err) {
      console.error('Error initializing channel:', err);
      setError(err.message);
      initializationRef.current = false; // Allow retry on error
      setChannelMetadata(appConfig.nip28.channelMetadata); // For display purposes
    } finally {
      setIsLoading(false);
    }
  }, [ndk, canCreateChannel, discoverChannel, createChannel, fetchChannelMetadata]);

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

  // Initialize channel on mount and NDK changes only
  useEffect(() => {
    if (ndk && !initializationRef.current && mountedRef.current) {
      console.log('Initializing channel for the first time...');
      initializationRef.current = true;
      // Call initializeChannel directly without dependency on the callback
      (async () => {
        if (!ndk) return;

        setIsLoading(true);
        setError(null);

        try {
          // Try to discover existing channel
          let channelEvent = await discoverChannel();

          // If no channel exists and user can create, create one
          if (!channelEvent && canCreateChannel && appConfig.nip28.requireChannel) {
            console.log('No channel found, creating new one...');
            try {
              channelEvent = await createChannel();
            } catch (createError) {
              console.warn('Failed to create channel:', createError);
            }
          }

          if (channelEvent) {
            if (!mountedRef.current) return; // Component unmounted
            setChannel(channelEvent);
            
            // Fetch latest metadata
            const metadata = await fetchChannelMetadata(channelEvent.id);
            if (!mountedRef.current) return; // Component unmounted
            if (metadata) {
              setChannelMetadata(metadata);
            } else {
              // Use channel creation content as fallback
              try {
                const content = JSON.parse(channelEvent.content);
                setChannelMetadata(content);
              } catch (err) {
                setChannelMetadata(appConfig.nip28.channelMetadata);
              }
            }
            
            console.log('Channel initialized successfully:', channelEvent.id);
          } else {
            // No channel available - this is expected for new communities
            console.log('No channel found - awaiting admin creation');
            if (!mountedRef.current) return; // Component unmounted
            setChannelMetadata(appConfig.nip28.channelMetadata);
          }

                } catch (err) {
          console.error('Error initializing channel:', err);
          if (!mountedRef.current) return; // Component unmounted
          setError(err.message);
          initializationRef.current = false; // Allow retry on error
          setChannelMetadata(appConfig.nip28.channelMetadata);
        } finally {
          if (mountedRef.current) {
            setIsLoading(false);
          }
        }
       })();
     }

     return () => {
       mountedRef.current = false;
     };
   }, [ndk]); // Only depend on ndk to prevent multiple initializations

  /**
   * Refresh channel (force re-initialization)
   */
  const refreshChannel = useCallback(() => {
    initializationRef.current = false;
    return initializeChannel();
  }, [initializeChannel]);

  return {
    channel,
    channelMetadata,
    channelId: getChannelId(),
    isLoading,
    error,
    canCreateChannel,
    hasChannel: hasChannel(),
    // Actions
    createChannel,
    updateChannelMetadata,
    refreshChannel
  };
} 