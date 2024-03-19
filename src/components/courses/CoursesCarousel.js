import React, { useState, useEffect } from 'react';
import { Carousel } from 'primereact/carousel';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { useImageProxy } from '@/hooks/useImageProxy';
import { parseEvent } from '@/utils/nostr';
import { formatTimestampToHowLongAgo } from '@/utils/time';

const responsiveOptions = [
    {
        breakpoint: '1199px',
        numVisible: 3,
        numScroll: 1
    },
    {
        breakpoint: '767px',
        numVisible: 2,
        numScroll: 1
    },
    {
        breakpoint: '575px',
        numVisible: 1,
        numScroll: 1
    }
];

export default function CoursesCarousel() {
    const courses = useSelector((state) => state.events.courses);
    const [processedCourses, setProcessedCourses] = useState([]);
    const { returnImageProxy } = useImageProxy();

    const router = useRouter();

    const [screenWidth, setScreenWidth] = useState(null);

    useEffect(() => {
        // Update the state to the current window width
        setScreenWidth(window.innerWidth);

        const handleResize = () => {
            // Update the state to the new window width when it changes
            setScreenWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);

        // Remove the event listener on cleanup
        return () => window.removeEventListener('resize', handleResize);
    }, []); // The empty array ensures this effect only runs once, similar to componentDidMount


    const calculateImageDimensions = () => {
        if (screenWidth >= 1200) {
            // Large screens
            return { width: 426, height: 240 };
        } else if (screenWidth >= 768 && screenWidth < 1200) {
            // Medium screens
            return { width: 344, height: 194 };
        } else {
            // Small screens
            return { width: screenWidth - 50, height: (screenWidth - 50) * (9 / 16) };
        }
    };

    useEffect(() => {
        const processCourses = courses.map(course => {
            const { id, content, title, summary, image, published_at } = parseEvent(course);
            return { id, content, title, summary, image, published_at };
        }
        );
        setProcessedCourses(processCourses);
    }, [courses]);

    const courseTemplate = (course) => {
        const { width, height } = calculateImageDimensions();
        return (
            <div style={{width: width < 768 ? "auto" : width}} onClick={() => router.push(`/details/${course.id}`)} className="flex flex-col items-center mx-auto px-4 cursor-pointer mt-8 rounded-md shadow-lg">
                <div style={{maxWidth: width, minWidth: width}} className="max-tab:h-auto max-mob:h-auto">
                    <Image
                        alt="resource thumbnail"
                        src={returnImageProxy(course.image)}
                        quality={100}
                        width={width}
                        height={height}
                        className="w-full h-full object-cover object-center rounded-md"
                    />
                    <div className='flex flex-col justify-start'>
                        <h4 className="mb-1 font-bold text-2xl font-blinker">{course.title}</h4>
                        <p style={{
                            display: '-webkit-box',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'prewrap',
                            font: '400 1rem/1.5 Blinker, sans-serif'
                        }}>
                            {course.summary}
                        </p>
                        <p className="text-sm mt-1 text-gray-400">Published: {formatTimestampToHowLongAgo(course.published_at)}</p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <h1 className="text-2xl ml-[6%] mt-4">courses</h1>
            <Carousel value={processedCourses} numVisible={2} itemTemplate={courseTemplate} responsiveOptions={responsiveOptions} />
        </>
    );
}
