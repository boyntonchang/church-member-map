const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = 3001;

// Supabase Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json());

// API to get all households
app.get('/api/households', async (req, res) => {
  try {
    const { data, error } = await supabase.from('households').select('*');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error fetching households from Supabase:", error.message);
    res.status(500).json({ message: 'Error fetching data' });
  }
});

// API to add a new household
app.post('/api/households', async (req, res) => {
  try {
    const newHousehold = req.body;
    // Supabase will automatically assign an ID if your table is configured with a primary key
    const { data, error } = await supabase.from('households').insert([newHousehold]).select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error("Error adding household to Supabase:", error.message);
    res.status(500).json({ message: 'Error adding data' });
  }
});

// API to update an existing household
app.put('/api/households/:id', async (req, res) => {
  try {
    const householdIdToUpdate = req.params.id;
    const updatedHouseholdData = req.body;
    const { data, error } = await supabase.from('households').update(updatedHouseholdData).eq('householdId', householdIdToUpdate).select();
    if (error) throw error;
    if (data.length === 0) {
      return res.status(404).json({ message: 'Household not found' });
    }
    res.json(data[0]);
  } catch (error) {
    console.error("Error updating household in Supabase:", error.message);
    res.status(500).json({ message: 'Error updating data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
