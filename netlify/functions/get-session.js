const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Supabase URL or Anon Key is missing.' }),
    };
  }

  const cookies = event.headers.cookie;
  if (!cookies) {
    return {
      statusCode: 200,
      body: JSON.stringify({ session: null }), // No cookies, no session
    };
  }

  const accessTokenMatch = cookies.match(/sb-access-token=([^;]+)/);
  const refreshTokenMatch = cookies.match(/sb-refresh-token=([^;]+)/);

  const accessToken = accessTokenMatch ? accessTokenMatch[1] : null;
  const refreshToken = refreshTokenMatch ? refreshTokenMatch[1] : null;

  if (!accessToken || !refreshToken) {
    return {
      statusCode: 200,
      body: JSON.stringify({ session: null }), // Missing one or both tokens
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Use setSession to validate the tokens and get the full session object
    const { data: { session }, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      console.error('Error setting session from cookies:', error);
      return {
        statusCode: 200, // Return 200 with null session if tokens are invalid
        body: JSON.stringify({ session: null, error: error.message }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ session }),
    };
  } catch (error) {
    console.error('Unhandled error in get-session:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
