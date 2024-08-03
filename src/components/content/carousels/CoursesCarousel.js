import React, { useState, useEffect, use } from 'react';
import { Carousel } from 'primereact/carousel';
import { parseCourseEvent } from '@/utils/nostr';
import { useNostr } from '@/hooks/useNostr';
import CourseTemplate from '@/components/content/carousels/templates/CourseTemplate';
import TemplateSkeleton from '@/components/content/carousels/skeletons/TemplateSkeleton';
import { useNostrQueries } from '@/hooks/useNostrQueries';

const responsiveOptions = [
    {
        breakpoint: '3000px',
        numVisible: 3,
        numScroll: 1
    },
    {
        breakpoint: '1462px',
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
    const [processedCourses, setProcessedCourses] = useState([]);
    const { fetchZapsForEvents } = useNostr();
    const { courses, coursesError, zapsForEvents, refetchZapsForEvents } = useNostrQueries()

    useEffect(() => {
        if (courses && courses.length > 0) {
            refetchZapsForEvents(courses);
        }
    }, [courses]);

    useEffect(() => {
        console.log('zapsForEvents:', zapsForEvents);
    }, [zapsForEvents]);

    useEffect(() => {
        const fetch = async () => {
            try {
                if ( courses && courses.length > 0) {
                    console.log('courses:', courses);
                    // First process the courses to be ready for display
                    const processedCourses = courses.map(course => parseCourseEvent(course));

                    // Fetch zaps for all processed courses at once
                    const allZaps = await fetchZapsForEvents(processedCourses);
                    console.log('allZaps:', allZaps);

                    // Process zaps to associate them with their respective courses
                    const coursesWithZaps = processedCourses.map(course => {
                        const relevantZaps = allZaps.filter(zap => {
                            const eTagMatches = zap.tags.find(tag => tag[0] === 'e' && tag[1] === course.id);
                            const aTag = zap.tags.find(tag => tag[0] === 'a');
                            const aTagMatches = aTag && course.d === aTag[1].split(':').pop();
                            return eTagMatches || aTagMatches;
                        });
                        return {
                            ...course,
                            zaps: relevantZaps
                        };
                    });

                    setProcessedCourses(coursesWithZaps);
                } else {
                    console.log('No courses fetched or empty array returned');
                }
            } catch (error) {
                console.error('Error fetching courses:', error);
            }
        };
        fetch();
    }, [courses]);

    if (coursesError) {
        return <div>Error: {coursesError.message}</div>
    }

    return (
        <>
            <h2 className="ml-[6%] mt-4">Courses</h2>
            <div className={"min-h-[384px]"}>
                <Carousel
                    value={!processedCourses.length > 0 ? [{}, {}, {}] : [...processedCourses]}
                    numVisible={2}
                    itemTemplate={(item) => 
                        processedCourses.length > 0 ? 
                        <CourseTemplate key={item.id} course={item} /> : 
                        <TemplateSkeleton key={Math.random()} />
                    }
                    responsiveOptions={responsiveOptions} />
            </div>
        </>
    );
}
