const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

const dataFilePath = path.join(__dirname, '..', 'public', 'members-location.json');

// API to get all households
app.get('/api/households', (req, res) => {
  fs.readFile(dataFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error("Error reading data file:", err);
      return res.status(500).json({ message: 'Error reading data' });
    }
    const churchData = JSON.parse(data);
    res.json(churchData.households);
  });
});

// API to add a new household
app.post('/api/households', (req, res) => {
  fs.readFile(dataFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error("Error reading data file:", err);
      return res.status(500).json({ message: 'Error reading data' });
    }
    const churchData = JSON.parse(data);
    const newHousehold = req.body;

    // Assign a unique ID and add to households array
    newHousehold.householdId = `hh_${Date.now()}`;
    churchData.households.push(newHousehold);

    fs.writeFile(dataFilePath, JSON.stringify(churchData, null, 2), 'utf8', (err) => {
      if (err) {
        console.error("Error writing data file:", err);
        return res.status(500).json({ message: 'Error writing data' });
      }
      res.status(201).json(newHousehold);
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
