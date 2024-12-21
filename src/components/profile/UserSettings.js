import React, { useState, useEffect, useCallback } from "react";
import GenericButton from "@/components/buttons/GenericButton";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import UserProfileCard from "@/components/profile/UserProfileCard";
import { useSession } from 'next-auth/react';
import { useNDKContext } from "@/context/NDKContext";
import useWindowWidth from "@/hooks/useWindowWidth";
import BitcoinConnectButton from "@/components/bitcoinConnect/BitcoinConnect";
import { InputText } from "primereact/inputtext";
import { useToast } from "@/hooks/useToast";
import SubscribeModal from "@/components/profile/subscription/SubscribeModal";
import appConfig from "@/config/appConfig";
import UserRelaysTable from "@/components/profile/DataTables/UserRelaysTable";

const UserSettings = () => {
    const [user, setUser] = useState(null);
    const { ndk, userRelays, setUserRelays, reInitializeNDK } = useNDKContext();
    const { data: session } = useSession();
    const windowWidth = useWindowWidth();

    useEffect(() => {
        if (session?.user) {
            setUser(session.user);
        }
    }, [session]);

    return (
        user && (
            <div className="p-4">
                {windowWidth < 768 && (
                    <h1 className="text-3xl font-bold mb-6">Settings</h1>
                )}
                <div className="w-full flex flex-row max-lap:flex-col">
                    <div className="w-1/4 h-full max-lap:w-full">
                        <UserProfileCard user={user} />

                        {/* Lightning Info Card */}
                        <div className="bg-gray-800 rounded-lg p-4 my-4 border border-gray-700">
                            <div className="flex items-center gap-2 mb-4">
                                <i className="pi pi-bolt text-yellow-500 text-2xl"></i>
                                <h3 className="text-xl font-semibold">Lightning Wallet Connection</h3>
                            </div>
                            <p className="text-gray-400 mb-4">
                                Connect your Lightning wallet for easier payments across the platform
                            </p>
                            <BitcoinConnectButton />
                        </div>

                        {/* Subscription Modal */}
                        {user && <SubscribeModal user={user} />}
                    </div>

                    <div className="w-3/4 flex flex-col justify-center mx-auto max-lap:w-full ml-2 max-lap:ml-0">
                        <UserRelaysTable 
                            ndk={ndk}
                            userRelays={userRelays}
                            setUserRelays={setUserRelays}
                            reInitializeNDK={reInitializeNDK}
                        />
                    </div>
                </div>
            </div>
        )
    );
};

export default UserSettings;
