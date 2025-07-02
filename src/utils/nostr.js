import { nip19 } from 'nostr-tools';
import { getEventHash } from 'nostr-tools/pure';

export const findKind0Fields = async kind0 => {
  let fields = {};

  const usernameProperties = ['name', 'displayName', 'display_name', 'username', 'handle', 'alias'];

  const pubkeyProperties = ['pubkey', 'npub', '_pubkey'];

  const findTruthyPropertyValue = (object, properties) => {
    for (const property of properties) {
      if (object?.[property]) {
        return object[property];
      }
    }
    return null;
  };

  const username = findTruthyPropertyValue(kind0, usernameProperties);

  if (username) {
    fields.username = username;
  }

  const avatar = findTruthyPropertyValue(kind0, [
    'picture',
    'avatar',
    'profilePicture',
    'profile_picture',
    'image',
  ]);

  if (avatar) {
    fields.avatar = avatar;
  }

  const pubkey = findTruthyPropertyValue(kind0, pubkeyProperties);

  if (pubkey) {
    fields.pubkey = pubkey;
  }

  const lud16 = findTruthyPropertyValue(kind0, ['lud16', 'lightning', 'lnurl', 'lnurlp', 'lnurlw']);

  if (lud16) {
    fields.lud16 = lud16;
  }

  const nip05 = findTruthyPropertyValue(kind0, ['nip05']);

  if (nip05) {
    fields.nip05 = nip05;
  }

  return fields;
};

export const parseMessageEvent = event => {
  const eventData = {
    id: event.id,
    pubkey: event.pubkey || '',
    content: event.content || '',
    kind: event.kind || '',
    type: 'message',
  };

  return eventData;
};

export const parseEvent = event => {
  // Initialize an object to store the extracted data
  const eventData = {
    id: event.id,
    pubkey: event.pubkey || '',
    content: event.content || '',
    kind: event.kind || '',
    additionalLinks: [],
    title: '',
    summary: '',
    image: '',
    published_at: '',
    topics: [], // Added to hold all topics
    type: 'document', // Default type
  };

  // Iterate over the tags array to extract data
  event.tags.forEach(tag => {
    switch (
      tag[0] // Check the key in each key-value pair
    ) {
      case 'title':
        eventData.title = tag[1];
        break;
      case 'summary':
        eventData.summary = tag[1];
        break;
      case 'description':
        eventData.summary = tag[1];
        break;
      case 'name':
        eventData.title = tag[1];
        break;
      case 'image':
        eventData.image = tag[1];
        break;
      case 'published_at':
        eventData.published_at = tag[1];
        break;
      case 'author':
        eventData.author = tag[1];
        break;
      case 'price':
        eventData.price = tag[1];
        break;
      // How do we get topics / tags?
      case 'l':
        // Grab index 1 and any subsequent elements in the array
        tag.slice(1).forEach(topic => {
          eventData.topics.push(topic);
        });
        break;
      case 'd':
        eventData.d = tag[1];
        break;
      case 't':
        if (tag[1] === 'video') {
          eventData.type = 'video';
          eventData.topics.push(tag[1]);
        } else if (tag[1] !== 'plebdevs') {
          eventData.topics.push(tag[1]);
        }
        break;
      case 'r':
        eventData.additionalLinks.push(tag[1]);
        break;
      default:
        break;
    }
  });

  // if published_at is an empty string, then set it to event.created_at
  if (!eventData.published_at) {
    eventData.published_at = event.created_at;
  }

  return eventData;
};

export const parseCourseEvent = event => {
  // Initialize an object to store the extracted data
  const eventData = {
    id: event.id,
    pubkey: event.pubkey || '',
    content: event.content || '',
    kind: event.kind || '',
    name: '',
    description: '',
    image: '',
    published_at: '',
    created_at: event.created_at,
    topics: [],
    d: '',
    tags: event.tags,
    type: 'course',
  };

  // Iterate over the tags array to extract data
  event.tags.forEach(tag => {
    switch (
      tag[0] // Check the key in each key-value pair
    ) {
      case 'name':
        eventData.name = tag[1];
        break;
      case 'title':
        eventData.name = tag[1];
        break;
      case 'description':
        eventData.description = tag[1];
        break;
      case 'about':
        eventData.description = tag[1];
        break;
      case 'image':
        eventData.image = tag[1];
        break;
      case 'picture':
        eventData.image = tag[1];
        break;
      case 'published_at':
        eventData.published_at = tag[1];
        break;
      case 'd':
        eventData.d = tag[1];
        break;
      case 'price':
        eventData.price = tag[1];
        break;
      // How do we get topics / tags?
      case 'l':
        // Grab index 1 and any subsequent elements in the array
        tag.slice(1).forEach(topic => {
          eventData.topics.push(topic);
        });
        break;
      case 'r':
        eventData.additionalLinks.push(tag[1]);
        break;
      case 't':
        eventData.topics.push(tag[1]);
        break;
      default:
        break;
    }
  });

  return eventData;
};

