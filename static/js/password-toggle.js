document.addEventListener('DOMContentLoaded', () => {
    const toggles = document.querySelectorAll('.password-toggle');

    toggles.forEach((button) => {
        button.addEventListener('click', () => togglePasswordVisibility(button));
    });
});

function togglePasswordVisibility(button) {
    if (!button) {
        return;
    }

    const targetId = button.getAttribute('aria-controls') || button.dataset.target;
    if (!targetId) {
        return;
    }

    const input = document.getElementById(targetId);
    if (!input) {
        return;
    }

    const isCurrentlyMasked = input.type === 'password';
    input.type = isCurrentlyMasked ? 'text' : 'password';

    button.setAttribute('aria-pressed', String(isCurrentlyMasked));

    const showLabel = button.getAttribute('data-show-label') || 'Show password';
    const hideLabel = button.getAttribute('data-hide-label') || 'Hide password';
    button.setAttribute('aria-label', isCurrentlyMasked ? hideLabel : showLabel);

    const textSpan = button.querySelector('.password-toggle__text');
    if (textSpan) {
        textSpan.textContent = isCurrentlyMasked ? 'Hide' : 'Show';
    }

    const icon = button.querySelector('.password-toggle__icon i');
    if (icon) {
        icon.classList.toggle('fa-eye', !isCurrentlyMasked);
        icon.classList.toggle('fa-eye-slash', isCurrentlyMasked);
    }

    // Keep focus on the input when revealing text for better keyboard UX
    if (isCurrentlyMasked) {
        input.focus({ preventScroll: true });
    }
}


