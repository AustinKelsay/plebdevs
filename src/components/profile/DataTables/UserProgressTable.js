import React from 'react';
import GenericDataTable from '@/components/ui/DataTables/DataTable';
import ProgressListItem from '@/components/content/lists/ProgressListItem';
import { formatDateTime } from '@/utils/time';
import { ProgressSpinner } from 'primereact/progressspinner';
import Link from 'next/link';

const UserProgressTable = ({ session, ndk }) => {
  const prepareProgressData = () => {
    if (!session?.user?.userCourses) return [];

    const progressData = [];

    // Add badge awards
    session.user.userBadges?.forEach(userBadge => {
      progressData.push({
        id: `badge-${userBadge.id}`,
        type: 'badge',
        name: userBadge.badge?.name,
        eventType: 'awarded',
        date: userBadge.awardedAt,
        courseId: userBadge.badge?.courseId,
        badgeId: userBadge.badgeId,
        noteId: userBadge.badge?.noteId,
      });
    });

    session.user.userCourses.forEach(courseProgress => {
      // Add course start entry
      if (courseProgress.started) {
        progressData.push({
          id: `${courseProgress.id}-start`,
          type: 'course',
          name: courseProgress.course?.name,
          eventType: 'started',
          date: courseProgress.startedAt,
          courseId: courseProgress.courseId,
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
          courseId: courseProgress.courseId,
        });
      }

      // Add lesson entries
      const courseLessons =
        session.user.userLessons?.filter(
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
            resourceId: lessonProgress.lesson?.resourceId,
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
            resourceId: lessonProgress.lesson?.resourceId,
          });
        }
      });
    });

    // Sort by date, most recent first
    return progressData.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const tableHeader = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold text-[#f8f8ff]">Progress</span>
    </div>
  );

  const typeTemplate = rowData => (
    <div className="flex items-center gap-2">
      <i
        className={`pi ${
          rowData.type === 'course' ? 'pi-book' : rowData.type === 'lesson' ? 'pi-file' : 'pi-star' // Badge icon
        } text-lg`}
      ></i>
      <span className="capitalize">{rowData.type}</span>
    </div>
  );

  const eventTemplate = rowData => (
    <div className="flex items-center gap-2">
      <i
        className={`pi ${
          rowData.eventType === 'started'
            ? 'pi-play'
            : rowData.eventType === 'completed'
              ? 'pi-check-circle'
              : 'pi-trophy' // Badge award icon
        } ${
          rowData.eventType === 'started'
            ? 'text-blue-500'
            : rowData.eventType === 'completed'
              ? 'text-green-500'
              : 'text-yellow-500' // Badge award color
        } text-lg`}
      ></i>
      <span className="capitalize">{rowData.eventType}</span>
    </div>
  );

  const nameTemplate = rowData => (
    <div className="flex items-center">
      {rowData.type === 'badge' ? (
        <Link
          href={`https://badges.page/a/${rowData.noteId}`}
          target="_blank"
          className="text-purple-400 hover:text-purple-300 transition-colors"
        >
          {rowData.name}
        </Link>
      ) : rowData.type === 'course' ? (
        <ProgressListItem dTag={rowData.courseId} category="name" type="course" />
      ) : (
        <ProgressListItem dTag={rowData.resourceId} category="name" type="lesson" />
      )}
    </div>
  );

  const dateTemplate = rowData => {
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

  const columns = [
    { field: 'type', header: 'Type', body: typeTemplate },
    { field: 'eventType', header: 'Event', body: eventTemplate },
    { field: 'name', header: 'Name', body: nameTemplate },
    { field: 'date', header: 'Date', body: dateTemplate },
  ];

  if (!session || !session?.user || !ndk) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <GenericDataTable
      emptyMessage="No Courses or Milestones completed"
      value={prepareProgressData()}
      header={tableHeader}
      columns={columns}
      className="mt-2 mx-2 max-lap:mx-0"
      style={{
        width: '100%',
        borderRadius: '8px',
        border: '1px solid #333',
        boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.1)',
      }}
      pt={{
        wrapper: {
          className: 'rounded-b-lg shadow-md',
        },
        header: {
          className: 'rounded-t-lg border-b border-gray-700',
        },
        th: {
          className: 'text-gray-300 font-semibold',
        },
        bodyRow: {
          className: 'border-b border-gray-700',
        },
        bodyCell: {
          className: 'text-gray-200 p-4',
        },
      }}
      stripedRows
      dataKey="id"
    >
      {/* Original Column definitions removed */}
    </GenericDataTable>
  );
};

export default UserProgressTable;
