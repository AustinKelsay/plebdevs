import Head from 'next/head';
import React, { useEffect, useState, useMemo } from 'react';
import CoursesCarousel from '@/components/content/carousels/CoursesCarousel';
import VideosCarousel from '@/components/content/carousels/VideosCarousel';
import DocumentsCarousel from '@/components/content/carousels/DocumentsCarousel';
import { parseEvent, parseCourseEvent } from '@/utils/nostr';
import { useDocuments } from '@/hooks/nostr/useDocuments';
import { useVideos } from '@/hooks/nostr/useVideos';
import { useCourses } from '@/hooks/nostr/useCourses';
import { TabMenu } from 'primereact/tabmenu';
import 'primeicons/primeicons.css';
import GenericButton from '@/components/buttons/GenericButton';
import { useRouter } from 'next/router';
import HeroBanner from '@/components/banner/HeroBanner';

const TOP_CONTENT_IDS = [
  "f538f5c5-1a72-4804-8eb1-3f05cea64874", // starter course
  "f73c37f4-df2e-4f7d-a838-dce568c76136", // frontend course
  "f6825391-831c-44da-904a-9ac3d149b7be", // backend course
  "164a7d28-3677-4f68-9fbb-ce2ff5cc4684", // Review bitcoin halving code
  "16a65e26-e5d9-450f-9b98-79d539b8acb0", // NWC
  "751ba534-e13a-4ed6-8f8b-452bf482f944", // Bitcoin Core Beginner Workshop
  "91c15fc0-bb11-43b4-83e6-4b8fd3a826ac", // Node JS Backend Walkthrough
  "5bb34e83-599b-4494-9790-db2ac087baed", // Rust cheatsheet
  "67d24075-7cda-4d38-93ad-cd0ef32f13f1", // Pleb Node Template
];

const MenuTab = ({ selectedTopic, onTabChange, allTopics }) => {
    const router = useRouter();
    
    // Define the hardcoded priority items that always appear first
    const priorityItems = ['Top', 'Courses', 'Videos', 'Documents', 'Free', 'Paid'];
    // Items that should be filtered out from topics
    const blacklistedItems = ['document', 'video', 'course'];
    
    // Get dynamic topics, excluding hardcoded and blacklisted items
    const otherItems = allTopics.filter(item => 
        !priorityItems.includes(item) && 
        !blacklistedItems.includes(item)
    );
    
    // Only take the first 4 dynamic topics to keep the menu clean
    // Additional topics will be accessible through the "More" page
    const limitedOtherItems = otherItems.slice(0, 8);
    
    // Combine all menu items: priority items + up to 4 dynamic topics + More
    const allItems = [...priorityItems, ...limitedOtherItems, 'More'];

    const menuItems = allItems.map((item) => {
        let icon = 'pi pi-tag';
        if (item === 'Top') icon = 'pi pi-star';
        else if (item === 'Documents') icon = 'pi pi-file';
        else if (item === 'Videos') icon = 'pi pi-video';
        else if (item === 'Courses') icon = 'pi pi-desktop';
        else if (item === 'Free') icon = 'pi pi-lock-open';
        else if (item === 'Paid') icon = 'pi pi-lock';
        else if (item === 'More') icon = 'pi pi-ellipsis-h';

        const isMore = item === 'More';
        const path = isMore ? '/content?tag=all' : item === 'Top' ? '/' : `/content?tag=${item.toLowerCase()}`;
        
        return {
            label: (
                <GenericButton
                    className={`${selectedTopic === item ? 'bg-primary text-white' : ''}`}
                    onClick={() => {
                        onTabChange(item);
                        router.push(path);
                    }}
                    outlined={selectedTopic !== item}
                    rounded
                    size='small'
                    label={item}
                    icon={icon}
                />
            ),
            command: () => {
                onTabChange(item);
                router.push(path);
            }
        };
    });

    return (
        <div className="w-full">
            <TabMenu
                model={menuItems}
                activeIndex={allItems.indexOf(selectedTopic)}
                onTabChange={(e) => onTabChange(allItems[e.index])}
                pt={{
                    menu: { className: 'bg-transparent border-none my-2 mb-4' },
                    action: ({ context, parent }) => ({
                        className: 'cursor-pointer select-none flex items-center relative no-underline overflow-hidden border-b-2 p-2 font-bold rounded-t-lg',
                        style: { top: '2px' }
                    }),
                    menuitem: { className: 'mr-0' }
                }}
            />
        </div>
    );
}

