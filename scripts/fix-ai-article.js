const { createClient } = require('@sanity/client')
const fs = require('fs')

// Sanity client setup
const client = createClient({
  projectId: '9dzq8f77',
  dataset: 'production',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2023-05-03'
})

async function fixAiArticle() {
  try {
    console.log('Fixing AI article image...')
    
    // Upload the AI article image
    const imagePath = '/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition/public/images/blog/ai-articles/ai-articles-001-a.png'
    const imageBuffer = fs.readFileSync(imagePath)
    
    console.log('Uploading image...')
    const imageAsset = await client.assets.upload('image', imageBuffer, {
      filename: 'ai-articles-001-a.png'
    })
    
    console.log(`Image uploaded successfully: ${imageAsset._id}`)
    
    // Update the ai40-1 post
    const postId = 'sOY5WwoEBY24iuIm0D221W'
    
    console.log('Updating post with image...')
    const updatedPost = await client
      .patch(postId)
      .set({
        mainImage: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: imageAsset._id
          },
          alt: 'AI技術と日常生活の融合を表現した未来的なイラスト - 40代パパの新しい休日体験'
        }
      })
      .commit()
    
    console.log('Post updated successfully!')
    console.log('Title:', updatedPost.title)
    
  } catch (error) {
    console.error('Error:', error)
  }
}

fixAiArticle()