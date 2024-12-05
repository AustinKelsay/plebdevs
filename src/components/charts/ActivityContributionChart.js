import React, { useState, useCallback } from 'react';
import { Tooltip } from 'primereact/tooltip';
import { formatDateTime } from "@/utils/time";

const ActivityContributionChart = ({ session }) => {
    const [contributionData, setContributionData] = useState({});
    const [totalActivities, setTotalActivities] = useState(0);

    // Prepare activity data
    const prepareActivityData = useCallback(() => {
        if (!session?.user?.userCourses) return {};
        
        const activityData = {};
        const allActivities = [];
        
        // ... existing course activities processing ...
        session.user.userCourses.forEach(courseProgress => {
            if (courseProgress.started) {
                const startDate = new Date(courseProgress.startedAt);
                startDate.setFullYear(new Date().getFullYear());
                const date = startDate.toISOString().split('T')[0];
                activityData[date] = (activityData[date] || 0) + 1;
                allActivities.push({
                    type: 'course_started',
                    name: courseProgress.course?.name,
                    date: date
                });
            }
            // ... rest of the course processing ...
        });

        // ... existing lesson activities processing ...
        session.user.userLessons?.forEach(lessonProgress => {
            // ... lesson processing ...
        });

        setContributionData(activityData);
        setTotalActivities(Object.values(activityData).reduce((a, b) => a + b, 0));
        
        return activityData;
    }, [session]);

    // Initialize data
    React.useEffect(() => {
        prepareActivityData();
    }, [prepareActivityData]);

    const getColor = useCallback((count) => {
        if (count === 0) return 'bg-gray-100';
        if (count === 1) return 'bg-purple-300';
        if (count === 2) return 'bg-purple-400';
        if (count === 3) return 'bg-purple-600';
        return 'bg-purple-700';
    }, []);

    const generateCalendar = useCallback(() => {
        const today = new Date();
        const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        const calendar = [];
        
        // Create 7 rows for days of the week
        for (let i = 0; i < 7; i++) {
            calendar[i] = [];
        }

        // Fill in the dates
        for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
            const dateString = d.toISOString().split('T')[0];
            const activityCount = contributionData[dateString] || 0;
            calendar[d.getDay()].push({ 
                date: new Date(d), 
                count: activityCount
            });
        }

        return calendar;
    }, [contributionData]);

    const getMonthLabels = useCallback(() => {
        const today = new Date();
        const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        const months = [];
        let currentMonth = -1;
        const calendar = generateCalendar();

        for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
            const month = d.getMonth();
            if (month !== currentMonth) {
                months.push({
                    name: d.toLocaleString('default', { month: 'short' }),
                    index: calendar[0].findIndex(
                        (_, weekIndex) => calendar[0][weekIndex]?.date.getMonth() === month
                    )
                });
                currentMonth = month;
            }
        }
        return months;
    }, [generateCalendar]);

    const calendar = generateCalendar();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="mx-auto py-2 px-8 max-w-[1000px] bg-gray-800 rounded-lg">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-base font-semibold text-gray-200">
                    {totalActivities} learning activities in the last year
                </h4>
                <i className="pi pi-question-circle text-lg cursor-pointer text-gray-400 hover:text-gray-200" 
                   data-pr-tooltip="Total number of learning activities (starting/completing courses and lessons)" />
                <Tooltip target=".pi-question-circle" position="top" />
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
                                {calendar.map((row, dayIndex) => (
                                    row[weekIndex] && (
                                        <div
                                            key={`${weekIndex}-${dayIndex}`}
                                            className={`w-[13px] h-[13px] ${getColor(row[weekIndex].count)} rounded-[2px] cursor-pointer transition-colors duration-100`}
                                            title={`${row[weekIndex].date.toDateString()}: ${
                                                row[weekIndex].count > 0 
                                                    ? `${row[weekIndex].count} activit${row[weekIndex].count !== 1 ? 'ies' : 'y'}`
                                                    : 'No activities'
                                            }`}
                                        ></div>
                                    )
                                ))}
                            </div>
                        ))}
                    </div>
                    {/* Month labels */}
                    <div className="flex text-[11px] text-gray-400 h-[20px] mt-1">
                        {getMonthLabels().map((month, index) => (
                            <div
                                key={index}
                                className="absolute"
                                style={{ marginLeft: `${month.index * 15}px` }}
                            >
                                {month.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {/* Legend */}
            <div className="text-[11px] text-gray-400 flex items-center justify-end">
                <span className="mr-2">Less</span>
                <div className="flex gap-[3px]">
                    <div className="w-[13px] h-[13px] bg-gray-100 rounded-[2px]"></div>
                    <div className="w-[13px] h-[13px] bg-purple-300 rounded-[2px]"></div>
                    <div className="w-[13px] h-[13px] bg-purple-400 rounded-[2px]"></div>
                    <div className="w-[13px] h-[13px] bg-purple-600 rounded-[2px]"></div>
                    <div className="w-[13px] h-[13px] bg-purple-700 rounded-[2px]"></div>
                </div>
                <span className="ml-2">More</span>
            </div>
        </div>
    );
};

export default ActivityContributionChart;
