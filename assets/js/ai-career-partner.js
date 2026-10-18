/* ============================================================
   AI Learning & Career Partner — Landing Page Scripts
   ============================================================ */

/*
 * CTA / link destinations — configure real URLs in one place.
 * Any element with data-acp-link="<key>" gets its href set from this map.
 * TODO(dev): confirm 'membership' and 'credits' checkout URLs, and 'privacy'.
 */
var ACP_LINKS = {
  assessment: 'https://learn.abhimanue.in/study-assessment',
  login: 'https://learn.abhimanue.in/',
  // Annual membership checkout is hosted on hexagonknow.com (Razorpay).
  membership: 'https://hexagonknow.com/abhimanue-ai-payment.html',
  credits: 'https://learn.abhimanue.in/',    // AI credits are purchased inside the platform after login
  privacy: 'terms-and-conditions.html'       // TODO: replace with a dedicated privacy policy page when published
};

(function () {
  'use strict';

  /* ---------- Apply configured link destinations ---------- */
  document.querySelectorAll('[data-acp-link]').forEach(function (el) {
    var key = el.getAttribute('data-acp-link');
    if (ACP_LINKS[key]) {
      el.setAttribute('href', ACP_LINKS[key]);
    }
  });

  /* ---------- Analytics events (uses existing gtag if loaded) ---------- */
  function acpTrack(eventName) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, { page: 'ai_learning_career_partner' });
    }
  }

  document.querySelectorAll('[data-acp-event]').forEach(function (el) {
    el.addEventListener('click', function () {
      acpTrack(el.getAttribute('data-acp-event'));
    });
  });

  /* ---------- Mobile navigation ---------- */
  var toggle = document.getElementById('acp-nav-toggle');
  var navList = document.getElementById('acp-nav-list');

  function closeNav() {
    navList.classList.remove('acp-nav-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  if (toggle && navList) {
    toggle.addEventListener('click', function () {
      var open = navList.classList.toggle('acp-nav-open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    navList.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navList.classList.contains('acp-nav-open')) {
        closeNav();
        toggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (navList.classList.contains('acp-nav-open') &&
          !navList.contains(e.target) && !toggle.contains(e.target)) {
        closeNav();
      }
    });
  }

  /* ---------- Smooth scrolling for in-page anchors ---------- */
  document.querySelectorAll('a[data-acp-scroll]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (id && id.charAt(0) === '#') {
        var target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.replaceState(null, '', id);
        }
      }
    });
  });

  /* ---------- FAQ accordion ---------- */
  var faqButtons = document.querySelectorAll('.acp-faq-q');
  faqButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      btn.setAttribute('aria-expanded', String(!expanded));
      if (panel) {
        panel.hidden = expanded;
      }
    });
  });
})();
