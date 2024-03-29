import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useNostr } from '@/hooks/useNostr';
import { parseEvent, findKind0Fields, hexToNpub } from '@/utils/nostr';
import { useImageProxy } from '@/hooks/useImageProxy';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import Image from 'next/image';
import 'primeicons/primeicons.css';

import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

const MarkdownContent = ({ content }) => {
    return (
        <div>
            <ReactMarkdown rehypePlugins={[rehypeRaw]} className='markdown-content'>
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default function Details() {
    const [event, setEvent] = useState(null);
    const [processedEvent, setProcessedEvent] = useState({});
    const [author, setAuthor] = useState(null);

    const { returnImageProxy } = useImageProxy();
    const { fetchSingleEvent, fetchKind0, zapEvent } = useNostr();

    const router = useRouter();

    const handleZapEvent = async () => {
        if (!event) return;

        const response = await zapEvent(event);

        console.log('zap response:', response);
    }

    useEffect(() => {
        if (router.isReady) {
            const { slug } = router.query;

            const fetchEvent = async (slug) => {
                const event = await fetchSingleEvent(slug);
                if (event) {
                    setEvent(event);
                }
            };

            fetchEvent(slug);
        }
    }, [router.isReady, router.query]);

    useEffect(() => {
        const fetchAuthor = async (pubkey) => {
            const author = await fetchKind0([{ authors: [pubkey], kinds: [0] }], {});
            const fields = await findKind0Fields(author);
            if (fields) {
                setAuthor(fields);
            }
        }
        if (event) {
            fetchAuthor(event.pubkey);
        }
    }, [event]);

    useEffect(() => {
        if (event) {
            const { id, pubkey, content, title, summary, image, published_at } = parseEvent(event);
            setProcessedEvent({ id, pubkey, content, title, summary, image, published_at });
        }
    }, [event]);

    return (
        <div className='w-full px-24 pt-12 mx-auto mt-4 max-tab:px-0 max-mob:px-0 max-tab:pt-2 max-mob:pt-2'>
            <div className='w-full flex flex-row justify-between max-tab:flex-col max-mob:flex-col'>
                {/* <i className='pi pi-arrow-left pl-8 cursor-pointer hover:opacity-75 max-tab:pl-2 max-mob:pl-2' onClick={() => router.push('/')} /> */}
                <div className='w-[75vw] mx-auto flex flex-row items-start justify-between max-tab:flex-col max-mob:flex-col max-tab:w-[95vw] max-mob:w-[95vw]'>
                    <div className='flex flex-col items-start max-w-[45vw] max-tab:max-w-[100vw] max-mob:max-w-[100vw]'>
                        <div className='pt-2 flex flex-row justify-start w-full'>
                            <Tag className='mr-2' value="Primary"></Tag>
                            <Tag className='mr-2' severity="success" value="Success"></Tag>
                            <Tag className='mr-2' severity="info" value="Info"></Tag>
                            <Tag className='mr-2' severity="warning" value="Warning"></Tag>
                            <Tag className='mr-2' severity="danger" value="Danger"></Tag>
                        </div>
                        <h1 className='text-4xl mt-6'>{processedEvent?.title}</h1>
                        <p className='text-xl mt-6'>{processedEvent?.summary}</p>
                        <div className='flex flex-row w-full mt-6 items-center'>
                            <Image
                                alt="resource thumbnail"
                                src={returnImageProxy(author?.avatar)}
                                width={50}
                                height={50}
                                className="rounded-full mr-4"
                            />
                            <p className='text-lg'>
                                Created by{' '}
                                <a rel='noreferrer noopener' target='_blank' className='text-blue-500 hover:underline'>
                                    {author?.username}
                                </a>
                            </p>
                        </div>
                    </div>
                    <div className='flex flex-col max-tab:mt-12 max-mob:mt-12'>
                        {processedEvent && (
                            <div className='flex flex-col items-center justify-between rounded-lg h-72 p-4 bg-gray-700 drop-shadow-md'>
                                <Image
                                    alt="resource thumbnail"
                                    src={returnImageProxy(processedEvent.image)}
                                    width={344}
                                    height={194}
                                    className="object-cover object-center rounded-lg"
                                />
                                <Button
                                    icon="pi pi-bolt"
                                    label="Zap"
                                    severity="success"
                                    outlined
                                    onClick={handleZapEvent}
                                    pt={{
                                        button: {
                                            icon: ({ context }) => ({
                                                className: 'bg-yellow-500'
                                            })
                                        }
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className='w-[75vw] mx-auto mt-32 p-12 border-t-2 border-gray-300 max-tab:p-0 max-mob:p-0 max-tab:max-w-[100vw] max-mob:max-w-[100vw]'>
                {
                    processedEvent?.content && <MarkdownContent content={processedEvent.content} />
                }
            </div>
        </div>
    );
}