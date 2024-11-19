import React, { useState, useCallback, useEffect } from 'react';
import { useFetchGithubCommits } from '@/hooks/githubQueries/useFetchGithubCommits';
import { Tooltip } from 'primereact/tooltip';

const GithubContributionChart = ({ username }) => {
    const [contributionData, setContributionData] = useState({});
    const [totalCommits, setTotalCommits] = useState(0);

    const handleNewCommit = useCallback(({ contributionData, totalCommits }) => {
        setContributionData(contributionData);
        setTotalCommits(totalCommits);
    }, []);

    const { data, isLoading, isFetching } = useFetchGithubCommits(username, handleNewCommit);

    // Initialize from cached data if available
    useEffect(() => {
        if (data && !isLoading) {
            setContributionData(data.contributionData);
            setTotalCommits(data.totalCommits);
        }
    }, [data, isLoading]);

    const getColor = useCallback((count) => {
        if (count === 0) return 'bg-gray-100';
        if (count < 5) return 'bg-green-300';
        if (count < 10) return 'bg-green-400';
        if (count < 20) return 'bg-green-600';
        return 'bg-green-700';
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
            const count = contributionData[dateString] || 0;
            const dayOfWeek = d.getDay();
            calendar[dayOfWeek].push({ date: new Date(d), count });
        }

        return calendar;
    }, [contributionData]);

    const calendar = generateCalendar();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getMonthLabels = useCallback(() => {
        const today = new Date();
        const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
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
        <div className="mx-auto py-4 px-8 max-w-[1000px] bg-gray-800 rounded-lg">
            {(isLoading || isFetching) && <p>Loading contribution data... ({totalCommits} commits fetched)</p>}
            {!isLoading && !isFetching && 
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-semibold text-gray-200">
                    {totalCommits} contributions in the last year
                </h3>
                <i className="pi pi-question-circle text-lg cursor-pointer text-gray-400 hover:text-gray-200" 
                   data-pr-tooltip="Total number of commits made to GitHub repositories over the last year. (may not be 100% accurate)" />
                <Tooltip target=".pi-question-circle" position="top" />
            </div>
            }
            <div className="flex">
                {/* Days of week labels */}
                <div className="flex flex-col gap-[3px] text-[11px] text-gray-400 pr-3">
                    {weekDays.map((day, index) => (
                        <div key={day} className="h-[12px] leading-[12px]">
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
                                            className={`w-[12px] h-[12px] ${getColor(row[weekIndex].count)} rounded-[2px] cursor-pointer transition-colors duration-100`}
                                            title={`${row[weekIndex].date.toDateString()}: ${row[weekIndex].count} contribution${row[weekIndex].count !== 1 ? 's' : ''}`}
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
                    <div className="w-[12px] h-[12px] bg-gray-100 rounded-[2px]"></div>
                    <div className="w-[12px] h-[12px] bg-green-300 rounded-[2px]"></div>
                    <div className="w-[12px] h-[12px] bg-green-400 rounded-[2px]"></div>
                    <div className="w-[12px] h-[12px] bg-green-600 rounded-[2px]"></div>
                    <div className="w-[12px] h-[12px] bg-green-700 rounded-[2px]"></div>
                </div>
                <span className="ml-2">More</span>
            </div>
        </div>
    );
};

export default GithubContributionChart;
