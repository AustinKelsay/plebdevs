import React, { useState, useCallback } from 'react';
import useWindowWidth from '@/hooks/useWindowWidth';
import MoreInfo from '@/components/MoreInfo';

const ActivityContributionChart = ({ session }) => {
  const [contributionData, setContributionData] = useState({});
  const [totalActivities, setTotalActivities] = useState(0);
  const windowWidth = useWindowWidth();

  // Prepare activity data
  const prepareActivityData = useCallback(() => {
    if (!session?.user?.userCourses) return {};

    const activityData = {};
    const allActivities = [];

    // Process course activities
    session.user.userCourses.forEach(courseProgress => {
      if (courseProgress.started) {
        const startDate = new Date(courseProgress.startedAt);
        const date = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000)
          .toISOString()
          .split('T')[0];
        activityData[date] = (activityData[date] || 0) + 1;
        allActivities.push({
          type: 'course_started',
          name: courseProgress.course?.name,
          date: date,
        });
      }
      if (courseProgress.completed) {
        const completeDate = new Date(courseProgress.completedAt);
        const date = new Date(completeDate.getTime() - completeDate.getTimezoneOffset() * 60000)
          .toISOString()
          .split('T')[0];
        activityData[date] = (activityData[date] || 0) + 1;
        allActivities.push({
          type: 'course_completed',
          name: courseProgress.course?.name,
          date: date,
        });
      }
    });

    // Process lesson activities
    session.user.userLessons?.forEach(lessonProgress => {
      if (lessonProgress.opened) {
        const openDate = new Date(lessonProgress.openedAt);
        const date = new Date(openDate.getTime() - openDate.getTimezoneOffset() * 60000)
          .toISOString()
          .split('T')[0];
        activityData[date] = (activityData[date] || 0) + 1;
        allActivities.push({
          type: 'lesson_started',
          name: lessonProgress.lesson?.name,
          date: date,
        });
      }
      if (lessonProgress.completed) {
        const completeDate = new Date(lessonProgress.completedAt);
        const date = new Date(completeDate.getTime() - completeDate.getTimezoneOffset() * 60000)
          .toISOString()
          .split('T')[0];
        activityData[date] = (activityData[date] || 0) + 1;
        allActivities.push({
          type: 'lesson_completed',
          name: lessonProgress.lesson?.name,
          date: date,
        });
      }
    });

    setContributionData(activityData);
    setTotalActivities(Object.values(activityData).reduce((a, b) => a + b, 0));

    return activityData;
  }, [session]);

  // Initialize data
  React.useEffect(() => {
    prepareActivityData();
  }, [prepareActivityData]);

  const getColor = useCallback(count => {
    if (count === 0) return 'bg-gray-100';
    if (count < 3) return 'bg-green-300';
    if (count < 6) return 'bg-green-400';
    if (count < 12) return 'bg-green-600';
    return 'bg-green-700';
  }, []);

  const generateCalendar = useCallback(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Calculate the start date (52 weeks + remaining days to today)
    const oneYearAgo = new Date(today);
    oneYearAgo.setDate(today.getDate() - 364);

    // Start from the first Sunday before or on oneYearAgo
    const startDate = new Date(oneYearAgo);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const calendar = [];
    for (let i = 0; i < 7; i++) {
      calendar[i] = [];
    }

    // Fill in the dates by week columns
    let currentDate = new Date(startDate);
    while (currentDate <= today) {
      const weekDay = currentDate.getDay();
      // Use local timezone date string instead of ISO string
      const dateString = currentDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
      const activityCount = contributionData[dateString] || 0;

      calendar[weekDay].push({
        date: new Date(currentDate),
        count: activityCount,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return calendar;
  }, [contributionData]);

  const getMonthLabels = useCallback(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Calculate exactly 52 weeks back
    const oneYearAgo = new Date(today);
    oneYearAgo.setDate(today.getDate() - 364);

    // Start from the first Sunday
    const startDate = new Date(oneYearAgo);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const months = [];
    let currentMonth = -1;
    const calendar = generateCalendar();

    let currentDate = new Date(startDate);
    while (currentDate <= today) {
      const month = currentDate.getMonth();
      if (month !== currentMonth) {
        months.push({
          name: currentDate.toLocaleString('default', { month: 'short' }),
          index: calendar[0].findIndex(
            (_, weekIndex) => calendar[0][weekIndex]?.date.getMonth() === month
          ),
        });
        currentMonth = month;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return months;
  }, [generateCalendar]);

  const calendar = generateCalendar();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getScaleClass = width => {
    if (width <= 800) return 'overflow-x-auto';
    if (width <= 1000) return 'scale-95 origin-top-left';
    return '';
  };

  return (
    <div className="w-full mx-2 bg-gray-800 rounded-lg border border-gray-700 shadow-md h-[330px] max-lap:mx-0">
      <div className="flex flex-row justify-between items-center p-4">
        <h1 className="text-2xl font-bold text-gray-200">Activity</h1>
        <MoreInfo
          tooltip="Total number of learning activities on the platform"
          modalTitle="Learning Activities"
          modalBody={
            <div className="space-y-4">
              <p>This chart shows your learning activities over the past year, including:</p>
              <ul className="list-disc pl-4">
                <li>Courses started and completed</li>
                <li>Lessons opened and completed</li>
              </ul>
              <p>The darker the green, the more activities completed on that day.</p>
            </div>
          }
          className="text-2xl text-gray-200"
        />
      </div>
      <div className={`${getScaleClass(windowWidth)}`}>
        <div className="min-w-[910px] p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-base font-semibold text-gray-200">
              {totalActivities} learning activities in the last year
            </h4>
          </div>
          <div className="flex">
            {/* Days of week labels */}
            <div className="flex flex-col gap-[3px] text-[11px] text-gray-400 pr-3">
              {weekDays.map((day, index) => (
                <div key={day} className="h-[13px] leading-[13px]">
                  {index % 2 === 0 && day}
                </div>
              ))}
            </div>
            <div className="flex flex-col">
              {/* Calendar grid */}
              <div className="flex gap-[3px]">
                {calendar[0].map((_, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[3px]">
                    {calendar.map(
                      (row, dayIndex) =>
                        row[weekIndex] && (
                          <div
                            key={`${weekIndex}-${dayIndex}`}
                            className={`w-[14px] h-[14px] ${getColor(row[weekIndex].count)} rounded-[2px] cursor-pointer transition-colors duration-100`}
                            title={`${row[weekIndex].date.toDateString()}: ${
                              row[weekIndex].count > 0
                                ? `${row[weekIndex].count} activit${row[weekIndex].count !== 1 ? 'ies' : 'y'}`
                                : 'No activities'
                            }`}
                          ></div>
                        )
                    )}
                  </div>
                ))}
              </div>
              {/* Month labels */}
              <div className="flex text-[11px] text-gray-400 h-[20px] mt-1 relative">
                {getMonthLabels().map((month, index) => (
                  <div key={index} className="absolute" style={{ left: `${month.index * 15}px` }}>
                    {month.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Legend */}
          <div className="text-[11px] text-gray-400 flex items-center justify-start pt-4">
            <span className="mr-2">Less</span>
            <div className="flex gap-[3px]">
              <div className="w-[14px] h-[14px] bg-gray-100 rounded-[2px]"></div>
              <div className="w-[14px] h-[14px] bg-green-300 rounded-[2px]"></div>
              <div className="w-[14px] h-[14px] bg-green-400 rounded-[2px]"></div>
              <div className="w-[14px] h-[14px] bg-green-600 rounded-[2px]"></div>
              <div className="w-[14px] h-[14px] bg-green-700 rounded-[2px]"></div>
            </div>
            <span className="ml-2">More</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityContributionChart;
