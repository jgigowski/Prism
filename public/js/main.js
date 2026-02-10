// Client-side JavaScript for User Portal

document.addEventListener('DOMContentLoaded', function() {

  // Add fade-in animation to main content
  const mainContent = document.querySelector('main');
  if (mainContent) {
    mainContent.classList.add('fade-in');
  }

  // Auto-dismiss alerts after 5 seconds
  // Use more specific selector to avoid matching buttons with hover:bg-red-50
  const alerts = document.querySelectorAll('div[class*="bg-green-50"][class*="border"], div[class*="bg-red-50"][class*="border"]');
  alerts.forEach(alert => {
    // Additional check: only dismiss if it looks like an alert (has specific structure)
    if (alert.querySelector('svg') && !alert.classList.contains('remove-button')) {
      setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 300);
      }, 5000);
    }
  });

  // Add loading state to forms
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn && !submitBtn.disabled) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner inline-block w-4 h-4 mr-2"></span>Processing...';
      }
    });
  });

  // Mobile menu toggle (if needed in future)
  const mobileMenuButton = document.querySelector('[data-mobile-menu-toggle]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');

  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', function() {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // Confirm dialogs for destructive actions
  const confirmButtons = document.querySelectorAll('[data-confirm]');
  confirmButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      const message = this.getAttribute('data-confirm') || 'Are you sure?';
      if (!confirm(message)) {
        e.preventDefault();
      }
    });
  });

  // Add card hover effects - DISABLED for settings page
  if (!window.location.pathname.includes('/settings')) {
    const cards = document.querySelectorAll('a[href]');
    cards.forEach(card => {
      if (card.querySelector('.bg-white')) {
        card.classList.add('card-hover');
      }
    });
  }

  // Log client-side errors
  window.addEventListener('error', function(e) {
    console.error('Client error:', e.message);
  });

  // Handle network errors
  window.addEventListener('online', function() {
    console.log('Connection restored');
  });

  window.addEventListener('offline', function() {
    console.warn('Connection lost');
  });
});
