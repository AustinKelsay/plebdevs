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
            progressData.push({
                id: courseProgress.id,
                type: 'course',
                name: courseProgress.course?.name,
                started: courseProgress.started,
                startedAt: courseProgress.startedAt,
                completed: courseProgress.completed,
                completedAt: courseProgress.completedAt,
                courseId: courseProgress.courseId
            });
            
            // Add lesson entries
            const courseLessons = session.user.userLessons?.filter(
                lesson => lesson.lesson?.courseId === courseProgress.courseId
            ) || [];
            
            courseLessons.forEach(lessonProgress => {
                progressData.push({
                    id: lessonProgress.id,
                    type: 'lesson',
                    name: lessonProgress.lesson?.name,
                    started: lessonProgress.opened,
                    startedAt: lessonProgress.openedAt,
                    completed: lessonProgress.completed,
                    completedAt: lessonProgress.completedAt,
                    courseId: courseProgress.courseId,
                    lessonId: lessonProgress.lessonId,
                    resourceId: lessonProgress.lesson?.resourceId
                });
            });
        });
        
        return progressData;
    };

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl text-900 font-bold text-[#f8f8ff]">Progress</span>
        </div>
    );

    if (!session || !session?.user || !ndk) {
        return <div className='w-full h-full flex items-center justify-center'><ProgressSpinner /></div>;
    }

    return (
        <DataTable
            emptyMessage="No Courses or Milestones completed"
            value={prepareProgressData()}
            header={header}
            style={{ maxWidth: windowWidth < 768 ? "100%" : "90%", margin: "0 auto", borderRadius: "10px" }}
            pt={{
                wrapper: {
                    className: "rounded-lg rounded-t-none"
                },
                header: {
                    className: "rounded-t-lg"
                }
            }}
        >
            <Column
                field="type"
                header="Type"
                body={(rowData) => (
                    <span>{rowData.type}</span>
                )}
            ></Column>
            <Column
                field="started"
                header="Started"
                body={(rowData) => (
                    <i className={classNames('pi', { 
                        'pi-check-circle text-blue-500': rowData.started, 
                        'pi-times-circle text-gray-500': !rowData.started 
                    })}></i>
                )}
            ></Column>
            <Column
                field="completed"
                header="Completed"
                body={(rowData) => (
                    <i className={classNames('pi', { 
                        'pi-check-circle text-green-500': rowData.completed, 
                        'pi-times-circle text-red-500': !rowData.completed 
                    })}></i>
                )}
            ></Column>
            <Column
                field="name"
                header="Name"
                body={(rowData) => (
                    rowData.type === 'course' 
                        ? <ProgressListItem dTag={rowData.courseId} category="name" type="course" />
                        : <ProgressListItem dTag={rowData.resourceId} category="name" type="lesson" />
                )}
            ></Column>
            <Column 
                body={rowData => {
                    if (rowData.completed) {
                        return formatDateTime(rowData.completedAt);
                    }
                    return formatDateTime(rowData.startedAt) || formatDateTime(rowData.createdAt);
                }} 
                header="Last Activity"
            ></Column>
        </DataTable>
    );
};

export default UserProgressTable;