export default function Home() {
    const router = useRouter();
    const { documents, documentsLoading } = useDocuments();
    const { videos, videosLoading } = useVideos();
    const { courses, coursesLoading } = useCourses();

    const [processedDocuments, setProcessedDocuments] = useState([]);
    const [processedVideos, setProcessedVideos] = useState([]);
    const [processedCourses, setProcessedCourses] = useState([]);
    const [allContent, setAllContent] = useState([]);
    const [allTopics, setAllTopics] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState('Top');
    const [filteredContent, setFilteredContent] = useState([]);

    useEffect(() => {
        if (documents && !documentsLoading) {
            const processedDocuments = documents.map(document => ({...parseEvent(document), type: 'document'}));
            setProcessedDocuments(processedDocuments);
        }
    }, [documents, documentsLoading]);

    useEffect(() => {
        if (videos && !videosLoading) {
            const processedVideos = videos.map(video => ({...parseEvent(video), type: 'video'}));
            setProcessedVideos(processedVideos);
        }
    }, [videos, videosLoading]);

    useEffect(() => {
        if (courses && !coursesLoading) {
            const processedCourses = courses.map(course => ({...parseCourseEvent(course), type: 'course'}));
            setProcessedCourses(processedCourses);
        }
    }, [courses, coursesLoading]);

    useEffect(() => {
        const allContent = [...processedDocuments, ...processedVideos, ...processedCourses];
        setAllContent(allContent);

        const uniqueTopics = new Set(allContent.map(item => item.topics).flat());
        const otherTopics = Array.from(uniqueTopics).filter(topic => 
            !['Top', 'Courses', 'Videos', 'Documents', 'Free', 'Paid', 'More'].includes(topic) && 
            !['document', 'video', 'course'].includes(topic)
        );
        setAllTopics(otherTopics);

        if (selectedTopic === 'Top') {
            const topContent = allContent.filter(item => TOP_CONTENT_IDS.includes(item.d));
            setFilteredContent(topContent);
        } else {
            filterContent(selectedTopic, allContent);
        }
    }, [processedDocuments, processedVideos, processedCourses, selectedTopic]);

    const filterContent = (topic, content) => {
        let filtered = content;
        if (topic !== 'Top' && topic !== 'More') {
            const topicLower = topic.toLowerCase();
            if (['courses', 'videos', 'documents'].includes(topicLower)) {
                filtered = content.filter(item => item.type === topicLower.slice(0, -1));
            } else if (topicLower === 'free') {
                filtered = content.filter(item => !item.price || Number(item.price) === 0);
            } else if (topicLower === 'paid') {
                filtered = content.filter(item => item.price && Number(item.price) > 0);
            } else {
                filtered = content.filter(item => item.topics && item.topics.includes(topicLower));
            }
        }
        setFilteredContent(filtered);
    };

    const handleTopicChange = (newTopic) => {
        setSelectedTopic(newTopic);
        if (newTopic === 'Top') {
            const topContent = allContent.filter(item => TOP_CONTENT_IDS.includes(item.d));
            setFilteredContent(topContent);
            router.push('/');
        } else if (newTopic === 'More') {
            router.push('/content?tag=all');
        } else {
            filterContent(newTopic, allContent);
            router.push(`/content?tag=${newTopic.toLowerCase()}`);
        }
    };

    return (
        <>
            <Head>
                <title>PlebDevs</title>
                <meta name="description" content="Build on Bitcoin" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main>
                <HeroBanner />
                <div className="w-full px-12">
                    <MenuTab
                        selectedTopic={selectedTopic}
                        onTabChange={handleTopicChange}
                        allTopics={allTopics}
                        className="max-w-[90%] mx-auto"
                    />
                </div>
                    <div className="w-full px-4">
                    <CoursesCarousel />
                    <VideosCarousel />
                    <DocumentsCarousel />
                    </div>
            </main>
        </>
    );
}