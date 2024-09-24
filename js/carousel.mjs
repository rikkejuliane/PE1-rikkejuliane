import { getAllPostsApiEndpoint, defaultPublicUsername } from './api.mjs';  // Import defaultPublicUsername

// Function to fetch the latest 6 posts
export async function fetchLatestPosts(username) {
    try {
        const token = localStorage.getItem('accessToken');
        const headers = { 'Content-Type': 'application/json' };

        // Only add authorization if token exists and the user is logged in
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Use the logged-in user's username or default public username if logged out
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
        console.log("Fetched posts:", result.data);  // Debugging log for fetched posts
        return result.data ? result.data.slice(0, 6) : [];  // Return latest 6 posts or empty array
    } catch (error) {
        console.error("Error fetching blog posts:", error);
        return [];
    }
}

// Function to create and display the carousel with the fetched posts
export function createCarousel(posts) {
    console.log("Posts for carousel:", posts);  // Debugging log for posts in carousel

    if (posts.length === 0) {
        console.log("No posts to display in the carousel.");
        return;
    }

    const carouselContainer = document.createElement('div');
    carouselContainer.className = 'carousel-container';

    const slidesWrapper = document.createElement('div');
    slidesWrapper.className = 'slides-wrapper';

    posts.forEach((post) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';

        // Only include an image if the post has a media URL
        if (post.media && post.media.url) {
            slide.innerHTML = `
                <img src="${post.media.url}" alt="${post.title}" />
                <div class="carousel-text-wrapper">
                    <p>${post.title}</p>
                </div>
            `;
        } else {
            slide.innerHTML = `
                <div class="carousel-text-wrapper">
                    <p>${post.title}</p>
                </div>
            `;
        }

        slide.addEventListener('click', () => {
            window.location.href = `/post/index.html?postId=${post.id}`;
        });

        slidesWrapper.appendChild(slide);
    });

    carouselContainer.appendChild(slidesWrapper);

    // Create the dots and navigation buttons
    const navigationContainer = document.createElement('div');
    navigationContainer.className = 'navigation-container';

    const prevButton = document.createElement('button');
    prevButton.className = 'carousel-prev';
    prevButton.innerHTML = '&lt;';
    prevButton.addEventListener('click', prevSlide);

    const nextButton = document.createElement('button');
    nextButton.className = 'carousel-next';
    nextButton.innerHTML = '&gt;';
    nextButton.addEventListener('click', nextSlide);

    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'dots-container';
    for (let i = 0; i < 3; i++) {  // 3 dots for 3 sets of 2 slides
        const dot = document.createElement('span');
        dot.className = 'dot';
        dot.addEventListener('click', () => navigateToSlide(i));
        dotsContainer.appendChild(dot);
    }

    navigationContainer.appendChild(prevButton);
    navigationContainer.appendChild(dotsContainer);
    navigationContainer.appendChild(nextButton);

    carouselContainer.appendChild(navigationContainer);

    document.querySelector('#carousel-root').appendChild(carouselContainer);

    let currentIndex = 0;

    // Functions for carousel navigation
    function navigateToSlide(index) {
        currentIndex = index;
        updateCarousel();
    }

    function prevSlide() {
        currentIndex = (currentIndex - 1 + 3) % 3;  // Navigate through 3 sets
        updateCarousel();
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % 3;
        updateCarousel();
    }

    function updateCarousel() {
        const slide = document.querySelector('.carousel-slide');
        const slideWidth = slide.offsetWidth + 30; // Add the gap between slides dynamically
        const offset = -currentIndex * 2 * slideWidth;  // Move by two slides each time
        slidesWrapper.style.transform = `translateX(${offset}px)`;
    
        document.querySelectorAll('.dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    }

    // Initialize the carousel
    updateCarousel();
}
