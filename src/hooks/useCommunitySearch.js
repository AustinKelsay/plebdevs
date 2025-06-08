import { useState, useEffect } from 'react';
import { useDiscordQuery } from '@/hooks/communityQueries/useDiscordQuery';
import { useCommunityChannel } from '@/hooks/nostr/useCommunityChannel';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const fetchStackerNews = async () => {
  const response = await axios.get('/api/stackernews');
  return response.data.data.items.items;
};

export const useCommunitySearch = () => {
  const [searchResults, setSearchResults] = useState([]);
  const { data: discordData } = useDiscordQuery({ page: 1 });
  const { channelMessages: nostrData } = useCommunityChannel();
  const { data: stackerNewsData } = useQuery({
    queryKey: ['stackerNews'],
    queryFn: fetchStackerNews,
  });

  const searchCommunity = term => {
    if (term.length < 3) {
      setSearchResults([]);
      return;
    }

    const lowercaseTerm = term.toLowerCase();

    // Discord search - match only on message content
    const filteredDiscord = (discordData || [])
      .filter(message => {
        if (!message.content) return false;
        return message.content.toLowerCase().includes(lowercaseTerm);
      })
      .map(message => ({ 
        ...message, 
        type: 'discord',
        _matches: {
          content: {
            text: message.content,
            term: lowercaseTerm
          }
        }
      }));

    // Nostr search - match only on message content
    const filteredNostr = (nostrData || [])
      .filter(message => {
        if (!message.content) return false;
        return message.content.toLowerCase().includes(lowercaseTerm);
      })
      .map(message => ({ 
        ...message, 
        type: 'nostr',
        _matches: {
          content: {
            text: message.content,
            term: lowercaseTerm
          }
        }
      }));

    // StackerNews search - match only on title
    const filteredStackerNews = (stackerNewsData || [])
      .filter(item => {
        if (!item.title) return false;
        return item.title.toLowerCase().includes(lowercaseTerm);
      })
      .map(item => ({ 
        ...item, 
        type: 'stackernews',
        _matches: {
          title: {
            text: item.title,
            term: lowercaseTerm
          }
        }
      }));

    // Combine and sort the results
    const combinedResults = [...filteredDiscord, ...filteredNostr, ...filteredStackerNews].sort(
      (a, b) => {
        // Get timestamps in a consistent format (milliseconds)
        const getTimestamp = item => {
          if (item.type === 'nostr') {
            return item.created_at * 1000;
          } else if (item.type === 'discord') {
            return new Date(item.timestamp).getTime();
          } else if (item.type === 'stackernews') {
            return new Date(item.createdAt).getTime();
          }
          return 0;
        };
        
        return getTimestamp(b) - getTimestamp(a);
      }
    );

    setSearchResults(combinedResults);
  };

  return { searchCommunity, searchResults };
};
