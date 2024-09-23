import { getPostApiEndpoint, defaultPublicUsername } from './api.mjs';  // Import defaultPublicUsername
import { showLoader, hideLoader } from './loader.mjs';  // Import show/hide loader functions

document.addEventListener('DOMContentLoaded', async () => {
    const accessToken = localStorage.getItem('accessToken');  // Get accessToken from localStorage
    const username = localStorage.getItem('username') || defaultPublicUsername;  // Get username from localStorage

    // Get the login link element
    const loginLink = document.getElementById('login-link');

    // Check if user is logged in by checking the accessToken
    if (accessToken) {
        // User is logged in, update the login link to point to the edit page
        loginLink.href = '/post/edit.html';
        console.log("User is logged in. Login link updated to /post/edit.html.");
    } else {
        // User is not logged in, set the link to the login page
        loginLink.href = '/account/login.html';
        console.log("User is not logged in. Login link remains to /account/login.html.");
    }

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('postId');  // Extract postId from the URL
    const fromEdit = urlParams.get('fromEdit');  // Check if the user came from the edit page

    // Get the back button element
    const backButton = document.querySelector('.back-btn').parentElement;

    // Check if the user is logged in and came from the edit page
    if (accessToken && fromEdit === 'true') {
        backButton.href = '/post/edit.html';  // Redirect back to the edit page if the user came from edit
        console.log("User came from the edit page. Back button redirects to edit page.");
    } else {
        backButton.href = '/index.html';  // Otherwise, go back to the index page
        console.log("User did not come from edit page or is not logged in. Back button redirects to index.");
    }

    if (postId) {
        showLoader('post-spinner');  // Show spinner while fetching post
        await fetchAndDisplayPost(postId, username);  // Fetch and display the post
    } else {
        console.error("No postId found in the URL");
    }
});

// Function to fetch and display a single post on the page
async function fetchAndDisplayPost(postId, username) {
    try {
        const token = localStorage.getItem('accessToken');  // Get accessToken if logged in
        const apiUrl = getPostApiEndpoint(username, postId);  // Use logged-in username or defaultPublicUsername

        console.log("Fetching post from API endpoint:", apiUrl);

        // Set up headers; only add Authorization if token exists
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(apiUrl, { method: 'GET', headers });

        if (!response.ok) {
            throw new Error(`Failed to fetch post: ${response.status}`);
        }

        const post = await response.json();
        console.log("Fetched post data:", post);  // Log fetched post data
        displayPost(post);

    } catch (error) {
        console.error("Error fetching the post:", error);
    } finally {
        hideLoader('post-spinner');  // Hide the spinner after loading the post
    }
}

// Function to display the fetched post on the page
function displayPost(post) {
    const postTitle = document.getElementById('post-title');
    const postBanner = document.getElementById('post-banner');
    const postBody = document.getElementById('post-body');
    const postMeta = document.getElementById('post-meta');

    console.log("Rendering post on the page:", post);

    const postData = post.data;

    // 1. Display the banner image if available
    if (postBanner && postData.media && postData.media.url) {
        postBanner.src = postData.media.url;
        postBanner.alt = postData.media.alt || 'Post banner image';
        postBanner.style.display = 'block';
    } else {
        postBanner.style.display = 'none';
    }

    // 2. Display the post title
    if (postTitle) {
        postTitle.textContent = postData.title || 'Untitled';
    }

    // 3. Display the post body
    if (postBody) {
        postBody.innerHTML = postData.body || 'No content available';
    }

    // 4. Display the post meta information
    if (postMeta) {
        const publishedDate = new Date(postData.created).toLocaleDateString();
        const authorName = postData.author ? postData.author.name : 'Unknown author';
        const postUrl = window.location.href;

        postMeta.innerHTML = `
            <p>Published: ${publishedDate}  
            <a href="#" id="copy-link" title="Copy Link" class="tooltip">
                <i class="fas fa-link"></i><span class="tooltiptext" id="tooltip-text">Copy Link</span>
            </a> 
            Author: ${authorName}</p>
        `;

        // Add copy-to-clipboard functionality for the post URL
        const copyLink = document.getElementById('copy-link');
        const tooltipText = document.getElementById('tooltip-text');

        copyLink.addEventListener('click', (e) => {
            e.preventDefault();
            navigator.clipboard.writeText(postUrl)
                .then(() => {
                    tooltipText.textContent = 'Copied!';
                    setTimeout(() => {
                        tooltipText.textContent = 'Copy Link';
                    }, 2000);
                })
                .catch((err) => {
                    console.error('Failed to copy URL:', err);
                });
        });
    }
}
