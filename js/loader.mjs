// Show loading-spinner
export function showLoader(elementId = 'loading') {
    const loadingSpinner = document.getElementById(elementId);
    if (loadingSpinner) {
        loadingSpinner.style.display = 'block';
    }
}

// Hide loading-spinner
export function hideLoader(elementId = 'loading') {
    const loadingSpinner = document.getElementById(elementId);
    if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
    }
}
