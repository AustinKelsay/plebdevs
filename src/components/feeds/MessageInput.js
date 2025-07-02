import React, { useState, useRef } from 'react';
import { InputTextarea } from 'primereact/inputtextarea';
import GenericButton from '@/components/buttons/GenericButton';
import { useNDKContext } from '@/context/NDKContext';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { finalizeEvent, verifyEvent } from 'nostr-tools/pure';
import { SimplePool } from 'nostr-tools/pool';
import appConfig from '@/config/appConfig';
import { useToast } from '@/hooks/useToast';
import { useSession } from 'next-auth/react';
import { useNip28Channel } from '@/hooks/nostr/useNip28Channel';

const MessageInput = ({ replyTo = null }) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { ndk, addSigner } = useNDKContext();
  const { showToast } = useToast();
  const { data: session } = useSession();
  const pool = useRef(null);
  
  // NIP-28 channel integration
  const { 
    channelId, 
    hasChannel, 
    isLoading: channelLoading,
    error: channelError 
  } = useNip28Channel();

  // Initialize pool when needed
  const getPool = async () => {
    if (!pool.current) {
      pool.current = new SimplePool();
    }
    return pool.current;
  };

  /**
   * Generate NIP-28 event configuration for channel messages
   */
  const getEventConfig = () => {
    if (!channelId) {
      throw new Error('No channel available for posting');
    }

    // NIP-28 channel mode (kind 42) only
    const tags = [
      ['e', channelId, '', 'root']
    ];
    
    // Add reply tags if replying to another message
    if (replyTo) {
      tags.push(['e', replyTo.id, '', 'reply']);
      tags.push(['p', replyTo.pubkey]);
    }
    
    return {
      kind: 42,
      tags
    };
  };

  const publishToRelay = async (relay, event, currentPool) => {
    try {
      // Wait for relay connection
      await currentPool.ensureRelay(relay);
      await currentPool.publish([relay], event);
      return true;
    } catch (err) {
      console.warn(`Failed to publish to ${relay}:`, err);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;
    if (isSubmitting) return;

    // Validate channel availability
    if (channelLoading) {
      showToast('info', 'Please wait', 'Channel is initializing...');
      return;
    }

    if (channelError) {
      showToast('error', 'Channel Error', channelError);
      return;
    }

    if (!channelId) {
      showToast('error', 'No Channel', 'No channel available for posting messages.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      let eventConfig;
      try {
        eventConfig = getEventConfig();
        console.log('Posting message to NIP-28 channel:', eventConfig);
      } catch (configError) {
        console.error('Error getting event configuration:', configError);
        showToast('error', 'Configuration Error', configError.message);
        return;
      }
      
      if (session && session?.user && session.user?.privkey) {
        await handleManualSubmit(session.user.privkey, eventConfig);
      } else {
        await handleExtensionSubmit(eventConfig);
      }
    } catch (error) {
      console.error('Error submitting message:', error);
      const errorMessage = error.message || 'There was an error sending your message. Please try again.';
      showToast('error', 'Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExtensionSubmit = async (eventConfig) => {
    if (!ndk) return;

    try {
      if (!ndk.signer) {
        await addSigner();
      }
      const event = new NDKEvent(ndk);
      event.kind = eventConfig.kind;
      event.content = message;
      event.tags = eventConfig.tags;

      await event.publish();
      
      showToast(
        'success', 
        'Message Sent', 
        'Your message has been sent to the PlebDevs channel.'
      );
      setMessage('');
    } catch (error) {
      console.error('Error publishing message:', error);
      throw error;
    }
  };

  const handleManualSubmit = async (privkey, eventConfig) => {
    try {
      let event = finalizeEvent(
        {
          kind: eventConfig.kind,
          created_at: Math.floor(Date.now() / 1000),
          tags: eventConfig.tags,
          content: message,
        },
        privkey
      );

      let isGood = verifyEvent(event);
      if (!isGood) {
        throw new Error('Event verification failed');
      }

      try {
        const currentPool = await getPool();
        let publishedToAny = false;

        // Try to publish to each relay sequentially
        for (const relay of appConfig.defaultRelayUrls) {
          const success = await publishToRelay(relay, event, currentPool);
          if (success) {
            publishedToAny = true;
            break; // Stop after first successful publish
          }
        }

        if (publishedToAny) {
          showToast(
            'success',
            'Message Sent',
            'Your message has been sent to the PlebDevs channel.'
          );
          setMessage('');
        } else {
          throw new Error('Failed to publish to any relay');
        }
      } catch (err) {
        console.error('Publishing error:', err);
        throw err;
      }
    } catch (error) {
      console.error('Error finalizing event:', error);
      throw error;
    }
  };

  // Show loading state while channel is initializing
  if (channelLoading) {
    return (
      <div className="flex flex-row items-center gap-2 p-4 bg-gray-700 rounded-lg">
        <i className="pi pi-spin pi-spinner text-blue-400" />
        <span className="text-gray-300">Initializing channel...</span>
      </div>
    );
  }

  // Show error state if channel failed to load
  if (channelError && !hasChannel) {
    return (
      <div className="flex flex-row items-center gap-2 p-4 bg-red-900/20 rounded-lg border border-red-500/30">
        <i className="pi pi-exclamation-triangle text-red-400" />
        <span className="text-red-300">Channel unavailable: {channelError}</span>
      </div>
    );
  }

  const placeholder = replyTo 
    ? `Reply to ${replyTo.pubkey?.slice(0, 12)}...` 
    : 'Type your message here...';

  const modeIndicator = hasChannel ? '📢 Channel' : '⏳ No Channel';

  return (
    <div className="space-y-2">
      {/* Mode indicator */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>{modeIndicator} Mode</span>
        {replyTo && (
          <span className="text-blue-400">
            Replying to {replyTo.pubkey?.slice(0, 12)}...
          </span>
        )}
      </div>
      
      {/* Message input */}
      <div className="flex flex-row items-center gap-2">
        <InputTextarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={1}
          autoResize
          placeholder={placeholder}
          className="flex-1 bg-[#1e2732] border-[#2e3b4e] rounded-lg"
          disabled={isSubmitting || channelLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <GenericButton
          icon="pi pi-send"
          outlined
          onClick={handleSubmit}
          className="h-full"
          disabled={isSubmitting || !message.trim() || channelLoading}
          loading={isSubmitting}
          tooltip="Send message"
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    </div>
  );
};

export default MessageInput;
