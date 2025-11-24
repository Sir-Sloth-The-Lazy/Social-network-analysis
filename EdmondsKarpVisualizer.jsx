import React, { useState, useEffect } from 'react';
import { Send, RotateCcw, Activity } from 'lucide-react';

const EdmondsKarpVisualizer = () => {
  // State for user input (a single step of the EK algorithm)
  const [stepData, setStepData] = useState('');
  const [explanation, setExplanation] = useState('Enter a Max-Flow step in JSON format to see the residual graph and flow augmentation.');
  const [currentStep, setCurrentStep] = useState(null);
  const [error, setError] = useState('');

  // Graph state: nodes, directed edges, capacities, current flow, and residual graph info
  const [graph, setGraph] = useState({ nodes: [], edges: [], flow: 0 });
  const [highlightPath, setHighlightPath] = useState([]); // List of edges in the augmenting path

  // Node positions helper
  const getNodePosition = (node, nodes) => {
    const s = 'S', t = 'T';
    if (node === s) return { x: 50, y: 200 };
    if (node === t) return { x: 350, y: 200 };

    // Arrange intermediate nodes in a circle
    const intermediateNodes = nodes.filter(n => n !== s && n !== t);
    const index = intermediateNodes.indexOf(node);
    if (index === -1) return { x: 200, y: 200 }; // Fallback

    const total = intermediateNodes.length;
    const radius = 100;
    const angle = (index * 2 * Math.PI) / total;
    const x = 200 + radius * Math.cos(angle);
    const y = 200 + radius * Math.sin(angle);
    return { x, y };
  };

  // Explanation generator for an Edmonds-Karp step
  const generateExplanation = (data) => {
    const { step, augmentingPath, pathCapacity, maxFlow } = data;
    const pathStr = augmentingPath.map(e => `${e.from}→${e.to}`).join(' → ');

    if (pathCapacity === 0) {
      return `Final Step ${step}: No more augmenting paths (a path with available residual capacity) could be found from S to T in the residual graph. The maximum flow is **${maxFlow}**. The Min-Cut is now determined by the set of nodes reachable from S in the final residual graph.`;
    }

    return `Step ${step}: An **augmenting path** was found via BFS: **${pathStr}**. The bottleneck capacity of this path is **${pathCapacity}**. The total flow is augmented (increased) by this amount, bringing the total flow to **${maxFlow}**. The residual graph is now updated.`;
  };

  // Graph update logic
  const updateGraph = (data) => {
    const { nodes, edges, maxFlow, augmentingPath } = data;

    if (nodes && edges) {
      setGraph({ nodes, edges, flow: maxFlow });
      // Highlight edges in the path
      const pathKey = augmentingPath.map(e => `${e.from}-${e.to}`);
      setHighlightPath(pathKey);
    }
  };

  const handleSubmit = () => {
    setError('');
    try {
      const parsed = JSON.parse(stepData);

      // Validate required fields for EK
      if (!parsed.step || !parsed.nodes || !parsed.edges || parsed.maxFlow === undefined || !parsed.augmentingPath) {
        setError('Missing required fields: step, nodes, edges, maxFlow, augmentingPath');
        return;
      }

      // Check edge structure: { from: 'u', to: 'v', capacity: 10, flow: 5 }
      if (!parsed.edges.every(e => e.from && e.to && e.capacity !== undefined && e.flow !== undefined)) {
        setError('Each edge must have { from, to, capacity, flow } fields.');
        return;
      }

      setCurrentStep(parsed);
      const exp = generateExplanation(parsed);
      setExplanation(exp);
      updateGraph(parsed);

    } catch (e) {
      setError('Invalid JSON format. Please check your input.');
    }
  };

  const handleReset = () => {
    setStepData('');
    setCurrentStep(null);
    setError('');
    setGraph({ nodes: [], edges: [], flow: 0 });
    setHighlightPath([]);
    setExplanation('Enter a Max-Flow step in JSON format to see the residual graph and flow augmentation.');
  };

  // Example inputs for Edmonds-Karp
  const exampleInputs = [
    {
      step: 1,
      maxFlow: 4,
      pathCapacity: 4,
      augmentingPath: [{ from: "S", to: "A" }, { from: "A", to: "T" }],
      nodes: ["S", "A", "B", "T"],
      edges: [
        { from: "S", to: "A", capacity: 10, flow: 4 },
        { from: "S", to: "B", capacity: 5, flow: 0 },
        { from: "A", to: "B", capacity: 15, flow: 0 },
        { from: "A", to: "T", capacity: 4, flow: 4 },
        { from: "B", to: "T", capacity: 10, flow: 0 },
      ],
    },
    {
      step: 2,
      maxFlow: 9,
      pathCapacity: 5,
      augmentingPath: [{ from: "S", to: "B" }, { from: "B", to: "T" }],
      nodes: ["S", "A", "B", "T"],
      edges: [
        { from: "S", to: "A", capacity: 10, flow: 4 },
        { from: "S", to: "B", capacity: 5, flow: 5 }, // Flow updated
        { from: "A", to: "B", capacity: 15, flow: 0 },
        { from: "A", to: "T", capacity: 4, flow: 4 },
        { from: "B", to: "T", capacity: 10, flow: 5 }, // Flow updated
      ],
    },
    {
      step: 3,
      maxFlow: 9,
      pathCapacity: 0,
      augmentingPath: [], // No path found
      nodes: ["S", "A", "B", "T"],
      edges: [
        { from: "S", to: "A", capacity: 10, flow: 4 },
        { from: "S", to: "B", capacity: 5, flow: 5 },
        { from: "A", to: "B", capacity: 15, flow: 0 },
        { from: "A", to: "T", capacity: 4, flow: 4 }, // Edge saturated
        { from: "B", to: "T", capacity: 10, flow: 5 },
      ],
    },
  ];

  // SVG rendering component for edges
  const EdgeComponent = ({ edge, nodes }) => {
    const posU = getNodePosition(edge.from, nodes);
    const posV = getNodePosition(edge.to, nodes);
    const isHighlighted = highlightPath.includes(`${edge.from}-${edge.to}`);
    const capacityText = `${edge.flow}/${edge.capacity}`;
    const midX = (posU.x + posV.x) / 2;
    const midY = (posU.y + posV.y) / 2;

    // Small offset for visibility on shorter lines or multiple edges
    const dx = posV.x - posU.x;
    const dy = posV.y - posU.y;
    const angle = Math.atan2(dy, dx);
    const offset = 10; // For arrow

    // Arrowhead calculations
    const arrowX1 = posV.x - offset * Math.cos(angle);
    const arrowY1 = posV.y - offset * Math.sin(angle);
    const arrowPoints = `${arrowX1},${arrowY1} ${arrowX1 - 5 * Math.cos(angle - Math.PI / 4)},${arrowY1 - 5 * Math.sin(angle - Math.PI / 4)} ${arrowX1 - 5 * Math.cos(angle + Math.PI / 4)},${arrowY1 - 5 * Math.sin(angle + Math.PI / 4)}`;

    return (
      <g>
        {/* Line */}
        <line
          x1={posU.x}
          y1={posU.y}
          x2={arrowX1}
          y2={arrowY1}
          stroke={isHighlighted ? "#f59e0b" : "#4b5563"}
          strokeWidth={isHighlighted ? "3" : "2"}
          markerEnd={`url(#arrowhead-${isHighlighted ? 'highlight' : 'normal'})`}
        />
        {/* Arrowhead (as a polygon for custom control) */}
        <polygon
            points={arrowPoints}
            fill={isHighlighted ? "#f59e0b" : "#4b5563"}
        />
        {/* Flow/Capacity Text */}
        <text
          x={midX}
          y={midY}
          fill={isHighlighted ? "#b45309" : "#1f2937"}
          fontSize="12"
          textAnchor="middle"
          dy={dx === 0 ? (dy > 0 ? -5 : 15) : (dy > 0 ? 15 : -5)} // Offset text
          fontWeight="bold"
        >
          {capacityText}
        </text>
      </g>
    );
  };

  // SVG rendering component for nodes
  const NodeComponent = ({ node, nodes }) => {
    const pos = getNodePosition(node, nodes);
    const isSource = node === 'S';
    const isSink = node === 'T';
    const isSpecial = isSource || isSink;
    
    // In Min-Cut step (final step), highlight S-reachable nodes (S set)
    const isMinCutS = currentStep && currentStep.pathCapacity === 0 && currentStep.sSet && currentStep.sSet.includes(node);

    return (
      <g>
        <circle
          cx={pos.x}
          cy={pos.y}
          r={20}
          fill={isMinCutS ? "#dc2626" : (isSource ? "#10b981" : (isSink ? "#ef4444" : "#3b82f6"))}
          stroke="#1e293b"
          strokeWidth="3"
        />
        <text
          x={pos.x}
          y={pos.y}
          textAnchor="middle"
          dy=".3em"
          fill="white"
          fontSize="16"
          fontWeight="bold"
        >
          {node}
        </text>
      </g>
    );
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Activity size={32} className="text-purple-600" /> Edmonds-Karp (Max-Flow Min-Cut) Visualizer
          </h1>
          <p className="text-gray-600 mb-8">
            Visualize the flow augmentation steps to understand the Max-Flow Min-Cut Theorem.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Input and Explanation */}
            <div className="space-y-6">
              {/* Input Section */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">
                  Step Parameters (Max-Flow State)
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      JSON Input
                    </label>
                    <textarea
                      value={stepData}
                      onChange={(e) => setStepData(e.target.value)}
                      placeholder={JSON.stringify(exampleInputs[0], null, 2)}
                      className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleSubmit}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Send size={20} />
                      Visualize Step
                    </button>
                    
                    <button
                      onClick={handleReset}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <RotateCcw size={20} />
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Examples */}
              <div className="bg-indigo-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                  Quick Examples
                </h3>
                <div className="space-y-2">
                  {exampleInputs.map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => setStepData(JSON.stringify(example, null, 2))}
                      className="w-full text-left px-4 py-2 bg-white hover:bg-indigo-100 rounded-lg text-sm transition-colors"
                    >
                      <div className="font-semibold text-gray-800">Step {example.step}</div>
                      <div className="text-gray-600 font-mono text-xs">
                        Max Flow: {example.maxFlow} (Path Capacity: {example.pathCapacity})
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Explanation */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">
                  Explanation
                  {currentStep && (
                    <span className="ml-2 text-base font-normal text-gray-600">
                      (Step {currentStep.step})
                    </span>
                  )}
                </h2>
                <p className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: explanation }} />
              </div>
            </div>

            {/* Right: Graph Visualization */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">
                  Current Flow Network
                </h2>
                
                {graph.nodes.length === 0 ? (
                  <div className="flex items-center justify-center h-96 bg-white rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-gray-400 text-center px-8">
                      Enter step parameters and click "Visualize Step" to see the flow network
                    </p>
                  </div>
                ) : (
                  <svg width="400" height="400" className="border border-gray-200 rounded-lg bg-white">
                    {/* Define arrowheads */}
                    <defs>
                      <marker id="arrowhead-normal" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#4b5563" />
                      </marker>
                      <marker id="arrowhead-highlight" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" />
                      </marker>
                    </defs>
                    
                    {/* Draw edges */}
                    {graph.edges.map((edge, idx) => (
                      <EdgeComponent key={idx} edge={edge} nodes={graph.nodes} />
                    ))}
                    
                    {/* Draw nodes */}
                    {graph.nodes.map((node) => (
                      <NodeComponent key={node} node={node} nodes={graph.nodes} />
                    ))}
                  </svg>
                )}

                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-gray-600">Source (S)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span className="text-gray-600">Sink (T) / Min-Cut S-Set</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <span className="text-gray-600">Intermediate Node</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-amber-500"></div>
                    <span className="text-gray-600">Augmenting Path</span>
                  </div>
                  <div className="ml-auto text-lg font-semibold text-gray-700">
                    Total Max Flow: <span className="text-purple-600">{graph.flow}</span>
                  </div>
                </div>
              </div>

              {/* Current Step Info */}
              {currentStep && (
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-700">
                    Current Step Details
                  </h3>
                  <div className="space-y-2 text-gray-600">
                    <p><strong>Step Number:</strong> {currentStep.step}</p>
                    <p><strong>Augmenting Path:</strong> {currentStep.augmentingPath.length > 0 ? currentStep.augmentingPath.map(e => e.from + "→" + e.to).join(', ') : 'None Found'}</p>
                    <p><strong>Path Capacity:</strong> {currentStep.pathCapacity}</p>
                    <p><strong>New Max Flow:</strong> {currentStep.maxFlow}</p>
                    <p><strong>Status:</strong> {currentStep.pathCapacity === 0 ? '✓ Max Flow Found / Min Cut Established' : '⟳ Augmenting Flow'}</p>
                  </div>
                </div>
              )}

              {/* Input Format Guide */}
              <div className="bg-purple-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                  Required Input Format
                </h3>
                <pre className="bg-white p-3 rounded-lg text-xs font-mono overflow-auto border border-purple-200">
                  {`{
  "step": 1,
  "maxFlow": 4,
  "pathCapacity": 4,
  "augmentingPath": [
    {"from": "S", "to": "A"}, 
    {"from": "A", "to": "T"}
  ],
  "nodes": ["S", "A", "B", "T"],
  "edges": [
    {"from": "S", "to": "A", "capacity": 10, "flow": 4},
    {"from": "S", "to": "B", "capacity": 5, "flow": 0},
    // ... all edges with current flow
  ]
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EdmondsKarpVisualizer;
