import { fetchLatestPosts, createCarousel } from './carousel.mjs';
import { getAllPostsApiEndpoint } from './api.mjs';  // Assuming API functions are here

document.addEventListener('DOMContentLoaded', async () => {
    const username = localStorage.getItem('username');

    // --- Carousel Section ---
    if (document.querySelector('#carousel-root')) {
        const latestPosts = await fetchLatestPosts(username);

        if (latestPosts.length > 0) {
            createCarousel(latestPosts);  // Create and display the carousel
        } else {
            console.log("No posts available to display.");
        }
    }

    // --- Main Blog Section with Pagination ---
    if (document.querySelector('#blog-grid')) {
        const allPosts = await fetchBlogPosts(username);  // Fetch all posts
        const postsPerPage = 6;
        let currentPage = 1;

        // Make sure the allPosts array is passed to the display and pagination functions
        displayPosts(allPosts, currentPage, postsPerPage);
        setupPagination(allPosts, postsPerPage);  // Now we pass the posts array to the setupPagination
    }
});

// --- Function to Fetch Blog Posts for the Main Blog Section ---
async function fetchBlogPosts(username) {
    try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(getAllPostsApiEndpoint(username), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) throw new Error(`Error fetching blog posts: ${response.status}`);
        const result = await response.json();
        return result.data;  // Assuming posts are inside the `data` field
    } catch (error) {
        console.error(error);
        return [];
    }
}

// --- Function to Display Posts in the Main Blog Section ---
function displayPosts(posts, page, postsPerPage) {
    const blogGrid = document.getElementById('blog-grid');
    blogGrid.innerHTML = '';  // Clear the grid

    // Calculate start and end index for the current page
    const startIndex = (page - 1) * postsPerPage;
    const endIndex = page * postsPerPage;

    // Slice the posts for the current page
    const currentPosts = posts.slice(startIndex, endIndex);

    // Render the blog cards
    currentPosts.forEach(post => {
        const imageUrl = post.media && post.media.url ? post.media.url : '/assets/placeholder.jpg';

        const blogCard = document.createElement('div');
        blogCard.classList.add('blog-card');

        blogCard.innerHTML = `
            <img src="${imageUrl}" alt="${post.title}">
            <p>${post.title}</p>
        `;

        blogCard.addEventListener('click', () => {
            window.location.href = `/post/index.html?postId=${post.id}`;
        });

        blogGrid.appendChild(blogCard);
    });
}

// --- Function to Set Up Pagination ---
function setupPagination(posts, postsPerPage) {
    const totalPages = Math.ceil(posts.length / postsPerPage);
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';  // Clear pagination

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;

        // Only add 'active' class if it's the first page, skip adding if it's not.
        if (i === 1) {
            pageButton.classList.add('active');
        }

        pageButton.addEventListener('click', () => {
            document.querySelectorAll('.pagination button').forEach(btn => btn.classList.remove('active'));
            pageButton.classList.add('active');
            displayPosts(posts, i, postsPerPage);  // Display posts for the selected page
        });

        paginationContainer.appendChild(pageButton);
    }
}

