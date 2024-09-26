import { getAllPostsApiEndpoint, defaultPublicUsername } from "./api.mjs";
import { showErrorNotification } from "./errorMessage.mjs"; // Import the notification function

// Fetch the 6 latest blogposts
export async function fetchLatestPosts(username) {
  try {
    const token = localStorage.getItem("accessToken");
    const headers = { "Content-Type": "application/json" };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const apiEndpoint = getAllPostsApiEndpoint(
      username || defaultPublicUsername
    );

    const response = await fetch(apiEndpoint, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorMessage = `Error fetching blog posts: ${response.status}`;
      console.error(errorMessage);
      showErrorNotification(errorMessage); // Show error to the user
      return [];
    }

    const result = await response.json();
    return result.data ? result.data.slice(0, 6) : [];
  } catch (error) {
    const errorMessage = "Error fetching blog posts.";
    console.error(errorMessage, error);
    showErrorNotification(errorMessage); // Show error to the user
    return [];
  }
}

// Display the carousel
export function createCarousel(posts) {
  if (posts.length === 0) {
    showErrorNotification("No posts to display in the carousel."); // Notify user if no posts
    return;
  }

  const carouselContainer = document.createElement("div");
  carouselContainer.className = "carousel-container";

  const slidesWrapper = document.createElement("div");
  slidesWrapper.className = "slides-wrapper";

  posts.forEach((post) => {
    const slide = document.createElement("div");
    slide.className = "carousel-slide";

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

    slide.addEventListener("click", () => {
      window.location.href = `/post/index.html?postId=${post.id}`;
    });

    slidesWrapper.appendChild(slide);
  });

  carouselContainer.appendChild(slidesWrapper);

  // Dots and navigation buttons
  const navigationContainer = document.createElement("div");
  navigationContainer.className = "navigation-container";

  const prevButton = document.createElement("button");
  prevButton.className = "carousel-prev";
  prevButton.innerHTML = "&lt;";
  prevButton.addEventListener("click", prevSlide);

  const nextButton = document.createElement("button");
  nextButton.className = "carousel-next";
  nextButton.innerHTML = "&gt;";
  nextButton.addEventListener("click", nextSlide);

  const dotsContainer = document.createElement("div");
  dotsContainer.className = "dots-container";
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.addEventListener("click", () => navigateToSlide(i));
    dotsContainer.appendChild(dot);
  }

  navigationContainer.appendChild(prevButton);
  navigationContainer.appendChild(dotsContainer);
  navigationContainer.appendChild(nextButton);
  carouselContainer.appendChild(navigationContainer);

  document.querySelector("#carousel-root").appendChild(carouselContainer);

  let currentIndex = 0;

  function navigateToSlide(index) {
    currentIndex = index;
    updateCarousel();
  }

  function prevSlide() {
    currentIndex = (currentIndex - 1 + 3) % 3;
    updateCarousel();
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % 3;
    updateCarousel();
  }

  function updateCarousel() {
    const slide = document.querySelector(".carousel-slide");
    const slidesWrapper = document.querySelector(".slides-wrapper");
    const slideWidth = slide.offsetWidth;
    const gap =
      parseInt(
        window.getComputedStyle(slidesWrapper).getPropertyValue("gap")
      ) || 0;
    const totalWidth = slideWidth + gap;
    const offset = -currentIndex * 2 * totalWidth;

    slidesWrapper.style.transform = `translateX(${offset}px)`;
    document.querySelectorAll(".dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === currentIndex);
    });
  }

  updateCarousel();
}
