import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { useNDKContext } from '@/context/NDKContext';
import { useSession } from 'next-auth/react';
import { createChannel, PLEBDEVS_CHANNEL_CONFIG } from '@/utils/nip28';
import { useToast } from '@/hooks/useToast';
import appConfig from '@/config/appConfig';

const ChannelCreator = ({ onChannelCreated }) => {
  const [isCreating, setIsCreating] = useState(false);
  const { ndk } = useNDKContext();
  const { data: session } = useSession();
  const { showToast } = useToast();

  // Check if current user is authorized to create channels
  const isAuthorized = session?.user?.pubkey && 
    appConfig.authorPubkeys.includes(session.user.pubkey);

  const handleCreateChannel = async () => {
    if (!ndk?.signer) {
      showToast('error', 'Please connect your Nostr account first');
      return;
    }

    if (!isAuthorized) {
      showToast('error', 'You are not authorized to create channels');
      return;
    }

    setIsCreating(true);

    try {
      const channelEvent = await createChannel(ndk, PLEBDEVS_CHANNEL_CONFIG);
      showToast('success', `Channel created successfully! ID: ${channelEvent.id.substring(0, 12)}...`);
      
      if (onChannelCreated) {
        onChannelCreated(channelEvent);
      }
    } catch (error) {
      console.error('Error creating channel:', error);
      showToast('error', 'Failed to create channel. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isAuthorized) {
    return null; // Don't show to unauthorized users
  }

  return (
    <div className="w-full p-4 bg-blue-900 border border-blue-700 rounded-lg">
      <div className="flex flex-col gap-3">
        <h4 className="text-lg font-semibold text-white">Initialize PlebDevs Channel</h4>
        <p className="text-sm text-blue-200">
          No NIP-28 channel found for PlebDevs community. Create the official channel to enable
          structured community discussions.
        </p>
        
        <div className="bg-blue-800 p-3 rounded">
          <h5 className="font-medium text-white mb-2">Channel Configuration:</h5>
          <ul className="text-sm text-blue-200 space-y-1">
            <li><strong>Name:</strong> {PLEBDEVS_CHANNEL_CONFIG.name}</li>
            <li><strong>About:</strong> {PLEBDEVS_CHANNEL_CONFIG.about}</li>
            <li><strong>Tags:</strong> {PLEBDEVS_CHANNEL_CONFIG.tags.map(tag => tag[1]).join(', ')}</li>
          </ul>
        </div>

        <Button
          label={isCreating ? 'Creating Channel...' : 'Create PlebDevs Channel'}
          icon={isCreating ? 'pi pi-spin pi-spinner' : 'pi pi-plus'}
          onClick={handleCreateChannel}
          disabled={isCreating || !ndk?.signer}
          className="bg-blue-600 hover:bg-blue-700"
        />
      </div>
    </div>
  );
};

export default ChannelCreator;