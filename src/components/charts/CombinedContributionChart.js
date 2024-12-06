import React, { useState, useCallback, useEffect } from 'react';
import { useFetchGithubCommits } from '@/hooks/githubQueries/useFetchGithubCommits';
import { Tooltip } from 'primereact/tooltip';
import { formatDateTime } from "@/utils/time";

const CombinedContributionChart = ({ username, session }) => {
    const [contributionData, setContributionData] = useState({});
    const [totalContributions, setTotalContributions] = useState(0);

    const prepareProgressData = useCallback(() => {
        if (!session?.user?.userCourses) return {};
        
        const activityData = {};
        const allActivities = [];  // Array to store all activities for logging
        
        // Process course activities
        session.user.userCourses.forEach(courseProgress => {
            if (courseProgress.started) {
                const startDate = new Date(courseProgress.startedAt);
                const date = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000)
                    .toLocaleDateString('en-CA');
                activityData[date] = (activityData[date] || 0) + 1;
                allActivities.push({
                    type: 'course_started',
                    name: courseProgress.course?.name,
                    date: date
                });
            }
            if (courseProgress.completed) {
                const completeDate = new Date(courseProgress.completedAt);
                const date = new Date(completeDate.getTime() - completeDate.getTimezoneOffset() * 60000)
                    .toLocaleDateString('en-CA');
                activityData[date] = (activityData[date] || 0) + 1;
                allActivities.push({
                    type: 'course_completed',
                    name: courseProgress.course?.name,
                    date: date
                });
            }
        });

        // Process lesson activities
        session.user.userLessons?.forEach(lessonProgress => {
            if (lessonProgress.opened) {
                const openDate = new Date(lessonProgress.openedAt);
                const date = new Date(openDate.getTime() - openDate.getTimezoneOffset() * 60000)
                    .toLocaleDateString('en-CA');
                activityData[date] = (activityData[date] || 0) + 1;
                allActivities.push({
                    type: 'lesson_started',
                    name: lessonProgress.lesson?.name,
                    date: date
                });
            }
            if (lessonProgress.completed) {
                const completeDate = new Date(lessonProgress.completedAt);
                const date = new Date(completeDate.getTime() - completeDate.getTimezoneOffset() * 60000)
                    .toLocaleDateString('en-CA');
                activityData[date] = (activityData[date] || 0) + 1;
                allActivities.push({
                    type: 'lesson_completed',
                    name: lessonProgress.lesson?.name,
                    date: date
                });
            }
        });

        console.log('All Learning Activities:', allActivities);
        console.log('Activities by Date:', activityData);

        return activityData;
    }, [session]);

    const handleNewCommit = useCallback(({ contributionData, totalCommits }) => {
        const activityData = prepareProgressData();
        console.log("GitHub Contribution Data:", contributionData);
        
        // Create a new object with GitHub commits
        const combinedData = { ...contributionData };
        
        // Add activities to the combined data
        Object.entries(activityData).forEach(([date, count]) => {
            combinedData[date] = (combinedData[date] || 0) + count;
        });
        
        console.log("Combined Data:", combinedData);
        setContributionData(combinedData);
        setTotalContributions(totalCommits + Object.values(activityData).reduce((a, b) => a + b, 0));
    }, [prepareProgressData]);

    const { data, isLoading, isFetching } = useFetchGithubCommits(username, handleNewCommit);

    // Initialize from cached data if available
    useEffect(() => {
        if (data && !isLoading) {
            const activityData = prepareProgressData();
            const combinedData = { ...data.contributionData };
            
            // Add activities to the combined data
            Object.entries(activityData).forEach(([date, count]) => {
                combinedData[date] = (combinedData[date] || 0) + count;
            });
            
            setContributionData(combinedData);
            setTotalContributions(data.totalCommits + Object.values(activityData).reduce((a, b) => a + b, 0));
        }
    }, [data, isLoading, prepareProgressData]);

    const getColor = useCallback((count) => {
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
        oneYearAgo.setDate(today.getDate() - 364); // 52 weeks * 7 days = 364 days
        
        // Start from the first Sunday before or on oneYearAgo
        const startDate = new Date(oneYearAgo);
        startDate.setDate(startDate.getDate() - startDate.getDay());
        
        const calendar = [];
        // Create 7 rows for days of the week (Sunday to Saturday)
        for (let i = 0; i < 7; i++) {
            calendar[i] = [];
        }

        // Fill in the dates by week columns
        let currentDate = new Date(startDate);
        while (currentDate <= today) {
            const weekDay = currentDate.getDay();
            const dateString = currentDate.toLocaleDateString('en-CA');
            const githubCount = data?.contributionData[dateString] || 0;
            const activityCount = (contributionData[dateString] || 0) - (data?.contributionData[dateString] || 0);
            const totalCount = githubCount + activityCount;
            
            calendar[weekDay].push({
                date: new Date(currentDate),
                count: totalCount,
                githubCount,
                activityCount
            });
            
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return calendar;
    }, [contributionData, data?.contributionData]);

    const calendar = generateCalendar();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getMonthLabels = useCallback(() => {
        const today = new Date();
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        oneYearAgo.setDate(today.getDate() + 1);
        const months = [];
        let currentMonth = -1;

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
    }, [calendar]);

    return (
        <div className="mx-auto py-2 px-8 max-w-[1000px] bg-gray-800 rounded-lg">
            {(isLoading || isFetching) && <p>Loading contribution data... ({totalContributions} total contributions / activities fetched)</p>}
            {!isLoading && !isFetching && 
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-base font-semibold text-gray-200">
                    {totalContributions} total contributions / activities in the last year
                </h4>
                <i className="pi pi-question-circle text-lg cursor-pointer text-gray-400 hover:text-gray-200" 
                   data-pr-tooltip="Combined total of GitHub commits and learning activities (starting/completing courses and lessons)" />
                <Tooltip target=".pi-question-circle" position="top" />
            </div>
            }
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
                                                [
                                                    row[weekIndex].githubCount > 0 ? `${row[weekIndex].githubCount} contribution${row[weekIndex].githubCount !== 1 ? 's' : ''}` : '',
                                                    row[weekIndex].activityCount > 0 ? `${row[weekIndex].activityCount} activit${row[weekIndex].activityCount !== 1 ? 'ies' : 'y'}` : ''
                                                ].filter(Boolean).join(' & ') || 'No contributions or activities'
                                            }`}
                                        ></div>
                                    )
                                ))}
                            </div>
                        ))}
                    </div>
                    {/* Month labels moved to bottom */}
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
            <div className="text-[11px] text-gray-400 flex items-center justify-end">
                <span className="mr-2">Less</span>
                <div className="flex gap-[3px]">
                    <div className="w-[13px] h-[13px] bg-gray-100 rounded-[2px]"></div>
                    <div className="w-[13px] h-[13px] bg-green-300 rounded-[2px]"></div>
                    <div className="w-[13px] h-[13px] bg-green-400 rounded-[2px]"></div>
                    <div className="w-[13px] h-[13px] bg-green-600 rounded-[2px]"></div>
                    <div className="w-[13px] h-[13px] bg-green-700 rounded-[2px]"></div>
                </div>
                <span className="ml-2">More</span>
            </div>
        </div>
    );
};

export default CombinedContributionChart;