export const hexToNpub = hex => {
  return nip19.npubEncode(hex);
};

/**
 * Generates a Nostr address (naddr) from event details
 * 
 * @param {string} pubkey - The public key of the content creator
 * @param {number} kind - The event kind
 * @param {string} identifier - The 'd' tag value
 * @param {Array} relays - Optional array of relay URLs
 * @returns {string} - The naddr string
 */
export const generateNaddr = (pubkey, kind, identifier, relays = []) => {
  try {
    // Convert npub to hex if needed
    let hexPubkey = pubkey;
    if (pubkey.startsWith('npub')) {
      try {
        const { data } = nip19.decode(pubkey);
        hexPubkey = data;
      } catch (e) {
        console.error('Error decoding npub:', e);
      }
    }

    // Create the address data
    const addressData = {
      pubkey: hexPubkey,
      kind: parseInt(kind),
      identifier,
      relays
    };

    // Generate and return the naddr
    return nip19.naddrEncode(addressData);
  } catch (error) {
    console.error('Error generating naddr:', error);
    return null;
  }
};

export function validateEvent(event) {
  if (typeof event.kind !== 'number') return 'Invalid kind';
  if (typeof event.content !== 'string') return 'Invalid content';
  if (typeof event.created_at !== 'number') return 'Invalid created_at';
  if (typeof event.pubkey !== 'string') return 'Invalid pubkey';
  if (!event.pubkey.match(/^[a-f0-9]{64}$/)) return 'Invalid pubkey format';

  if (!Array.isArray(event.tags)) return 'Invalid tags';
  for (let i = 0; i < event.tags.length; i++) {
    const tag = event.tags[i];
    if (!Array.isArray(tag)) return 'Invalid tag structure';
    for (let j = 0; j < tag.length; j++) {
      if (typeof tag[j] === 'object') return 'Invalid tag value';
    }
  }

  return true;
}

/**
 * Parse NIP-28 Channel Creation Event (kind 40)
 * 
 * @param {Object} event - The NDK event object
 * @returns {Object} - Parsed channel data
 */
export const parseChannelEvent = event => {

  console.log('Parsing channel event:', event);

  // Use centralized event ID extraction logic
  const eventId = getEventId(event);

  const eventData = {
    id: eventId,
    pubkey: event.pubkey || '',
    content: event.content || '',
    kind: event.kind || 40,
    created_at: event.created_at || 0,
    type: 'channel',
    metadata: null,
    tags: event.tags || []
  };

  // Parse channel metadata from content
  try {
    if (eventData.content) {
      eventData.metadata = JSON.parse(eventData.content);
    }
  } catch (err) {
    console.warn('Error parsing channel metadata:', err);
    eventData.metadata = {};
  }

  // Extract additional data from tags
  event.tags.forEach(tag => {
    switch (tag[0]) {
      case 't':
        if (!eventData.topics) eventData.topics = [];
        eventData.topics.push(tag[1]);
        break;
      case 'r':
        if (!eventData.relays) eventData.relays = [];
        eventData.relays.push(tag[1]);
        break;
      default:
        break;
    }
  });

  return eventData;
};

/**
 * Parse NIP-28 Channel Metadata Event (kind 41)
 * 
 * @param {Object} event - The NDK event object
 * @returns {Object} - Parsed channel metadata
 */
