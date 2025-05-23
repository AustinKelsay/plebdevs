import React, { useState, useEffect } from 'react';
import { ProgressBar } from 'primereact/progressbar';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { useSession, signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useBadge } from '@/hooks/badges/useBadge';
import GenericButton from '@/components/buttons/GenericButton';
import UserProgressFlow from './UserProgressFlow';
import RepoSelector from '@/components/profile/RepoSelector';
import MoreInfo from '@/components/MoreInfo';

const allTasks = [
  {
    status: 'Connect GitHub',
    completed: false,
    tier: 'Pleb',
    courseId: null,
    subTasks: [{ status: 'Connect your GitHub account', completed: false }],
  },
  {
    status: 'PlebDevs Starter',
    completed: false,
    tier: 'Plebdev',
    courseId: 'f538f5c5-1a72-4804-8eb1-3f05cea64874',
    courseNAddress:
      'naddr1qvzqqqr4xspzpueu32tp0jc47uzlcuxdgcw06m40ytu7ynpna2adnqty3e0vda6pqy88wumn8ghj7mn0wvhxcmmv9uq32amnwvaz7tmjv4kxz7fwv3sk6atn9e5k7tcpr9mhxue69uhhyetvv9ujuumwdae8gtnnda3kjctv9uq3wamnwvaz7tmjv4kxz7fwdehhxarj9e3xzmny9uq36amnwvaz7tmjv4kxz7fwd46hg6tw09mkzmrvv46zucm0d5hsz9mhwden5te0wfjkccte9ec8y6tdv9kzumn9wshszynhwden5te0dehhxarjxgcjucm0d5hszynhwden5te0dehhxarjw4jjucm0d5hsz9nhwden5te0wp6hyurvv4ex2mrp0yhxxmmd9uq3wamnwvaz7tmjv4kxz7fwv3jhvueww3hk7mrn9uqzge34xvuxvdtrx5knzcfhxgkngwpsxsknsetzxyknxe3sx43k2cfkxsurwdq68epwa',
    subTasks: [{ status: 'Complete the course', completed: false }],
  },
  {
    status: 'Frontend Course',
    completed: false,
    tier: 'Frontend Dev',
    courseId: 'f73c37f4-df2e-4f7d-a838-dce568c76136',
    courseNAddress:
      'naddr1qvzqqqr4xspzpueu32tp0jc47uzlcuxdgcw06m40ytu7ynpna2adnqty3e0vda6pqy88wumn8ghj7mn0wvhxcmmv9uq32amnwvaz7tmjv4kxz7fwv3sk6atn9e5k7tcpr9mhxue69uhhyetvv9ujuumwdae8gtnnda3kjctv9uq3wamnwvaz7tmjv4kxz7fwdehhxarj9e3xzmny9uq36amnwvaz7tmjv4kxz7fwd46hg6tw09mkzmrvv46zucm0d5hsz9mhwden5te0wfjkccte9ec8y6tdv9kzumn9wshszynhwden5te0dehhxarjxgcjucm0d5hszynhwden5te0dehhxarjw4jjucm0d5hsz9nhwden5te0wp6hyurvv4ex2mrp0yhxxmmd9uq3wamnwvaz7tmjv4kxz7fwv3jhvueww3hk7mrn9uqzge3hxd3nxdmxxskkge3jv5knge3hvskkzwpn8qkkgcm9x5mrscehxccnxdsc53n8w',
    subTasks: [
      { status: 'Complete the course', completed: false },
      { status: 'Submit your project repository', completed: false },
    ],
  },
  {
    status: 'Backend Course',
    completed: false,
    tier: 'Backend Dev',
    courseId: 'f6825391-831c-44da-904a-9ac3d149b7be',
    courseNAddress:
      'naddr1qvzqqqr4xspzpueu32tp0jc47uzlcuxdgcw06m40ytu7ynpna2adnqty3e0vda6pqy88wumn8ghj7mn0wvhxcmmv9uq32amnwvaz7tmjv4kxz7fwv3sk6atn9e5k7tcpr9mhxue69uhhyetvv9ujuumwdae8gtnnda3kjctv9uq3wamnwvaz7tmjv4kxz7fwdehhxarj9e3xzmny9uq36amnwvaz7tmjv4kxz7fwd46hg6tw09mkzmrvv46zucm0d5hsz9mhwden5te0wfjkccte9ec8y6tdv9kzumn9wshszynhwden5te0dehhxarjxgcjucm0d5hszynhwden5te0dehhxarjw4jjucm0d5hsz9nhwden5te0wp6hyurvv4ex2mrp0yhxxmmd9uq3wamnwvaz7tmjv4kxz7fwv3jhvueww3hk7mrn9uqzge3k8qer2veexyknsve3vvkngdryvyknjvp5vyknjctrxdjrzdpevgmkyegqyn0ns',
    subTasks: [
      { status: 'Complete the course', completed: false },
      { status: 'Submit your project repository', completed: false },
    ],
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
      const ids = user?.userCourses
        ?.map(course => (course?.completed ? course.courseId : null))
        .filter(id => id !== null);
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

  const generateTasks = completedCourseIds => {
    const updatedTasks = allTasks.map(task => {
      if (task.status === 'Connect GitHub') {
        const isGithubConnected = session?.account?.provider === 'github';
        return {
          ...task,
          completed: isGithubConnected,
          subTasks: task.subTasks.map(subTask => ({
            ...subTask,
            completed: isGithubConnected,
          })),
        };
      }

      // For course tasks
      const userCourse = session?.user?.userCourses?.find(uc => uc.courseId === task.courseId);
      const courseCompleted = completedCourseIds.includes(task.courseId);
      const repoSubmitted = userCourse?.submittedRepoLink ? true : false;

      const updatedSubTasks = task.subTasks.map(subTask => {
        let isSubTaskActuallyCompleted = false;
        if (subTask.status.includes('Complete the course')) {
          isSubTaskActuallyCompleted = courseCompleted;
        } else if (subTask.status.includes('Submit your project repository')) {
          isSubTaskActuallyCompleted = repoSubmitted;
        }
        // Add more conditions here if other types of subtasks exist in the future
        return { ...subTask, completed: isSubTaskActuallyCompleted };
      });

      // A task is considered complete if all of its subtasks are complete.
      const taskOverallCompleted = updatedSubTasks.every(st => st.completed);

      return {
        ...task,
        completed: taskOverallCompleted,
        subTasks: updatedSubTasks,
      };
    });

    setTasks(updatedTasks);
  };

  const calculateProgress = completedCourseIds => {
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

  const calculateCurrentTier = completedCourseIds => {
    let tier = null;

    if (completedCourseIds.includes('f6825391-831c-44da-904a-9ac3d149b7be')) {
      tier = 'Backend Dev';
    } else if (completedCourseIds.includes('f73c37f4-df2e-4f7d-a838-dce568c76136')) {
      tier = 'Frontend Dev';
    } else if (completedCourseIds.includes('f6daa88a-53d6-4901-8dbd-d2203a05b7ab')) {
      tier = 'Plebdev';
    } else if (session?.account?.provider === 'github') {
      tier = 'Pleb';
    }

    setCurrentTier(tier);
  };

  const handleAccordionChange = (index, isExpanded) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: isExpanded,
    }));
  };

  const handleGitHubLink = async () => {
    try {
      // If user is already signed in, we'll link the accounts
      if (session?.user) {
        const result = await signIn('github', {
          redirect: false,
          // Pass existing user data for linking
          userId: session?.user?.id,
          pubkey: session?.user?.pubkey,
          privkey: session?.user?.privkey || null,
        });

        if (result?.ok) {
          // Wait for session update
          await new Promise(resolve => setTimeout(resolve, 1000));
          const updatedSession = await getSession();
          if (updatedSession?.account?.provider === 'github') {
            router.push('/profile'); // Accounts linked successfully
          }
        }
      } else {
        // Normal GitHub sign in
        await signIn('github');
      }
    } catch (error) {
      console.error('GitHub sign in error:', error);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 pb-0 m-2 mb-0 w-full border border-gray-700 shadow-md max-lap:mx-0">
      <div className="flex flex-row justify-between items-center">
        <h1 className="text-3xl font-bold text-white mb-2">Dev Journey</h1>
        <MoreInfo
          tooltip="Learn about the Dev Journey"
          modalTitle="Dev Journey"
          modalBody="This is an optional Dev Journey that will walk you through the primary course materials and help you learn how to code, gain the required experience to Build Bitcoin/Lightning/Nostr Apps, and set you up to go through the rest of the free workshops and other content on the platform."
          className="text-2xl text-gray-200"
        />
      </div>
      <p className="text-gray-400 mb-4">
        Track your progress through the courses, showcase your GitHub contributions, submit
        projects, and earn badges!
      </p>

      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-300">Progress</span>
        <span className="text-gray-300">{progress}%</span>
      </div>
      <ProgressBar
        value={progress}
        className="h-2 mb-6"
        pt={{
          label: {
            className: 'hidden',
          },
        }}
      />

      <div className="mb-6">
        <span className="text-white text-lg font-semibold">Current Tier: </span>
        {currentTier ? (
          <span className="bg-green-500 text-white px-3 py-1 rounded-full">{currentTier}</span>
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
                  onTabChange={e => handleAccordionChange(index, e.index === 0)}
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
                          <span
                            className={`text-lg ${task.completed ? 'text-white' : 'text-gray-400'}`}
                          >
                            {task.status}
                          </span>
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
                          <li key={subIndex}>
                            <div className="flex items-center pl-[28px]">
                              {subTask.completed ? (
                                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center mr-3">
                                  <i className="pi pi-check text-white text-sm"></i>
                                </div>
                              ) : (
                                <div className="w-4 h-4 bg-gray-700 rounded-full flex items-center justify-center mr-3">
                                  <i className="pi pi-info-circle text-white text-sm"></i>
                                </div>
                              )}
                              <span
                                className={`${subTask.completed ? 'text-white' : 'text-gray-400'}`}
                              >
                                {subTask.status}
                              </span>
                              {subTask.status === 'Connect your GitHub account' && (
                                <MoreInfo
                                  tooltip="GitHub Connection Info"
                                  modalTitle="Connect GitHub Account"
                                  modalBody="Connect your GitHub account to track your progress and submit projects. This allows us to verify your project submissions and track your development journey."
                                  className="ml-2 text-sm text-gray-200"
                                />
                              )}
                            </div>
                            {subTask.status.includes('repository') && !subTask.completed && (
                              <RepoSelector
                                courseId={task.courseId}
                                onSubmit={() => {
                                  const updatedTasks = tasks.map(t =>
                                    t.courseId === task.courseId
                                      ? {
                                          ...t,
                                          subTasks: t.subTasks.map(st =>
                                            st.status === subTask.status
                                              ? { ...st, completed: true }
                                              : st
                                          ),
                                        }
                                      : t
                                  );
                                  setTasks(updatedTasks);
                                  router.push('/profile');
                                }}
                              />
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    {task.courseNAddress && (
                      <div className="mt-2 flex justify-end">
                        <GenericButton
                          icon="pi pi-external-link"
                          label="View Course"
                          onClick={() => router.push(`/course/${task.courseNAddress}`)}
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
