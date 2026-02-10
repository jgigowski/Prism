// Debug script to prevent Remove buttons from disappearing
document.addEventListener('DOMContentLoaded', function() {
  if (window.location.pathname.includes('/settings')) {
    console.log('Settings debug mode active - LOCKDOWN MODE');

    function lockElementStyles(element, displayValue) {
      // Store original style object
      const originalStyle = element.style;

      // Create getter/setter that always returns visible values
      const lockedProperties = {
        visibility: 'visible',
        opacity: '1',
        display: displayValue,
        position: 'static',
        transform: 'none',
        zIndex: 'auto'
      };

      Object.keys(lockedProperties).forEach(prop => {
        const camelProp = prop.replace(/-([a-z])/g, g => g[1].toUpperCase());

        try {
          Object.defineProperty(element.style, camelProp, {
            get: function() {
              return lockedProperties[prop];
            },
            set: function(value) {
              console.log(`Blocked attempt to set ${prop} to ${value} on`, element.className);
              // Ignore the set - keep our value
              return lockedProperties[prop];
            },
            configurable: true
          });
        } catch (e) {
          console.warn('Could not lock property:', prop, e);
        }
      });

      // Also force inline styles
      element.style.cssText = `visibility: visible !important; opacity: 1 !important; display: ${displayValue} !important; position: static !important;`;
    }

    // Wait a bit for page to fully load
    setTimeout(() => {
      const buttons = document.querySelectorAll('.remove-button');
      console.log('Locking down', buttons.length, 'buttons');

      buttons.forEach(button => {
        // Lock the button
        lockElementStyles(button, 'inline-flex');

        // Lock the form
        const form = button.closest('form');
        if (form) {
          lockElementStyles(form, 'block');
        }

        // Lock the row
        const row = button.closest('.enrolled-item');
        if (row) {
          lockElementStyles(row, 'flex');
        }

        // Lock the section
        const section = button.closest('.enrolled-section');
        if (section) {
          lockElementStyles(section, 'block');
        }
      });

      // Additional brute force check every 10ms
      setInterval(() => {
        document.querySelectorAll('.remove-button').forEach(button => {
          const computed = window.getComputedStyle(button);
          if (computed.visibility !== 'visible' ||
              computed.opacity !== '1' ||
              computed.display === 'none') {
            console.log('DETECTED HIDDEN BUTTON - FORCING VISIBLE');
            button.style.cssText = 'visibility: visible !important; opacity: 1 !important; display: inline-flex !important; position: static !important;';

            // Force parents too
            let parent = button.parentElement;
            while (parent && parent !== document.body) {
              parent.style.cssText += ' visibility: visible !important; opacity: 1 !important;';
              parent = parent.parentElement;
            }
          }
        });
      }, 10);

      console.log('Lockdown complete - styles are now protected');
    }, 500);
  }
});
