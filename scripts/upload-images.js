const { createClient } = require('@sanity/client')
const fs = require('fs')
const path = require('path')

// Sanity client setup
const client = createClient({
  projectId: '9dzq8f77',
  dataset: 'production',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2023-05-03'
})

// Image-to-post mapping
const imageMapping = [
  {
    postSlug: 'article-1',
    imagePath: '/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition/public/images/blog/tech-articles/programming-001-a.png',
    altText: '学び続ける習慣の力を象徴する現代的な技術イラスト - プログラマーの成長と継続学習'
  },
  {
    postSlug: 'article',
    imagePath: '/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition/public/images/blog/lifestyle-articles/lifestyle-001-a.png',
    altText: '家族との時間を大切にする温かい家庭の風景 - 情報社会での心地よい暮らし'
  },
  {
    postSlug: 'ai40-1',
    imagePath: '/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition/public/images/blog/ai-articles/ai-articles-001-a.png',
    altText: 'AI技術と日常生活の融合を表現した未来的なイラスト - 40代パパの新しい休日体験'
  }
]

async function uploadImageAndUpdatePost(mapping) {
  try {
    console.log(`Processing: ${mapping.postSlug}`)
    
    // Upload image to Sanity
    const imageBuffer = fs.readFileSync(mapping.imagePath)
    const imageAsset = await client.assets.upload('image', imageBuffer, {
      filename: path.basename(mapping.imagePath)
    })
    
    console.log(`Image uploaded: ${imageAsset._id}`)
    
    // Find the post by slug
    const posts = await client.fetch(`*[_type == "post" && slug.current == $slug]`, { slug: mapping.postSlug })
    
    if (posts.length === 0) {
      console.log(`Post not found: ${mapping.postSlug}`)
      return
    }
    
    const post = posts[0]
    
    // Update post with main image
    const updatedPost = await client
      .patch(post._id)
      .set({
        mainImage: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: imageAsset._id
          },
          alt: mapping.altText
        }
      })
      .commit()
    
    console.log(`Post updated: ${post.title}`)
    
  } catch (error) {
    console.error(`Error processing ${mapping.postSlug}:`, error)
  }
}

async function processAllMappings() {
  console.log('Starting image upload and post update process...')
  
  for (const mapping of imageMapping) {
    await uploadImageAndUpdatePost(mapping)
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('All posts updated successfully!')
}

// Check if running directly
if (require.main === module) {
  processAllMappings().catch(console.error)
}

module.exports = { processAllMappings }