import { getPostApiEndpoint, getDeletePostApiEndpoint } from './api.mjs';  // Import the correct API endpoint functions
import { showLoader, hideLoader } from './loader.mjs';  // Import the loader functions

// Initialize TinyMCE for edit modal
tinymce.init({
    selector: '#edit-text-input',
    menubar: false,
    toolbar: 'bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist | link image undo redo',
    plugins: 'lists link image',
    height: 400,
    content_css: '/css/styles.css',
    license_key: 'gpl',
    content_style: "body { font-family: 'Mulish', sans-serif; padding: 15px; } ul, ol { padding-left: 20px; }"
});

// Function to fetch and display blog posts
async function fetchAndDisplayPosts() {
    try {
        showLoader('page-spinner');  // Show spinner when fetching posts
        const token = localStorage.getItem('accessToken');
        const username = localStorage.getItem('username');

        if (!username || !token) {
            console.error("Missing username or token");
            return;
        }

        const response = await fetch(`https://v2.api.noroff.dev/blog/posts/${username}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }
        });

        if (!response.ok) {
            console.error("Failed to fetch posts", response.statusText);
            return;
        }

        const data = await response.json();
        const postGrid = document.getElementById('post-grid');
        postGrid.innerHTML = '';  // Clear the grid before adding posts

        if (data.data && data.data.length > 0) {
            data.data.forEach(post => {
                const imageUrl = post.media && post.media.url ? post.media.url : '/assets/placeholder.jpg';
                const postCard = `
                    <div class="post-card">
                        <div class="post-image">
                            <img src="${imageUrl}" alt="Post image">
                        </div>
                        <div class="post-content">
                            <h2 class="post-title">${post.title}</h2>
                            <p class="post-date">Posted: ${new Date(post.created).toLocaleDateString()}</p>
                        </div>
                        <div class="post-actions">
                            <button class="action-btn edit-btn" data-id="${post.id}"><i class="fa fa-pencil"></i></button>
                            <button class="action-btn view-btn" data-id="${post.id}"><i class="fa fa-eye"></i></button> <!-- View button -->
                            <button class="action-btn delete-btn" data-id="${post.id}"><i class="fa fa-trash"></i></button>
                        </div>
                    </div>
                `;
                postGrid.innerHTML += postCard;
            });

            // Add event listener for view buttons
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', (event) => {
                    const postId = event.target.closest('.view-btn').dataset.id;
                    window.location.href = `/post/index.html?postId=${postId}&fromEdit=true`;  // Append fromEdit=true to the URL
                });
            });

        } else {
            postGrid.innerHTML = '<p>No blog posts available.</p>';
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
    } finally {
        hideLoader('page-spinner');  // Hide spinner when fetching is done
    }
}

// Show the modal
function showModal() {
    const modal = document.getElementById('edit-modal');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';  // Ensure modal is visible
}

// Hide the modal
function hideModal() {
    const modal = document.getElementById('edit-modal');
    modal.classList.add('hidden');
    modal.style.display = 'none';  // Ensure modal is hidden
}

// Attach click event to close button in the modal
document.querySelector('.close').addEventListener('click', hideModal);

// Attach event listeners to Edit buttons
document.addEventListener('click', async (event) => {
    if (event.target.closest('.edit-btn')) {
        const postId = event.target.closest('.edit-btn').dataset.id;
        const username = localStorage.getItem('username');  // Ensure you get the correct username
        const token = localStorage.getItem('accessToken');

        if (!username || !token) {
            console.error("Missing username or token");
            return;
        }

        try {
            showLoader('page-spinner');  // Show spinner while fetching post details
            const apiEndpoint = getPostApiEndpoint(username, postId);
            const response = await fetch(apiEndpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                console.error("Failed to fetch post", response.statusText);
                return;
            }

            const post = await response.json();
            const postDetails = post.data ? post.data : post;

            document.getElementById('edit-title').value = postDetails.title || '';
            document.getElementById('edit-image-url').value = postDetails.media && postDetails.media.url ? postDetails.media.url : '';
            document.getElementById('edit-tags').value = Array.isArray(postDetails.tags) ? postDetails.tags.join(', ') : '';

            setTimeout(() => {
                const editor = tinymce.get('edit-text-input');
                if (editor) {
                    editor.setContent(postDetails.body ? postDetails.body : '');
                }
            }, 100);

            showModal();

            const saveEditBtn = document.getElementById('save-edit-btn');
            saveEditBtn.removeEventListener('click', saveChanges);
            saveEditBtn.addEventListener('click', () => saveChanges(postId));
        } catch (error) {
            console.error('Error fetching post details:', error);
        } finally {
            hideLoader('page-spinner');  // Hide spinner after post details are fetched
        }
    }
});

// Function to save the edited post and show the notification
async function saveChanges(postId) {
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('accessToken');
    const apiEndpoint = getPostApiEndpoint(username, postId);

    const updatedPost = {
        title: document.getElementById('edit-title').value,
        media: { url: document.getElementById('edit-image-url').value },
        body: tinymce.get('edit-text-input').getContent(),
        tags: document.getElementById('edit-tags').value.split(',').map(tag => tag.trim())
    };

    try {
        showLoader('page-spinner');  // Show spinner when saving changes
        const response = await fetch(apiEndpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(updatedPost),
        });

        if (response.ok) {
            const notificationBox = document.getElementById('notification-box');
            notificationBox.textContent = 'Post updated successfully!';
            notificationBox.classList.remove('hidden');
            notificationBox.classList.add('show');

            setTimeout(() => {
                notificationBox.classList.remove('show');
                notificationBox.classList.add('hidden');
                window.location.reload();  // Reload page after showing notification
            }, 5000);
        } else {
            const errorData = await response.json();
            alert(`Failed to update post: ${errorData.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error updating post:', error);
    } finally {
        hideLoader('page-spinner');  // Hide spinner after saving changes
    }
}

// Attach event listeners to Delete buttons
document.addEventListener('click', (event) => {
    const deleteBtn = event.target.closest('.delete-btn');

    if (deleteBtn) {
        const postId = deleteBtn.getAttribute('data-id');
        if (postId) {
            showDeleteConfirmation(postId);
        } else {
            console.error('No post ID found for delete button');
        }
    }
});

// Function to show delete confirmation box
function showDeleteConfirmation(postId) {
    const deleteConfirmBox = document.getElementById('delete-confirm-box');
    deleteConfirmBox.classList.remove('hidden');
    deleteConfirmBox.classList.add('show');

    const yesBtn = document.getElementById('confirm-delete-yes');
    const noBtn = document.getElementById('confirm-delete-no');

    yesBtn.replaceWith(yesBtn.cloneNode(true));
    noBtn.replaceWith(noBtn.cloneNode(true));

    document.getElementById('confirm-delete-yes').addEventListener('click', () => {
        deletePost(postId);
        hideDeleteConfirmation();
    });

    document.getElementById('confirm-delete-no').addEventListener('click', hideDeleteConfirmation);
}

// Function to hide delete confirmation box
function hideDeleteConfirmation() {
    const deleteConfirmBox = document.getElementById('delete-confirm-box');
    deleteConfirmBox.classList.remove('show');
    deleteConfirmBox.classList.add('hidden');
}

// Function to delete the post
async function deletePost(postId) {
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('accessToken');
    const apiEndpoint = getDeletePostApiEndpoint(username, postId);

    try {
        showLoader('page-spinner');  // Show spinner when deleting post
        const response = await fetch(apiEndpoint, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });

        if (response.status === 204) {
            document.querySelector(`.delete-btn[data-id="${postId}"]`).closest('.post-card').remove();

            const notificationBox = document.getElementById('notification-box');
            notificationBox.textContent = 'Post deleted successfully!';
            notificationBox.classList.remove('hidden');
            notificationBox.classList.add('show');

            setTimeout(() => {
                notificationBox.classList.remove('show');
                notificationBox.classList.add('hidden');
            }, 3000);
        } else {
            throw new Error('Failed to delete the post.');
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        alert('An error occurred while deleting the post.');
    } finally {
        hideLoader('page-spinner');  // Hide spinner after deleting post
    }
}

// Call the function to fetch and display posts when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const username = localStorage.getItem('username');
    if (username) {
        document.getElementById('username').textContent = username;
    }

    fetchAndDisplayPosts();

    const logoutButton = document.getElementById('logout-btn');
    logoutButton.addEventListener('click', () => logoutUser());
});

// Function to log out the user
function logoutUser() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('username');
    window.location.href = '/index.html';
}
