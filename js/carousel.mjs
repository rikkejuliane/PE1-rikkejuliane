import { getAllPostsApiEndpoint } from './api.mjs';

// Function to fetch the latest 6 posts from the API, passing the 'name' parameter
export async function fetchLatestPosts(username) {
    try {
        const token = localStorage.getItem('accessToken');
        if (!token || !username) {
            console.error("Missing accessToken or username");
            return [];
        }

        const response = await fetch(getAllPostsApiEndpoint(username), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,  // Use token for authenticated request
                'Content-Type': 'application/json'
            }
        });

        // Check if the response is okay
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Log the API response to inspect the structure
        console.log("API response:", result);

        // Check if result contains 'data' and it's an array
        if (Array.isArray(result.data) && result.data.length > 0) {
            return result.data.slice(0, 6);  // Get only the latest 6 posts
        } else {
            console.error("No posts found or unexpected data format: ", result);
            return [];
        }
    } catch (error) {
        console.error("Error fetching blog posts:", error);
        return [];
    }
}

// Function to create and display the carousel with the fetched posts
export function createCarousel(posts) {
    const carouselContainer = document.createElement('div');
    carouselContainer.className = 'carousel-container';

    // Create the wrapper for slides
    const slidesWrapper = document.createElement('div');
    slidesWrapper.className = 'slides-wrapper';

    // Generate slides for each post
    posts.forEach((post, index) => {
        // Check if the image exists, otherwise use a placeholder image
        const imageUrl = post.media && post.media.url ? post.media.url : '/assets/placeholder.jpg';

        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.innerHTML = `
            <img src="${imageUrl}" alt="${post.title}" />
            <p>${post.title}</p>
        `;
        slidesWrapper.appendChild(slide);
    });

    // Append slides wrapper to the main container
    carouselContainer.appendChild(slidesWrapper);

    // Create navigation dots
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'dots-container';
    for (let i = 0; i < 3; i++) {  // 3 dots for 3 sets of 2 slides
        const dot = document.createElement('span');
        dot.className = 'dot';
        dot.addEventListener('click', () => navigateToSlide(i));
        dotsContainer.appendChild(dot);
    }

    // Append dots container to the carousel
    carouselContainer.appendChild(dotsContainer);

    // Add previous and next navigation buttons
    const prevButton = document.createElement('button');
    prevButton.className = 'carousel-prev';
    prevButton.innerHTML = '&lt;';
    prevButton.addEventListener('click', prevSlide);

    const nextButton = document.createElement('button');
    nextButton.className = 'carousel-next';
    nextButton.innerHTML = '&gt;';
    nextButton.addEventListener('click', nextSlide);

    // Append navigation buttons to the carousel
    carouselContainer.appendChild(prevButton);
    carouselContainer.appendChild(nextButton);

    // Append the whole carousel to the root container in the HTML
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

    // Function to update carousel position and active dot
    function updateCarousel() {
        const offset = -currentIndex * 100;  // Shift by 100% per set of two slides
        slidesWrapper.style.transform = `translateX(${offset}%)`;

        // Update active dot
        document.querySelectorAll('.dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    }

    // Initialize the carousel
    updateCarousel();
}
