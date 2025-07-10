import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION!

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Set to false for development
  token: process.env.SANITY_API_TOKEN,
})

const builder = imageUrlBuilder(client)

export function urlFor(source: any) {
  return builder.image(source)
}

// Blog post type definition
export interface BlogPost {
  _id: string
  _createdAt: string
  title: string
  slug: {
    current: string
  }
  mainImage?: {
    asset: {
      _ref: string
    }
    alt?: string
  }
  heroImage?: {
    asset: {
      _ref: string
    }
    alt?: string
  }
  sectionImages?: Array<{
    _key: string
    asset: {
      _ref: string
    }
    alt?: string
  }>
  body: any[]
  excerpt?: string
  publishedAt: string
  categories?: string[]
  author?: {
    name: string
    image?: {
      asset: {
        _ref: string
      }
    }
  }
}

// GROQ queries
export const postsQuery = `*[_type == "post" && !(_id in path("drafts.**"))] | order(publishedAt desc) {
  _id,
  _createdAt,
  title,
  slug,
  mainImage,
  heroImage,
  sectionImages,
  body,
  excerpt,
  publishedAt,
  categories,
  author->{
    name,
    image
  }
}`

export const postQuery = `*[_type == "post" && slug.current == $slug && !(_id in path("drafts.**"))][0] {
  _id,
  _createdAt,
  title,
  slug,
  mainImage,
  heroImage,
  sectionImages,
  body,
  excerpt,
  publishedAt,
  categories,
  author->{
    name,
    image
  }
}`

export async function getPosts(): Promise<BlogPost[]> {
  return await client.fetch(postsQuery)
}

export async function getPost(slug: string): Promise<BlogPost> {
  return await client.fetch(postQuery, { slug })
}