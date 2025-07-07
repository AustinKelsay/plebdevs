/**
 * ChannelEmptyState - Component displayed when no NIP-28 channel is available
 * 
 * Provides user-friendly messaging and potential actions when the channel
 * system is unavailable, helping users understand the current state.
 * 
 * @param {Object} props - Component props
 * @param {string} props.mode - Current mode ('loading', 'error', 'no-channel')
 * @param {string} props.error - Error message if applicable
 * @param {Function} props.onRetry - Optional retry function
 * @param {boolean} props.canCreateChannel - Whether user can create channels
 * @param {Function} props.onCreateChannel - Function to create a new channel
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Card } from 'primereact/card';
import GenericButton from '@/components/buttons/GenericButton';

const ChannelEmptyState = ({ 
  mode = 'no-channel', 
  error = null, 
  onRetry = null, 
  canCreateChannel = false, 
  onCreateChannel = null 
}) => {
  const getContent = () => {
    switch (mode) {
      case 'loading':
        return {
          icon: 'pi pi-spin pi-spinner',
          title: 'Loading Channel...',
          message: 'Connecting to the PlebDevs community channel. Please wait.',
          iconColor: 'text-blue-400'
        };

      case 'error':
        return {
          icon: 'pi pi-exclamation-triangle',
          title: 'Channel Error',
          message: error || 'Unable to connect to the community channel.',
          iconColor: 'text-red-400'
        };

      case 'no-channel':
      default:
        return {
          icon: 'pi pi-comments',
          title: 'No Channel Available',
          message: canCreateChannel 
            ? 'No PlebDevs community channel exists yet. You can create one to enable enhanced features.'
            : 'No PlebDevs community channel is available. Please wait for an admin to create one.',
          iconColor: 'text-gray-400'
        };
    }
  };

  const content = getContent();

  const renderActions = () => {
    const actions = [];

    if (mode === 'error' && onRetry) {
      actions.push(
        <GenericButton
          key="retry"
          label="Retry Connection"
          icon="pi pi-refresh"
          onClick={onRetry}
          className="mr-2"
        />
      );
    }

    if (mode === 'no-channel' && canCreateChannel && onCreateChannel) {
      actions.push(
        <GenericButton
          key="create"
          label="Create Channel"
          icon="pi pi-plus"
          onClick={onCreateChannel}
          severity="primary"
        />
      );
    }

    return actions.length > 0 ? (
      <div className="flex flex-row gap-2 mt-4">
        {actions}
      </div>
    ) : null;
  };

  return (
    <Card className="w-full bg-gray-700 text-center">
      <div className="flex flex-col items-center space-y-4 p-6">
        <i className={`${content.icon} text-4xl ${content.iconColor}`} />
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">
            {content.title}
          </h3>
          <p className="text-gray-300 max-w-md">
            {content.message}
          </p>
        </div>

        {renderActions()}

        {mode === 'no-channel' && !canCreateChannel && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-300">
              ℹ️ Admins can create channels to enable features like threaded conversations, 
              user moderation, and enhanced community management.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

ChannelEmptyState.propTypes = {
  mode: PropTypes.oneOf(['loading', 'error', 'no-channel']),
  error: PropTypes.string,
  onRetry: PropTypes.func,
  canCreateChannel: PropTypes.bool,
  onCreateChannel: PropTypes.func
};

export default ChannelEmptyState; 