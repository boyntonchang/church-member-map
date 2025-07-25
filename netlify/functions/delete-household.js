const { authenticateToken, supabaseAdmin } = require('./utilities');

exports.handler = async (event) => {
  // Only allow DELETE requests
  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const authResult = await authenticateToken(event);
  if (authResult.statusCode) {
    return authResult; // Return authentication error
  }

  const householdId = event.path.split('/').pop(); // Extract householdId from path

  if (!householdId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Household ID is required.' }),
    };
  }

  try {
    const { error } = await supabaseAdmin.from('households').delete().eq('householdId', householdId);
    if (error) throw error;
    return {
      statusCode: 204, // No Content
      body: '',
    };
  } catch (error) {
    console.error("Error deleting household in Supabase:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error deleting data' }),
    };
  }
};
