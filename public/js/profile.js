/**
 * Profile page client-side functionality
 * Handles security image selection
 */

document.addEventListener('DOMContentLoaded', function() {
  const securityImages = document.querySelectorAll('.security-image');
  const securityImageInput = document.getElementById('securityImageInput');

  // Handle security image selection
  securityImages.forEach(function(image) {
    image.addEventListener('click', function() {
      // Remove selected class from all images
      securityImages.forEach(function(img) {
        img.classList.remove('selected');
      });

      // Add selected class to clicked image
      this.classList.add('selected');

      // Update hidden input with selected image ID
      const imageId = this.getAttribute('data-image-id');
      securityImageInput.value = imageId;
    });

    // Add keyboard support for accessibility
    image.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });
  });
});
