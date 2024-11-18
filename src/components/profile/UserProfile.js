import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Menu } from "primereact/menu";
import { Column } from "primereact/column";
import { useImageProxy } from "@/hooks/useImageProxy";
import { useSession } from 'next-auth/react';
import { ProgressSpinner } from "primereact/progressspinner";
import ProgressListItem from "@/components/content/lists/ProgressListItem";
import PurchasedListItem from "@/components/content/lists/PurchasedListItem";
import { useNDKContext } from "@/context/NDKContext";
import { formatDateTime } from "@/utils/time";
import { Tooltip } from "primereact/tooltip";
import { nip19 } from "nostr-tools";
import Image from "next/image";
import GithubContributionChart from "@/components/charts/GithubContributionChart";
import GithubContributionChartDisabled from "@/components/charts/GithubContributionChartDisabled";
import useCheckCourseProgress from "@/hooks/tracking/useCheckCourseProgress";
import useWindowWidth from "@/hooks/useWindowWidth";
import { useToast } from "@/hooks/useToast";
import UserProgress from "@/components/profile/progress/UserProgress";
import { classNames } from "primereact/utils";

const UserProfile = () => {
    const windowWidth = useWindowWidth();
    const [user, setUser] = useState(null);
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
            setUser(session.user);
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
                    {/* <GithubContributionChart username={"austinkelsay"} /> */}
                    <GithubContributionChartDisabled username={"austinkelsay"} />
                    <UserProgress />
                </div>
                {!session || !session?.user || !ndk ? (
                    <div className='w-full h-full flex items-center justify-center'><ProgressSpinner /></div>
                ) : (
                    <DataTable
                        emptyMessage="No Courses or Milestones completed"
                        value={session.user?.userCourses}
                        header={header}
                        style={{ maxWidth: windowWidth < 768 ? "100%" : "90%", margin: "0 auto", borderRadius: "10px" }}
                        pt={{
                            wrapper: {
                                className: "rounded-lg rounded-t-none"
                            },
                            header: {
                                className: "rounded-t-lg"
                            }
                        }}
                    >
                        <Column
                            field="completed"
                            header="Completed"
                            body={(rowData) => (
                                <i className={classNames('pi', { 'pi-check-circle text-green-500': rowData.completed, 'pi-times-circle text-red-500': !rowData.completed })}></i>
                            )}
                        ></Column>
                        <Column
                            body={(rowData) => {
                                return <ProgressListItem dTag={rowData.courseId} category="name" />
                            }}
                            header="Name"
                        ></Column>
                        <Column body={(rowData) => {
                            return <ProgressListItem dTag={rowData.courseId} category="lessons" />
                        }} header="Lessons"></Column>
                        <Column body={rowData => formatDateTime(rowData?.createdAt)} header="Date"></Column>
                    </DataTable>
                )}
                {session && session?.user && (
                    <DataTable
                        emptyMessage="No purchases"
                        value={session.user?.purchased}
                        header={purchasesHeader}
                        style={{ maxWidth: windowWidth < 768 ? "100%" : "90%", margin: "0 auto", borderRadius: "10px" }}
                        pt={{
                            wrapper: {
                                className: "rounded-lg rounded-t-none"
                            },
                            header: {
                                className: "rounded-t-lg mt-4"
                            }
                        }}
                    >
                        <Column field="amountPaid" header="Cost"></Column>
                        <Column
                            body={(rowData) => {
                                return <PurchasedListItem eventId={rowData?.resource?.noteId || rowData?.course?.noteId} category={rowData?.course ? "courses" : "resources"} />
                            }}
                            header="Name"
                        ></Column>
                        <Column body={session.user?.purchased?.some((item) => item.courseId) ? "course" : "resource"} header="Category"></Column>
                        <Column body={rowData => formatDateTime(rowData?.createdAt)} header="Date"></Column>
                    </DataTable>
                )}
            </div>
        )
    );
};

export default UserProfile;
