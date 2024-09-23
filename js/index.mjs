import { fetchLatestPosts, createCarousel } from './carousel.mjs';
import { getAllPostsApiEndpoint, getAllPostsByTagApiEndpoint, defaultPublicUsername } from './api.mjs';
import { showLoader, hideLoader } from './loader.mjs';  // Use existing loader functions

document.addEventListener('DOMContentLoaded', async () => {
    const accessToken = localStorage.getItem('accessToken');
    const username = localStorage.getItem('username');

    // Log the stored token and username for debugging
    console.log("Stored accessToken:", accessToken);
    console.log("Stored username:", username);

    // Get the login link element using the ID
    const loginLink = document.getElementById('login-link');

    // Check if the user is logged in
    if (accessToken && username) {
        // User is logged in, change the link to edit.html
        loginLink.href = './post/edit.html';
        console.log("User is logged in. Link changed to edit.html.");
    } else {
        // User is not logged in, keep the link to login.html
        loginLink.href = './account/login.html';
        console.log("User is not logged in. Link remains to login.html.");
    }

    // --- Carousel Section ---
    if (document.querySelector('#carousel-root')) {
        showLoader('carousel-spinner');  // Show the spinner for the carousel while loading

        try {
            // Fetch latest posts using either logged-in username or default public username
            const latestPosts = await fetchLatestPosts(username || defaultPublicUsername);

            if (latestPosts.length > 0) {
                console.log("Latest posts for carousel:", latestPosts);  // Debugging log
                createCarousel(latestPosts);  // Create and display the carousel
            } else {
                console.log("No posts available to display in carousel.");
            }
        } catch (error) {
            console.error("Error loading carousel posts:", error);
        } finally {
            hideLoader('carousel-spinner');  // Hide the spinner after the carousel has been loaded
        }
    }

    // --- Blog Grid Section ---
    if (document.querySelector('#blog-grid')) {
        showLoader('blog-spinner');  // Show the spinner for the blog grid

        try {
            const allPosts = await fetchBlogPosts(username || defaultPublicUsername);  // Fetch all posts
            if (allPosts.length > 0) {
                const tags = getUniqueTags(allPosts);  // Extract unique tags from posts
                populateTagDropdown(tags);  // Populate the tag dropdown

                const postsPerPage = 12;
                let currentPage = 1;

                // Initially display up to 12 posts
                displayPosts(allPosts.slice(0, postsPerPage), currentPage, postsPerPage);

                // If there are more than 12 posts, setup pagination
                if (allPosts.length > postsPerPage) {
                    setupPagination(allPosts, postsPerPage);
                }

                // Set up search functionality
                const searchInput = document.getElementById('blog-search');
                searchInput.addEventListener('input', () => {
                    const searchTerm = searchInput.value.toLowerCase();
                    const filteredPosts = filterPosts(allPosts, searchTerm);
                    displayPosts(filteredPosts.slice(0, postsPerPage), 1, postsPerPage);  // Reset to first page when searching
                    if (filteredPosts.length > postsPerPage) {
                        setupPagination(filteredPosts, postsPerPage);  // Update pagination for filtered results
                    } else {
                        document.getElementById('pagination').innerHTML = '';  // Remove pagination if filtered results < 12
                    }
                });

                // Set up tag filter functionality
                const tagDropdown = document.getElementById('blog-tags');
                tagDropdown.addEventListener('change', async () => {
                    const selectedTag = tagDropdown.value;
                    if (selectedTag) {
                        const filteredPostsByTag = await fetchPostsByTag(username || defaultPublicUsername, selectedTag);  // Fetch posts by tag
                        displayPosts(filteredPostsByTag, 1, postsPerPage);  // Display filtered posts by tag
                        if (filteredPostsByTag.length > postsPerPage) {
                            setupPagination(filteredPostsByTag, postsPerPage);
                        } else {
                            document.getElementById('pagination').innerHTML = '';  // Remove pagination if filtered results < 12
                        }
                    } else {
                        displayPosts(allPosts.slice(0, postsPerPage), 1, postsPerPage);  // Reset to all posts if no tag is selected
                        setupPagination(allPosts, postsPerPage);  // Reset pagination for all posts
                    }
                });
            } else {
                console.log("No posts available to display in blog grid.");
            }
        } catch (error) {
            console.error("Error loading blog posts:", error);
        } finally {
            hideLoader('blog-spinner');  // Hide the spinner after the blog posts are loaded
        }
    }
});

// --- Function to Fetch Blog Posts for the Main Blog Section ---
async function fetchBlogPosts(username) {
    try {
        const token = localStorage.getItem('accessToken');
        const headers = { 'Content-Type': 'application/json' };

        // Only add authorization if token exists and the user is logged in
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const apiEndpoint = getAllPostsApiEndpoint(username || defaultPublicUsername);

        const response = await fetch(apiEndpoint, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            console.error(`Error fetching blog posts: ${response.status}`);
            return [];
        }

        const result = await response.json();
        return result.data || [];  // Return posts or an empty array if none are found
    } catch (error) {
        console.error("Error fetching blog posts:", error);
        return [];
    }
}

// --- Function to Fetch Posts by Tag ---
async function fetchPostsByTag(username, tag) {
    try {
        const token = localStorage.getItem('accessToken');
        const headers = { 'Content-Type': 'application/json' };

        // Only add authorization if token exists and the user is logged in
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(getAllPostsByTagApiEndpoint(username || defaultPublicUsername, tag), {
            method: 'GET',
            headers
        });

        if (!response.ok) throw new Error(`Error fetching posts by tag: ${response.status}`);
        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error(error);
        return [];
    }
}

// --- Function to Display Posts ---
function displayPosts(posts, page, postsPerPage) {
    const blogGrid = document.getElementById('blog-grid');
    blogGrid.innerHTML = '';  // Clear the grid

    const startIndex = (page - 1) * postsPerPage;
    const endIndex = page * postsPerPage;
    const currentPosts = posts.slice(startIndex, endIndex);

    currentPosts.forEach(post => {
        const imageUrl = post.media && post.media.url ? post.media.url : '/assets/placeholder.jpg';
        const blogCard = document.createElement('div');
        blogCard.classList.add('blog-card');
        blogCard.innerHTML = `
            <img src="${imageUrl}" alt="${post.title}">
            <div class="blog-text-wrapper">
                <p>${post.title}</p>
            </div>
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
    paginationContainer.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;

        if (i === 1) {
            pageButton.classList.add('active');
        }

        pageButton.addEventListener('click', () => {
            document.querySelectorAll('.pagination button').forEach(btn => btn.classList.remove('active'));
            pageButton.classList.add('active');
            displayPosts(posts, i, postsPerPage);
        });

        paginationContainer.appendChild(pageButton);
    }
}

// --- Function to Filter Posts by Search Term (Title or Tags) ---
function filterPosts(posts, searchTerm) {
    return posts.filter(post => {
        const titleMatches = post.title.toLowerCase().includes(searchTerm);
        const tagMatches = post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        return titleMatches || tagMatches;
    });
}

// --- Function to Get Unique Tags from Posts ---
function getUniqueTags(posts) {
    const tags = new Set();
    posts.forEach(post => {
        if (post.tags && post.tags.length > 0) {
            post.tags.forEach(tag => tags.add(tag));
        }
    });
    return Array.from(tags);
}

// --- Function to Populate Tag Dropdown ---
function populateTagDropdown(tags) {
    const tagDropdown = document.getElementById('blog-tags');
    tags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagDropdown.appendChild(option);
    });
}
