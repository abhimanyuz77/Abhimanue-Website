(function ($) {
  "use strict";

  /*--------------------------------------------------------------
    Offer Countdown Timer (Resets Daily at 5 AM)
  --------------------------------------------------------------*/
  function startOfferCountdown() {
    function pad(n) {
      return n < 10 ? '0' + n : '' + n;
    }

    function updateOfferCountdown() {
      var now = new Date();
      var target = new Date();

      // Set target to 5 AM today
      target.setHours(5, 0, 0, 0);

      // If 5 AM has already passed today, set target to 5 AM tomorrow
      if (now >= target) {
        target.setDate(target.getDate() + 1);
      }

      var timeLeft = target - now;

      var hours = Math.floor(timeLeft / (1000 * 60 * 60));
      var minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      var h = pad(hours), m = pad(minutes), s = pad(seconds);

      // Hero timer
      if (document.getElementById('spc-hours')) {
        document.getElementById('spc-hours').textContent = h;
        document.getElementById('spc-minutes').textContent = m;
        document.getElementById('spc-seconds').textContent = s;
      }

      // Pricing timer
      if (document.getElementById('spc-hours-2')) {
        document.getElementById('spc-hours-2').textContent = h;
        document.getElementById('spc-minutes-2').textContent = m;
        document.getElementById('spc-seconds-2').textContent = s;
      }
    }

    updateOfferCountdown();
    setInterval(updateOfferCountdown, 1000);
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
    startOfferCountdown();
    initScrollReveal();

    var form = $('#study-coaching-form');
    if (form.length === 0) return;

    var alertBox = $('#study-coaching-alert');
    var submitBtn = $('#sc-submit');
    var defaultBtnText = submitBtn.html();

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

      var fullname = $('#sc-fullname').val().trim();
      var email = $('#sc-email').val().trim();
      var phone = $('#sc-phone').val().trim();
      var studentType = $('#sc-student-type').val();
      var challenges = $('#sc-challenges').val();
      var message = $('#sc-message').val().trim();
      var terms = $('#sc-terms').is(':checked');

      var emailRegex = /^([a-zA-Z0-9_.+-])+@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;

      if (!fullname || !email || !phone || !studentType || !challenges) {
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
        student_type: studentType,
        challenges: challenges,
        message: message || 'No additional message',
        timestamp: new Date().toISOString()
      };

      submitBtn.prop('disabled', true).html('<span class="button-spinner"></span> Submitting...');

      $.ajax({
        type: "POST",
        url: "assets/php/study-coaching-signup.php",
        data: formData,
        dataType: 'json',
        success: function (response) {
          if (response.success) {
            showAlert('success', '<strong>Success!</strong> Your assessment request has been submitted. We will contact you within 24 hours to schedule your personalized consultation.');
            form[0].reset();
            $('html, body').animate({
              scrollTop: alertBox.offset().top - 100
            }, 500);
          } else {
            showAlert('danger', '<strong>Error!</strong> ' + (response.message || 'There was a problem submitting your request. Please try again.'));
          }
          submitBtn.prop('disabled', false).html(defaultBtnText);
        },
        error: function (xhr, status, error) {
          showAlert('danger', '<strong>Error!</strong> There was a problem submitting your request. Please try again later or WhatsApp us directly.');
          console.error("AJAX Error:", status, error);
          submitBtn.prop('disabled', false).html(defaultBtnText);
        }
      });

      return false;
    });

    // Phone number formatting
    $('#sc-phone').on('input', function () {
      var value = $(this).val().replace(/\D/g, '');
      if (value.length > 15) {
        value = value.substring(0, 15);
      }
      $(this).val(value);
    });

    // Form field focus animations
    $('#study-coaching-form .form-control').on('focus', function () {
      $(this).parent().addClass('focused');
    });

    $('#study-coaching-form .form-control').on('blur', function () {
      if (!$(this).val()) {
        $(this).parent().removeClass('focused');
      }
    });
  });

})(jQuery);
