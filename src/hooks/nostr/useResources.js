import { useState, useEffect } from 'react';
import { useNDKContext } from '@/context/NDKContext';
import { useContentIdsQuery } from '@/hooks/apiQueries/useContentIdsQuery';

const AUTHOR_PUBKEY = process.env.NEXT_PUBLIC_AUTHOR_PUBKEY;

export function useResources() {
    const [isClient, setIsClient] = useState(false);
    const [resources, setResources] = useState();
    // Add new state variables for loading and error
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const { contentIds } = useContentIdsQuery()
    const {ndk, addSigner} = useNDKContext();

    useEffect(() => {
        setIsClient(true);
    }, []);

    const hasRequiredProperties = (event, contentIds) => {
        const hasResource = event.tags.some(([tag, value]) => tag === "t" && value === "resource");
        const hasId = event.tags.some(([tag, value]) => tag === "d" && contentIds.includes(value));
        return hasResource && hasId;
    };

    const fetchResourcesFromNDK = async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (!contentIds || contentIds.length === 0) {
                console.log('No content IDs found');
                setIsLoading(false);
                return []; // Return early if no content IDs are found
            }

            await ndk.connect();

            const filter = { kinds: [30023, 30402], authors: [AUTHOR_PUBKEY] };
            const events = await ndk.fetchEvents(filter);

            if (events && events.size > 0) {
                const eventsArray = Array.from(events);
                const resources = eventsArray.filter(event => hasRequiredProperties(event, contentIds));
                setIsLoading(false);
                return resources;
            }
            setIsLoading(false);
            return [];
        } catch (error) {
            console.error('Error fetching resources from NDK:', error);
            setError(error);
            setIsLoading(false);
            return [];
        }
    };

    useEffect(() => {
        if (isClient && contentIds) {
            fetchResourcesFromNDK().then(fetchedResources => {
                if (fetchedResources && fetchedResources.length > 0) {
                    setResources(fetchedResources);
                }
            });
        }
    }, [isClient, contentIds]);

    return { resources, isLoading, error };
}