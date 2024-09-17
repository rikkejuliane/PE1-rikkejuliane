const BASE_API_URL = 'https://v2.api.noroff.dev';


// Login & register
export const REGISTER_API_ENDPOINT = `${BASE_API_URL}/auth/register`;
export const LOGIN_API_ENDPOINT = `${BASE_API_URL}/auth/login`;


// Create new post
export const getCreatePostApiEndpoint = (username) => `${BASE_API_URL}/blog/posts/${username}`;

//Update post by ID
export const getPostApiEndpoint = (username, postId) => `${BASE_API_URL}/blog/posts/${username}/${postId}`;

// Delete a post by ID
export const getDeletePostApiEndpoint = (username, postId) => `${BASE_API_URL}/blog/posts/${username}/${postId}`;