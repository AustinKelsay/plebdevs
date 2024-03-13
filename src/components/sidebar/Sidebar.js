import React, { useState } from 'react';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { useRouter } from 'next/router';
import 'primeicons/primeicons.css';

const Sidebar = () => {
    const router = useRouter();

    return (
        <div className='w-64 bg-gray-800 p-4'>
            <div  onClick={() => router.push('/')} className='w-full cursor-pointer hover:bg-gray-700 rounded-lg'>
                <p className="p-4 pl-5 rounded-md font-bold"><i className="pi pi-home" /> Home</p>
            </div>
            <div onClick={() => router.push('/content')} className='w-full cursor-pointer hover:bg-gray-700 rounded-lg'>
                <p className="p-4 pl-5 rounded-md font-bold"><i className="pi pi-video" /> Content</p>
            </div>

            <Accordion
                className="unstyled border-none bg-transparent"
                activeIndex={0}
                pt={{
                    tab: {
                        header: ({ context }) => ({
                            className: 'border-none bg-transparent hover:bg-gray-700 rounded-lg',
                        }),
                        headerAction: ({ context }) => ({
                            className: 'border-none bg-transparent',
                        }),
                        content: { className: 'border-none bg-transparent pt-0' }
                    }
                }}
            >
                <AccordionTab header={"Chat"}>
                <div onClick={() => router.push('/chat/general')} className='w-full cursor-pointer hover:bg-gray-700 rounded-lg'>
                    <p className="p-4 rounded-md font-bold"><i className="pi pi-hashtag"></i> general</p>
                </div>
                <div onClick={() => router.push('/chat/nostr')} className='w-full cursor-pointer hover:bg-gray-700 rounded-lg'>
                    <p className="p-4 rounded-md font-bold"><i className="pi pi-hashtag"></i> nostr</p>
                </div>
                <div onClick={() => router.push('/chat/discord')} className='w-full cursor-pointer hover:bg-gray-700 rounded-lg'>
                    <p className="p-4 rounded-md font-bold"><i className="pi pi-hashtag"></i> discord</p>
                </div>
                <div onClick={() => router.push('/chat/stackernews')} className='w-full cursor-pointer hover:bg-gray-700 rounded-lg'>
                    <p className="p-4 rounded-md font-bold"><i className="pi pi-hashtag"></i> stackernews</p>
                </div>
                </AccordionTab>
            </Accordion>
        </div>
    );
};

export default Sidebar;
