import { getPostApiEndpoint } from './api.mjs';

document.addEventListener('DOMContentLoaded', async () => {
    const username = localStorage.getItem('username');
    const urlParams = new URLSearchParams(window.location.search);  // Get URL parameters
    const postId = urlParams.get('postId');  // Extract the postId from the URL

    console.log("Extracted postId:", postId);  // Log to see if it's working

    if (postId) {
        await fetchAndDisplayPost(postId, username);
    } else {
        console.error("No postId found in the URL");
    }
});


// Function to fetch and display a single post on the page
async function fetchAndDisplayPost(postId, username) {
    try {
        const token = localStorage.getItem('accessToken');
        const apiUrl = getPostApiEndpoint(username, postId);
        console.log("Fetching post from API:", apiUrl);  // Log the API URL being used

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch post: ${response.status}`);
        }

        const post = await response.json();
        console.log("Fetched post data:", post);  // Log the fetched post data
        displayPost(post);

    } catch (error) {
        console.error("Error fetching the post:", error);
    }
}


// Function to display the fetched post on the page
function displayPost(post) {
    const postTitle = document.getElementById('post-title');
    const postBanner = document.getElementById('post-banner');  // Banner image
    const postBody = document.getElementById('post-body');
    const postMeta = document.getElementById('post-meta');  // Meta section for date, link icon, author

    console.log("Rendering post:", post);  // Log the post data before rendering

    // Access the data property in the post object
    const postData = post.data;

    // 1. Display the banner image (if available)
    if (postBanner) {
        if (postData.media && postData.media.url) {
            postBanner.src = postData.media.url;
            postBanner.alt = postData.media.alt || 'Post banner image';
            postBanner.style.display = 'block';  // Ensure the banner is displayed
        } else {
            postBanner.style.display = 'none';  // Hide banner if no URL is available
        }
    }

    // 2. Display the post title
    if (postTitle) {
        postTitle.textContent = postData.title || 'Untitled';  // Fallback if title is missing
    }

    // 3. Render the post body (which may contain HTML content from TinyMCE)
    if (postBody) {
        postBody.innerHTML = postData.body || 'No content available';  // Use innerHTML to render the full body content (with images and paragraphs)
    }

    // 4. Render the post meta information (published date, copy link, author)
    if (postMeta) {
        const publishedDate = new Date(postData.created).toLocaleDateString();  // Format date
        const authorName = postData.author ? postData.author.name : 'Unknown author';
        const postUrl = window.location.href;  // Get the current post URL

        postMeta.innerHTML = `
            <hr>  <!-- Line to separate post from meta info -->
            <p>Published: ${publishedDate} - 
            <a href="#" id="copy-link" title="Copy Link" class="tooltip">
                <i class="fas fa-link"></i><span class="tooltiptext" id="tooltip-text">Copy Link</span>
            </a> - 
            Author: ${authorName}</p>
        `;

        // Add copy-to-clipboard functionality for the post URL
        const copyLink = document.getElementById('copy-link');
        const tooltipText = document.getElementById('tooltip-text');

        copyLink.addEventListener('click', (e) => {
            e.preventDefault();
            navigator.clipboard.writeText(postUrl)
                .then(() => {
                    // Show "Copied!" in the tooltip
                    tooltipText.textContent = 'Copied!';
                    setTimeout(() => {
                        tooltipText.textContent = 'Copy Link';  // Reset the tooltip text after 2 seconds
                    }, 2000);
                })
                .catch((err) => {
                    console.error('Failed to copy URL: ', err);
                });
        });
    }
}
