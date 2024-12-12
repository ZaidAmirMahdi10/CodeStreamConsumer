// App.js
import React, { useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import "./App.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const App = () => {
  const [fileData, setFileData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDetectingClones, setIsDetectingClones] = useState(false);
  const [processingResult, setProcessingResult] = useState(null);
  const [cloneResults, setCloneResults] = useState(null);
  const [timingData, setTimingData] = useState([]);
  const [logMessages, setLogMessages] = useState([]);
  const [isProcessingCollapsed, setIsProcessingCollapsed] = useState(false);
  const [isCloneResultsCollapsed, setIsCloneResultsCollapsed] = useState(false);

  const handleFileUpload = (e) => {
    setFileData(e.target.files);
  };

  const handleProcessFiles = async () => {
    if (!fileData || fileData.length === 0) {
      alert("Please upload files.");
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    Array.from(fileData).forEach((file) => formData.append("fileData", file));

    try {
      const startTime = Date.now();
      const response = await axios.post(
        "http://localhost:3007/process-files",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      console.log(`File processed in ${processingTime}ms`);
      setLogMessages((prevLogs) => [
        ...prevLogs,
        `File processed in ${processingTime}ms`,
      ]);

      setProcessingResult(response.data.results);
      setTimingData(response.data.timings);
      setIsProcessing(false);
    } catch (error) {
      console.error("Error processing files:", error);
      setIsProcessing(false);
    }
  };

  const handleDetectClones = async () => {
    if (!fileData || fileData.length === 0) {
      alert("Please upload files.");
      return;
    }

    setIsDetectingClones(true);
    const formData = new FormData();
    Array.from(fileData).forEach((file) => formData.append("fileData", file));

    try {
      const response = await axios.post(
        "http://localhost:3007/detect-clones",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const detectedClones = response.data.clones;
      console.log(
        `Clone detection completed. Found ${detectedClones.length} clones.`
      );
      setLogMessages((prevLogs) => [
        ...prevLogs,
        `Clone detection completed. Found ${detectedClones.length} clones.`,
      ]);

      setCloneResults(response.data.clones);
      setIsDetectingClones(false);
    } catch (error) {
      console.error("Error detecting clones:", error);
      setIsDetectingClones(false);
    }
  };

  const chartData = {
    labels: timingData.map((_, index) => `File ${index + 1}`),
    datasets: [
      {
        label: "Processing Time (ms)",
        data: timingData,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div>
      <h1>Code Stream Consumer</h1>
      <input type="file" multiple onChange={handleFileUpload} />
      <button onClick={handleProcessFiles} disabled={isProcessing}>
        Process Files
      </button>
      <button onClick={handleDetectClones} disabled={isDetectingClones}>
        Detect Clones
      </button>

      {isProcessing && <p>Processing...</p>}
      {isDetectingClones && <p>Detecting clones...</p>}

      {/* Display log messages */}
      {logMessages.length > 0 && (
        <div>
          <h2>Log Messages</h2>
          <ul>
            {logMessages.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      {timingData.length > 0 && (
        <div>
          <h2>Timing Statistics</h2>
          <Bar data={chartData} />
        </div>
      )}

      {!isProcessing && processingResult && (
        <div>
          <button
            onClick={() => setIsProcessingCollapsed(!isProcessingCollapsed)}
          >
            {isProcessingCollapsed ? "Show" : "Hide"} Processing Results
          </button>
          {!isProcessingCollapsed && (
            <div>
              <h2>Processing Results</h2>
              <pre>{JSON.stringify(processingResult, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {!isDetectingClones && cloneResults && (
        <div>
          <button
            onClick={() => setIsCloneResultsCollapsed(!isCloneResultsCollapsed)}
          >
            {isCloneResultsCollapsed ? "Show" : "Hide"} Clone Detection Results
          </button>
          {!isCloneResultsCollapsed && (
            <div>
              <h2>Clone Detection Results</h2>
              <ul>
                {cloneResults.map((clone, index) => (
                  <li key={index}>
                    {clone.filename}: {JSON.stringify(clone.clones)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
