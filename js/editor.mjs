import { getCreatePostApiEndpoint } from "./api.mjs";
import { showErrorNotification } from "./errorMessage.mjs";
import { showLoader, hideLoader } from "./loader.mjs";

showLoader("page-spinner");

// TinyMCE
tinymce.init({
  selector: "#text-input",
  menubar: false,
  toolbar:
    "bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist | link image undo redo",
  plugins: "lists link image",
  height: 650,
  content_css: "/css/styles.css",
  content_style:
    "body { font-family: 'Mulish', sans-serif; padding: 15px; } ul, ol { padding-left: 20px; }",
  license_key: "gpl",
  setup: function (editor) {
    editor.on("init", function () {
      hideLoader("page-spinner");
    });
  },
});

const publishPost = async () => {
  showLoader("page-spinner");

  const title = document.getElementById("title").value;
  const body = tinymce.get("text-input").getContent();
  const imageUrl = document.getElementById("image-url").value;
  const tagsInput = document.getElementById("tags").value;
  const tags = tagsInput.split(",").map((tag) => tag.trim());

  if (!title || !body) {
    hideLoader("page-spinner");
    const errorMessage = "Title and body are required.";
    showErrorNotification(errorMessage);
    return;
  }

  const username = localStorage.getItem("username");
  const apiEndpoint = getCreatePostApiEndpoint(username);

  const postData = {
    title: title,
    body: body,
    media: imageUrl ? { url: imageUrl } : undefined,
    tags: tags.length > 0 ? tags : undefined,
  };

  const token = localStorage.getItem("accessToken");

  if (!token) {
    hideLoader("page-spinner");
    const errorMessage = "You are not authorized. Please log in.";
    showErrorNotification(errorMessage);
    return;
  }

  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(postData),
    });

    if (response.ok) {
      const notificationBox = document.getElementById("notification-box");
      notificationBox.classList.remove("hidden");
      notificationBox.classList.add("show");

      setTimeout(() => {
        notificationBox.classList.remove("show");
        notificationBox.classList.add("hidden");
        window.location.href = "/post/edit.html";
      }, 5000);
    } else {
      const errorData = await response.json();
      const errorMessage = `Failed to publish post: ${
        errorData.message || "Unknown error"
      }`;
      console.error(errorMessage);
      showErrorNotification(errorMessage);
    }
  } catch (error) {
    const errorMessage = "An error occurred while publishing the post.";
    console.error(errorMessage, error);
    showErrorNotification(errorMessage);
  } finally {
    hideLoader("page-spinner");
  }
};

const publishButton = document.getElementById("publish-btn");
publishButton.addEventListener("click", publishPost);

window.onload = () => {};
