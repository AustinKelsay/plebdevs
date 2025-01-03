import React, { useState, useEffect } from 'react';
import { ProgressBar } from 'primereact/progressbar';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { useSession, signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useBadge } from '@/hooks/badges/useBadge';
import GenericButton from '@/components/buttons/GenericButton';
import UserProgressFlow from './UserProgressFlow';
import { Tooltip } from 'primereact/tooltip';

const allTasks = [
    {
        status: 'Connect GitHub', 
        completed: false, 
        tier: 'Pleb', 
        courseId: null,
        subTasks: [
            { status: 'Connect your GitHub account', completed: false },
        ]
    },
    {
        status: 'PlebDevs Starter',
        completed: false,
        tier: 'Plebdev',
        // courseId: "f538f5c5-1a72-4804-8eb1-3f05cea64874",
        courseId: "5664e78f-c618-410d-a7cc-f3393b021fdf",
        subTasks: [
            { status: 'Complete the course', completed: false },
        ]
    },
    {
        status: 'Frontend Course',
        completed: false,
        tier: 'Frontend Dev',
        courseId: 'f73c37f4-df2e-4f7d-a838-dce568c76136',
        subTasks: [
            { status: 'Complete the course', completed: false },
            // { status: 'Select your completed project', completed: false },
        ]
    },
    {
        status: 'Backend Course',
        completed: false,
        tier: 'Backend Dev',
        courseId: 'f6825391-831c-44da-904a-9ac3d149b7be',
        subTasks: [
            { status: 'Complete the course', completed: false },
            // { status: 'Select your completed project', completed: false },
        ]
    },
];

