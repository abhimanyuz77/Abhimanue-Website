(function ($) {
  "use strict";

  /*--------------------------------------------------------------
    Countdown Timer (Resets Daily at Midnight)
  --------------------------------------------------------------*/
  function startCountdown() {
    function updateCountdown() {
      var now = new Date();
      var midnight = new Date();
      midnight.setHours(24, 0, 0, 0); // Next midnight
      
      var timeLeft = midnight - now;
      
      // Calculate hours, minutes, seconds
      var hours = Math.floor(timeLeft / (1000 * 60 * 60));
      var minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      
      // Add leading zeros
      hours = hours < 10 ? '0' + hours : hours;
      minutes = minutes < 10 ? '0' + minutes : minutes;
      seconds = seconds < 10 ? '0' + seconds : seconds;
      
      // Update display
      $('#hours').text(hours);
      $('#minutes').text(minutes);
      $('#seconds').text(seconds);
    }
    
    // Update immediately
    updateCountdown();
    
    // Update every second
    setInterval(updateCountdown, 1000);
  }

  /*--------------------------------------------------------------
    Academy Signup Form Handler
  --------------------------------------------------------------*/
  $(document).ready(function () {
    
    // Start countdown timer
    startCountdown();
    
    // Form submission handler
    if ($('#academy-signup-form').length > 0) {
      $('#academy-alert').hide();
      
      $('#academy-signup-form').on('submit', function (e) {
        e.preventDefault();
        
        // Get form values
        var fullname = $('#fullname').val().trim();
        var age = $('#age').val().trim();
        var email = $('#email-signup').val().trim();
        var phone = $('#phone-signup').val().trim();
        var background = $('#background').val();
        var experience = $('#experience').val();
        var message = $('#message-signup').val().trim();
        var terms = $('#terms').is(':checked');
        
        // Email validation regex
        var emailRegex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        
        // Validation
        if (!fullname || !age || !email || !phone || !background) {
          showAlert('danger', '<strong>Warning!</strong> Please fill in all required fields.');
          return false;
        }
        
        if (!emailRegex.test(email)) {
          showAlert('danger', '<strong>Warning!</strong> Please enter a valid email address.');
          return false;
        }
        
        if (parseInt(age) < 16 || parseInt(age) > 100) {
          showAlert('danger', '<strong>Warning!</strong> Please enter a valid age between 16 and 100.');
          return false;
        }
        
        if (!terms) {
          showAlert('warning', '<strong>Notice!</strong> Please agree to be contacted regarding the program.');
          return false;
        }
        
        // Prepare data
        var formData = {
          fullname: fullname,
          age: age,
          email: email,
          phone: phone,
          background: background,
          experience: experience || 'Not specified',
          message: message || 'No additional message',
          timestamp: new Date().toISOString()
        };
        
        // Disable submit button
        var $submitBtn = $('#signup-submit');
        var originalText = $submitBtn.text();
        $submitBtn.prop('disabled', true).text('Submitting...');
        
        // Send AJAX request
        $.ajax({
          type: "POST",
          url: "assets/php/academy-signup.php",
          data: formData,
          dataType: 'json',
          success: function (response) {
            if (response.success) {
              showAlert('success', '<strong>Success!</strong> Your application has been submitted successfully. We will contact you soon!');
              
              // Reset form
              $('#academy-signup-form')[0].reset();
              
              // Scroll to alert
              $('html, body').animate({
                scrollTop: $('#academy-alert').offset().top - 100
              }, 500);
            } else {
              showAlert('danger', '<strong>Error!</strong> ' + (response.message || 'There was a problem submitting your application. Please try again.'));
            }
            
            // Re-enable submit button
            $submitBtn.prop('disabled', false).text(originalText);
          },
          error: function (xhr, status, error) {
            showAlert('danger', '<strong>Error!</strong> There was a problem submitting your application. Please try again later or contact us directly.');
            console.error("AJAX Error:", status, error);
            
            // Re-enable submit button
            $submitBtn.prop('disabled', false).text(originalText);
          }
        });
        
        return false;
      });
    }
    
    // Helper function to show alerts
    function showAlert(type, message) {
      var alertClass = 'alert-' + type;
      $('#academy-alert')
        .removeClass('alert-success alert-danger alert-warning')
        .addClass(alertClass)
        .html('<div class="alert ' + alertClass + '">' + message + '</div>')
        .fadeIn();
      
      // Auto-hide success messages after 5 seconds
      if (type === 'success') {
        setTimeout(function () {
          $('#academy-alert').fadeOut('slow');
        }, 5000);
      }
    }
    
    // Form field animations
    $('.academy-form .form-control').on('focus', function () {
      $(this).parent().addClass('focused');
    });
    
    $('.academy-form .form-control').on('blur', function () {
      if (!$(this).val()) {
        $(this).parent().removeClass('focused');
      }
    });
    
    // Phone number formatting (optional)
    $('#phone-signup').on('input', function () {
      var value = $(this).val().replace(/\D/g, '');
      if (value.length > 10) {
        value = value.substring(0, 10);
      }
      $(this).val(value);
    });
    
  });

})(jQuery);
