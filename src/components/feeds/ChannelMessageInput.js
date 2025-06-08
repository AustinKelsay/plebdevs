import React, { useState } from 'react';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { useNDKContext } from '@/context/NDKContext';
import { useSession } from 'next-auth/react';
import { sendChannelMessage } from '@/utils/nip28';
import { useToast } from '@/hooks/useToast';

const ChannelMessageInput = ({ channelId, onMessageSent, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { ndk } = useNDKContext();
  const { data: session } = useSession();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    if (!ndk?.signer) {
      showToast('error', 'Please connect your Nostr account to post messages');
      return;
    }

    if (!channelId) {
      showToast('error', 'No channel available for posting');
      return;
    }

    setIsSubmitting(true);

    try {
      await sendChannelMessage(ndk, channelId, message.trim());
      setMessage('');
      showToast('success', 'Message posted successfully!');
      
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (error) {
      console.error('Error posting message:', error);
      showToast('error', 'Failed to post message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!session) {
    return (
      <div className="w-full p-4 bg-gray-800 rounded-lg text-center">
        <p className="text-gray-300">Please sign in to participate in the community chat</p>
      </div>
    );
  }

  return (
    <div className="w-full p-4 bg-gray-800 rounded-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <InputTextarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Share your thoughts with the PlebDevs community..."
          rows={3}
          className="w-full bg-gray-700 text-white border-gray-600 focus:border-blue-400"
          disabled={disabled || isSubmitting}
          maxLength={2000}
        />
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">
            {message.length}/2000 characters
          </span>
          
          <Button
            type="submit"
            label={isSubmitting ? 'Posting...' : 'Post Message'}
            icon={isSubmitting ? 'pi pi-spin pi-spinner' : 'pi pi-send'}
            size="small"
            disabled={!message.trim() || disabled || isSubmitting || !channelId}
            className="bg-blue-500 hover:bg-blue-600"
          />
        </div>
      </form>
      
      {!ndk?.signer && (
        <div className="mt-2 p-2 bg-yellow-900 border border-yellow-600 rounded text-yellow-200 text-sm">
          Connect your Nostr account to post messages to the community
        </div>
      )}
    </div>
  );
};

export default ChannelMessageInput;