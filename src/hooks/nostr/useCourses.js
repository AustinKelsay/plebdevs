import { useState, useEffect } from 'react';
import { useNDKContext } from '@/context/NDKContext';
import { useContentIdsQuery } from '@/hooks/apiQueries/useContentIdsQuery';
import appConfig from "@/config/appConfig";

export function useCourses() {
    const [isClient, setIsClient] = useState(false);
    const [courses, setCourses] = useState();

    const [coursesLoading, setCoursesLoading] = useState(false);
    const [coursesError, setCoursesError] = useState(null);

    const { contentIds } = useContentIdsQuery()
    // const contentIds = ["f6825391-831c-44da-904a-9ac3d149b7be","f73c37f4-df2e-4f7d-a838-dce568c76136","f538f5c5-1a72-4804-8eb1-3f05cea64874","e58a42c0-c7c6-4b0e-8206-ace7df59a2b8","751ba534-e13a-4ed6-8f8b-452bf482f944","711924b4-3efe-4603-8a23-0ed42c88a63c","42f19d87-3a40-46bb-96b9-e7d31ded89bb","d084d45e-05fa-48fc-afa7-b54499f9e21e","ef588bcb-79a3-4ce9-a370-28c1dc7b604e","5bb34e83-599b-4494-9790-db2ac087baed","67d24075-7cda-4d38-93ad-cd0ef32f13f1","91c15fc0-bb11-43b4-83e6-4b8fd3a826ac","e25f3d3b-f28b-4edd-a325-380564e6db7d","558f88a6-fd1e-4482-9ae7-0f52d7fb82f0","181ed1a5-1f6b-4f68-bb5f-3c2f993f3c72","a0a7d5d2-d416-4bff-9a7f-836b51891fed","38180242-dd5c-4bae-ace4-d46b854d5b7d","5aeb5c26-0d6e-48d7-9436-11ff490a2adc","8b08d474-2ee9-4468-9976-19284c562e13","7d1c7b9b-0ad4-4199-a462-eeb936ea30c9","d607625a-81e1-4098-ba17-068ed29b05ed","e0b93cb8-ba23-4a6b-b7c9-efda9c886b7c","26fb6c60-3655-4193-998d-6e920caead68","4372a797-3565-44ab-a801-042ed5087873","18fd6bfd-fec1-4496-9871-2630b4f3d3b0","f3a61a3e-7523-43ff-9df3-7581c1436c36","b4deaa04-0c78-4526-80ec-362944fe35b6","dbc8672a-d09e-413b-a076-7b86bcc75ca6","5bba9ee9-a37b-496d-b524-e70ebd7140cc","c14bbbde-63b1-4341-a848-f67e07ee8618","e3d7ccfc-0374-46b9-98ff-5526247e13e5","164a7d28-3677-4f68-9fbb-ce2ff5cc4684","89da8522-f8dd-44e2-a49d-7be58328c9ff","03586c4c-5c4a-4bd6-b5e9-bfad02bb22c5","2c79dca4-334b-4805-9e97-fb1a27351580","93f52ce2-ebeb-445b-b698-757815ddb450","ee31bfb2-a2cd-4a31-87e1-da4f3e3c70fa","8cb1d556-df1b-4fef-a625-69c1fe1c397c","1f889e07-0fe2-4944-976d-7e602d3c1fb7","2553ed1a-d8ab-4fa5-a160-4a668a672a5e","80aac9d4-8bef-4a92-9ee9-dea1c2d66c3a","6fe3cb4b-2571-4e3b-9159-db78325ee5cc","a3083ab5-0187-4b77-83d1-29ae1f644559","e5399c72-9b95-46d6-a594-498e673b6c58","f93827ed-68ad-4b5e-af33-f7424b37f0d6","16a65e26-e5d9-450f-9b98-79d539b8acb0","8ce74cf3-bc67-4e95-83b6-a01983a1b586","6d8260b3-c902-46ec-8aed-f3b8c8f1229b"]
    const {ndk, addSigner} = useNDKContext();

    useEffect(() => {
        setIsClient(true);
    }, []);

    const hasRequiredProperties = (event, contentIds) => {
        const hasId = event.tags.some(([tag, value]) => tag === "d" && contentIds.includes(value));
        return hasId;
    };

    const fetchCoursesFromNDK = async () => {
        setCoursesLoading(true);
        setCoursesError(null);
        try {
            if (!contentIds || contentIds.length === 0) {
                setCoursesLoading(false);
                return []; // Return early if no content IDs are found
            }

            await ndk.connect();

            const filter = { kinds: [30004], authors: appConfig.authorPubkeys };
            const events = await ndk.fetchEvents(filter);

            if (events && events.size > 0) {
                const eventsArray = Array.from(events);
                const courses = eventsArray.filter(event => hasRequiredProperties(event, contentIds));
                setCoursesLoading(false);
                return courses;
            }
            setCoursesLoading(false);
            return [];
        } catch (error) {
            console.error('Error fetching courses from NDK:', error);
            setCoursesError(error);
            setCoursesLoading(false);
            return [];
        }
    };

    useEffect(() => {
        if (isClient && contentIds) {
            fetchCoursesFromNDK().then(fetchedCourses => {
                if (fetchedCourses && fetchedCourses.length > 0) {
                    setCourses(fetchedCourses);
                }
            });
        }
    }, [isClient, contentIds]);

    return { courses, coursesLoading, coursesError };
}