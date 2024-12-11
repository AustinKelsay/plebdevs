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
        <>
            <div className="relative flex w-full items-center justify-center">
                <Image
                    alt="user's avatar"
                    src={returnImageProxy(user.avatar, user?.pubkey || "")}
                    width={100}
                    height={100}
                    className="rounded-full my-4"
                />
                <div className="absolute top-8 right-80 max-tab:right-20 max-mob:left-0">
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
            </div>


            <h1 className="text-center text-2xl my-2">
                {user.username || user?.name || user?.email || "Anon"}
            </h1>
            {user.pubkey && (
                <h2 className="text-center text-xl my-2 truncate max-tab:px-4 max-mob:px-4">
                    <Tooltip target=".pubkey-tooltip" content={"this is your nostr npub"} />
                    {nip19.npubEncode(user.pubkey)} <i className="pi pi-question-circle text-xl pubkey-tooltip" />
                </h2>
            )}
            {user?.lightningAddress && (
                <h3 className="w-fit mx-auto text-center text-xl my-2 bg-gray-800 rounded-lg p-4">
                    <span className="font-bold">Lightning Address:</span> {user.lightningAddress.name}@plebdevs.com <i className="pi pi-copy cursor-pointer hover:text-gray-400" onClick={() => copyToClipboard(user.lightningAddress.name + "@plebdevs.com")} />
                </h3>
            )}
            {user?.nip05 && (
                <h3 className="w-fit mx-auto text-center text-xl my-2 bg-gray-800 rounded-lg p-4">
                    <span className="font-bold">NIP-05:</span> {user.nip05.name}@plebdevs.com <i className="pi pi-copy cursor-pointer hover:text-gray-400" onClick={() => copyToClipboard(user.nip05.name + "@plebdevs.com")} />
                </h3>
            )}
        </>
    );
};

export default UserProfileCard;
