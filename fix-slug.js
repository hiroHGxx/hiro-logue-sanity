const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'fyosgmdu',
  dataset: 'production',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2023-05-03'
});

async function fixSlug() {
  try {
    // Update the slug back to "ai"
    const result = await client
      .patch('sOY5WwoEBY24iuIm0D221W')
      .set({
        slug: {
          _type: 'slug',
          current: 'ai'
        }
      })
      .commit();
    
    console.log('Successfully updated slug to "ai":', result);
  } catch (error) {
    console.error('Error updating slug:', error);
  }
}

fixSlug();