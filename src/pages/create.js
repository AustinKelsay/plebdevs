import React, { useState, useEffect } from 'react';
import MenuTab from '@/components/menutab/MenuTab';
import DocumentForm from '@/components/forms/document/DocumentForm';
import VideoForm from '@/components/forms/video/VideoForm';
import CourseForm from '@/components/forms/course/CourseForm';
import CombinedResourceForm from '@/components/forms/combined/CombinedResourceForm';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useRouter } from 'next/router';
import { ProgressSpinner } from 'primereact/progressspinner';

const Create = () => {
  const [activeIndex, setActiveIndex] = useState(0); // State to track the active tab index
  const { isAdmin, isLoading } = useIsAdmin();
  const router = useRouter();
  const homeItems = [
    { label: 'Document', icon: 'pi pi-file' },
    { label: 'Video', icon: 'pi pi-video' },
    { label: 'Combined', icon: 'pi pi-clone' },
    { label: 'Course', icon: 'pi pi-desktop' },
  ];

  useEffect(() => {
    if (isLoading) return;

    if (!isAdmin) {
      router.push('/');
    }
  }, [isAdmin, router, isLoading]);

  // Function to render the correct form based on the active tab
  const renderForm = () => {
    switch (homeItems[activeIndex].label) {
      case 'Course':
        return <CourseForm />;
      case 'Video':
        return <VideoForm />;
      case 'Document':
        return <DocumentForm />;
      case 'Combined':
        return <CombinedResourceForm />;
      default:
        return null;
    }
  };

  if (!isAdmin) return null;

  if (isLoading)
    return (
      <div className="w-full h-full flex items-center justify-center">
        <ProgressSpinner />
      </div>
    );

  return (
    <div className="w-full min-bottom-bar:w-[86vw] max-sidebar:w-[100vw] px-8 mx-auto my-8 flex flex-col justify-center">
      <h2 className="text-center mb-8">Create a {homeItems[activeIndex].label}</h2>
      <MenuTab items={homeItems} activeIndex={activeIndex} onTabChange={setActiveIndex} />
      {renderForm()}
    </div>
  );
};

export default Create;
