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

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        console.log("API response:", result);

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
        const slideWidth = 564 + 40; // Width of one slide + gap between slides
        const offset = -currentIndex * 2 * slideWidth;  // Move by two slides each time
        slidesWrapper.style.transform = `translateX(${offset}px)`;

        document.querySelectorAll('.dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    }

    // Initialize the carousel
    updateCarousel();
}
