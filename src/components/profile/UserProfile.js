import React, { useRef, useState, useEffect } from "react";
import { Menu } from "primereact/menu";
import { useImageProxy } from "@/hooks/useImageProxy";
import { useSession } from 'next-auth/react';
import { useNDKContext } from "@/context/NDKContext";
import { formatDateTime } from "@/utils/time";
import { Tooltip } from "primereact/tooltip";
import { nip19 } from "nostr-tools";
import Image from "next/image";
import CombinedContributionChart from "@/components/charts/CombinedContributionChart";
import GithubContributionChart from "@/components/charts/GithubContributionChart";
import ActivityContributionChart from "@/components/charts/ActivityContributionChart";
import GithubContributionChartDisabled from "@/components/charts/GithubContributionChartDisabled";
import useCheckCourseProgress from "@/hooks/tracking/useCheckCourseProgress";
import useWindowWidth from "@/hooks/useWindowWidth";
import { useToast } from "@/hooks/useToast";
import UserProgress from "@/components/profile/progress/UserProgress";
import UserProgressTable from '@/components/profile/DataTables/UserProgressTable';
import UserPurchaseTable from '@/components/profile/DataTables/UserPurchaseTable';

const UserProfile = () => {
    const windowWidth = useWindowWidth();
    const [user, setUser] = useState(null);
    const [account, setAccount] = useState(null);
    const { data: session } = useSession();
    const { returnImageProxy } = useImageProxy();
    const { ndk, addSigner } = useNDKContext();
    const { showToast } = useToast();
    const menu = useRef(null);
    useCheckCourseProgress();

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        showToast("success", "Copied", "Copied to clipboard");
    };

    useEffect(() => {
        if (session?.user) {
            console.log("Session", session)
            setUser(session.user);

            if (session?.account) {
                setAccount(session.account);
            }
        }
    }, [session]);

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl text-900 font-bold text-[#f8f8ff]">Progress</span>
        </div>
    );

    const purchasesHeader = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl text-900 font-bold text-[#f8f8ff]">Purchases</span>
        </div>
    );

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
        user && (
            <div className="p-4">
                {
                    windowWidth < 768 && (
                        <h1 className="text-3xl font-bold mb-6">Profile</h1>
                    )
                }
                <div className="w-full flex flex-col justify-center mx-auto">
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
                    {account && account?.provider === "github" ? (
                        <CombinedContributionChart username={user.username} session={session} />
                    ) : (
                        <ActivityContributionChart session={session} />
                    )}
                    <UserProgress />
                </div>
                    <UserProgressTable
                        session={session}
                        ndk={ndk}
                        windowWidth={windowWidth}
                    />
                    <UserPurchaseTable
                        session={session}
                        windowWidth={windowWidth}
                    />
            </div>
        )
    );
};

export default UserProfile;
