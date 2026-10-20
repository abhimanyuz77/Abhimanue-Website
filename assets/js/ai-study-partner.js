(function ($) {
  "use strict";

  /*--------------------------------------------------------------
    Geo Pricing — ₹2,000 INR (India) / $20 USD (International),
    one-time lifetime access. All users are billed in INR on the
    payment page; the $20 figure is the approximate USD equivalent.
  --------------------------------------------------------------*/
  function detectIsIndia() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') return true;

      var langs = navigator.languages || [navigator.language || ''];
      for (var i = 0; i < langs.length; i++) {
        if (/-IN\b/i.test(langs[i])) return true;
      }
    } catch (e) { /* fall through to default */ }
    return false;
  }

  function applyGeoPricing() {
    var isIndia = detectIsIndia();
    var price = isIndia ? '2,000' : '20';
    var currency = isIndia ? '₹' : '$';
    var note = isIndia ? 'billed in INR' : 'billed as ₹2,000 INR — your card converts automatically';

    document.querySelectorAll('[data-asp-price]').forEach(function (el) {
      el.textContent = price;
    });
    document.querySelectorAll('[data-asp-currency]').forEach(function (el) {
      el.textContent = currency;
    });
    document.querySelectorAll('[data-asp-price-note]').forEach(function (el) {
      el.textContent = note;
    });
    document.querySelectorAll('[data-asp-submit-label]').forEach(function (el) {
      el.textContent = 'Get Lifetime Access – ' + currency + price + ' one-time';
    });

    return isIndia;
  }

  /*--------------------------------------------------------------
    Scroll Reveal (Fade Up) — Intersection Observer
  --------------------------------------------------------------*/
  function initScrollReveal() {
    var selectors = [
      '.spc-problem-item',
      '.spc-different-card',
      '.spc-coach-image',
      '.spc-coach-content',
      '.spc-included-card',
      '.spc-audience-item',
      '.spc-learn-item',
      '.spc-process-step',
      '.spc-info-card',
      '.spc-final-cta',
      '.spc-archimedes',
      '.spc-achievement-card',
      '.asp-dash-card',
      '.signup-form-wrapper'
    ];

    var elements = document.querySelectorAll(selectors.join(','));
    if (!elements.length) return;

    // If IntersectionObserver isn't supported, leave everything visible.
    if (!('IntersectionObserver' in window)) return;

    elements.forEach(function (el, i) {
      el.classList.add('spc-reveal');
      el.style.transitionDelay = (i % 4) * 0.08 + 's';
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('spc-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    elements.forEach(function (el) { observer.observe(el); });
  }

  $(document).ready(function () {
    var isIndia = applyGeoPricing();
    initScrollReveal();

    var form = $('#ai-partner-form');
    if (form.length === 0) return;

    var alertBox = $('#ai-partner-alert');
    var submitBtn = $('#asp-submit');
    var defaultBtnHtml = submitBtn.html();

    function showAlert(type, message) {
      var alertClass = 'alert-' + type;
      alertBox
        .removeClass('alert-success alert-danger alert-warning')
        .addClass(alertClass)
        .html('<div class="alert ' + alertClass + '">' + message + '</div>')
        .fadeIn();

      if (type === 'success') {
        setTimeout(function () {
          alertBox.fadeOut('slow');
        }, 6000);
      }
    }

    form.on('submit', function (e) {
      e.preventDefault();

      var fullname = $('#asp-fullname').val().trim();
      var email = $('#asp-email').val().trim();
      var phone = $('#asp-phone').val().trim();
      var userType = $('#asp-user-type').val();
      var goal = $('#asp-goal').val();
      var message = $('#asp-message').val().trim();
      var terms = $('#asp-terms').is(':checked');

      var emailRegex = /^([a-zA-Z0-9_.+-])+@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;

      if (!fullname || !email || !phone || !userType || !goal) {
        showAlert('warning', '<strong>Warning!</strong> Please fill in all required fields.');
        return false;
      }

      if (!emailRegex.test(email)) {
        showAlert('danger', '<strong>Warning!</strong> Please enter a valid email address.');
        return false;
      }

      if (!terms) {
        showAlert('warning', '<strong>Notice!</strong> Please agree to the terms before submitting.');
        return false;
      }

      var formData = {
        fullname: fullname,
        email: email,
        phone: phone,
        user_type: userType,
        goal: goal,
        message: message || 'No additional message',
        region: isIndia ? 'IN' : 'INTL',
        timestamp: new Date().toISOString()
      };

      submitBtn.prop('disabled', true).html('<span class="button-spinner"></span> Submitting...');

      $.ajax({
        type: "POST",
        url: "/api/ai-partner-signup",
        data: formData,
        dataType: 'json',
        success: function (response) {
          if (response.success) {
            showAlert('success', '<strong>Success!</strong> Your details have been submitted. Redirecting to our secure payment page...');

            var paymentParams = new URLSearchParams({
              name: fullname,
              email: email
            });

            var cleanPhone = phone.replace(/\D/g, '');
            if (cleanPhone) {
              paymentParams.append('phone', cleanPhone);
            }

            var paymentUrl = 'https://hexagonknow.com/abhimanue-app-payment.html?' + paymentParams.toString();

            setTimeout(function () {
              window.location.href = paymentUrl;
            }, 1200);
          } else {
            showAlert('danger', '<strong>Error!</strong> ' + (response.message || 'There was a problem submitting your request. Please try again.'));
            submitBtn.prop('disabled', false).html(defaultBtnHtml);
          }
        },
        error: function (xhr, status, error) {
          showAlert('danger', '<strong>Error!</strong> There was a problem submitting your request. Please try again later or WhatsApp us directly.');
          console.error("AJAX Error:", status, error);
          submitBtn.prop('disabled', false).html(defaultBtnHtml);
        }
      });

      return false;
    });

    // Phone number formatting
    $('#asp-phone').on('input', function () {
      var value = $(this).val().replace(/\D/g, '');
      if (value.length > 15) {
        value = value.substring(0, 15);
      }
      $(this).val(value);
    });

    // Form field focus animations
    $('#ai-partner-form .form-control').on('focus', function () {
      $(this).parent().addClass('focused');
    });

    $('#ai-partner-form .form-control').on('blur', function () {
      if (!$(this).val()) {
        $(this).parent().removeClass('focused');
      }
    });
  });

})(jQuery);
