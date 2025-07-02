import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useNDKContext } from '@/context/NDKContext';
import appConfig from '@/config/appConfig';

export function useIsAdmin() {
  const { data: session, status } = useSession();
  const { ndk } = useNDKContext();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (status === 'loading') {
        setIsLoading(true);
        return;
      }

      let isSessionAdmin = false;
      let isNostrAdmin = false;

      // Check session-based admin
      if (status === 'authenticated') {
        isSessionAdmin = session?.user?.role?.admin || false;
      }

      // Check Nostr pubkey admin
      if (ndk?.signer) {
        try {
          const user = await ndk.signer.user();
          if (user?.pubkey) {
            isNostrAdmin = appConfig.nip28.adminPubkeys.includes(user.pubkey);
          }
        } catch (err) {
          console.warn('Could not get Nostr user for admin check:', err);
        }
      }

      // User is admin if they're admin by either method
      setIsAdmin(isSessionAdmin || isNostrAdmin);
      setIsLoading(false);
    };

    checkAdminStatus();
  }, [session, status, ndk]);

  return { isAdmin, isLoading };
}
