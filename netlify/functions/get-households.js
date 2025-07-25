const { supabase } = require('./utilities');

exports.handler = async (event) => {
  try {
    const { data, error } = await supabase.from('households').select('*');
    if (error) throw error;
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Error fetching households from Supabase:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error fetching data' }),
    };
  }
};
