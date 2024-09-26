import { getPostApiEndpoint, getDeletePostApiEndpoint } from "./api.mjs";
import { showLoader, hideLoader } from "./loader.mjs";
import { showErrorNotification } from "./errorMessage.mjs";

// TinyMCE for edit modal
tinymce.init({
  selector: "#edit-text-input",
  menubar: false,
  toolbar:
    "bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist | link image undo redo",
  plugins: "lists link image",
  height: 400,
  content_css: "/css/styles.css",
  license_key: "gpl",
  content_style:
    "body { font-family: 'Mulish', sans-serif; padding: 15px; } ul, ol { padding-left: 20px; }",
});

// Fetch and display blog posts
async function fetchAndDisplayPosts() {
  try {
    showLoader("page-spinner");
    const token = localStorage.getItem("accessToken");
    const username = localStorage.getItem("username");

    if (!username || !token) {
      const errorMessage = "Missing username or token";
      console.error(errorMessage);
      showErrorNotification(errorMessage);
      return;
    }

    const response = await fetch(
      `https://v2.api.noroff.dev/blog/posts/${username}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorMessage = `Failed to fetch posts: ${response.statusText}`;
      console.error(errorMessage);
      showErrorNotification(errorMessage);
      return;
    }

    const data = await response.json();
    const postGrid = document.getElementById("post-grid");
    postGrid.innerHTML = "";

    if (data.data && data.data.length > 0) {
      data.data.forEach((post) => {
        const imageUrl =
          post.media && post.media.url
            ? post.media.url
            : "/assets/placeholder.jpg";
        const postCard = `
                    <div class="post-card">
                        <div class="post-image">
                            <img src="${imageUrl}" alt="Post image">
                        </div>
                        <div class="post-content">
                            <h2 class="post-title">${post.title}</h2>
                            <p class="post-date">Posted: ${new Date(
                              post.created
                            ).toLocaleDateString()}</p>
                        </div>
                        <div class="post-actions">
                            <button class="action-btn edit-btn" data-id="${
                              post.id
                            }"><i class="fa fa-pencil"></i></button>
                            <button class="action-btn view-btn" data-id="${
                              post.id
                            }"><i class="fa fa-eye"></i></button> <!-- View button -->
                            <button class="action-btn delete-btn" data-id="${
                              post.id
                            }"><i class="fa fa-trash"></i></button>
                        </div>
                    </div>
                `;
        postGrid.innerHTML += postCard;
      });

      document.querySelectorAll(".view-btn").forEach((btn) => {
        btn.addEventListener("click", (event) => {
          const postId = event.target.closest(".view-btn").dataset.id;
          window.location.href = `/post/index.html?postId=${postId}&fromEdit=true`;
        });
      });
    } else {
      postGrid.innerHTML = "<p>No blog posts available.</p>";
    }
  } catch (error) {
    const errorMessage = "Error fetching posts.";
    console.error(errorMessage, error);
    showErrorNotification(errorMessage);
  } finally {
    hideLoader("page-spinner");
  }
}

// Modal
function showModal() {
  const modal = document.getElementById("edit-modal");
  modal.classList.remove("hidden");
  modal.style.display = "flex"; // Ensure modal is visible
}

function hideModal() {
  const modal = document.getElementById("edit-modal");
  modal.classList.add("hidden");
  modal.style.display = "none"; // Ensure modal is hidden
}

document.querySelector(".close").addEventListener("click", hideModal);

document.addEventListener("click", async (event) => {
  if (event.target.closest(".edit-btn")) {
    const postId = event.target.closest(".edit-btn").dataset.id;
    const username = localStorage.getItem("username");
    const token = localStorage.getItem("accessToken");

    if (!username || !token) {
      const errorMessage = "Missing username or token";
      console.error(errorMessage);
      showErrorNotification(errorMessage);
      return;
    }

    try {
      showLoader("page-spinner");
      const apiEndpoint = getPostApiEndpoint(username, postId);
      const response = await fetch(apiEndpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorMessage = `Failed to fetch post details: ${response.statusText}`;
        console.error(errorMessage);
        showErrorNotification(errorMessage);
        return;
      }

      const post = await response.json();
      const postDetails = post.data ? post.data : post;

      document.getElementById("edit-title").value = postDetails.title || "";
      document.getElementById("edit-image-url").value =
        postDetails.media && postDetails.media.url ? postDetails.media.url : "";
      document.getElementById("edit-tags").value = Array.isArray(
        postDetails.tags
      )
        ? postDetails.tags.join(", ")
        : "";

      setTimeout(() => {
        const editor = tinymce.get("edit-text-input");
        if (editor) {
          editor.setContent(postDetails.body ? postDetails.body : "");
        }
      }, 100);

      showModal();

      const saveEditBtn = document.getElementById("save-edit-btn");
      saveEditBtn.removeEventListener("click", saveChanges);
      saveEditBtn.addEventListener("click", () => saveChanges(postId));
    } catch (error) {
      const errorMessage = "Error fetching post details.";
      console.error(errorMessage, error);
      showErrorNotification(errorMessage);
    } finally {
      hideLoader("page-spinner");
    }
  }
});

// Save the edited post
async function saveChanges(postId) {
  const username = localStorage.getItem("username");
  const token = localStorage.getItem("accessToken");
  const apiEndpoint = getPostApiEndpoint(username, postId);

  const updatedPost = {
    title: document.getElementById("edit-title").value,
    media: { url: document.getElementById("edit-image-url").value },
    body: tinymce.get("edit-text-input").getContent(),
    tags: document
      .getElementById("edit-tags")
      .value.split(",")
      .map((tag) => tag.trim()),
  };

  try {
    showLoader("page-spinner");
    const response = await fetch(apiEndpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedPost),
    });

    if (response.ok) {
      const notificationBox = document.getElementById("notification-box");
      notificationBox.textContent = "Post updated successfully!";
      notificationBox.classList.remove("hidden");
      notificationBox.classList.add("show");

      setTimeout(() => {
        notificationBox.classList.remove("show");
        notificationBox.classList.add("hidden");
        window.location.reload();
      }, 5000);
    } else {
      const errorData = await response.json();
      const errorMessage = `Failed to update post: ${
        errorData.message || "Unknown error"
      }`;
      console.error(errorMessage);
      showErrorNotification(errorMessage);
    }
  } catch (error) {
    const errorMessage = "Error updating post.";
    console.error(errorMessage, error);
    showErrorNotification(errorMessage);
  } finally {
    hideLoader("page-spinner");
  }
}

// Delete post
async function deletePost(postId) {
  const username = localStorage.getItem("username");
  const token = localStorage.getItem("accessToken");
  const apiEndpoint = getDeletePostApiEndpoint(username, postId);

  try {
    showLoader("page-spinner");
    const response = await fetch(apiEndpoint, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 204) {
      document
        .querySelector(`.delete-btn[data-id="${postId}"]`)
        .closest(".post-card")
        .remove();

      const notificationBox = document.getElementById("notification-box");
      notificationBox.textContent = "Post deleted successfully!";
      notificationBox.classList.remove("hidden");
      notificationBox.classList.add("show");

      setTimeout(() => {
        notificationBox.classList.remove("show");
        notificationBox.classList.add("hidden");
      }, 3000);
    } else {
      const errorMessage = "Failed to delete the post. Server error.";
      console.error(errorMessage);
      showErrorNotification(errorMessage);
    }
  } catch (error) {
    const errorMessage = "Error deleting post.";
    console.error(errorMessage, error);
    showErrorNotification(errorMessage);
  } finally {
    hideLoader("page-spinner");
  }
}

// Show delete confirmation box
function showDeleteConfirmation(postId) {
  const deleteConfirmBox = document.getElementById("delete-confirm-box");
  deleteConfirmBox.classList.remove("hidden");
  deleteConfirmBox.classList.add("show");

  const yesBtn = document.getElementById("confirm-delete-yes");
  const noBtn = document.getElementById("confirm-delete-no");

  yesBtn.replaceWith(yesBtn.cloneNode(true));
  noBtn.replaceWith(noBtn.cloneNode(true));

  document
    .getElementById("confirm-delete-yes")
    .addEventListener("click", () => {
      deletePost(postId);
      hideDeleteConfirmation();
    });

  document
    .getElementById("confirm-delete-no")
    .addEventListener("click", hideDeleteConfirmation);
}

function hideDeleteConfirmation() {
  const deleteConfirmBox = document.getElementById("delete-confirm-box");
  deleteConfirmBox.classList.remove("show");
  deleteConfirmBox.classList.add("hidden");
}

document.addEventListener("click", (event) => {
  const deleteBtn = event.target.closest(".delete-btn");
  if (deleteBtn) {
    const postId = deleteBtn.getAttribute("data-id");
    if (postId) {
      showDeleteConfirmation(postId);
    } else {
      const errorMessage = "No post ID found for delete button";
      console.error(errorMessage);
      showErrorNotification(errorMessage);
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const username = localStorage.getItem("username");
  if (username) {
    document.getElementById("username").textContent = username;
  }

  fetchAndDisplayPosts();

  const logoutButton = document.getElementById("logout-btn");
  logoutButton.addEventListener("click", () => logoutUser());
});

// Logout
function logoutUser() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("username");
  window.location.href = "/index.html";
}
