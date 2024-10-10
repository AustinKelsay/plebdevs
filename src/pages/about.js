import React from 'react';
import Image from 'next/image';
import NostrIcon from '../../public/images/nostr.png';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { useToast } from "@/hooks/useToast";
import useWindowWidth from "@/hooks/useWindowWidth";
import GenericButton from '@/components/buttons/GenericButton';
import InteractivePromotionalCarousel from '@/components/content/carousels/InteractivePromotionalCarousel';

const AboutPage = () => {
    const { showToast } = useToast();
    const windowWidth = useWindowWidth();

    const isTabView = windowWidth <= 1360;

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            showToast("success", "Copied", "Copied Lightning Address to clipboard");
            if (window && window?.webln && window?.webln?.lnurl) {
                await window.webln.enable();
                const result = await window.webln.lnurl("austin@bitcoinpleb.dev");
                if (result && result?.preimage) {
                    showToast("success", "Payment Sent", "Thank you for your donation!");
                }
            }
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className={`${isTabView ? 'w-full' : 'w-[83vw]'} p-4 mx-auto`}>
            <InteractivePromotionalCarousel />
            <Card title="Key Features" className="mb-4">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col items-start justify-center">
                        <div className='flex flex-row items-start justify-center'>
                            <i className="pi pi-cloud text-2xl text-primary mr-2 text-blue-400"></i>
                            <h3 className='text-lg font-semibold'>Content Distribution:</h3>
                        </div>
                        <p className='text-lg'>All educational content is published to Nostr and actively pulled from Nostr relays, ensuring distributed and up-to-date information.</p>
                    </div>
                    <div className="flex items-start">
                        <i className="pi pi-file-edit text-2xl text-primary mr-2 text-green-400 mt-1"></i>
                        <div>
                            <h3 className="text-lg font-semibold">Content Types:</h3>
                            <p className='text-lg'>high signal, Bitcoin, Lightning, Nostr educational content.</p>
                            <ul className="list-disc list-inside ml-2 mt-2 space-y-2">
                                <li><span className="text-lg font-semibold">Documents:</span> Markdown documents posted as NIP-23 long-form events on Nostr.</li>
                                <li><span className="text-lg font-semibold">Videos:</span> Enhanced markdown files with rich media support, including embedded videos, also saved as NIP-23 events.</li>
                                <li><span className="text-lg font-semibold">Courses:</span> Nostr lists (NIP-51) that combines multiple documents and videos into a structured learning path.</li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <i className="pi pi-users text-2xl text-primary mr-2 text-purple-400 mt-1"></i>
                        <div>
                            <h3 className="text-lg font-semibold">Community:</h3>
                            <p className='text-lg'>All of the current PlebDevs Community channels.</p>
                            <ul className="list-disc list-inside ml-2 mt-2 space-y-2">
                                <li><span className="text-lg font-semibold">Nostr:</span> Public plebdevs nostr chat</li>
                                <li><span className="text-lg font-semibold">Discord:</span> PlebDevs Discord server</li>
                                <li><span className="text-lg font-semibold">StackerNews:</span> StackerNews ~devs territory</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </Card>

            <Card title="Connect with Us" className="mb-4">
                <div className="flex flex-wrap gap-4 justify-center">
                    <GenericButton
                        severity="secondary"
                        outlined
                        icon="pi pi-github"
                        tooltip="Github"
                        className="text-gray-300"
                        onClick={() => window.open('https://github.com/pleb-devs', '_blank')}
                    />
                    <GenericButton
                        severity="info"
                        outlined
                        icon="pi pi-twitter"
                        tooltip="X"
                        onClick={() => window.open('https://x.com/pleb_devs', '_blank')}
                    />
                    <GenericButton
                        severity="help"
                        outlined
                        icon={<Image src={NostrIcon} alt="Nostr" width={20} height={20} className="mr-0" />}
                        tooltip="Nostr"
                        onClick={() => window.open('https://nostr.com/plebdevs@plebdevs.com', '_blank')}
                    />
                    <GenericButton
                        severity="danger"
                        outlined
                        icon="pi pi-youtube"
                        tooltip="Youtube"
                        onClick={() => window.open('https://www.youtube.com/@plebdevs', '_blank')}
                    />
                    <GenericButton
                        severity="warning"
                        className="text-yellow-400"
                        outlined
                        icon="pi pi-bolt"
                        tooltip="Donate"
                        onClick={() => copyToClipboard("austin@bitcoinpleb.dev")}
                    />
                </div>
            </Card>
        </div>
    );
};

export default AboutPage;