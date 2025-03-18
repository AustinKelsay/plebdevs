import React, { useEffect, useState, useRef } from 'react';
import useWindowWidth from '@/hooks/useWindowWidth';
import Image from 'next/image';
import { getSession, signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Avatar } from 'primereact/avatar';
import { AvatarGroup } from 'primereact/avatargroup';
import GenericButton from '../buttons/GenericButton';
import HeroImage from '../../../public/images/hero-image.png';

const HeroBanner = () => {
    const [currentTech, setCurrentTech] = useState('Bitcoin');
    const [isAnimating, setIsAnimating] = useState(false);
    const techs = ['Bitcoin', 'Lightning', 'Nostr'];
    const windowWidth = useWindowWidth();
    const router = useRouter();
    const { data: session } = useSession();
    
    const isTabView = windowWidth <= 1360;
    const isMobile = windowWidth <= 800;
    const isWideScreen = windowWidth >= 2200;
    const isSuperWideScreen = windowWidth >= 2600;

    useEffect(() => {
        const interval = setInterval(() => {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentTech(prev => {
                    const currentIndex = techs.indexOf(prev);
                    return techs[(currentIndex + 1) % techs.length];
                });
                setIsAnimating(false);
            }, 400); // Half of the interval for smooth transition
        }, 2800);

        return () => clearInterval(interval);
    }, []);

    const getColorClass = (tech) => {
        switch (tech) {
            case 'Bitcoin': return 'text-orange-400';
            case 'Lightning': return 'text-blue-500';
            case 'Nostr': return 'text-purple-400';
            default: return 'text-white';
        }
    };

    const getHeroHeight = () => {
        if (isSuperWideScreen) return 'h-[700px]';
        if (isWideScreen) return 'h-[550px]';
        if (isMobile) return 'h-[400px]';
        return 'h-[500px]';
    };

    const handleLearnToCode = async () => {
        const starterCourseUrl = '/course/naddr1qvzqqqr4xspzpueu32tp0jc47uzlcuxdgcw06m40ytu7ynpna2adnqty3e0vda6pqy88wumn8ghj7mn0wvhxcmmv9uq32amnwvaz7tmjv4kxz7fwv3sk6atn9e5k7tcpr9mhxue69uhhyetvv9ujuumwdae8gtnnda3kjctv9uq3wamnwvaz7tmjv4kxz7fwdehhxarj9e3xzmny9uq36amnwvaz7tmjv4kxz7fwd46hg6tw09mkzmrvv46zucm0d5hsz9mhwden5te0wfjkccte9ec8y6tdv9kzumn9wshszynhwden5te0dehhxarjxgcjucm0d5hszynhwden5te0dehhxarjw4jjucm0d5hsz9nhwden5te0wp6hyurvv4ex2mrp0yhxxmmd9uq3wamnwvaz7tmjv4kxz7fwv3jhvueww3hk7mrn9uqzge34xvuxvdtrx5knzcfhxgkngwpsxsknsetzxyknxe3sx43k2cfkxsurwdq68epwa?active=starter';

        // If user is already signed in, redirect directly
        if (session?.user) {
            router.push(starterCourseUrl);
            return;
        }

        // Check for stored keys
        const storedPubkey = localStorage.getItem('anonymousPubkey');
        const storedPrivkey = localStorage.getItem('anonymousPrivkey');

        if (storedPubkey && storedPrivkey) {
            // Sign in with stored keys
            const result = await signIn('anonymous', {
                pubkey: storedPubkey,
                privkey: storedPrivkey,
                redirect: false,
                callbackUrl: starterCourseUrl
            });

            if (result?.ok) {
                router.push(starterCourseUrl);
            }
        } else {
            // Proceed with anonymous sign in
            const result = await signIn('anonymous', { 
                callbackUrl: starterCourseUrl,
                redirect: false,
            });

            if (result?.ok) {
                // Wait a moment for the session to be updated
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Fetch the session
                const session = await getSession();
                
                if (session?.user?.pubkey && session?.user?.privkey) {
                    localStorage.setItem('anonymousPubkey', session.user.pubkey);
                    localStorage.setItem('anonymousPrivkey', session.user.privkey);
                    router.push('/');
                } else {
                    console.error("Session data incomplete:", session);
                }
            }
        }
    };

    return (
        <div className={`${getHeroHeight()} ${isTabView ? 'mx-0 w-full' : 'mt-4 mx-12'} relative flex justify-center items-center overflow-hidden drop-shadow-2xl rounded-lg`}>
            <Image
                src={HeroImage}
                alt="Banner"
                quality={100}
                fill
                style={{ objectFit: 'cover', transform: 'scaleX(-1)', filter: isTabView ? 'blur(1px)' : 'blur(3px)' }}
                className='opacity-90 rounded-lg'
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black via-black/20 to-transparent rounded-lg" />

            {!isTabView && (
                <div className="absolute right-0 top-auto bottom-auto w-1/2 overflow-hidden opacity-100 p-4 shadow-lg">
                    <video
                        className="w-full object-cover rounded-lg shadow-lg"
                        autoPlay
                        loop
                        muted
                        playsInline
                    >
                        <source src="https://plebdevs-bucket.nyc3.cdn.digitaloceanspaces.com/plebdevs-montage.mp4" type="video/mp4" />
                        <source src="https://plebdevs-bucket.nyc3.cdn.digitaloceanspaces.com/plebdevs-montage.webm" type="video/webm" />
                        Your browser does not support the video tag.
                    </video>
                </div>
            )}

            <div className={`absolute inset-0 flex flex-col justify-center ${isTabView ? 'items-center text-center px-4' : 'items-start pl-8'}`}>
                <h1 className={`text-4xl sm:text-4xl lg:text-6xl font-bold leading-tight mb-4 ${isTabView ? 'px-4' : 'max-w-[50%]'}`}>
                    <span className="block">Learn to code</span>
                    <span className={`block ${isTabView ? `transition-opacity duration-500 ${isAnimating ? 'opacity-0' : 'opacity-100'}` : ''}`}>
                        Build on{' '}
                        <span className={`${getColorClass(currentTech)} ${!isTabView ? `transition-opacity duration-500 ${isAnimating ? 'opacity-0' : 'opacity-100'}` : ''}`}>
                            {currentTech}
                        </span>
                    </span>
                    <span className="block">Become a dev</span>
                </h1>
                {isMobile ? (
                    <h3 className="text-[#f8f8ff] mb-6 font-semibold">
                        A one of a kind developer education, content, and community platform built on Nostr and fully Lightning integrated.
                    </h3>
                ) : (
                    <h2 className="text-[#f8f8ff] mb-6 font-semibold max-w-[42%]">
                        A one of a kind developer education, content, and community platform built on Nostr and fully Lightning integrated.
                    </h2>
                )}
                <div 
                    className="mb-6 flex flex-row hover:opacity-70 cursor-pointer"
                    onClick={() => !isMobile && window.open('https://www.udemy.com/user/austin-james-kelsay/', '_blank')}
                    style={{ cursor: isMobile ? 'default' : 'pointer' }}
                >
                    <AvatarGroup>
                        <Avatar image={"https://pbs.twimg.com/profile_images/1674493492519751680/wxuiYCJA_400x400.jpg"} size={isMobile ? "normal" : "large"} shape="circle" />
                        <Avatar image={"https://cdn.discordapp.com/avatars/823623334582681610/a19c596166584d2f51e444103255336d.png?size=1024"} size={isMobile ? "normal" : "large"} shape="circle" />
                        <Avatar image={"https://pbs.twimg.com/profile_images/1724533572537880576/WBcctRHT_400x400.jpg"} size={isMobile ? "normal" : "large"} shape="circle" />
                        <Avatar image={"https://cdn.discordapp.com/avatars/850975720872214578/37b3790a77e5c848d9489c2649420aa9.png?size=1024"} size={isMobile ? "normal" : "large"} shape="circle" />
                        <Avatar image={"https://i.nostr.build/BksqZ8QSHxr9FGj2.webp"} size={isMobile ? "normal" : "large"} shape="circle" />
                        <Avatar label="500+" shape="circle" size={isMobile ? "normal" : "large"} className={`${isMobile ? 'text-sm' : 'text-base'}`} />
                    </AvatarGroup>
                    <div className="flex flex-col justify-between my-2 ml-4">
                        <div className="flex flex-row gap-2">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <i key={index} className={`pi pi-star-fill text-yellow-500 ${isMobile ? 'text-base' : 'text-2xl'}`} />
                            ))}
                            <p className={`text-sm ${isMobile ? 'text-base' : 'text-2xl'}`}>4.87</p>
                        </div>
                        <span className={`text-sm ${isMobile ? 'text-base' : 'text-2xl'}`}>500+ students enrolled</span>
                    </div>
                </div>
                <div className="space-x-4">
                    <GenericButton
                        label="Learn To Code"
                        icon={<i className="pi pi-book pr-2 text-2xl" />}
                        rounded
                        severity="success"
                        className="border-2"
                        outlined
                        onClick={handleLearnToCode}
                    />
                </div>
            </div>
        </div>
    );
};

export default HeroBanner;
