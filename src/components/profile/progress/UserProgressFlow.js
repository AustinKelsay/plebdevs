import React from 'react';
import ReactFlow, { 
    Background,
    Handle,
    Position,
    Controls
} from 'reactflow';
import 'reactflow/dist/style.css';

const CustomNode = ({ data }) => (
    <div className={`px-4 py-2 rounded-lg shadow-md w-48 text-center transition-all duration-300 ${
        data.completed 
            ? 'bg-green-500 text-white border-2 border-green-400 bg-opacity-50' 
            : 'bg-gray-700 text-gray-300 border-2 border-gray-600 bg-opacity-50'
    }`}>
        <Handle type="target" position={Position.Top} />
        <div className="flex items-center justify-center gap-2">
            {data.completed ? (
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <i className="pi pi-check text-white text-sm"></i>
                </div>
            ) : (
                <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center">
                    <i className="pi pi-lock text-gray-400 text-sm"></i>
                </div>
            )}
            <div className="font-semibold">{data.label}</div>
        </div>
        <div className="text-sm mt-1 px-2 py-0.5 bg-blue-500 rounded-full inline-block">
            {data.tier}
        </div>
        <Handle type="source" position={Position.Bottom} />
    </div>
);

const nodeTypes = {
    custom: CustomNode,
};

const UserProgressFlow = ({ tasks }) => {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const nodes = [
        {
            id: '1',
            type: 'custom',
            position: { x: 250, y: 0 },
            data: { 
                label: tasks[0]?.status || 'Connect GitHub',
                tier: tasks[0]?.tier || 'Pleb',
                completed: tasks[0]?.completed || false,
            },
        },
        {
            id: '2',
            type: 'custom',
            position: { x: 250, y: 120 },
            data: { 
                label: tasks[1]?.status || 'PlebDevs Starter',
                tier: tasks[1]?.tier || 'Plebdev',
                completed: tasks[1]?.completed || false,
            },
        },
        {
            id: '3',
            type: 'custom',
            position: { x: 100, y: 240 },
            data: { 
                label: tasks[2]?.status || 'Frontend Course',
                tier: tasks[2]?.tier || 'Frontend Dev',
                completed: tasks[2]?.completed || false,
            },
        },
        {
            id: '4',
            type: 'custom',
            position: { x: 400, y: 240 },
            data: { 
                label: tasks[3]?.status || 'Backend Course',
                tier: tasks[3]?.tier || 'Backend Dev',
                completed: tasks[3]?.completed || false,
            },
        },
    ];

    const edges = [
        { 
            id: 'e1-2', 
            source: '1', 
            target: '2',
            style: { 
                stroke: tasks[0]?.completed ? '#22c55e' : '#4b5563',
                strokeWidth: 2,
            },
            animated: tasks[0]?.completed && !tasks[1]?.completed,
        },
        { 
            id: 'e2-3', 
            source: '2', 
            target: '3',
            style: { 
                stroke: tasks[1]?.completed ? '#22c55e' : '#4b5563',
                strokeWidth: 2,
            },
            animated: tasks[1]?.completed && !tasks[2]?.completed,
        },
        { 
            id: 'e2-4', 
            source: '2', 
            target: '4',
            style: { 
                stroke: tasks[1]?.completed ? '#22c55e' : '#4b5563',
                strokeWidth: 2,
            },
            animated: tasks[1]?.completed && !tasks[3]?.completed,
        },
    ];

    if (!mounted) return <div style={{ height: 400 }} className="bg-gray-800 rounded-3xl" />;

    return (
        <div style={{ height: 400 }} className="bg-gray-800 rounded-3xl">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                panOnDrag={false}
                zoomOnScroll={false}
                panOnScroll={false}
                selectNodesOnDrag={false}
                preventScrolling
                minZoom={1}
                maxZoom={1}
                defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            >
                <Background color="#4a5568" gap={16} />
                {/* <Controls position="top-right" /> */}
            </ReactFlow>
        </div>
    );
};

export default UserProgressFlow;