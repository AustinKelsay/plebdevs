import React, {useEffect, useState} from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import useResponsiveImageDimensions from "@/hooks/useResponsiveImageDimensions";
import { formatTimestampToHowLongAgo } from "@/utils/time";
import { useImageProxy } from "@/hooks/useImageProxy";
import { useNostr } from "@/hooks/useNostr";

const CourseTemplate = (course) => {
    const [zaps, setZaps] = useState([]);
    const router = useRouter();
    const { returnImageProxy } = useImageProxy();
    const { width, height } = useResponsiveImageDimensions();
    const {events, fetchZapsForEvent} = useNostr();

    useEffect(() => {
        if (events && events.zaps) {
            console.log('zaps:', events.zaps);
            setZaps(events.zaps);
        } else {
            fetchZapsForEvent(course.id);
        }
    }, [events]);

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

export default CourseTemplate;