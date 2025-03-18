import React, { useState, useEffect, use } from 'react';
import { Carousel } from 'primereact/carousel';
import { parseCourseEvent } from '@/utils/nostr';
import { CourseTemplate } from '@/components/content/carousels/templates/CourseTemplate';
import TemplateSkeleton from '@/components/content/carousels/skeletons/TemplateSkeleton';
import { useCourses } from '@/hooks/nostr/useCourses';
import useWindowWidth from '@/hooks/useWindowWidth';
import { Divider } from 'primereact/divider';
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
    const { courses, coursesLoading, coursesError } = useCourses()
    const windowWidth = useWindowWidth();
    const isMobileView = windowWidth <= 450;

    useEffect(() => {
        const fetch = async () => {
            try {
                if (courses && courses.length > 0) {
                    const processedCourses = courses.map(course => parseCourseEvent(course));
                    
                    // Sort courses by created_at in descending order (most recent first)
                    const sortedCourses = processedCourses.sort((a, b) => b.created_at - a.created_at);

                    setProcessedCourses(sortedCourses);
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
            <h3 className={`ml-[3%] mt-4 max-mob:text-2xl max-tab:ml-10 max-mob:ml-5`}>Courses</h3>
            <Divider className='w-[95%] mx-auto max-tab:hidden max-mob:w-[100%]' />
            <div className={"min-h-[384px]"}>
                <Carousel
                    value={coursesLoading || !processedCourses.length ? [{}, {}, {}] : [...processedCourses]}
                    numVisible={2}
                    pt={{
                        previousButton: {
                            className: 'm-0'
                        },
                        nextButton: {
                            className: 'm-0'
                        }
                    }}
                    itemTemplate={(item) => 
                        !processedCourses.length ? 
                        <TemplateSkeleton key={Math.random()} /> : 
                        <CourseTemplate key={item.id} course={item} showMetaTags={false} />
                    }
                    responsiveOptions={responsiveOptions} />
            </div>
        </>
    );
}
