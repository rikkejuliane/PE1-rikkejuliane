import { REGISTER_API_ENDPOINT } from "./api.mjs";
import { showLoader, hideLoader } from './loader.mjs'; // Import loader functions

const registerForm = document.querySelector('#register-form');
const emailInput = document.querySelector('#email-input');
const nameInput = document.querySelector('#name-input');
const pswInput = document.querySelector('#psw-input');
const registerBtn = document.getElementById('register-btn');

registerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    registerUser();
});

async function registerUser() {
    const email = emailInput.value;
    const name = nameInput.value;
    const password = pswInput.value;

    // Show spinner and disable the button
    registerBtn.disabled = true; // Disable the button to prevent multiple clicks
    registerBtn.querySelector('span').style.display = 'none'; // Hide the text
    showLoader('register-button-spinner'); // Use loader.mjs to show the spinner

    try {
        const customOption = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                name: name,
                password: password,
            }),
        };
        const response = await fetch(REGISTER_API_ENDPOINT, customOption);
        const json = await response.json();

        const registerLogElement = document.getElementById('p-error');

        if (response.ok && json.data) {
            localStorage.setItem('username', name); // Save username to localStorage

            // Change the <p> element's content to show a success message
            registerLogElement.innerHTML = 'You have successfully registered!';
            registerLogElement.style.color = 'green'; // Success message in green
        } else if (response.status === 400 && json.errors && json.errors[0].message === "Profile already exists") {
            // Checking for the specific "Profile already exists" message
            const errorMessage = 'This user already exists.';
            registerLogElement.innerHTML = errorMessage;
            registerLogElement.style.color = 'red'; // Error message in red
        } else {
            console.error('Registration failed', json);
            const errorMessage = json.errors && json.errors[0].message ? json.errors[0].message : 'An unknown error occurred during registration.';
            registerLogElement.innerHTML = errorMessage;
            registerLogElement.style.color = 'red'; // General error message in red
        }
    } catch (error) {
        console.log('Error occurred during registration', error);
        const errorMessage = 'An error occurred while connecting to the server. Please try again later.';
        const registerLogElement = document.getElementById('p-error');
        registerLogElement.innerHTML = errorMessage;
        registerLogElement.style.color = 'red'; // Network error message in red
    } finally {
        // Reset button state
        registerBtn.disabled = false; // Re-enable the button
        registerBtn.querySelector('span').style.display = 'inline-block'; // Show the text again
        hideLoader('register-button-spinner'); // Use loader.mjs to hide the spinner
    }
}
