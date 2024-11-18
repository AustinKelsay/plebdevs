import React, { useRef, useState, useEffect, useCallback } from "react";
import GenericButton from "@/components/buttons/GenericButton";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Menu } from "primereact/menu";
import { useImageProxy } from "@/hooks/useImageProxy";
import { useSession } from 'next-auth/react';
import { ProgressSpinner } from "primereact/progressspinner";
import { useNDKContext } from "@/context/NDKContext";
import useWindowWidth from "@/hooks/useWindowWidth";
import Image from "next/image";
import PurchasedListItem from "@/components/content/lists/PurchasedListItem";
import { formatDateTime } from "@/utils/time";
import BitcoinConnectButton from "@/components/bitcoinConnect/BitcoinConnect";
import { Panel } from "primereact/panel";
import { nip19 } from "nostr-tools";
import { InputText } from "primereact/inputtext";
import { Tooltip } from "primereact/tooltip";
import { useToast } from "@/hooks/useToast";
import SubscribeModal from "@/components/profile/subscription/SubscribeModal";
import appConfig from "@/config/appConfig";

const UserSettings = () => {
    const [user, setUser] = useState(null);
    const [collapsed, setCollapsed] = useState(true);
    const { ndk, userRelays, setUserRelays, reInitializeNDK } = useNDKContext();
    const { data: session } = useSession();
    const { returnImageProxy } = useImageProxy();
    const menu = useRef(null);
    const windowWidth = useWindowWidth();
    const [newRelayUrl, setNewRelayUrl] = useState("");
    const { showToast } = useToast();
    const [relayStatuses, setRelayStatuses] = useState({});
    const [updateTrigger, setUpdateTrigger] = useState(0);

    useEffect(() => {
        if (session?.user) {
            setUser(session.user);
        }
    }, [session]);

    useEffect(() => {
        if (ndk) {
            updateRelayStatuses();
        }
    }, [ndk]);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        showToast("success", "Copied", "Copied to clipboard");
    };


    const updateRelayStatuses = useCallback(() => {
        // export enum NDKRelayStatus {
        //     DISCONNECTING, // 0
        //     DISCONNECTED, // 1
        //     RECONNECTING, // 2
        //     FLAPPING, // 3
        //     CONNECTING, // 4

        //     // connected states
        //     CONNECTED, // 5
        //     AUTH_REQUESTED, // 6
        //     AUTHENTICATING, // 7
        //     AUTHENTICATED, // 8
        // }
        if (ndk) {
            const statuses = {};
            ndk.pool.relays.forEach((relay, url) => {
                statuses[url] = relay.connectivity.status === 5;
            });
            setRelayStatuses(statuses);
        }
    }, [ndk]);

    // Effect for periodic polling
    useEffect(() => {
        const intervalId = setInterval(() => {
            setUpdateTrigger(prev => prev + 1);
        }, 7000); // Poll every 7 seconds

        return () => clearInterval(intervalId); // Cleanup on unmount
    }, []);

    // Effect to update on every render and when updateTrigger changes
    useEffect(() => {
        updateRelayStatuses();
    }, [updateRelayStatuses, updateTrigger]);

    const relayStatusBody = (url) => {
        const isConnected = relayStatuses[url];
        return (
            <i className={`pi ${isConnected ? 'pi-check-circle text-green-500' : 'pi-times-circle text-red-500'}`}></i>
        );
    };

    const addRelay = () => {
        if (newRelayUrl && !userRelays.includes(newRelayUrl)) {
            setUserRelays([...userRelays, newRelayUrl]);
            setNewRelayUrl("");
            reInitializeNDK();
            setCollapsed(true);
            showToast("success", "Relay added", "Relay successfully added to your list of relays.");
        }
    };

    const removeRelay = (url) => {
        if (!appConfig.defaultRelayUrls.includes(url)) {
            setUserRelays(userRelays.filter(relay => relay !== url));
            reInitializeNDK();
            setCollapsed(true);
            showToast("success", "Relay removed", "Relay successfully removed from your list of relays.");
        }
    };

    const relayActionsBody = (rowData) => {
        return (
            <div>
                {!appConfig.defaultRelayUrls.includes(rowData) ? (
                    <GenericButton
                        icon="pi pi-trash"
                        className="p-button-rounded p-button-danger p-button-text"
                        onClick={() => removeRelay(rowData)}
                    />
                ) : (
                    <>
                        <GenericButton
                            icon="pi pi-trash"
                            className="p-button-rounded p-button-danger p-button-text opacity-50"
                            onClick={() => removeRelay(rowData)}
                            tooltip="Cannot remove default relays at this time (soon ™)"
                            tooltipOptions={{ position: 'top' }}
                            style={{
                                pointerEvents: 'none',
                                cursor: 'not-allowed'
                            }}
                        />
                    </>
                )}
            </div>
        );
    };

    const PanelHeader = (options) => {
        return (
            <div className="flex flex-row justify-between px-4 py-[6px] bg-gray-800 rounded-t-lg border-b border-gray-700">
                <p className="text-[#f8f8ff] text-900 text-xl mt-2 h-fit font-bold">Relays</p>
                <GenericButton
                    onClick={options.onTogglerClick}
                    icon={options.collapsed ? "pi pi-plus" : "pi pi-minus"}
                    className="p-button-rounded p-button-success p-button-text"
                />
            </div>
        );
    };

    const header = (
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
                copyToClipboard(nip19.npubEncode(user?.pubkey));
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
                        <h1 className="text-3xl font-bold mb-6">Settings</h1>
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
                                className="pi pi-ellipsis-h text-2xl cursor-pointer user-menu-trigger"
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
                    <div className="bg-gray-800 rounded-lg p-6 shadow-lg w-1/4 mx-auto my-4 max-mob:w-full max-tab:w-full">
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex items-center gap-2">
                                <i className="pi pi-bolt text-yellow-500 text-2xl"></i>
                                <h3 className="text-xl font-semibold max-mob:text-base max-tab:text-base">
                                    Lightning Wallet Connection
                                </h3>
                            </div>
                            <p>
                                Connect your Lightning wallet for easier payments across the platform
                            </p>
                            <BitcoinConnectButton />
                        </div>
                    </div>
                    {user && (
                        <SubscribeModal user={user} />
                    )}
                </div>
                <div>
                    <Panel
                        headerTemplate={PanelHeader}
                        toggleable
                        collapsed={collapsed}
                        onToggle={(e) => setCollapsed(e.value)}
                    >
                        <div className="flex flex-row justify-between">
                            <InputText
                                placeholder="Relay URL"
                                value={newRelayUrl}
                                onChange={(e) => setNewRelayUrl(e.target.value)}
                            />
                            <GenericButton
                                label="Add"
                                severity="success"
                                className='w-fit px-4'
                                outlined
                                onClick={addRelay}
                            />
                        </div>
                    </Panel>
                    <DataTable value={userRelays}
                        pt={{
                            wrapper: {
                                className: "rounded-lg rounded-t-none"
                            },
                            header: {
                                className: "rounded-t-lg"
                            }
                        }}
                        onValueChange={() => setUpdateTrigger(prev => prev + 1)} // Trigger update when table value changes
                    >
                        <Column field={(url) => url} header="Relay URL"></Column>
                        <Column body={relayStatusBody} header="Status"></Column>
                        <Column body={relayActionsBody} header="Actions"></Column>
                    </DataTable>
                </div>
            </div>
        )
    );
};

export default UserSettings;
