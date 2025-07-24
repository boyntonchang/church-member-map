const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = 3001; // Backend server port

// Supabase Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// Gracefully handle missing Supabase credentials
if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or Anon Key is missing. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.");
  process.exit(1); // Exit if critical env vars are missing
}

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Middleware
app.use(cors()); // Allow all origins for simplicity in local dev
app.use(express.json());

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) {
    console.error("Auth middleware: No token provided.");
    return res.sendStatus(401);
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError) {
        console.error("Auth middleware: supabase.auth.getUser error:", userError.message);
        return res.sendStatus(403);
    }
    if (!user) {
        console.error("Auth middleware: No user found for token.");
        return res.sendStatus(403);
    }

    const { data: adminData, error: adminError } = await supabaseAdmin.from('admin_users').select('user_id').eq('user_id', user.id);
    if (adminError) {
        console.error("Auth middleware: supabaseAdmin error checking admin status:", adminError.message);
        return res.status(500).json({ message: "Error checking admin status", error: adminError.message });
    }
    if (!adminData || adminData.length === 0) {
        console.log(`Auth middleware: User ${user.id} is not an admin.`);
        return res.sendStatus(403); // Forbidden - not an admin
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware: Unhandled exception:", error.message);
    res.status(500).json({ message: "Authentication failed", error: error.message });
  }
};

// API to check if a user is an admin
app.get('/api/admin-check/:userId', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('admin_users').select('user_id').eq('user_id', req.params.userId);
    if (error) throw error;
    res.json({ isAdmin: data.length > 0 });
  } catch (error) {
    console.error("Error checking admin status:", error.message);
    res.status(500).json({ message: 'Error checking admin status' });
  }
});

// API to get all households (publicly accessible)
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

// API to add a new household (admin only)
app.post('/api/households', authenticateToken, async (req, res) => {
  try {
    const { coordinates, ...rest } = req.body;
    const newHousehold = { ...rest, lat: coordinates?.lat, lng: coordinates?.lng };
    const { data, error } = await supabaseAdmin.from('households').insert([newHousehold]).select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error adding data to Supabase:', error);
    res.status(500).json({ message: 'Error adding data', error: error.message });
  }
});

// API to update an existing household (admin only)
app.put('/api/households/:id', authenticateToken, async (req, res) => {
  console.log("PUT /households/:id route hit.");
  console.log("Raw req.body:", req.body);
  try {
    const { coordinates, ...rest } = req.body;
    const updatedHouseholdData = { ...rest, lat: coordinates?.lat, lng: coordinates?.lng };
    console.log('Backend PUT: householdId from params:', req.params.id);
    console.log('Backend PUT: updatedHouseholdData:', updatedHouseholdData);
    console.log('Before Supabase update - householdId:', req.params.id);
    console.log('Before Supabase update - updatedHouseholdData:', updatedHouseholdData);
    const { data, error } = await supabaseAdmin.from('households').update(updatedHouseholdData).eq('householdId', req.params.id).select();
    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ message: 'Household not found' });
    res.json(data[0]);
  } catch (error) {
    console.error('Error updating data in Supabase:', error);
    res.status(500).json({ message: 'Error updating data', error: error.message });
  }
});

// API to delete a household (admin only)
app.delete('/api/households/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('households').delete().eq('householdId', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting household in Supabase:", error.message);
    res.status(500).json({ message: 'Error deleting data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});