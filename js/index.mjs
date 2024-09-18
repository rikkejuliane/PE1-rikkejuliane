import { fetchLatestPosts, createCarousel } from './carousel.mjs';

document.addEventListener('DOMContentLoaded', async () => {
    const username = localStorage.getItem('username');  // Fetch the username from local storage

    // Fetch the latest 6 posts using the blog name
    const posts = await fetchLatestPosts(username);

    // If posts are successfully fetched, create the carousel
    if (posts.length > 0) {
        createCarousel(posts);
    } else {
        console.log("No posts available to display.");
    }
});
