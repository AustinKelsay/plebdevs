import React, { useState, useEffect } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useNDKContext } from '@/context/NDKContext';
import { useSession } from 'next-auth/react';
import { findKind0Fields } from '@/utils/nostr';
import NostrIcon from '../../../public/images/nostr.png';
import Image from 'next/image';
import { useImageProxy } from '@/hooks/useImageProxy';
import useWindowWidth from '@/hooks/useWindowWidth';
import { nip19 } from 'nostr-tools';
import { useCommunityNotes } from '@/hooks/nostr/useCommunityNotes';
import CommunityMessage from '@/components/feeds/messages/CommunityMessage';
import ZapThreadsWrapper from '@/components/ZapThreadsWrapper';

const NostrFeed = ({ searchQuery }) => {
    const { communityNotes, isLoading, error } = useCommunityNotes();
    const { ndk } = useNDKContext();
    const { returnImageProxy } = useImageProxy();
    const { data: session } = useSession();
    const [authorData, setAuthorData] = useState({});
    const [npub, setNpub] = useState(null);

    const windowWidth = useWindowWidth();

    useEffect(() => {
        const fetchAuthors = async () => {
            const authorDataMap = {};
            for (const message of communityNotes) {
                if (!authorDataMap[message.pubkey]) {
                    const author = await fetchAuthor(message.pubkey);
                    authorDataMap[message.pubkey] = author;
                }
            }
            setAuthorData(authorDataMap);
        };

        if (communityNotes && communityNotes.length > 0) {
            fetchAuthors();
        }
    }, [communityNotes]);

    useEffect(() => {
        if (session?.user?.pubkey) {
            setNpub(nip19.npubEncode(session.user.pubkey));
        }
    }, [session]);

    const fetchAuthor = async (pubkey) => {
        try {
            const filter = {
                kinds: [0],
                authors: [pubkey]
            };

            const author = await ndk.fetchEvent(filter);
            if (author) {
                try {
                    const fields = await findKind0Fields(JSON.parse(author.content));
                    return fields;
                } catch (error) {
                    console.error('Error fetching author:', error);
                }
            }
            return null;
        } catch (error) {
            console.error('Error fetching author:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="h-[100vh] min-bottom-bar:w-[86vw] max-sidebar:w-[100vw]">
                <ProgressSpinner className='w-full mt-24 mx-auto' />
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 text-center p-4">Failed to load messages. Please try again later.</div>;
    }

    const filteredNotes = communityNotes.filter(message =>
        message.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-gray-900 h-full w-full min-bottom-bar:w-[86vw]">
            <div className="mx-4 mt-4">
                {filteredNotes.length > 0 ? (
                    filteredNotes.map(message => (
                        <CommunityMessage
                            key={message.id}
                            message={{
                                id: message.id,
                                author: authorData[message.pubkey]?.username || message.pubkey.substring(0, 12) + '...',
                                avatar: authorData[message.pubkey]?.avatar ? returnImageProxy(authorData[message.pubkey]?.avatar) : null,
                                content: message.content,
                                timestamp: message.created_at * 1000,
                                channel: "plebdevs"
                            }}
                            searchQuery={searchQuery}
                            windowWidth={windowWidth}
                            platform="nostr"
                            platformIcon={<Image src={NostrIcon} alt="Nostr" width={14} height={14} className='mr-[1px]' />}
                            platformLink={`https://nostr.band/${nip19.noteEncode(message.id)}`}
                        />
                    ))
                ) : (
                    <div className="text-gray-400 text-center p-4">No messages available.</div>
                )}
            </div>
        </div>
    );
};

export default NostrFeed;