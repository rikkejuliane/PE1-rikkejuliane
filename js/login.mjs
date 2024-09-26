import { LOGIN_API_ENDPOINT } from "./api.mjs";
import { showLoader, hideLoader } from "./loader.mjs";

const loginForm = document.querySelector("#login-form");
const emailInput = document.querySelector("#email-input");
const pswInput = document.querySelector("#psw-input");
const loginErrorElement = document.getElementById("login-error");
const signInBtn = document.getElementById("sign-in-btn");

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loginUser();
});

async function loginUser() {
  const email = emailInput.value;
  const password = pswInput.value;

  signInBtn.disabled = true;
  signInBtn.querySelector("span").style.display = "none";
  showLoader("button-spinner");

  try {
    const customOption = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    };
    const response = await fetch(LOGIN_API_ENDPOINT, customOption);
    const json = await response.json();

    if (response.ok && json.data && json.data.accessToken) {
      const accessToken = json.data.accessToken;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("username", json.data.name);
      window.location.href = "/post/edit.html";
    } else {
      const errorMessage =
        json.message || "Login failed. Please check your email and password.";
      loginErrorElement.innerHTML = errorMessage;
      loginErrorElement.style.color = "red";
    }
  } catch (error) {
    console.error("Error occurred during login", error);
    const errorMessage =
      "An error occurred while connecting to the server. Please try again later.";
    loginErrorElement.innerHTML = errorMessage;
    loginErrorElement.style.color = "red";
  } finally {
    signInBtn.disabled = false;
    signInBtn.querySelector("span").style.display = "inline-block";
    hideLoader("button-spinner");
  }
}