const UserProgress = () => {
    const [progress, setProgress] = useState(0);
    const [currentTier, setCurrentTier] = useState(null);
    const [expandedItems, setExpandedItems] = useState({});
    const [completedCourses, setCompletedCourses] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const router = useRouter();
    const { data: session, update } = useSession();
    useBadge();
    
    useEffect(() => {
        if (session?.user) {
            setIsLoading(true);
            const user = session.user;
            const ids = user?.userCourses?.map(course => course?.completed ? course.courseId : null).filter(id => id !== null);
            if (ids && ids.length > 0) {
                setCompletedCourses(ids);
                generateTasks(ids);
                calculateProgress(ids);
                calculateCurrentTier(ids);
            } else {
                generateTasks([]);
                calculateProgress([]);
                calculateCurrentTier([]);
            }
            setIsLoading(false);
        }
    }, [session]);

    const generateTasks = (completedCourseIds) => {
        const updatedTasks = allTasks.map(task => {
            if (task.status === 'Connect GitHub') {
                return {
                    ...task,
                    completed: session?.account?.provider === 'github' ? true : false,
                    subTasks: task.subTasks ? task.subTasks.map(subTask => ({
                        ...subTask,
                        completed: session?.account?.provider === 'github' ? true : false
                    })) : undefined
                };
            }
            
            return {
                ...task,
                completed: task.courseId === null || completedCourseIds.includes(task.courseId),
                subTasks: task.subTasks ? task.subTasks.map(subTask => ({
                    ...subTask,
                    completed: completedCourseIds.includes(task.courseId)
                })) : undefined
            };
        });

        setTasks(updatedTasks);
    };

    const calculateProgress = (completedCourseIds) => {
        let progressValue = 0;

        if (session?.account?.provider === 'github') {
            progressValue += 25;
        }

        const remainingTasks = allTasks.slice(1);
        remainingTasks.forEach(task => {
            if (completedCourseIds.includes(task.courseId)) {
                progressValue += 25;
            }
        });

        setProgress(progressValue);
    };

    const calculateCurrentTier = (completedCourseIds) => {
        let tier = null;

        if (completedCourseIds.includes("f6825391-831c-44da-904a-9ac3d149b7be")) {
            tier = 'Backend Dev';
        } else if (completedCourseIds.includes("f73c37f4-df2e-4f7d-a838-dce568c76136")) {
            tier = 'Frontend Dev';
        } else if (completedCourseIds.includes("f6daa88a-53d6-4901-8dbd-d2203a05b7ab")) {
            tier = 'Plebdev';
        } else if (session?.account?.provider === 'github') {
            tier = 'Pleb';
        }

        setCurrentTier(tier);
    };

    const handleAccordionChange = (index, isExpanded) => {
        setExpandedItems(prev => ({
            ...prev,
            [index]: isExpanded
        }));
    };

    const handleGitHubLink = async () => {
        try {
            // If user is already signed in, we'll link the accounts
            if (session?.user) {
              const result = await signIn("github", { 
                redirect: false,
                // Pass existing user data for linking
                userId: session?.user?.id,
                pubkey: session?.user?.pubkey,
                privkey: session?.user?.privkey || null
              });
      
              if (result?.ok) {
                // Wait for session update
                await new Promise(resolve => setTimeout(resolve, 1000));
                const updatedSession = await getSession();
                if (updatedSession?.account?.provider === 'github') {
                  router.push('/'); // Accounts linked successfully
                }
              }
            } else {
              // Normal GitHub sign in
              await signIn("github");
            }
          } catch (error) {
            console.error("GitHub sign in error:", error);
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg p-4 pb-0 m-2 w-full border border-gray-700 shadow-md max-lap:mx-0">
            <div className="flex flex-row justify-between items-center">
                <h1 className="text-3xl font-bold text-white mb-2">Dev Journey</h1>
                <i className="pi pi-question-circle text-2xl cursor-pointer text-gray-200"
                    data-pr-tooltip="Track your progress from Pleb to Plebdev" />
                <Tooltip target=".pi-question-circle" position="left" />
            </div>
            <p className="text-gray-400 mb-4">Track your progress from Pleb to Plebdev</p>

            <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">Progress</span>
                <span className="text-gray-300">{progress}%</span>
            </div>
            <ProgressBar value={progress} className="h-2 mb-6" pt={{
                label: {
                    className: 'hidden'
                }
            }} />

            <div className="mb-6">
                <span className="text-white text-lg font-semibold">Current Tier: </span>
                {currentTier ? (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full">
                        {currentTier}
                    </span>
                ) : (
                    <span className="bg-gray-700 text-gray-400 px-3 py-1 rounded-full text-sm">
                        Not Started
                    </span>
                )}
            </div>

            <div className="flex max-sidebar:flex-col gap-6 mb-6">
                <div className="w-1/2 max-sidebar:w-full">
                    <ul className="space-y-6 pt-2">
                        {tasks.map((task, index) => (
                            <li key={index}>
                                <Accordion 
                                    activeIndex={expandedItems[index] ? 0 : null}
                                    onTabChange={(e) => handleAccordionChange(index, e.index === 0)}
                                >
                                    <AccordionTab
                                        header={
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center">
                                                    {task.completed ? (
                                                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                                                            <i className="pi pi-check text-white text-lg"></i>
                                                        </div>
                                                    ) : (
                                                        <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center mr-3">
                                                            <i className="pi pi-info-circle text-white text-lg"></i>
                                                        </div>
                                                    )}
                                                    <span className={`text-lg ${task.completed ? 'text-white' : 'text-gray-400'}`}>{task.status}</span>
                                                </div>
                                                <span className="bg-blue-500 text-white text-sm px-2 py-1 rounded-full w-24 text-center">
                                                    {task.tier}
                                                </span>
                                            </div>
                                        }
                                    >
                                        {task.status === 'Connect GitHub' && !task.completed && (
                                            <div className="mb-4">
                                                <GenericButton 
                                                    label="Connect GitHub"
                                                    icon="pi pi-github"
                                                    onClick={handleGitHubLink}
                                                    className="w-fit bg-[#24292e] hover:bg-[#2f363d] border border-[#f8f8ff] text-[#f8f8ff] font-semibold" 
                                                    rounded
                                                />
                                            </div>
                                        )}
                                        {task.subTasks && (
                                            <ul className="space-y-2">
                                                {task.subTasks.map((subTask, subIndex) => (
                                                    <li key={subIndex} className="flex items-center pl-[28px]">
                                                        {subTask.completed ? (
                                                            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center mr-3">
                                                                <i className="pi pi-check text-white text-sm"></i>
                                                            </div>
                                                        ) : (
                                                            <div className="w-4 h-4 bg-gray-700 rounded-full flex items-center justify-center mr-3">
                                                                <i className="pi pi-info-circle text-white text-sm"></i>
                                                            </div>
                                                        )}
                                                        <span className={`${subTask.completed ? 'text-white' : 'text-gray-400'}`}>
                                                            {subTask.status}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        {task.courseId && (
                                            <div className="mt-2 flex justify-end">
                                                <GenericButton 
                                                    icon="pi pi-external-link"
                                                    onClick={() => router.push(`/courses/${task.courseId}`)}
                                                    tooltip="View Course"
                                                    tooltipOptions={{
                                                        position: "top"
                                                    }}
                                                    outlined
                                                    size="small"
                                                />
                                            </div>
                                        )}
                                    </AccordionTab>
                                </Accordion>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="w-1/2 max-sidebar:w-full">
                    {isLoading ? (
                        <div className="h-[400px] bg-gray-800 rounded-3xl flex items-center justify-center">
                            <i className="pi pi-spin pi-spinner text-4xl text-gray-600"></i>
                        </div>
                    ) : (
                        <UserProgressFlow tasks={tasks} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProgress;
