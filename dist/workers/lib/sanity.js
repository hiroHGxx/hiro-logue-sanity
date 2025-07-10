"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postQuery = exports.postsQuery = exports.client = void 0;
exports.urlFor = urlFor;
exports.getPosts = getPosts;
exports.getPost = getPost;
const client_1 = require("@sanity/client");
const image_url_1 = require("@sanity/image-url");
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION;
exports.client = (0, client_1.createClient)({
    projectId,
    dataset,
    apiVersion,
    useCdn: false, // Set to false for development
    token: process.env.SANITY_API_TOKEN,
});
const builder = (0, image_url_1.default)(exports.client);
function urlFor(source) {
    return builder.image(source);
}
// GROQ queries
exports.postsQuery = `*[_type == "post" && !(_id in path("drafts.**"))] | order(publishedAt desc) {
  _id,
  _createdAt,
  title,
  slug,
  mainImage,
  body,
  excerpt,
  publishedAt,
  categories,
  author->{
    name,
    image
  }
}`;
exports.postQuery = `*[_type == "post" && slug.current == $slug && !(_id in path("drafts.**"))][0] {
  _id,
  _createdAt,
  title,
  slug,
  mainImage,
  body,
  excerpt,
  publishedAt,
  categories,
  author->{
    name,
    image
  }
}`;
async function getPosts() {
    return await exports.client.fetch(exports.postsQuery);
}
async function getPost(slug) {
    return await exports.client.fetch(exports.postQuery, { slug });
}
