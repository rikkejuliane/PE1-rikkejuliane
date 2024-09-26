import { getPostApiEndpoint, defaultPublicUsername } from './api.mjs';
import { showLoader, hideLoader } from './loader.mjs';
import { showErrorNotification } from './errorMessage.mjs';

document.addEventListener('DOMContentLoaded', async () => {
    const accessToken = localStorage.getItem('accessToken');
    const username = localStorage.getItem('username') || defaultPublicUsername;

    const loginLink = document.getElementById('login-link');

    if (accessToken) {
        loginLink.href = '/post/edit.html';
    } else {
        loginLink.href = '/account/login.html';
    }

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('postId');
    const fromEdit = urlParams.get('fromEdit');

    const backButton = document.querySelector('.back-btn').parentElement;

    // Check if the user is logged in and came from the edit page
    if (accessToken && fromEdit === 'true') {
        backButton.href = '/post/edit.html';
    } else {
        backButton.href = '/index.html';
    }

    if (postId) {
        showLoader('post-spinner');
        await fetchAndDisplayPost(postId, username);
    } else {
        const errorMessage = "No postId found in the URL";
        console.error(errorMessage);
        showErrorNotification(errorMessage);
    }
});

// Fetch and display a single post
async function fetchAndDisplayPost(postId, username) {
    try {
        const token = localStorage.getItem('accessToken');
        const apiUrl = getPostApiEndpoint(username, postId);

        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(apiUrl, { method: 'GET', headers });

        if (!response.ok) {
            throw new Error(`Failed to fetch post: ${response.status}`);
        }

        const post = await response.json();
        displayPost(post);

    } catch (error) {
        console.error("Error fetching the post:", error);
        showErrorNotification(`Error fetching the post: ${error.message}`);
    } finally {
        hideLoader('post-spinner');
    }
}

// Display the fetched post on the page
function displayPost(post) {
    const postTitle = document.getElementById('post-title');
    const postBanner = document.getElementById('post-banner');
    const postBody = document.getElementById('post-body');
    const postMeta = document.getElementById('post-meta');

    const postData = post.data;

    // 1. Display banner image
    if (postBanner && postData.media && postData.media.url) {
        postBanner.src = postData.media.url;
        postBanner.alt = postData.media.alt || 'Post banner image';
        postBanner.style.display = 'block';
    } else {
        postBanner.src = '/assets/placeholderimg.jpg';
        postBanner.alt = 'Placeholder image';
        postBanner.style.display = 'block';
    }

    // 2. Display post title
    if (postTitle) {
        postTitle.textContent = postData.title || 'Untitled';
    }

    // 3. Display post body
    if (postBody) {
        postBody.innerHTML = postData.body || 'No content available';
    }

    // 4. Display post meta
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
                    showErrorNotification('Failed to copy URL');
                });
        });
    }
}
