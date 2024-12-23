import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { Menu } from 'primereact/menu';
import { Tooltip } from 'primereact/tooltip';
import { nip19 } from 'nostr-tools';
import { useImageProxy } from '@/hooks/useImageProxy';
import { useToast } from '@/hooks/useToast';
import UserBadges from '@/components/profile/UserBadges';
import useWindowWidth from '@/hooks/useWindowWidth';

const UserProfileCard = ({ user }) => {
    const [showBadges, setShowBadges] = useState(false);
    const menu = useRef(null);
    const { showToast } = useToast();
    const { returnImageProxy } = useImageProxy();
    const windowWidth = useWindowWidth();

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

    const MobileProfileCard = () => (
        <div className="w-full bg-gray-800 rounded-lg p-2 py-1 border border-gray-700 shadow-md h-[420px] flex flex-col justify-center items-start">
            <div className="flex flex-col gap-2 pt-4 w-full relative">
                <div className="absolute top-8 right-[10px]">
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
            <Image
                alt="user's avatar"
                src={returnImageProxy(user.avatar, user?.pubkey || "")}
                width={100}
                height={100}
                className="rounded-full m-2 mt-0"
            />
            <h3 className="text-center">
                {user.username || user?.name || user?.email || "Anon"}
            </h3>
            <div className="flex flex-col gap-2 justify-center w-full overflow-hidden">
                {
                    user?.pubkey && (
                        <div className="flex flex-row gap-2 items-center w-full overflow-hidden">
                            <div className="overflow-hidden">
                                <p className="text-ellipsis overflow-hidden whitespace-nowrap">
                                    {nip19.npubEncode(user.pubkey)}
                                </p>
                            </div>
                            <Tooltip target=".pubkey-tooltip" content={"this is your account pubkey"} />
                            <i className="pi pi-question-circle pubkey-tooltip text-xs cursor-pointer shrink-0" />
                        </div>
                    )
                }
                {user?.createdAt && (
                    <p className="truncate">
                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                )}
            </div>
            <div className='w-full flex flex-row justify-between'>
                <div className="flex flex-col justify-between gap-4 my-2">
                    {user?.lightningAddress ? (
                        <h4 className="bg-gray-900 rounded-lg p-3 max-lap:w-fit min-w-[240px]">
                            <span className="font-bold">Lightning Address:</span> {user.lightningAddress.name}@plebdevs.com <i className="pi pi-copy cursor-pointer hover:text-gray-400" onClick={() => copyToClipboard(user.lightningAddress.name + "@plebdevs.com")} />
                        </h4>
                    ) : (
                        <div className="flex flex-row justify-between bg-gray-900 rounded-lg p-3 max-lap:w-fit min-w-[240px]">
                            <h4 >
                                <span className="font-bold">Lightning Address:</span> None
                            </h4>
                            {/* todo: add tooltip */}
                            <Tooltip target=".lightning-address-tooltip" content={"this is your account lightning address"} />
                            <i className="pi pi-question-circle lightning-address-tooltip text-xs cursor-pointer" />
                        </div>
                    )}
                    {user?.nip05 ? (
                        <h4 className="bg-gray-900 rounded-lg p-3 max-lap:w-fit min-w-[240px]">
                            <span className="font-bold">NIP-05:</span> {user.nip05.name}@plebdevs.com <i className="pi pi-copy cursor-pointer hover:text-gray-400" onClick={() => copyToClipboard(user.nip05.name + "@plebdevs.com")} />
                        </h4>
                    ) : (
                        <div className="flex flex-row justify-between bg-gray-900 rounded-lg p-3 max-lap:w-fit min-w-[240px]">
                            <h4>
                                <span className="font-bold">NIP-05:</span> None
                            </h4>
                            {/* todo: add tooltip */}
                            <Tooltip target=".nip05-tooltip" content={"this is your account nip05"} />
                            <i className="pi pi-question-circle nip05-tooltip text-xs cursor-pointer" />
                        </div>
                    )}
                <div className="flex flex-col justify-center min-w-[140px] px-2">
                    <button
                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-semibold"
                        onClick={() => setShowBadges(true)}
                        >
                        View Badges
                    </button>
                        </div>
                </div>
            </div>
        </div>
    );

    const DesktopProfileCard = () => (
        <div className="w-full bg-gray-800 rounded-lg p-2 py-1 border border-gray-700 shadow-md h-[330px]">
            <div className="flex flex-row w-full justify-evenly">
                <Image
                    alt="user's avatar"
                    src={returnImageProxy(user.avatar, user?.pubkey || "")}
                    width={100}
                    height={100}
                    className="rounded-full my-4"
                />
                <div className="flex flex-col gap-2 pt-4 w-fit relative">
                    <div className="absolute top-[-4px] right-[-30px]">
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
            <div className="flex flex-col justify-between gap-4 my-2">
                {user?.lightningAddress ? (
                    <h4 className="bg-gray-900 rounded-lg p-3 max-lap:w-fit min-w-[240px]">
                        <span className="font-bold">Lightning Address:</span> {user.lightningAddress.name}@plebdevs.com <i className="pi pi-copy cursor-pointer hover:text-gray-400" onClick={() => copyToClipboard(user.lightningAddress.name + "@plebdevs.com")} />
                    </h4>
                ) : (
                    <div className="flex flex-row justify-between bg-gray-900 rounded-lg p-3 max-lap:w-fit min-w-[240px]">
                        <h4 >
                            <span className="font-bold">Lightning Address:</span> None
                        </h4>
                        {/* todo: add tooltip */}
                        <Tooltip target=".lightning-address-tooltip" content={"this is your account lightning address"} />
                        <i className="pi pi-question-circle lightning-address-tooltip text-xs cursor-pointer" />
                    </div>
                )}
                {user?.nip05 ? (
                    <h4 className="bg-gray-900 rounded-lg p-3 max-lap:w-fit min-w-[240px]">
                        <span className="font-bold">NIP-05:</span> {user.nip05.name}@plebdevs.com <i className="pi pi-copy cursor-pointer hover:text-gray-400" onClick={() => copyToClipboard(user.nip05.name + "@plebdevs.com")} />
                    </h4>
                ) : (
                    <div className="flex flex-row justify-between bg-gray-900 rounded-lg p-3 max-lap:w-fit min-w-[240px]">
                        <h4>
                            <span className="font-bold">NIP-05:</span> None
                        </h4>
                        {/* todo: add tooltip */}
                        <Tooltip target=".nip05-tooltip" content={"this is your account nip05"} />
                        <i className="pi pi-question-circle nip05-tooltip text-xs cursor-pointer" />
                    </div>
                )}
                <button
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-semibold max-lap:w-fit min-w-[140px]"
                    onClick={() => setShowBadges(true)}
                >
                    View Badges
                </button>
            </div>
        </div>
    );

    // 1440px is the max-lap breakpoint from tailwind config
    return (
        <>
            {windowWidth <= 1440 ? <MobileProfileCard /> : <DesktopProfileCard />}
            <UserBadges
                visible={showBadges}
                onHide={() => setShowBadges(false)}
            />
        </>
    );
};

export default UserProfileCard;
