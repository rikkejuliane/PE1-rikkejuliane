import { LOGIN_API_ENDPOINT } from "./api.mjs";

const loginForm = document.querySelector('#login-form');
const emailInput = document.querySelector('#email-input');
const pswInput = document.querySelector('#psw-input');
const loginErrorElement = document.getElementById('login-error');
const signInBtn = document.getElementById('sign-in-btn');
const buttonSpinner = document.getElementById('button-spinner');

loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    loginUser();
});

async function loginUser() {
    const email = emailInput.value;
    const password = pswInput.value;

    // Transform the button to show the spinner
    signInBtn.disabled = true; // Disable the button to prevent multiple clicks
    signInBtn.querySelector('span').style.display = 'none'; // Hide the text
    buttonSpinner.style.display = 'flex'; // Show the spinner

    try {
        const customOption = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('username', json.data.name); // Save username to localStorage
            window.location.href = '/post/edit.html';
        } else {
            // Handle login error
            const errorMessage = json.message || 'Login failed. Please check your email and password.';
            loginErrorElement.innerHTML = errorMessage;
            loginErrorElement.style.color = 'red'; // Show the error message in red
        }
    } catch (error) {
        console.error('Error occurred during login', error);
        const errorMessage = 'An error occurred while connecting to the server. Please try again later.';
        loginErrorElement.innerHTML = errorMessage;
        loginErrorElement.style.color = 'red'; // Show the error message in red
    } finally {
        // Reset button state
        signInBtn.disabled = false; // Re-enable the button
        signInBtn.querySelector('span').style.display = 'inline-block'; // Show the text again
        buttonSpinner.style.display = 'none'; // Hide the spinner
    }
}