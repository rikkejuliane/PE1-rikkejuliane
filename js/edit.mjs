import { getPostApiEndpoint, getDeletePostApiEndpoint } from './api.mjs';  // Import the correct API endpoint functions

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
        console.log("Fetched posts:", data);  // Log the posts data to verify

        // Get the grid container
        const postGrid = document.getElementById('post-grid');

        // Clear the grid before adding posts
        postGrid.innerHTML = '';

        // Check if there are any posts
        if (data.data && data.data.length > 0) {
            // Loop through the blog posts and display them
            data.data.forEach(post => {
                // Check if media and media.url exist, if not provide a fallback image
                const imageUrl = post.media && post.media.url ? post.media.url : '/assets/placeholder.jpg'; // Provide a placeholder image path

                const postCard = `
                    <div class="post-card">
                        <div class="post-image">
                            <img src="${imageUrl}" alt="Post image">
                        </div>
                        <div class="post-content">
                            <h3 class="post-title">${post.title}</h3>
                            <p class="post-date">Posted: ${new Date(post.created).toLocaleDateString()}</p>
                        </div>
                        <div class="post-actions">
                            <button class="action-btn edit-btn" data-id="${post.id}"><i class="fa fa-pencil"></i></button>
                            <button class="action-btn view-btn" data-id="${post.id}"><i class="fa fa-eye"></i></button>
                            <button class="action-btn delete-btn" data-id="${post.id}"><i class="fa fa-trash"></i></button>
                        </div>
                    </div>
                `;

                // Insert each post card into the grid
                postGrid.innerHTML += postCard;
            });
        } else {
            postGrid.innerHTML = '<p>No blog posts available.</p>';
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
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

        // Fetch the blog post data using the correct endpoint
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
        const postDetails = post.data ? post.data : post;  // If data is wrapped under `data`

        // Populate modal with fetched data
        document.getElementById('edit-title').value = postDetails.title || '';
        document.getElementById('edit-image-url').value = postDetails.media && postDetails.media.url ? postDetails.media.url : '';
        document.getElementById('edit-tags').value = Array.isArray(postDetails.tags) ? postDetails.tags.join(', ') : '';

        setTimeout(() => {
            const editor = tinymce.get('edit-text-input');
            if (editor) {
                editor.setContent(postDetails.body ? postDetails.body : '');
            }
        }, 100);

        // Show the modal
        showModal();

        // Attach the click event to the Save Changes button
        const saveEditBtn = document.getElementById('save-edit-btn');
        saveEditBtn.removeEventListener('click', saveChanges);  // Ensure old event listeners are removed
        saveEditBtn.addEventListener('click', () => {
            console.log("Save button clicked!");  // Add log to verify click
            saveChanges(postId);  // Call the saveChanges function
        });
    }
});

// Function to save the edited post and show the notification
async function saveChanges(postId) {
    console.log("Attempting to save changes for post ID:", postId);  // Log to confirm save action is triggered

    const username = localStorage.getItem('username');
    const token = localStorage.getItem('accessToken');
    const apiEndpoint = getPostApiEndpoint(username, postId);

    const updatedPost = {
        title: document.getElementById('edit-title').value,
        media: {
            url: document.getElementById('edit-image-url').value,
        },
        body: tinymce.get('edit-text-input').getContent(),
        tags: document.getElementById('edit-tags').value.split(',').map(tag => tag.trim())
    };

    try {
        const response = await fetch(apiEndpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(updatedPost),
        });

        if (response.ok) {
            console.log("Post updated successfully!");

            // Show the notification box
            const notificationBox = document.getElementById('notification-box');
            console.log('Showing notification box');  // Debugging log
            notificationBox.textContent = 'Post updated successfully!';
            notificationBox.classList.remove('hidden');
            notificationBox.classList.add('show');

            // Hide the notification and reload after 5 seconds
            setTimeout(() => {
                console.log('Hiding notification box');  // Debugging log
                notificationBox.classList.remove('show');
                notificationBox.classList.add('hidden');

                // Reload the page to show updated post
                window.location.reload();
            }, 5000);  // 5 seconds
        } else {
            const errorData = await response.json();
            alert(`Failed to update post: ${errorData.message || 'Unknown error'}`);
            console.error("Error updating post:", errorData);
        }
    } catch (error) {
        console.error('Error updating post:', error);
        alert('An error occurred while updating the post.');
    }
}

