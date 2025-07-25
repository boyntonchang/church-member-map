const { supabaseAdmin } = require('./utilities');

exports.handler = async (event) => {
  const { userId } = event.path.split('/').pop(); // Extract userId from path

  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'User ID is required.' }),
    };
  }

  try {
    const { data, error } = await supabaseAdmin.from('admin_users').select('user_id').eq('user_id', userId);
    if (error) throw error;
    return {
      statusCode: 200,
      body: JSON.stringify({ isAdmin: data.length > 0 }),
    };
  } catch (error) {
    console.error("Error checking admin status:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error checking admin status' }),
    };
  }
};
