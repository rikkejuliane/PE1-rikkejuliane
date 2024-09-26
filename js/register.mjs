import { REGISTER_API_ENDPOINT } from "./api.mjs";
import { showLoader, hideLoader } from "./loader.mjs";

const registerForm = document.querySelector("#register-form");
const emailInput = document.querySelector("#email-input");
const nameInput = document.querySelector("#name-input");
const pswInput = document.querySelector("#psw-input");
const registerBtn = document.getElementById("register-btn");

registerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  registerUser();
});

async function registerUser() {
  const email = emailInput.value;
  const name = nameInput.value;
  const password = pswInput.value;

  registerBtn.disabled = true;
  registerBtn.querySelector("span").style.display = "none";
  showLoader("register-button-spinner");

  try {
    const customOption = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        name: name,
        password: password,
      }),
    };
    const response = await fetch(REGISTER_API_ENDPOINT, customOption);
    const json = await response.json();

    const registerLogElement = document.getElementById("p-error");

    if (response.ok && json.data) {
      localStorage.setItem("username", name);

      registerLogElement.innerHTML = "You have successfully registered!";
      registerLogElement.style.color = "green";
    } else if (
      response.status === 400 &&
      json.errors &&
      json.errors[0].message === "Profile already exists"
    ) {
      const errorMessage = "This user already exists.";
      registerLogElement.innerHTML = errorMessage;
      registerLogElement.style.color = "red";
    } else {
      console.error("Registration failed", json);
      const errorMessage =
        json.errors && json.errors[0].message
          ? json.errors[0].message
          : "An unknown error occurred during registration.";
      registerLogElement.innerHTML = errorMessage;
      registerLogElement.style.color = "red";
    }
  } catch (error) {
    console.log("Error occurred during registration", error);
    const errorMessage =
      "An error occurred while connecting to the server. Please try again later.";
    const registerLogElement = document.getElementById("p-error");
    registerLogElement.innerHTML = errorMessage;
    registerLogElement.style.color = "red";
  } finally {
    registerBtn.disabled = false;
    registerBtn.querySelector("span").style.display = "inline-block";
    hideLoader("register-button-spinner");
  }
}
