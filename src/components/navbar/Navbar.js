import React, { useState, useRef, useEffect } from 'react';
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

// todo: Dropdown on left becomes search bar on mobile (also about and subscribe are linked in user avatart dropdown on mobile)
// MAYBE: Add a 4th button at the bottom that contains both about and subscribe
const Navbar = () => {
    const router = useRouter();
    const windowWidth = useWindowWidth();
    const navbarHeight = '60px';
    const { ndk } = useNDKContext();
    const [isHovered, setIsHovered] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const menu = useRef(null);

    // Debug Navbar mounting
    useEffect(() => {
        console.log("Navbar mounted, windowWidth:", windowWidth);
    }, [windowWidth]);

    // Lock/unlock body scroll when mobile search is shown/hidden
    useEffect(() => {
        if (showMobileSearch && windowWidth <= 600) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        
        // Cleanup effect
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showMobileSearch, windowWidth]);

    const menuItems = [
        {
            label: 'Content',
            icon: 'pi pi-play-circle',
            command: () => router.push('/content?tag=all')
        },
        {
            label: 'Feeds',
            icon: 'pi pi-comments',
            command: () => router.push('/feed?channel=global')
        },
        {
            label: 'Subscribe',
            icon: 'pi pi-star',
            command: () => router.push('/about')
        },
        {
            label: 'About',
            icon: 'pi pi-info-circle',
            command: () => router.push('/about')
        }
    ];

    return (
        <>
            <div className='w-[100vw] h-fit z-20'>
                <div className='px-10 py-8 bg-gray-800 border-t-0 border-l-0 border-r-0 rounded-none fixed z-10 w-[100vw] max-tab:px-[5%] max-mob:px-[5%] flex justify-between' style={{ height: navbarHeight }}>
                    {/* Left section */}
                    <div className='flex items-center flex-1'>
                        <div onClick={() => router.push('/')} className="flex flex-row items-center justify-center cursor-pointer">
                            <Image
                                alt="logo"
                                src="/images/plebdevs-icon.png"
                                width={50}
                                height={50}
                                className="rounded-full max-tab:hidden max-mob:hidden"
                            />
                            <h1 className="text-white text-xl font-semibold max-tab:text-2xl max-mob:text-2xl pb-1 pl-2">PlebDevs</h1>
                        </div>
                        {windowWidth > 600 ? (
                            <div 
                                className={`ml-2 p-2 cursor-pointer transition-all duration-300 flex items-center justify-center ${isHovered ? 'bg-gray-700 rounded-full' : ''}`}
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
                                onClick={(e) => menu.current.toggle(e)}
                                style={{ width: '40px', height: '40px' }}
                            >
                                <div className="flex flex-col items-center justify-center">
                                    <i className="pi pi-angle-up text-white text-base" />
                                    <i className="pi pi-angle-down text-white text-base" />
                                </div>
                            </div>
                        ) : (
                            <div 
                                className="ml-2 p-2 cursor-pointer transition-all duration-300 flex items-center justify-center hover:bg-gray-700 rounded-full"
                                onClick={() => setShowMobileSearch(!showMobileSearch)}
                                style={{ width: '40px', height: '40px' }}
                            >
                                <i className="pi pi-search text-white text-xl" />
                            </div>
                        )}
                        <Menu model={menuItems} popup ref={menu} />
                    </div>

                    {/* Center section - Search */}
                    {windowWidth > 600 && (
                        <div className="flex items-center justify-center flex-1">
                            <SearchBar isDesktopNav={true} />
                        </div>
                    )}

                    {/* Right section - User Avatar */}
                    <div className="flex items-center justify-end flex-1">
                        <UserAvatar />
                    </div>
                </div>
            </div>
            
            {/* Placeholder div with the same height as the Navbar */}
            <div style={{ height: navbarHeight }}></div>
            
            {/* Mobile Search Overlay */}
            {showMobileSearch && windowWidth <= 600 && (
                <div className="fixed inset-0 bg-gray-900 z-50 overflow-hidden navbar-mobile-search">
                    <div className="h-full">
                        <div className="sticky top-0 z-10 bg-gray-900">
                            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-700">
                                <h2 className="text-white text-2xl font-semibold">Search</h2>
                                <button 
                                    onClick={() => setShowMobileSearch(false)}
                                    className="text-white hover:text-gray-300 p-2"
                                >
                                    <i className="pi pi-times text-2xl" />
                                </button>
                            </div>
                            <div className="px-6 pt-4 pb-2">
                                <SearchBar 
                                    isMobileSearch={true} 
                                    onCloseSearch={() => setShowMobileSearch(false)} 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
