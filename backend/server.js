// server.js
const express = require("express");
const multer = require("multer");
const cors = require("cors");

const app = express();
const port = 3007;

// Set up CORS
app.use(cors());

// Configure multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Simulate file processing
const processData = async (fileBuffer) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ processedData: "Sample processed content" }), Math.random() * 1000);
  });
};

// Simulate clone detection
const detectClones = async (fileBuffer) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ clones: [] }), Math.random() * 1000);
  });
};

// Handle multiple file processing
app.post("/process-files", upload.array("fileData"), async (req, res) => {
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).send("No files uploaded.");
  }

  try {
    const results = [];
    const timings = [];

    for (const file of files) {
      const start = Date.now();
      const result = await processData(file.buffer);
      const end = Date.now();
      timings.push(end - start);
      results.push({
        filename: file.originalname,
        processedData: result.processedData,
        timing: end - start,
      });
    }

    res.status(200).json({ results, timings });
  } catch (error) {
    res.status(500).send(`Error processing files: ${error.message}`);
  }
});

// Handle clone detection for multiple files
app.post("/detect-clones", upload.array("fileData"), async (req, res) => {
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).send("No files uploaded.");
  }

  try {
    const cloneResults = [];

    for (const file of files) {
      const clones = await detectClones(file.buffer);
      cloneResults.push({ filename: file.originalname, clones });
    }

    res.status(200).json({ clones: cloneResults });
  } catch (error) {
    res.status(500).send(`Error detecting clones: ${error.message}`);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
