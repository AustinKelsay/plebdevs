import React, { useEffect, useState, useRef } from 'react';
import useWindowWidth from '@/hooks/useWindowWidth';
import Image from 'next/image';
import { useImageProxy } from '@/hooks/useImageProxy';
import { useRouter } from 'next/router';
import { Avatar } from 'primereact/avatar';
import { AvatarGroup } from 'primereact/avatargroup';
import GenericButton from '../buttons/GenericButton';
import HeroImage from '../../../public/images/hero-image.png';
import plebdevsGuy from '../../../public/images/plebdevs-guy.png';

const HeroBanner = () => {
    const [currentTech, setCurrentTech] = useState('Bitcoin');
    const [isAnimating, setIsAnimating] = useState(false);
    const techs = ['Bitcoin', 'Lightning', 'Nostr'];
    const windowWidth = useWindowWidth();
    const router = useRouter();
    const { returnImageProxy } = useImageProxy();
    
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
        if (isSuperWideScreen) return 'h-[900px]';
        if (isWideScreen) return 'h-[700px]';
        if (isMobile) return 'h-[450px]';
        return 'h-[600px]';
    };

    return (
        <div className={`${getHeroHeight()} ${isTabView ? 'mx-0' : 'm-14'} relative flex justify-center items-center overflow-hidden drop-shadow-2xl`}>
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
                <div className="absolute right-0 top-24 bottom-0 w-1/2 overflow-hidden rounded-l-lg opacity-100 p-2 rounded-lg shadow-lg mr-2">
                    <video
                        className="w-full object-cover rounded-lg shadow-lg"
                        autoPlay
                        loop
                        muted
                        playsInline
                    >
                        <source src="https://plebdevs-bucket.nyc3.cdn.digitaloceanspaces.com/plebdevs-montage.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </div>
            )}

            <div className={`absolute inset-0 flex flex-col justify-center ${isTabView ? 'items-center text-center' : 'items-start pl-8'}`}>
                <h1 className={`text-4xl sm:text-4xl lg:text-6xl font-bold leading-tight mb-6 ${isTabView ? 'px-4' : 'max-w-[50%]'}`}>
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
                    <h3 className="text-[#f8f8ff] mb-8 font-semibold">
                        A one of a kind developer education, content, and community platform built on Nostr and fully Lightning integrated.
                    </h3>
                ) : (
                    <h2 className="text-[#f8f8ff] mb-8 font-semibold max-w-[42%]">
                        A one of a kind developer education, content, and community platform built on Nostr and fully Lightning integrated.
                    </h2>
                )}
                <div className="mb-8 flex flex-row">
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
                        label="Learn"
                        icon={<i className="pi pi-book pr-2 text-2xl" />}
                        rounded
                        severity="info"
                        className="border-2"
                        size={isMobile ? null : "large"}
                        outlined
                        onClick={() => router.push('/content?tag=all')}
                    />
                    <GenericButton
                        label="Connect"
                        icon={<i className="pi pi-users pr-2 text-2xl" />}
                        rounded
                        size={isMobile ? null : "large"}
                        severity="success"
                        className="border-2"
                        outlined
                        onClick={() => router.push('/feed?channel=global')}
                    />
                </div>
            </div>
        </div>
    );
};

export default HeroBanner;
