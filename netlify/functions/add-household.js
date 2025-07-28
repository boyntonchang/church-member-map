const { authenticateToken, supabaseAdmin } = require('./utilities');

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const authResult = await authenticateToken(event);
  if (authResult.statusCode) {
    return authResult; // Return authentication error
  }

  try {
    console.log('Netlify Function: add-household - event.body:', event.body);
    const { coordinates, ...rest } = JSON.parse(event.body);
    const newHousehold = { ...rest, lat: coordinates?.lat, lng: coordinates?.lng };
    console.log('Netlify Function: add-household - newHousehold:', newHousehold);
    const { data, error } = await supabaseAdmin.from('households').insert([newHousehold]).select();
    if (error) throw error;
    return {
      statusCode: 201,
      body: JSON.stringify(data[0]),
    };
  } catch (error) {
    console.error('Error adding data to Supabase:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error adding data', error: error.message }),
    };
  }
};