export const parseChannelMetadataEvent = event => {
  const eventData = {
    id: getEventId(event),
    pubkey: event.pubkey || '',
    content: event.content || '',
    kind: event.kind || 41,
    created_at: event.created_at || 0,
    type: 'channel-metadata',
    channelId: null,
    metadata: null,
    tags: event.tags || []
  };

  // Find channel reference
  event.tags.forEach(tag => {
    if (tag[0] === 'e' && tag[3] === 'root') {
      eventData.channelId = tag[1];
    }
  });

  // Parse metadata from content
  try {
    if (eventData.content) {
      eventData.metadata = JSON.parse(eventData.content);
    }
  } catch (err) {
    console.warn('Error parsing channel metadata:', err);
    eventData.metadata = {};
  }

  return eventData;
};

/**
 * Parse NIP-28 Channel Message Event (kind 42)
 * 
 * @param {Object} event - The NDK event object
 * @returns {Object} - Parsed channel message
 */
export const parseChannelMessageEvent = event => {
  const eventData = {
    id: getEventId(event),
    pubkey: event.pubkey || '',
    content: event.content || '',
    kind: event.kind || 42,
    created_at: event.created_at || 0,
    type: 'channel-message',
    channelId: null,
    replyTo: null,
    mentions: [],
    tags: event.tags || []
  };

  // Parse NIP-10 threading and channel references
  event.tags.forEach(tag => {
    switch (tag[0]) {
      case 'e':
        if (tag[3] === 'root') {
          eventData.channelId = tag[1];
        } else if (tag[3] === 'reply') {
          eventData.replyTo = tag[1];
        }
        break;
      case 'p':
        eventData.mentions.push(tag[1]);
        break;
      default:
        break;
    }
  });

  return eventData;
};

/**
 * Generate a proper event ID from NDK event with comprehensive fallback logic
 * 
 * @param {Object} event - The NDK event object
 * @returns {string} - The event ID
 */
export const getEventId = event => {
  let eventId = '';
  
  // First try the direct properties
  if (event.id && event.id !== '') {
    eventId = event.id;
  } else if (event.eventId && event.eventId !== '') {
    eventId = event.eventId;
  } else if (typeof event.tagId === 'function') {
    const tagId = event.tagId();
    if (tagId && tagId !== '') eventId = tagId;
  }
  
  // Try to decode the nevent if available (skip if malformed)
  if (!eventId && event.encode) {
    try {
      const neventString = typeof event.encode === 'function' ? event.encode() : event.encode;
      if (neventString && typeof neventString === 'string') {
        const decoded = nip19.decode(neventString);
        if (decoded.type === 'nevent' && decoded.data?.id) {
          eventId = decoded.data.id;
          console.log('Decoded event ID from nevent:', eventId);
        }
      }
    } catch (err) {
      // Nevent is malformed, will fallback to generating ID from event data
      console.log('Nevent malformed, will generate ID from event data');
    }
  }
  
  // Try the rawEvent - call it if it's a function
  if (!eventId && event.rawEvent) {
    try {
      const rawEventData = typeof event.rawEvent === 'function' ? event.rawEvent() : event.rawEvent;
      if (rawEventData?.id) {
        eventId = rawEventData.id;
        console.log('Found ID in raw event data:', eventId);
      }
    } catch (err) {
      console.warn('Error accessing raw event:', err);
    }
  }

  // Generate event ID from event data if we have all required fields
  if (!eventId && event.pubkey && event.kind && event.created_at && event.content && event.tags) {
    try {
      console.log('Generating event ID from event data:', {
        pubkey: event.pubkey?.slice(0, 8) + '...',
        kind: event.kind,
        created_at: event.created_at,
        contentLength: event.content?.length,
        tagsLength: event.tags?.length
      });
      
      const eventForHashing = {
        pubkey: event.pubkey,
        kind: event.kind,
        created_at: event.created_at,
        tags: event.tags,
        content: event.content
      };
      
      eventId = getEventHash(eventForHashing);
      console.log('✅ Generated event ID from data:', eventId);
    } catch (err) {
      console.error('❌ Error generating event ID:', err);
    }
  } else if (!eventId) {
    console.log('Cannot generate event ID - missing required fields:', {
      hasPubkey: !!event.pubkey,
      hasKind: !!event.kind,
      hasCreatedAt: !!event.created_at,
      hasContent: !!event.content,
      hasTags: !!event.tags
    });
  }

  // Last resort - generate temporary ID
  if (!eventId) {
    console.warn('No event ID found - generating temporary ID');
    if (event.pubkey && event.created_at) {
      eventId = `temp_${event.pubkey.slice(0, 8)}_${event.created_at}`;
    }
  }
  
  return eventId || null;
};
