import { useState, useEffect, useCallback } from 'react';
import { useNDKContext } from '@/context/NDKContext';
import NDK, { NDKEvent, NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';

export function useZapsSubscription({ event }) {
  const [zaps, setZaps] = useState([]);
  const [zapsLoading, setZapsLoading] = useState(true);
  const [zapsError, setZapsError] = useState(null);
  const { ndk } = useNDKContext();

  const addZap = useCallback(zapEvent => {
    setZaps(prevZaps => {
      if (prevZaps.some(zap => zap.id === zapEvent.id)) return prevZaps;
      return [...prevZaps, zapEvent];
    });
  }, []);

  useEffect(() => {
    let subscription;
    const zapIds = new Set();
    let timeoutId;

    async function subscribeToZaps() {
      if (!event || !ndk) return;

      try {
        const filters = [
          { kinds: [9735], '#e': [event.id] },
          { kinds: [9735], '#a': [`${event.kind}:${event.pubkey}:${event.d}`] },
        ];

        subscription = ndk.subscribe(filters, {
          closeOnEose: false,
          cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
        });

        subscription.on('event', zapEvent => {
          if (!zapIds.has(zapEvent.id)) {
            zapIds.add(zapEvent.id);
            addZap(zapEvent);
            setZapsLoading(false);
            clearTimeout(timeoutId);
          }
        });

        subscription.on('close', () => {
          setZapsLoading(false);
        });

        subscription.on('eose', () => {
          setZapsLoading(false);
        });

        await subscription.start();

        // Set a 4-second timeout to stop loading state if no zaps are received
        timeoutId = setTimeout(() => {
          setZapsLoading(false);
        }, 3000);
      } catch (error) {
        console.error('Error subscribing to zaps:', error);
        setZapsError(error.message);
        setZapsLoading(false);
      }
    }

    setZaps([]);
    setZapsLoading(true);
    setZapsError(null);
    subscribeToZaps();

    return () => {
      if (subscription) {
        subscription.stop();
      }
      clearTimeout(timeoutId);
    };
  }, [event, ndk, addZap]);

  return { zaps, zapsLoading, zapsError };
}
