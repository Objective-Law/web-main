(function () {
  'use strict';

  var contextKey = 'oli_donation_context';

  function send(name, context) {
    try {
      if (typeof window.gtag !== 'function') return false;
      window.gtag('event', name, context);
      return true; // Queued by the existing tag; network delivery is not guaranteed.
    } catch (error) {
      return false;
    }
  }

  function record(name, surface) {
    var context = {
      donation_surface: surface,
      origin_path: window.location.pathname,
      origin_title: document.title
    };
    try {
      window.sessionStorage.setItem(contextKey, JSON.stringify(context));
    } catch (error) { /* Storage may be unavailable, especially in an iframe. */ }
    send(name, context);
  }

  window.OLIDonationAnalytics = { record: record };

  if (document.querySelector('[data-donation-complete]')) {
    var context = {
      donation_surface: 'unknown',
      origin_path: 'unknown',
      origin_title: 'unknown'
    };
    try {
      var stored = JSON.parse(window.sessionStorage.getItem(contextKey));
      if (stored && typeof stored === 'object') {
        Object.keys(context).forEach(function (key) {
          if (typeof stored[key] === 'string' && stored[key]) context[key] = stored[key];
        });
      }
    } catch (error) { /* Use unknown attribution if storage is blocked or invalid. */ }
    if (send('donation_complete', context)) {
      try {
        window.sessionStorage.removeItem(contextKey);
      } catch (error) { /* Clearing storage is best effort. */ }
    }
  }

  if (window.location.pathname === '/contribute/' && 'IntersectionObserver' in window) {
    try {
      var viewed = false;
      var observer = new IntersectionObserver(function (entries) {
        if (viewed || !entries.some(function (entry) {
          return entry.isIntersecting && entry.intersectionRatio >= 0.1;
        })) return;
        viewed = true;
        observer.disconnect();
        record('donation_form_view', 'contribute_embed');
      }, { threshold: 0.1 });

      // Observe the form containers, including the vendor-script failure fallback.
      // No access to the cross-origin iframe's contents is needed.
      document.querySelectorAll('.oli-donation-embed [data-zeffy-embed], .oli-donation-embed [data-zeffy-embed-fallback]')
        .forEach(function (form) { observer.observe(form); });
    } catch (error) { /* Visibility tracking must not affect the donation form. */ }
  }
}());
