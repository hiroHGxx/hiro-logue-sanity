import { client } from './sanity'
import { markdownToPortableText } from './markdown-to-portable-text'

// Generate unique slug with better Japanese support
async function generateUniqueSlug(title: string): Promise<string> {
  // より良いスラッグ生成ロジック
  let baseSlug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')  // 特殊文字を除去
    .replace(/\s+/g, '-')      // スペースをハイフンに
    .trim()
  
  // 空文字列やダッシュのみの場合の処理
  if (!baseSlug || baseSlug === '' || baseSlug === '-') {
    baseSlug = 'article'
  }
  
  // 既存のスラッグをチェック
  const existingPosts = await client.fetch(`*[_type == "post" && slug.current match $slugPattern] {
    slug
  }`, { slugPattern: `${baseSlug}*` })
  
  // 重複がなければそのまま返す
  if (existingPosts.length === 0) {
    return baseSlug
  }
  
  // 重複がある場合は番号を付ける
  let counter = 1
  let uniqueSlug = `${baseSlug}-${counter}`
  
  while (existingPosts.some((post: any) => post.slug.current === uniqueSlug)) {
    counter++
    uniqueSlug = `${baseSlug}-${counter}`
  }
  
  return uniqueSlug
}

// Create a new blog post
export async function createPost(postData: {
  title: string
  content: string
  excerpt?: string
  category?: string
  authorId?: string
}) {
  const { title, content, excerpt, category, authorId } = postData
  
  // Generate unique slug from title
  const slug = await generateUniqueSlug(title)

  // Create the post document
  const post = {
    _type: 'post',
    title,
    slug: {
      _type: 'slug',
      current: slug
    },
    body: markdownToPortableText(content),
    excerpt,
    categories: category ? [category] : [],
    publishedAt: new Date().toISOString(),
    ...(authorId && {
      author: {
        _type: 'reference',
        _ref: authorId
      }
    })
  }

  try {
    const result = await client.create(post)
    console.log('✅ Post created successfully:', result._id)
    
    // 自動的に公開状態にする
    await publishPost(result._id)
    console.log('✅ Post published automatically:', result._id)
    
    return result
  } catch (error) {
    console.error('❌ Error creating post:', error)
    throw error
  }
}

// Publish a post (move from draft to published)
export async function publishPost(postId: string) {
  try {
    // Sanityの公開システムを使用してDraftを公開状態にする
    const result = await client
      .patch(postId)
      .set({ _id: postId.replace('drafts.', '') })
      .commit()
    
    console.log('✅ Post published successfully:', postId)
    return result
  } catch (error) {
    console.error('❌ Error publishing post:', error)
    throw error
  }
}

// Create a new author
export async function createAuthor(authorData: {
  name: string
  bio?: string
}) {
  const { name, bio } = authorData
  
  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim()

  const author = {
    _type: 'author',
    name,
    slug: {
      _type: 'slug',
      current: slug
    },
    ...(bio && {
      bio: [
        {
          _type: 'block',
          _key: 'bio',
          style: 'normal',
          children: [
            {
              _type: 'span',
              text: bio,
              marks: []
            }
          ]
        }
      ]
    })
  }

  try {
    const result = await client.create(author)
    console.log('✅ Author created successfully:', result._id)
    return result
  } catch (error) {
    console.error('❌ Error creating author:', error)
    throw error
  }
}

// Update an existing post
export async function updatePost(postId: string, updates: {
  title?: string
  content?: string
  excerpt?: string
  category?: string
}) {
  const updateData: any = {}
  
  if (updates.title) {
    updateData.title = updates.title
    // Update slug when title changes
    const newSlug = await generateUniqueSlug(updates.title)
    updateData.slug = {
      _type: 'slug',
      current: newSlug
    }
  }
  
  if (updates.content) {
    updateData.body = markdownToPortableText(updates.content)
  }
  
  if (updates.excerpt) {
    updateData.excerpt = updates.excerpt
  }
  
  if (updates.category) {
    updateData.categories = [updates.category]
  }

  try {
    const result = await client.patch(postId).set(updateData).commit()
    console.log('✅ Post updated successfully:', result._id)
    return result
  } catch (error) {
    console.error('❌ Error updating post:', error)
    throw error
  }
}

// Delete a post
export async function deletePost(postId: string) {
  try {
    const result = await client.delete(postId)
    console.log('✅ Post deleted successfully:', postId)
    return result
  } catch (error) {
    console.error('❌ Error deleting post:', error)
    throw error
  }
}

// Get all authors (for reference when creating posts)
export async function getAuthors() {
  const query = `*[_type == "author"] {
    _id,
    name,
    slug,
    bio
  }`
  
  try {
    const authors = await client.fetch(query)
    return authors
  } catch (error) {
    console.error('❌ Error fetching authors:', error)
    throw error
  }
}