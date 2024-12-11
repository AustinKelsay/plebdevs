import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { classNames } from "primereact/utils";
import ProgressListItem from "@/components/content/lists/ProgressListItem";
import { formatDateTime } from "@/utils/time";
import { ProgressSpinner } from "primereact/progressspinner";

const UserProgressTable = ({ session, ndk, windowWidth }) => {
    const prepareProgressData = () => {
        if (!session?.user?.userCourses) return [];
        
        const progressData = [];
        
        session.user.userCourses.forEach(courseProgress => {
            // Add course start entry
            if (courseProgress.started) {
                progressData.push({
                    id: `${courseProgress.id}-start`,
                    type: 'course',
                    name: courseProgress.course?.name,
                    eventType: 'started',
                    date: courseProgress.startedAt,
                    courseId: courseProgress.courseId
                });
            }
            
            // Add course completion entry
            if (courseProgress.completed) {
                progressData.push({
                    id: `${courseProgress.id}-complete`,
                    type: 'course',
                    name: courseProgress.course?.name,
                    eventType: 'completed',
                    date: courseProgress.completedAt,
                    courseId: courseProgress.courseId
                });
            }
            
            // Add lesson entries
            const courseLessons = session.user.userLessons?.filter(
                lesson => lesson.lesson?.courseId === courseProgress.courseId
            ) || [];
            
            courseLessons.forEach(lessonProgress => {
                // Add lesson start entry
                if (lessonProgress.opened) {
                    progressData.push({
                        id: `${lessonProgress.id}-start`,
                        type: 'lesson',
                        name: lessonProgress.lesson?.name,
                        eventType: 'started',
                        date: lessonProgress.openedAt,
                        courseId: courseProgress.courseId,
                        lessonId: lessonProgress.lessonId,
                        resourceId: lessonProgress.lesson?.resourceId
                    });
                }
                
                // Add lesson completion entry
                if (lessonProgress.completed) {
                    progressData.push({
                        id: `${lessonProgress.id}-complete`,
                        type: 'lesson',
                        name: lessonProgress.lesson?.name,
                        eventType: 'completed',
                        date: lessonProgress.completedAt,
                        courseId: courseProgress.courseId,
                        lessonId: lessonProgress.lessonId,
                        resourceId: lessonProgress.lesson?.resourceId
                    });
                }
            });
        });
        
        // Sort by date, most recent first
        return progressData.sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl text-900 font-bold text-[#f8f8ff]">Progress</span>
        </div>
    );

    const typeTemplate = (rowData) => (
        <div className="flex items-center gap-2">
            <i className={`pi ${rowData.type === 'course' ? 'pi-book' : 'pi-file'} text-lg`}></i>
            <span className="capitalize">{rowData.type}</span>
        </div>
    );

    const eventTemplate = (rowData) => (
        <div className="flex items-center gap-2">
            <i className={`pi ${rowData.eventType === 'started' ? 'pi-play' : 'pi-check-circle'} 
                ${rowData.eventType === 'started' ? 'text-blue-500' : 'text-green-500'} text-lg`}></i>
            <span className="capitalize">{rowData.eventType}</span>
        </div>
    );

    const nameTemplate = (rowData) => (
        <div className="flex items-center">
            {rowData.type === 'course' 
                ? <ProgressListItem dTag={rowData.courseId} category="name" type="course" />
                : <ProgressListItem dTag={rowData.resourceId} category="name" type="lesson" />
            }
        </div>
    );

    const dateTemplate = (rowData) => {
        // Adjust for timezone offset like in the contribution chart
        const date = new Date(rowData.date);
        const adjustedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        
        return (
            <div className="flex items-center gap-2">
                <i className="pi pi-calendar text-gray-400"></i>
                <span>{formatDateTime(adjustedDate)}</span>
            </div>
        );
    };

    if (!session || !session?.user || !ndk) {
        return <div className='w-full h-full flex items-center justify-center'><ProgressSpinner /></div>;
    }

    return (
        <DataTable
            emptyMessage="No Courses or Milestones completed"
            value={prepareProgressData()}
            header={header}
            style={{ maxWidth: windowWidth < 768 ? "100%" : "90%", margin: "0 auto" }}
            pt={{
                wrapper: {
                    className: "rounded-b-lg shadow-md"
                },
                header: {
                    className: "rounded-t-lg border-b border-gray-700"
                },
                th: {
                    className: "text-gray-300 font-semibold"
                },
                bodyRow: {
                    className: "border-b border-gray-700"
                },
                bodyCell: {
                    className: "text-gray-200 p-4"
                }
            }}
            stripedRows
        >
            <Column
                field="type"
                header="Type"
                body={typeTemplate}
            ></Column>
            <Column
                field="eventType"
                header="Event"
                body={eventTemplate}
            ></Column>
            <Column
                field="name"
                header="Name"
                body={nameTemplate}
            ></Column>
            <Column 
                field="date"
                body={dateTemplate}
                header="Date"
            ></Column>
        </DataTable>
    );
};

export default UserProgressTable;
