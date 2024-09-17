// Show loading-spinner
export function showLoader() {
    const loadingSpinner = document.getElementById('loading');
    if (loadingSpinner) {
        loadingSpinner.style.display = 'block';
    }
}

// Hide loading-spinner
export function hideLoader() {
    const loadingSpinner = document.getElementById('loading');
    if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
    }
}