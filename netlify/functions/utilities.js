const { createClient } = require('@supabase/supabase-js');

// Supabase Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Gracefully handle missing Supabase credentials
if (!supabaseUrl || !supabaseKey || !supabaseServiceRoleKey) {
  console.error("Supabase URL, Anon Key, or Service Role Key is missing. Make sure VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are set in your environment variables.");
  // In a Netlify Function, we can't process.exit(1) directly, but we can return an error.
}

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
);

const authenticateToken = async (req) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.error("Auth middleware: No token provided.");
    return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized: No token provided." }) };
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError) {
        console.error("Auth middleware: supabase.auth.getUser error:", userError.message);
        return { statusCode: 403, body: JSON.stringify({ message: "Forbidden: Invalid token." }) };
    }
    if (!user) {
        console.error("Auth middleware: No user found for token.");
        return { statusCode: 403, body: JSON.stringify({ message: "Forbidden: No user found for token." }) };
    }

    const { data: adminData, error: adminError } = await supabaseAdmin.from('admin_users').select('user_id').eq('user_id', user.id);
    if (adminError) {
        console.error("Auth middleware: supabaseAdmin error checking admin status:", adminError.message);
        return { statusCode: 500, body: JSON.stringify({ message: "Error checking admin status", error: adminError.message }) };
    }
    if (!adminData || adminData.length === 0) {
        console.log(`Auth middleware: User ${user.id} is not an admin.`);
        return { statusCode: 403, body: JSON.stringify({ message: "Forbidden: Not an admin." }) };
    }
    
    return { user, supabase, supabaseAdmin }; // Return authenticated user and clients
  } catch (error) {
    console.error("Auth middleware: Unhandled exception:", error.message);
    return { statusCode: 500, body: JSON.stringify({ message: "Authentication failed", error: error.message }) };
  }
};

module.exports = { supabase, supabaseAdmin, authenticateToken };
