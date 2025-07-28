const { authenticateToken, supabaseAdmin } = require('./utilities');

exports.handler = async (event) => {
  // Only allow PUT requests
  if (event.httpMethod !== 'PUT') {
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
    console.log('Netlify Function: update-household - event.body:', event.body);
    const { coordinates, ...rest } = JSON.parse(event.body);
    const updatedHouseholdData = { ...rest, lat: coordinates?.lat, lng: coordinates?.lng };
    console.log('Netlify Function: update-household - updatedHouseholdData:', updatedHouseholdData);

    const { data, error } = await supabaseAdmin.from('households').update(updatedHouseholdData).eq('householdId', householdId).select();
    if (error) throw error;
    if (data.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ message: 'Household not found' }) };
    }
    return {
      statusCode: 200,
      body: JSON.stringify(data[0]),
    };
  } catch (error) {
    console.error('Error updating data in Supabase:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error updating data', error: error.message }),
    };
  }
};
