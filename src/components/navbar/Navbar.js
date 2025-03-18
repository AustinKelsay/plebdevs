import React, { useState, useRef } from 'react';
import Image from 'next/image';
import UserAvatar from './user/UserAvatar';
import { Menubar } from 'primereact/menubar';
import { Menu } from 'primereact/menu';
import { useRouter } from 'next/router';
import SearchBar from '../search/SearchBar';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { useNDKContext } from '@/context/NDKContext';
import useWindowWidth from '@/hooks/useWindowWidth';

const Navbar = () => {
    const router = useRouter();
    const windowWidth = useWindowWidth();
    const navbarHeight = '60px';
    const {ndk} = useNDKContext();
    const [isHovered, setIsHovered] = useState(false);
    const menu = useRef(null);

    const menuItems = [
        {
            label: 'Content',
            icon: 'pi pi-play-circle',
            command: () => router.push('/content?tag=all')
        },
        {
            label: 'Feeds',
            icon: 'pi pi-comments',
            command: () => router.push('/feeds?channel=global')
        },
        {
            label: 'Subscribe',
            icon: 'pi pi-star',
            command: () => router.push('/subscribe')
        },
        {
            label: 'About',
            icon: 'pi pi-info-circle',
            command: () => router.push('/about')
        }
    ];

    const start = (
        <div className='flex items-center'>
            <div onClick={() => router.push('/')} className="flex flex-row items-center justify-center cursor-pointer">
                <Image
                    alt="logo"
                    src="/images/plebdevs-icon.png"
                    width={50}
                    height={50}
                    className="rounded-full mr-2 max-tab:hidden max-mob:hidden"
                />
                <h1 className="text-white text-xl font-semibold max-tab:text-2xl max-mob:text-2xl pb-1">PlebDevs</h1>
            </div>
            <div 
                className={`ml-2 p-2 cursor-pointer transition-all duration-300 flex items-center justify-center ${isHovered ? 'bg-gray-700 rounded-full' : ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={(e) => menu.current.toggle(e)}
                style={{ width: '40px', height: '40px' }}
            >
                <div className="flex flex-col items-center justify-center">
                    {/* Show hamburger menu on mobile (< 600px) and up/down arrows on larger screens */}
                    {windowWidth <= 600 ? (
                        <i className="pi pi-bars text-white text-xl" />
                    ) : (
                        <>
                            <i className="pi pi-angle-up text-white text-base" />
                            <i className="pi pi-angle-down text-white text-base" />
                        </>
                    )}
                </div>
            </div>
            <Menu model={menuItems} popup ref={menu} />
            {ndk && windowWidth > 600 && <SearchBar />}
        </div>
    );

    return (
        <>
            <div className='w-[100vw] h-fit z-20'>
                <Menubar
                    start={start}
                    end={UserAvatar}
                    className='px-6 py-8 bg-gray-800 border-t-0 border-l-0 border-r-0 rounded-none fixed z-10 w-[100vw] max-tab:px-[5%] max-mob:px-[5%]'
                    style={{ height: navbarHeight }}
                />
            </div>
            {/* Placeholder div with the same height as the Navbar */}
            <div style={{ height: navbarHeight }}></div>
        </>
    );
};

export default Navbar;
