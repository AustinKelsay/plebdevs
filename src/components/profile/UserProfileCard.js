import React, { useRef } from 'react';
import Image from 'next/image';
import { Menu } from 'primereact/menu';
import { Tooltip } from 'primereact/tooltip';
import { nip19 } from 'nostr-tools';
import { useImageProxy } from '@/hooks/useImageProxy';
import { useToast } from '@/hooks/useToast';

const UserProfileCard = ({ user }) => {
    const menu = useRef(null);
    const { showToast } = useToast();
    const { returnImageProxy } = useImageProxy();
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        showToast("success", "Copied", "Copied to clipboard");
    };

    const menuItems = [
        ...(user?.privkey ? [{
            label: 'Copy nsec',
            icon: 'pi pi-key',
            command: () => {
                const privkeyBuffer = Buffer.from(user.privkey, 'hex');
                copyToClipboard(nip19.nsecEncode(privkeyBuffer));
            }
        }] : []),
        {
            label: 'Copy npub',
            icon: 'pi pi-user',
            command: () => {
                if (user.pubkey) {
                    copyToClipboard(nip19.npubEncode(user?.pubkey));
                }
            }
        },
        {
            label: 'Open Nostr Profile',
            icon: 'pi pi-external-link',
            command: () => window.open(`https://nostr.com/${nip19.npubEncode(user?.pubkey)}`, '_blank')
        }
    ];

    return (
        <div className="lg:w-1/4 bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-md">
            <div className="flex flex-row gap-4">
                <Image
                    alt="user's avatar"
                    src={returnImageProxy(user.avatar, user?.pubkey || "")}
                    width={100}
                    height={100}
                    className="rounded-full my-4"
                />

                <div className="flex flex-col gap-2 pt-4 w-full relative">
                    <div className="absolute top-0 right-0">
                        <i
                            className="pi pi-ellipsis-h text-2xl cursor-pointer"
                            onClick={(e) => menu.current.toggle(e)}
                        />
                        <Menu
                            model={menuItems}
                            popup
                            ref={menu}
                            id="profile-options-menu"
                        />
                    </div>
                    <h3 className="self-start">
                        {user.username || user?.name || user?.email || "Anon"}
                    </h3>
                    {
                        user?.pubkey && (
                            <div className="flex flex-row gap-2">
                                <p className="truncate">
                                    {nip19.npubEncode(user.pubkey).slice(0, 12)}...
                                </p>
                                <Tooltip target=".pubkey-tooltip" content={"this is your account pubkey"} />
                                <i className="pi pi-question-circle pubkey-tooltip text-xs cursor-pointer" />
                            </div>
                        )
                    }
                    {user?.createdAt && (
                        <p className="truncate">
                            Joined: {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex flex-col gap-2">
                {user?.lightningAddress ? (
                    <h4 className="my-2 bg-gray-900 rounded-lg p-4">
                        <span className="font-bold">Lightning Address:</span> {user.lightningAddress.name}@plebdevs.com <i className="pi pi-copy cursor-pointer hover:text-gray-400" onClick={() => copyToClipboard(user.lightningAddress.name + "@plebdevs.com")} />
                    </h4>
                ) : (
                    <div className="flex flex-row justify-between my-2 bg-gray-900 rounded-lg p-4">
                        <h4 >
                            <span className="font-bold">Lightning Address:</span> None
                        </h4>
                        {/* todo: add tooltip */}
                        <Tooltip target=".lightning-address-tooltip" content={"this is your account lightning address"} />
                        <i className="pi pi-question-circle lightning-address-tooltip text-xs cursor-pointer" />
                    </div>
                )}
                {user?.nip05 ? (
                    <h4 className="my-2 bg-gray-900 rounded-lg p-4">
                        <span className="font-bold">NIP-05:</span> {user.nip05.name}@plebdevs.com <i className="pi pi-copy cursor-pointer hover:text-gray-400" onClick={() => copyToClipboard(user.nip05.name + "@plebdevs.com")} />
                    </h4>
                ) : (
                    <div className="flex flex-row justify-between my-2 bg-gray-900 rounded-lg p-4">
                        <h4>
                            <span className="font-bold">NIP-05:</span> None
                        </h4>
                        {/* todo: add tooltip */}
                        <Tooltip target=".nip05-tooltip" content={"this is your account nip05"} />
                        <i className="pi pi-question-circle nip05-tooltip text-xs cursor-pointer" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfileCard;
