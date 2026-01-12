import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import CoursesCarousel from '@/components/content/carousels/CoursesCarousel';
import VideosCarousel from '@/components/content/carousels/VideosCarousel';
import DocumentsCarousel from '@/components/content/carousels/DocumentsCarousel';
import { parseEvent, parseCourseEvent } from '@/utils/nostr';
import { useDocuments } from '@/hooks/nostr/useDocuments';
import { useVideos } from '@/hooks/nostr/useVideos';
import { useCourses } from '@/hooks/nostr/useCourses';
import { TabMenu } from 'primereact/tabmenu';
import { Message } from 'primereact/message';
import { Badge } from 'primereact/badge';
import 'primeicons/primeicons.css';
import GenericButton from '@/components/buttons/GenericButton';
import { useRouter } from 'next/router';
import HeroBanner from '@/components/banner/HeroBanner';

const MenuTab = ({ selectedTopic, onTabChange, allTopics }) => {
  const router = useRouter();

  // Define the hardcoded priority items that always appear first
  const priorityItems = ['Top', 'Courses', 'Videos', 'Documents', 'Free', 'Paid'];
  // Items that should be filtered out from topics
  const blacklistedItems = ['document', 'video', 'course'];

  // Get dynamic topics, excluding hardcoded and blacklisted items
  const otherItems = allTopics.filter(
    item => !priorityItems.includes(item) && !blacklistedItems.includes(item)
  );

  // Only take the first 4 dynamic topics to keep the menu clean
  // Additional topics will be accessible through the "More" page
  const limitedOtherItems = otherItems.slice(0, 8);

  // Combine all menu items: priority items + up to 4 dynamic topics + More
  const allItems = [...priorityItems, ...limitedOtherItems, 'More'];

  const menuItems = allItems.map(item => {
    let icon = 'pi pi-tag';
    if (item === 'Top') icon = 'pi pi-star';
    else if (item === 'Documents') icon = 'pi pi-file';
    else if (item === 'Videos') icon = 'pi pi-video';
    else if (item === 'Courses') icon = 'pi pi-desktop';
    else if (item === 'Free') icon = 'pi pi-lock-open';
    else if (item === 'Paid') icon = 'pi pi-lock';
    else if (item === 'More') icon = 'pi pi-ellipsis-h';

    const isMore = item === 'More';
    const path = isMore
      ? '/content?tag=all'
      : item === 'Top'
        ? '/'
        : `/content?tag=${item.toLowerCase()}`;

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
          size="small"
          label={item}
          icon={icon}
        />
      ),
      command: () => {
        onTabChange(item);
        router.push(path);
      },
    };
  });

  return (
    <div className="w-full">
      <TabMenu
        model={menuItems}
        activeIndex={allItems.indexOf(selectedTopic)}
        onTabChange={e => onTabChange(allItems[e.index])}
        pt={{
          menu: { className: 'bg-transparent border-none my-2 py-1' },
          action: ({ context, parent }) => ({
            className:
              'cursor-pointer select-none flex items-center relative no-underline overflow-hidden border-b-2 p-2 pl-1 font-bold rounded-t-lg',
            style: { top: '2px' },
          }),
          menuitem: { className: 'mr-0' },
        }}
      />
    </div>
  );
};

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
  const bannerMessage =
    'All content is free while we build PlebDevs V2. New FREE AI course launching with the new platform as well - stay tuned!';

  useEffect(() => {
    if (documents && !documentsLoading) {
      const processedDocuments = documents.map(document => ({
        ...parseEvent(document),
        type: 'document',
      }));
      setProcessedDocuments(processedDocuments);
    }
  }, [documents, documentsLoading]);

  useEffect(() => {
    if (videos && !videosLoading) {
      const processedVideos = videos.map(video => ({ ...parseEvent(video), type: 'video' }));
      setProcessedVideos(processedVideos);
    }
  }, [videos, videosLoading]);

  useEffect(() => {
    if (courses && !coursesLoading) {
      const processedCourses = courses.map(course => ({
        ...parseCourseEvent(course),
        type: 'course',
      }));
      setProcessedCourses(processedCourses);
    }
  }, [courses, coursesLoading]);

  // Filter out topics that look like hex color codes (3 or 6 hex chars)
  const isHexColor = str => /^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(str);

  useEffect(() => {
    const allContent = [...processedDocuments, ...processedVideos, ...processedCourses];
    setAllContent(allContent);

    const uniqueTopics = new Set(allContent.map(item => item.topics).flat());
    const otherTopics = Array.from(uniqueTopics).filter(
      topic =>
        !['Top', 'Courses', 'Videos', 'Documents', 'Free', 'Paid', 'More'].includes(topic) &&
        !['document', 'video', 'course'].includes(topic) &&
        !isHexColor(topic)
    );
    setAllTopics(otherTopics);

    filterContent(selectedTopic, allContent);
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
  };

  const handleTopicChange = newTopic => {
    setSelectedTopic(newTopic);
    if (newTopic === 'More') {
      router.push('/content?tag=all');
    } else {
      filterContent(newTopic, allContent);
      router.push(newTopic === 'Top' ? '/' : `/content?tag=${newTopic.toLowerCase()}`);
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
        <div className="w-full max-w-[2800px] mx-auto px-4 md:px-12 2xl:px-16 3xl:px-20 4xl:px-24 mt-6">
            <Message
              severity="info"
              icon="pi pi-bolt"
              className="announcement-message"
              content={
                <span className="announcement-content">
                  <Badge
                    value="Limited"
                    className="announcement-badge"
                    style={{ color: '#f8f8ff' }}
                  />
                  <span className="announcement-text">{bannerMessage}</span>
                </span>
              }
            />
        </div>
        <div className="w-full max-w-[2800px] mx-auto px-4 md:px-12 2xl:px-16 3xl:px-20 4xl:px-24">
          <MenuTab
            selectedTopic={selectedTopic}
            onTabChange={handleTopicChange}
            allTopics={allTopics}
            className="w-full"
          />
        </div>
        <div className="w-full max-w-[2800px] mx-auto px-4 max-mob:px-0 2xl:px-8 3xl:px-12 4xl:px-16">
          <CoursesCarousel />
          <VideosCarousel />
          <DocumentsCarousel />
        </div>
      </main>
      <style jsx>{`
        .announcement-message {
          min-width: 320px;
          border-radius: 9999px;
          background: transparent;
          border: 1px solid rgba(96, 165, 250, 0.35);
          color: rgba(226, 232, 240, 0.95);
          box-shadow: none;
        }

        .announcement-message :global(.p-message-wrapper) {
          padding: 0.55rem 1.1rem;
          background: transparent;
        }

        .announcement-message :global(.p-message-text) {
          padding: 0;
        }

        .announcement-message :global(.p-message-icon) {
          color: rgba(147, 197, 253, 0.95);
          margin-right: 0.6rem;
        }

        .announcement-content {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.95rem;
        }

        .announcement-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 2.75rem;
          text-transform: uppercase;
          font-size: 0.7rem;
          letter-spacing: 0.08em;
          border-radius: 9999px;
          padding: 0.15rem 0.6rem;
          background: transparent !important;
          border: 1px solid rgba(96, 165, 250, 0.45) !important;
          color: #f8f8ff !important;
          font-weight: 600;
        }

        .announcement-badge :global(.p-badge) {
          color: #f8f8ff !important;
        }

        .announcement-badge :global(.p-badge .p-badge-text) {
          color: #f8f8ff !important;
        }

        .announcement-badge :global(.p-badge span) {
          color: #f8f8ff !important;
        }

        .announcement-badge :global(*) {
          color: #f8f8ff !important;
        }

        .announcement-text {
          color: inherit;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .announcement-wrapper {
            padding: 0.85rem 1.1rem;
          }

          .announcement-message {
            min-width: 260px;
          }

          .announcement-content {
            font-size: 0.85rem;
          }
        }
      `}</style>
    </>
  );
}
