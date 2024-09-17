import { getCreatePostApiEndpoint } from './api.mjs';

tinymce.init({
    selector: '#text-input',
    menubar: false,
    toolbar: 'bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist | link image undo redo',
    plugins: 'lists link image',
    height: 650,
    content_css: '/css/styles.css', // This ensures that general styles from your site are applied
    content_style: "body { font-family: 'Mulish', sans-serif; padding: 15px; } ul, ol { padding-left: 20px; }", // Set Mulish font for editor content
    license_key: 'gpl', // Use GPL license
    setup: function (editor) {
        editor.on('init', function () {
            console.log('Editor initialized');
        });
    }
});

const publishPost = async () => {
    const title = document.getElementById('title').value;
    const body = tinymce.get('text-input').getContent();  // Get TinyMCE content
    const imageUrl = document.getElementById('image-url').value;
    const tagsInput = document.getElementById('tags').value;
    const tags = tagsInput.split(',').map(tag => tag.trim());

    if (!title || !body) {
        alert("Title and body are required.");
        return;
    }

    const username = localStorage.getItem('username');
    const apiEndpoint = getCreatePostApiEndpoint(username);

    const postData = {
        title: title,
        body: body,  // Use TinyMCE content
        media: imageUrl ? { url: imageUrl } : undefined,
        tags: tags.length > 0 ? tags : undefined,
    };

    const token = localStorage.getItem('accessToken'); // Retrieve the correct token

    if (!token) {
        alert("You are not authorized. Please log in.");
        return;
    }

    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, // Use the correct token
            },
            body: JSON.stringify(postData),
        });

        if (response.ok) {
            // Show the notification box
            const notificationBox = document.getElementById('notification-box');
            notificationBox.classList.remove('hidden');
            notificationBox.classList.add('show');

            // Hide the notification and redirect after 10 seconds
            setTimeout(() => {
                // Hide the notification
                notificationBox.classList.remove('show');
                notificationBox.classList.add('hidden');

                // Redirect to the blog post overview page
                window.location.href = '/post/edit.html';
            }, 5000); // 10 seconds (10000 milliseconds)
        } else {
            const errorData = await response.json();
            alert(`Failed to publish post: ${errorData.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error publishing post:', error);
        alert('An error occurred while publishing the post.');
    }
};

// Attach the publish event listener after defining the function
const publishButton = document.getElementById('publish-btn');
publishButton.addEventListener('click', publishPost);

window.onload = () => {
    console.log('Editor page loaded');
};
