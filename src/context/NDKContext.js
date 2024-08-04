import React, { createContext, useContext, useEffect, useState } from 'react';
import NDK from "@nostr-dev-kit/ndk";

const NDKContext = createContext(null);

const relayUrls = [
    "wss://nos.lol/",
    "wss://relay.damus.io/",
    "wss://relay.snort.social/",
    "wss://relay.nostr.band/",
    "wss://nostr.mutinywallet.com/",
    "wss://relay.mutinywallet.com/",
    "wss://relay.primal.net/"
];

export const NDKProvider = ({ children }) => {
    const [ndk, setNdk] = useState(null);

    useEffect(() => {
        const instance = new NDK({ explicitRelayUrls: relayUrls });
        setNdk(instance);
    }, []);

    return (
        <NDKContext.Provider value={ndk}>
            {children}
        </NDKContext.Provider>
    );
};

export const useNDKContext = () => {
    return useContext(NDKContext);
};
