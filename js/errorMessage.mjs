export function showErrorNotification(message) {
  let notification = document.querySelector(".notification");
  if (!notification) {
    notification = document.createElement("div");
    notification.className = "notification";
    document.body.appendChild(notification);
  }

  notification.textContent = message;

  notification.classList.add("show");

  setTimeout(() => {
    notification.classList.remove("show");
  }, 5000);
}
