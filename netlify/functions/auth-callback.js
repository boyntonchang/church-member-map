const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const { code } = event.queryStringParameters;

  if (code) {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Error exchanging code for session:', error);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: error.message }),
        };
      }

      const { session, user } = data;

      // Set the session as an HTTP-only cookie
      // Note: In a real-world scenario, you might want to use a more robust cookie library
      // and consider setting domain, path, and secure flags more carefully.
      const cookieOptions = `Max-Age=${session.expires_in}; Path=/; HttpOnly; SameSite=Lax; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''}`;

      return {
        statusCode: 302,
        headers: {
          'Set-Cookie': `sb-access-token=${session.access_token}; ${cookieOptions}`,
          'Location': '/', // Redirect back to your app's root
        },
      };
    } catch (error) {
      console.error('Supabase exchangeCodeForSession error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }
  }

  return {
    statusCode: 400,
    body: JSON.stringify({ error: 'No code provided' }),
  };
};
