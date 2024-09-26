import { fetchLatestPosts, createCarousel } from './carousel.mjs';
import { getAllPostsApiEndpoint, getAllPostsByTagApiEndpoint, defaultPublicUsername } from './api.mjs';
import { showLoader, hideLoader } from './loader.mjs';
import { showErrorNotification } from './errorMessage.mjs';

document.addEventListener('DOMContentLoaded', async () => {
    const accessToken = localStorage.getItem('accessToken');
    const username = localStorage.getItem('username');

    const loginLink = document.getElementById('login-link');

    if (accessToken && username) {
        loginLink.href = './post/edit.html';
    } else {
        loginLink.href = './account/login.html';
    }

    // Carousel
    if (document.querySelector('#carousel-root')) {
        showLoader('carousel-spinner');

        try {
            const latestPosts = await fetchLatestPosts(username || defaultPublicUsername);

            if (latestPosts.length > 0) {
                createCarousel(latestPosts);
            }
        } catch (error) {
            console.error("Error loading carousel posts:", error);
            showErrorNotification(`Error loading carousel: ${error.message}`);
        } finally {
            hideLoader('carousel-spinner');
        }
    }

    // Blog-grid
    if (document.querySelector('#blog-grid')) {
        showLoader('blog-spinner');

        try {
            const allPosts = await fetchBlogPosts(username || defaultPublicUsername);
            if (allPosts.length > 0) {
                const tags = getUniqueTags(allPosts);
                populateTagDropdown(tags);

                const postsPerPage = 12;
                let currentPage = 1;

                displayPosts(allPosts.slice(0, postsPerPage), currentPage, postsPerPage);

                if (allPosts.length > postsPerPage) {
                    setupPagination(allPosts, postsPerPage);
                }

                const searchInput = document.getElementById('blog-search');
                searchInput.addEventListener('input', () => {
                    const searchTerm = searchInput.value.toLowerCase();
                    const filteredPosts = filterPosts(allPosts, searchTerm);
                    displayPosts(filteredPosts.slice(0, postsPerPage), 1, postsPerPage);
                    if (filteredPosts.length > postsPerPage) {
                        setupPagination(filteredPosts, postsPerPage);
                    } else {
                        document.getElementById('pagination').innerHTML = '';
                    }
                });

                const tagDropdown = document.getElementById('blog-tags');
                tagDropdown.addEventListener('change', async () => {
                    const selectedTag = tagDropdown.value;
                    if (selectedTag) {
                        const filteredPostsByTag = await fetchPostsByTag(username || defaultPublicUsername, selectedTag);
                        displayPosts(filteredPostsByTag, 1, postsPerPage);
                        if (filteredPostsByTag.length > postsPerPage) {
                            setupPagination(filteredPostsByTag, postsPerPage);
                        } else {
                            document.getElementById('pagination').innerHTML = '';
                        }
                    } else {
                        displayPosts(allPosts.slice(0, postsPerPage), 1, postsPerPage);
                        setupPagination(allPosts, postsPerPage);
                    }
                });
            } else {
                console.log("No posts available to display in blog grid.");
            }
        } catch (error) {
            console.error("Error loading blog posts:", error);
            showErrorNotification(`Error loading blog posts: ${error.message}`);
        } finally {
            hideLoader('blog-spinner');
        }
    }
});

async function fetchBlogPosts(username) {
    try {
        const token = localStorage.getItem('accessToken');
        const headers = { 'Content-Type': 'application/json' };

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
            showErrorNotification(`Error fetching blog posts: ${response.status}`);
            return [];
        }

        const result = await response.json();
        return result.data || [];
    } catch (error) {
        console.error("Error fetching blog posts:", error);
        showErrorNotification(`Error fetching blog posts: ${error.message}`);
        return [];
    }
}

async function fetchPostsByTag(username, tag) {
    try {
        const token = localStorage.getItem('accessToken');
        const headers = { 'Content-Type': 'application/json' };

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
        showErrorNotification(`Error fetching posts by tag: ${error.message}`);
        return [];
    }
}

function displayPosts(posts, page, postsPerPage) {
    const blogGrid = document.getElementById('blog-grid');
    blogGrid.innerHTML = '';

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

// Pagination
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

// Search
function filterPosts(posts, searchTerm) {
    return posts.filter(post => {
        const titleMatches = post.title.toLowerCase().includes(searchTerm);
        const tagMatches = post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        return titleMatches || tagMatches;
    });
}

// Tags
function getUniqueTags(posts) {
    const tags = new Set();
    posts.forEach(post => {
        if (post.tags && post.tags.length > 0) {
            post.tags.forEach(tag => tags.add(tag));
        }
    });
    return Array.from(tags);
}

function populateTagDropdown(tags) {
    const tagDropdown = document.getElementById('blog-tags');
    tags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagDropdown.appendChild(option);
    });
}
