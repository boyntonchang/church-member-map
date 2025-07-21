require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const dataFilePath = path.join(__dirname, '..', 'public', 'members-location.json');

async function migrateData() {
  try {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    const churchData = JSON.parse(data);
    const households = churchData.households;

    console.log(`Migrating ${households.length} households...`);

    for (const household of households) {
      // Transform coordinates object into separate lat and lng fields
      const { coordinates, ...rest } = household;
      const householdToInsert = {
        ...rest,
        lat: coordinates.lat,
        lng: coordinates.lng,
      };

      // Supabase handles arrays and JSONB types automatically if columns are set correctly
      const { data, error } = await supabase.from('households').insert([householdToInsert]);

      if (error) {
        console.error(`Error inserting household ${household.householdId}:`, error);
      } else {
        console.log(`Successfully inserted household ${household.householdId}`);
      }
    }

    console.log('Migration complete.');
  } catch (error) {
    console.error('Error during migration:', error.message);
  }
}

migrateData();
