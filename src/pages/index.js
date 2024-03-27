import Head from 'next/head'
import React from 'react';
import CoursesCarousel from '@/components/content/carousels/CoursesCarousel'
import WorkshopsCarousel from '@/components/content/carousels/WorkshopsCarousel'
import HeroBanner from '@/components/banner/HeroBanner';
import ResourcesCarousel from '@/components/content/carousels/ResourcesCarousel';

export default function Home() {
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
  )
}
