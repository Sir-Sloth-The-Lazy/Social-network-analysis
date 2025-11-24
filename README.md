# 🌊 Edmonds-Karp (Max-Flow Min-Cut) Visualizer

This is a React component designed to visualize the step-by-step process of the **Edmonds-Karp algorithm**, a foundational method for solving the **Maximum Flow** problem and, consequently, finding the **Minimum Cut** in a flow network.

The visualizer works by accepting a JSON object representing the state of the network (flows, capacities, and the augmenting path found) at a specific iteration, rendering the graph, and providing a detailed explanation of the step.

## ✨ Features

* **Step-by-Step Visualization:** Renders the network state after each flow augmentation.
* **Residual Graph Simulation:** Visualizes the current flow (`flow/capacity`) on each edge.
* **Augmenting Path Highlighting:** Clearly marks the path found by BFS in the residual graph.
* **Max-Flow Min-Cut Duality:** Explains how the termination of the algorithm (Max Flow found) defines the Min-Cut.
* **Interactive Input:** Allows users to manually input JSON data for specific steps or use predefined examples.

## 🚀 Setup and Installation

This is a single React component, assuming you have a standard React project (e.g., created with Create React App or Next.js) and **Tailwind CSS** installed for styling.

1.  **Dependencies:** Ensure you have the necessary libraries:
    ```bash
    # Install dependencies
    npm install react react-dom lucide-react 
    # Ensure Tailwind CSS is configured in your project
    ```
2.  **File Location:** Save the code as `EdmondsKarpVisualizer.jsx`.
3.  **Usage:** Import and render the component in your main application file (e.g., `App.js`):

    ```jsx
    import EdmondsKarpVisualizer from './EdmondsKarpVisualizer';

    function App() {
      return (
        <div className="App">
          <EdmondsKarpVisualizer />
        </div>
      );
    }

    export default App;
    ```

## 📐 JSON Input Format

The visualizer requires a structured JSON object for each step to accurately represent the graph and the algorithm's state.

| Field | Type | Description |
| :--- | :--- | :--- |
| `step` | `number` | The current step number in the Edmonds-Karp iteration. |
| `maxFlow` | `number` | The total accumulated flow value after this step's augmentation. |
| `pathCapacity` | `number` | The bottleneck capacity of the augmenting path found in this step. |
| `augmentingPath` | `Array<Object>` | The sequence of edges defining the path found from **S** to **T**. |
| `nodes` | `Array<string>` | List of all node names (e.g., `["S", "A", "B", "T"]`). |
| `edges` | `Array<Object>` | List of all directed edges in the network. |

### Example Step Input

```json
{
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
    {"from": "A", "to": "B", "capacity": 15, "flow": 0},
    {"from": "A", "to": "T", "capacity": 4, "flow": 4},
    {"from": "B", "to": "T", "capacity": 10, "flow": 0}
  ]
}