// Attach event listeners to Delete buttons
document.addEventListener('click', (event) => {
    const deleteBtn = event.target.closest('.delete-btn');  // Ensure we're getting the delete button
    console.log('Clicked Element:', event.target);  // Log clicked element for debugging
    console.log('Closest Delete Button:', deleteBtn);  // Log closest delete button for debugging

    if (deleteBtn) {
        const postId = deleteBtn.getAttribute('data-id');  // Get the correct post ID from the button
        console.log(`Delete button clicked for post ID: ${postId}`);  // Log to check if delete button is clicked
        if (postId) {
            showDeleteConfirmation(postId);  // Trigger the delete confirmation popup
        } else {
            console.error('No post ID found for delete button');
        }
    }
});

// Function to show delete confirmation box
function showDeleteConfirmation(postId) {
    const deleteConfirmBox = document.getElementById('delete-confirm-box');
    console.log(`Showing delete confirmation for post ID: ${postId}`);  // Log to verify confirmation popup
    deleteConfirmBox.classList.remove('hidden');  // Show the confirmation modal
    deleteConfirmBox.classList.add('show');  // Explicitly add the show class for visibility

    // Attach "Yes" and "No" buttons event handlers
    const yesBtn = document.getElementById('confirm-delete-yes');
    const noBtn = document.getElementById('confirm-delete-no');

    // Reset event listeners to avoid duplication
    yesBtn.replaceWith(yesBtn.cloneNode(true));  // Reset "Yes" button
    noBtn.replaceWith(noBtn.cloneNode(true));  // Reset "No" button

    // Attach the "Yes" button handler to confirm deletion
    document.getElementById('confirm-delete-yes').addEventListener('click', () => {
        console.log(`Confirmed deletion for post ID: ${postId}`);
        deletePost(postId);  // Call deletePost function to delete the post
        hideDeleteConfirmation();  // Hide the modal after clicking "Yes"
    });

    // Attach the "No" button handler to cancel the deletion
    document.getElementById('confirm-delete-no').addEventListener('click', hideDeleteConfirmation);
}

// Function to hide delete confirmation box
function hideDeleteConfirmation() {
    const deleteConfirmBox = document.getElementById('delete-confirm-box');
    console.log('Hiding delete confirmation box');  // Log to confirm hiding
    deleteConfirmBox.classList.remove('show');  // Remove the show class
    deleteConfirmBox.classList.add('hidden');  // Add the hidden class
}


// Function to delete the post
async function deletePost(postId) {
    console.log(`Attempting to delete post with ID: ${postId}`);  // Log the delete action
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('accessToken');

    const apiEndpoint = getDeletePostApiEndpoint(username, postId);  // Use the correct DELETE API endpoint
    console.log(`API Endpoint for deletion: ${apiEndpoint}`);  // Log the API endpoint for debugging

    try {
        const response = await fetch(apiEndpoint, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });

        if (response.status === 204) {
            console.log(`Post with ID ${postId} deleted successfully`);  // Log successful deletion

            // Hide the delete confirmation box
            hideDeleteConfirmation();

            // Remove the post from the DOM
            document.querySelector(`.delete-btn[data-id="${postId}"]`).closest('.post-card').remove();

            // Show success notification
            const notificationBox = document.getElementById('notification-box');
            notificationBox.textContent = 'Post deleted successfully!';
            notificationBox.classList.remove('hidden');
            notificationBox.classList.add('show');

            // Hide notification after 3 seconds
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
    }
}

// Call the function to fetch and display posts when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const username = localStorage.getItem('username');
    if (username) {
        document.getElementById('username').textContent = username;
    } else {
        console.error('No username found in localStorage');
    }

    fetchAndDisplayPosts();

    // Add event listener to the logout button
    const logoutButton = document.getElementById('logout-btn');
    logoutButton.addEventListener('click', () => {
        logoutUser();
    });
});

// Function to log out the user
function logoutUser() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('username');
    window.location.href = '/index.html';
}
