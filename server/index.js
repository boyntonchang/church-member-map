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

// Supabase client for admin operations (uses service_role key to bypass RLS)
const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Middleware
app.use(cors({
  origin: '*',
  allowedHeaders: ['authorization', 'x-client-info', 'apikey', 'content-type'],
}));
app.use(express.json());

// Middleware to authenticate and get user from token
const authenticateToken = async (req, res, next) => {
  console.log('Backend: authenticateToken middleware hit');
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    console.log('Backend: No token provided');
    return res.sendStatus(401); // No token
  }

  try {
    // Use the regular supabase client to verify the user's session
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) {
      console.error("Backend: Supabase auth.getUser error:", error.message);
      return res.sendStatus(403); // Invalid token or user not found
    }
    if (!user) {
      console.log('Backend: User not found for token');
      return res.sendStatus(403); // Invalid token or user not found
    }

    // Now, check if the authenticated user is an admin
    const { data: adminData, error: adminError } = await supabaseAdmin.from('admin_users').select('user_id').eq('user_id', user.id);
    if (adminError) {
      console.error("Backend: Error checking admin status in middleware:", adminError.message);
      return res.status(500).json({ message: 'Error checking admin status' });
    }
    if (adminData.length === 0) {
      console.log('Backend: User is not an admin:', user.id);
      return res.sendStatus(403); // Not an admin
    }

    req.user = user; // Attach user to request object
    console.log('Backend: Admin user authenticated:', user.id);
    next();
  } catch (error) {
    console.error("Backend: Token authentication failed:", error.message);
    return res.sendStatus(403); // Forbidden
  }
};

// API to check if a user is an admin
app.get('/api/admin-check/:userId', async (req, res) => {
  const { userId } = req.params;
  console.log('Backend: Received admin check request for userId:', userId);
  try {
    // Use supabaseAdmin to query admin_users table (bypasses RLS)
    const { data, error } = await supabaseAdmin.from('admin_users').select('user_id').eq('user_id', userId);
    if (error) throw error;
    console.log('Backend: Admin check query result:', data);
    res.json({ isAdmin: data.length > 0 });
  } catch (error) {
    console.error("Backend: Error checking admin status:", error.message);
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
    const newHousehold = {
      ...rest,
      lat: coordinates ? coordinates.lat : undefined,
      lng: coordinates ? coordinates.lng : undefined,
    };
    // Use supabaseAdmin for insert
    const { data, error } = await supabaseAdmin.from('households').insert([newHousehold]).select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error("Error adding household to Supabase:", error.message);
    res.status(500).json({ message: 'Error adding data' });
  }
});

// API to update an existing household (admin only)
app.put('/api/households/:id', authenticateToken, async (req, res) => {
  try {
    const householdIdToUpdate = req.params.id;
    console.log('Backend: Updating household with ID:', householdIdToUpdate);
    const { coordinates, ...rest } = req.body;
    const updatedHouseholdData = {
      ...rest,
      lat: coordinates ? coordinates.lat : undefined,
      lng: coordinates ? coordinates.lng : undefined,
    };
    console.log('Backend: Data to update:', updatedHouseholdData);

    const { data, error } = await supabaseAdmin.from('households').update(updatedHouseholdData).eq('householdId', householdIdToUpdate).select();
    if (error) {
      console.error('Backend: Supabase update error:', error);
      throw error;
    }
    if (data.length === 0) {
      console.log('Backend: Household not found in Supabase for ID:', householdIdToUpdate);
      return res.status(404).json({ message: 'Household not found' });
    }
    res.json(data[0]);
  } catch (error) {
    console.error("Error updating household in Supabase:", error.message);
    res.status(500).json({ message: 'Error updating data' });
  }
});

// API to delete a household (admin only)
app.delete('/api/households/:id', authenticateToken, async (req, res) => {
  try {
    const householdIdToDelete = req.params.id;
    console.log('Backend: Deleting household with ID:', householdIdToDelete);

    const { error } = await supabaseAdmin.from('households').delete().eq('householdId', householdIdToDelete);
    if (error) throw error;

    res.status(204).send(); // No content to send back on successful delete
  } catch (error) {
    console.error("Error deleting household in Supabase:", error.message);
    res.status(500).json({ message: 'Error deleting data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});