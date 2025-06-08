import { NDKEvent } from '@nostr-dev-kit/ndk';

// PlebDevs community channel configuration
export const PLEBDEVS_CHANNEL_CONFIG = {
  name: "PlebDevs Community",
  about: "Bitcoin and Lightning developer discussions, learning, and collaboration",
  picture: "https://plebdevs.com/images/plebdevs-icon.png",
  tags: [
    ["t", "developer"],
    ["t", "bitcoin"], 
    ["t", "lightning"],
    ["t", "plebdevs"]
  ]
};

/**
 * Create a NIP-28 channel (kind 40)
 * @param {NDK} ndk - NDK instance
 * @param {Object} config - Channel configuration
 * @returns {Promise<NDKEvent>} Channel creation event
 */
export async function createChannel(ndk, config = PLEBDEVS_CHANNEL_CONFIG) {
  if (!ndk?.signer) {
    throw new Error('NDK signer required to create channel');
  }

  const channelEvent = new NDKEvent(ndk);
  channelEvent.kind = 40;
  channelEvent.content = JSON.stringify({
    name: config.name,
    about: config.about,
    picture: config.picture
  });
  channelEvent.tags = config.tags;

  await channelEvent.publish();
  return channelEvent;
}

/**
 * Update channel metadata (kind 41)
 * @param {NDK} ndk - NDK instance
 * @param {string} channelId - Channel ID to update
 * @param {Object} metadata - Updated metadata
 * @param {string} relay - Relay URL
 * @returns {Promise<NDKEvent>} Channel update event
 */
export async function updateChannelMetadata(ndk, channelId, metadata, relay = 'wss://nos.lol') {
  if (!ndk?.signer) {
    throw new Error('NDK signer required to update channel');
  }

  const updateEvent = new NDKEvent(ndk);
  updateEvent.kind = 41;
  updateEvent.content = JSON.stringify(metadata);
  updateEvent.tags = [
    ["e", channelId, relay, "root"]
  ];

  await updateEvent.publish();
  return updateEvent;
}

/**
 * Send a message to a channel (kind 42)
 * @param {NDK} ndk - NDK instance
 * @param {string} channelId - Channel ID
 * @param {string} content - Message content
 * @param {string} relay - Relay URL
 * @param {string} replyToId - ID of message being replied to (optional)
 * @param {string} replyToAuthor - Pubkey of message author being replied to (optional)
 * @returns {Promise<NDKEvent>} Message event
 */
export async function sendChannelMessage(ndk, channelId, content, relay = 'wss://nos.lol', replyToId = null, replyToAuthor = null) {
  if (!ndk?.signer) {
    throw new Error('NDK signer required to send message');
  }

  const messageEvent = new NDKEvent(ndk);
  messageEvent.kind = 42;
  messageEvent.content = content;
  
  // Base channel reference
  const tags = [
    ["e", channelId, relay, "root"]
  ];

  // Add reply tags if this is a reply
  if (replyToId && replyToAuthor) {
    tags.push(["e", replyToId, relay, "reply"]);
    tags.push(["p", replyToAuthor, relay]);
  }

  messageEvent.tags = tags;

  await messageEvent.publish();
  return messageEvent;
}

/**
 * Hide a message (kind 43) - client-side moderation
 * @param {NDK} ndk - NDK instance
 * @param {string} messageId - Message ID to hide
 * @param {string} reason - Reason for hiding
 * @param {string} relay - Relay URL
 * @returns {Promise<NDKEvent>} Hide event
 */
export async function hideMessage(ndk, messageId, reason = 'spam', relay = 'wss://nos.lol') {
  if (!ndk?.signer) {
    throw new Error('NDK signer required to hide message');
  }

  const hideEvent = new NDKEvent(ndk);
  hideEvent.kind = 43;
  hideEvent.content = reason;
  hideEvent.tags = [
    ["e", messageId, relay]
  ];

  await hideEvent.publish();
  return hideEvent;
}

/**
 * Mute a user in a channel (kind 44) - client-side moderation
 * @param {NDK} ndk - NDK instance
 * @param {string} userPubkey - User pubkey to mute
 * @param {string} channelId - Channel ID
 * @param {string} reason - Reason for muting
 * @param {string} relay - Relay URL
 * @returns {Promise<NDKEvent>} Mute event
 */
export async function muteUser(ndk, userPubkey, channelId, reason = 'spam', relay = 'wss://nos.lol') {
  if (!ndk?.signer) {
    throw new Error('NDK signer required to mute user');
  }

  const muteEvent = new NDKEvent(ndk);
  muteEvent.kind = 44;
  muteEvent.content = reason;
  muteEvent.tags = [
    ["p", userPubkey, relay],
    ["e", channelId, relay]
  ];

  await muteEvent.publish();
  return muteEvent;
}

/**
 * Get channel metadata from a kind 40 or 41 event
 * @param {NDKEvent} event - Channel creation or update event
 * @returns {Object} Parsed channel metadata
 */
export function parseChannelMetadata(event) {
  try {
    const metadata = JSON.parse(event.content);
    return {
      id: event.id,
      name: metadata.name,
      about: metadata.about,
      picture: metadata.picture,
      created_at: event.created_at,
      author: event.pubkey,
      tags: event.tags
    };
  } catch (error) {
    console.error('Error parsing channel metadata:', error);
    return null;
  }
}

/**
 * Build message threads from channel messages
 * @param {Array<NDKEvent>} messages - Array of kind 42 messages
 * @returns {Map} Map of parent message ID to replies
 */
export function buildMessageThreads(messages) {
  const threads = new Map();
  
  messages.forEach(msg => {
    const replyTag = msg.tags.find(tag => 
      tag[0] === 'e' && tag[3] === 'reply'
    );
    
    if (replyTag) {
      const parentId = replyTag[1];
      if (!threads.has(parentId)) {
        threads.set(parentId, []);
      }
      threads.get(parentId).push(msg);
    }
  });
  
  return threads;
}

/**
 * Validate a channel message event
 * @param {NDKEvent} event - Message event to validate
 * @returns {boolean} Whether the event is valid
 */
export function validateChannelMessage(event) {
  if (event.kind !== 42) return false;
  if (!event.tags.find(tag => tag[0] === 'e')) return false;
  if (!event.content || event.content.length > 2000) return false;
  return true;
}

/**
 * Find the channel ID from a message event
 * @param {NDKEvent} messageEvent - Kind 42 message event
 * @returns {string|null} Channel ID or null if not found
 */
export function getChannelIdFromMessage(messageEvent) {
  const rootTag = messageEvent.tags.find(tag => 
    tag[0] === 'e' && tag[3] === 'root'
  );
  return rootTag ? rootTag[1] : null;
}

/**
 * Check if user has admin permissions (placeholder for future implementation)
 * @param {string} userPubkey - User's public key
 * @returns {boolean} Whether user has admin permissions
 */
export function hasChannelAdminPermissions(userPubkey) {
  // For now, allow all users to post
  // In future, this could check against a list of authorized pubkeys
  return true;
}