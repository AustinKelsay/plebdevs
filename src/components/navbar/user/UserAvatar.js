import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { Avatar } from 'primereact/avatar';
import { useRouter } from 'next/router';
import { useImageProxy } from '@/hooks/useImageProxy';
import GenericButton from '@/components/buttons/GenericButton';
import { Menu } from 'primereact/menu';
import useWindowWidth from '@/hooks/useWindowWidth';
import { useSession, signOut } from 'next-auth/react';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import styles from '../navbar.module.css';

const UserAvatar = () => {
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const [user, setUser] = useState(null);
    const [visible, setVisible] = useState(false);
    const [isProfile, setIsProfile] = useState(false);
    const { returnImageProxy } = useImageProxy();
    const windowWidth = useWindowWidth();
    const { isAdmin, isLoading } = useIsAdmin();
    const { data: session, status } = useSession();

    useEffect(() => {
        if (session) {
            setUser(session.user);
        }
    }, [session]);

    useEffect(() => {
        if (router.asPath === '/profile?tab=profile') {
            setIsProfile(true);
        } else {
            setIsProfile(false);
        }
    }, [router.asPath]);

    const menu = useRef(null);

    const handleLogout = async () => {
        await signOut({ redirect: false }); // Wait for the sign-out to complete
        router.push('/').then(() => window.location.reload());
    }

    let userAvatar;

    useEffect(() => {
        setIsClient(true); // Component did mount, we're client-side
    }, []);

    // If not client, render nothing or a placeholder
    if (!isClient) {
        return null; // Or return a loader/spinner/placeholder
    } else if (user && Object.keys(user).length > 0) {
        // User exists, show username or pubkey
        const displayName = user?.username || user?.email || user?.pubkey?.slice(0, 10) + '...' || "Anon";

        const items = [
            {
                label: displayName,
                items: [
                    {
                        label: 'Profile',
                        icon: 'pi pi-user',
                        command: () => router.push('/profile?tab=profile')
                    },
                    // Only show the "Create" option for admin users
                    ...(isAdmin ? [{
                        label: 'Create',
                        icon: 'pi pi-file-edit',
                        command: () => router.push('/create')
                    }] : []),
                    {
                        label: 'Logout',
                        icon: 'pi pi-power-off',
                        command: handleLogout
                    }
                ]
            }
        ];
        userAvatar = (
            <>
                <div className='flex flex-row items-center justify-between'>
                    <div onClick={(event) => menu.current.toggle(event)} className={`flex flex-row items-center justify-between cursor-pointer hover:opacity-75`}>
                        <Image
                            alt="logo"
                            src={returnImageProxy(user.avatar, user.pubkey)}
                            width={50}
                            height={50}
                            className={styles.logo}
                            style={{
                                boxShadow: isProfile ? '0 0 10px 3px rgba(255, 255, 255, 0.7)' : 'none',
                                transition: 'box-shadow 0.3s ease-in-out',
                            }}
                        />
                    </div>
                </div>
                <Menu model={items} popup ref={menu} className='w-[250px] break-words' />
            </>
        );
    } else {
        userAvatar = (
            <div className='flex flex-row items-center justify-between'>
                <GenericButton
                    label="Login"
                    icon="pi pi-user"
                    className="text-[#f8f8ff]"
                    rounded
                    onClick={() => router.push('/auth/signin')}
                    size={windowWidth < 768 ? 'small' : 'normal'}
                />
            </div>
        );
    }

    return userAvatar;
};

export default UserAvatar;
