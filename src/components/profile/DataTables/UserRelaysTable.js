import React, { useState, useEffect, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import GenericButton from "@/components/buttons/GenericButton";
import { useToast } from "@/hooks/useToast";
import appConfig from "@/config/appConfig";

const UserRelaysTable = ({ ndk, userRelays, setUserRelays, reInitializeNDK }) => {
    const [collapsed, setCollapsed] = useState(true);
    const [newRelayUrl, setNewRelayUrl] = useState("");
    const { showToast } = useToast();
    const [relayStatuses, setRelayStatuses] = useState({});
    const [updateTrigger, setUpdateTrigger] = useState(0);

    const updateRelayStatuses = useCallback(() => {
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
        }, 7000);
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        updateRelayStatuses();
    }, [updateRelayStatuses, updateTrigger]);

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

    const header = (
        <div className="text-[#f8f8ff]">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">Relays</h2>
                    <p className="text-gray-400">Manage your connected relays</p>
                </div>
                <GenericButton
                    icon="pi pi-plus"
                    label="Add Relay"
                    severity="success"
                    onClick={() => setCollapsed(!collapsed)}
                />
            </div>

            {!collapsed && (
                <div className="flex gap-2 mt-4">
                    <InputText
                        placeholder="Relay URL"
                        value={newRelayUrl}
                        onChange={(e) => setNewRelayUrl(e.target.value)}
                        className="flex-1"
                    />
                    <GenericButton
                        label="Add"
                        severity="success"
                        outlined
                        onClick={addRelay}
                    />
                </div>
            )}
        </div>
    );

    const relayStatusBody = (url) => {
        const isConnected = relayStatuses[url];
        return (
            <i className={`pi ${isConnected ? 'pi-check-circle text-green-500' : 'pi-times-circle text-red-500'}`}></i>
        );
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
                )}
            </div>
        );
    };

    return (
        <div className="bg-gray-800 rounded-lg border border-gray-700">
            <DataTable
                value={userRelays}
                className="border-none"
                header={header}
            >
                <Column field={(url) => url} header="Relay URL"></Column>
                <Column body={relayStatusBody} header="Status"></Column>
                <Column body={relayActionsBody} header="Actions"></Column>
            </DataTable>
        </div>
    );
};

export default UserRelaysTable; 