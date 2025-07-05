import { NextRequest, NextResponse } from 'next/server'
import { createPost, updatePost, deletePost, getAuthors } from '@/lib/sanity-mutations'
import { getPosts, getPost } from '@/lib/sanity'

// Create a new post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, excerpt, category, authorName } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Get or create author
    let authorId = null
    if (authorName) {
      const authors = await getAuthors()
      const existingAuthor = authors.find((author: any) => author.name === authorName)
      
      if (existingAuthor) {
        authorId = existingAuthor._id
      } else {
        // Create new author if doesn't exist
        const { createAuthor } = await import('@/lib/sanity-mutations')
        const newAuthor = await createAuthor({ name: authorName })
        authorId = newAuthor._id
      }
    }

    const result = await createPost({
      title,
      content,
      excerpt,
      category,
      authorId
    })

    return NextResponse.json({
      success: true,
      post: result,
      message: `記事「${title}」が正常に作成されました`
    })

  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}

// Get all posts
export async function GET(request: NextRequest) {
  try {
    const posts = await getPosts()
    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

// Update a post
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, content, excerpt, category } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const result = await updatePost(id, {
      title,
      content,
      excerpt,
      category
    })

    return NextResponse.json({
      success: true,
      post: result,
      message: `記事が正常に更新されました`
    })

  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
}

// Delete a post
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('id')

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    await deletePost(postId)

    return NextResponse.json({
      success: true,
      message: '記事が正常に削除されました'
    })

  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}