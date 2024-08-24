import React, { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useToast } from '@/hooks/useToast';
import { useResourcesQuery } from '@/hooks/nostrQueries/content/useResourcesQuery';
import { useWorkshopsQuery } from '@/hooks/nostrQueries/content/useWorkshopsQuery';
import { useDraftsQuery } from '@/hooks/apiQueries/useDraftsQuery';
import axios from 'axios';
import LessonSelector from './LessonSelector';

const CourseForm = ({ draft = null }) => {
    const [title, setTitle] = useState(draft?.title || '');
    const [summary, setSummary] = useState(draft?.summary || '');
    const [isPaidCourse, setIsPaidCourse] = useState(draft?.price ? true : false);
    const [price, setPrice] = useState(draft?.price || 0);
    const [coverImage, setCoverImage] = useState(draft?.image || '');
    const [topics, setTopics] = useState(draft?.topics || ['']);
    const [lessons, setLessons] = useState(draft?.resources?.map((resource, index) => ({ ...resource, index })) || []);
    const [allContent, setAllContent] = useState([]);

    const { data: session } = useSession();
    const router = useRouter();
    const { showToast } = useToast();
    const { resources, resourcesLoading, resourcesError } = useResourcesQuery();
    const { workshops, workshopsLoading, workshopsError } = useWorkshopsQuery();
    const { drafts, draftsLoading, draftsError } = useDraftsQuery();

    useEffect(() => {
        if (!resourcesLoading && !workshopsLoading && !draftsLoading && resources && workshops && drafts) {
            setAllContent([...resources, ...workshops, ...drafts]);
        }
    }, [resources, workshops, drafts, resourcesLoading, workshopsLoading, draftsLoading]);

    const handleSubmit = async (event) => {
        event.preventDefault();
  
        try {
            // First, create the courseDraft
            const courseDraftData = {
                userId: session.user.id,
                title,
                summary,
                image: coverImage,
                price: isPaidCourse ? price : 0,
                topics,
            };

            console.log('courseDraftData', courseDraftData);

            const courseDraftResponse = await axios.post('/api/courses/drafts', courseDraftData);
            const createdCourseDraft = courseDraftResponse.data;

            // Now create all the lessonDrafts with the courseDraftId
            const createdLessonDrafts = await Promise.all(
                lessons.map(async (lessonDraft, index) => {
                    console.log('lessonDraft', lessonDraft);
                    const isResource = lessonDraft?.kind ? true : false;
                    let payload = {};
                    if (isResource) {
                        payload = {
                            courseDraftId: createdCourseDraft.id,
                            resourceId: lessonDraft.d,
                            index: index
                        };
                    } else {
                        payload = {
                            courseDraftId: createdCourseDraft.id,
                            draftId: lessonDraft.id,
                            index: index
                        };
                    }
                    
                    const response = await axios.post('/api/lessons/drafts', payload);
                    console.log('Lesson draft created:', response.data);
                    return response.data;
                })
            );

            console.log('Course draft created:', createdCourseDraft);
            console.log('Lesson drafts created:', createdLessonDrafts);

            showToast('success', 'Success', 'Course draft created successfully');
            router.push(`/course/${createdCourseDraft.id}/draft`);
        } catch (error) {
            console.error('Error creating course draft:', error);
            showToast('error', 'Error', 'Failed to create course draft');
        }
    };

    const addTopic = () => {
        setTopics([...topics, '']);
    };

    const removeTopic = (index) => {
        const updatedTopics = topics.filter((_, i) => i !== index);
        setTopics(updatedTopics);
    };

    const handleTopicChange = (index, value) => {
        const updatedTopics = topics.map((topic, i) => i === index ? value : topic);
        setTopics(updatedTopics);
    };

    if (resourcesLoading || workshopsLoading || draftsLoading) {
        return <ProgressSpinner />;
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="p-inputgroup flex-1">
                <InputText value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
            </div>
            <div className="p-inputgroup flex-1 mt-4">
                <InputText value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Summary" />
            </div>
            <div className="p-inputgroup flex-1 mt-4">
                <InputText value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="Cover Image URL" />
            </div>
            <div className="p-inputgroup flex-1 mt-8 flex-col">
                <p className="py-2">Paid Course</p>
                <InputSwitch checked={isPaidCourse} onChange={(e) => setIsPaidCourse(e.value)} />
                {isPaidCourse && (
                    <div className="p-inputgroup flex-1 py-4">
                        <InputNumber
                            value={price}
                            onValueChange={(e) => setPrice(e.value)}
                            placeholder="Price (sats)"
                            min={1}
                        />
                    </div>
                )}
            </div>
                <LessonSelector
                    isPaidCourse={isPaidCourse}
                    lessons={lessons}
                    setLessons={setLessons}
                    allContent={allContent}
                />
            <div className="mt-4 flex-col w-full">
                {topics.map((topic, index) => (
                    <div key={index} className="p-inputgroup flex-1 mt-4">
                        <InputText value={topic} onChange={(e) => handleTopicChange(index, e.target.value)} placeholder={`Topic #${index + 1}`} className="w-full" />
                        {index > 0 && (
                            <Button icon="pi pi-times" className="p-button-danger mt-2" onClick={() => removeTopic(index)} />
                        )}
                    </div>
                ))}
                <Button type="button" icon="pi pi-plus" onClick={addTopic} className="p-button-outlined mt-2" />
            </div>
            <div className="flex justify-center mt-8">
                <Button type="submit" label="Create Course Draft" className="p-button-raised p-button-success" />
            </div>
        </form>
    );
};

export default CourseForm;