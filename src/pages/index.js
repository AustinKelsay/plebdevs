import Head from 'next/head';
import React, { useEffect } from 'react';
import CoursesCarousel from '@/components/content/carousels/CoursesCarousel';
import WorkshopsCarousel from '@/components/content/carousels/WorkshopsCarousel';
import HeroBanner from '@/components/banner/HeroBanner';
import ResourcesCarousel from '@/components/content/carousels/ResourcesCarousel';
import { useLocalStorageWithEffect } from '@/hooks/useLocalStorage';
import axios from 'axios';

export default function Home() {
  const [contentIds, setContentIds] = useLocalStorageWithEffect('contentIds', []);

  // this is ready so now we can pass all ids into fetch hooks from loacl storage
  useEffect(() => {
    const fetchContentIds = async () => {
      try {
        const response = await axios.get('/api/content/all');
        const ids = response.data;
        setContentIds(ids);
      } catch (error) {
        console.error('Failed to fetch content IDs:', error);
      }
    };

    fetchContentIds();
  }, [setContentIds]);

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <HeroBanner />
        <CoursesCarousel />
        <WorkshopsCarousel />
        <ResourcesCarousel />
      </main>
    </>
  );
}