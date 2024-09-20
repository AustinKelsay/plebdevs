import React, {useState, useEffect} from 'react';
import { ProgressBar } from 'primereact/progressbar';

const UserProgress = () => {
    const [progress, setProgress] = useState(0);
    const [currentTier, setCurrentTier] = useState('Pleb');

    const getProgress = async () => {
        return 10;
    };

    const getCurrentTier = async () => {
        return 'Pleb';
    };
    useEffect(() => {
        // Fetch progress and current tier from backend
        // For now, let's assume we have a function to get these values
        const fetchProgress = async () => {
            const progress = await getProgress();
            const currentTier = await getCurrentTier();
            setProgress(progress);
            setCurrentTier(currentTier);
        };

        fetchProgress();
    }, []);

    const tasks = [
        { status: 'Create Account', completed: true, tier: 'Pleb' },
        { 
            status: 'Complete PlebDevs Starter', 
            completed: false,
            tier: 'New Dev',
            subTasks: [
                { status: 'Connect GitHub', completed: false },
                { status: 'Create First GitHub Repo', completed: false },
                { status: 'Push Commit', completed: false }
            ]
        },
        { status: 'Complete PlebDevs Course 1', completed: false, tier: 'Junior Dev' },
        { status: 'Complete PlebDevs Course 2', completed: false, tier: 'Plebdev' },
    ];

    return (
        <div className="bg-gray-900 rounded-3xl p-6 w-[500px] mx-auto my-8">
            <h1 className="text-3xl font-bold text-white mb-2">Your Dev Journey</h1>
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
                <span className="bg-green-500 text-white px-3 py-1 rounded-full">{currentTier}</span>
            </div>
            
            <ul className="space-y-4 mb-6">
                {tasks.map((task, index) => (
                    <li key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                            {task.completed ? (
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                                    <i className="pi pi-check text-white text-sm"></i>
                                </div>
                            ) : (
                                <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-white text-sm">{index + 1}</span>
                                </div>
                            )}
                            <span className={`text-lg ${task.completed ? 'text-white' : 'text-gray-400'}`}>{task.status}</span>
                        </div>
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full w-20 text-center">
                            {task.tier}
                        </span>
                    </li>
                ))}
            </ul>
            
            <button className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-semibold">
                View Badges
            </button>
        </div>
    );
};

export default UserProgress;