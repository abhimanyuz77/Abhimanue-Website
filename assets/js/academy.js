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
      
      // Update display for physics foundation
      if ($('#hours-physics').length) {
        $('#hours-physics').text(hours);
        $('#minutes-physics').text(minutes);
        $('#seconds-physics').text(seconds);
      }
    }
    
    // Update immediately
    updateCountdown();
    
    // Update every second
    setInterval(updateCountdown, 1000);
  }

  /*--------------------------------------------------------------
    Early Bird Countdown Timer (Resets Daily at 3 AM)
  --------------------------------------------------------------*/
  function startEarlyBirdCountdown() {
    function updateEarlyBirdCountdown() {
      var now = new Date();
      var target = new Date();
      
      // Set target to 3 AM today
      target.setHours(3, 0, 0, 0);
      
      // If 3 AM has already passed today, set target to 3 AM tomorrow
      if (now >= target) {
        target.setDate(target.getDate() + 1);
      }
      
      var timeLeft = target - now;
      
      // Calculate hours, minutes, seconds
      var hours = Math.floor(timeLeft / (1000 * 60 * 60));
      var minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      
      // Add leading zeros
      hours = hours < 10 ? '0' + hours : hours;
      minutes = minutes < 10 ? '0' + minutes : minutes;
      seconds = seconds < 10 ? '0' + seconds : seconds;
      
      // Update display for early bird timer
      if ($('#hours').length && $('#earlyBirdTimer').length) {
        $('#hours').text(hours);
        $('#minutes').text(minutes);
        $('#seconds').text(seconds);
      }
    }
    
    // Update immediately
    updateEarlyBirdCountdown();
    
    // Update every second
    setInterval(updateEarlyBirdCountdown, 1000);
  }

  /*--------------------------------------------------------------
    Academy Signup Form Handler
  --------------------------------------------------------------*/
  $(document).ready(function () {
    
    // Start countdown timer
    startCountdown();
    
    // Start early bird 24-hour countdown timer
    startEarlyBirdCountdown();
    
    const applyForm = $('#apply-form');
    if (applyForm.length) {
      const alertBox = $('#apply-alert');
      const submitBtn = $('#apply-form button[type="submit"]');
      const defaultBtnText = submitBtn.html();

      function showApplyAlert(type, message) {
        alertBox
          .removeClass('alert-success alert-danger alert-warning show')
          .addClass('alert-' + type + ' show')
          .html(message);
      }

      applyForm.on('submit', function (e) {
        e.preventDefault();

        const studentName = $('#student_name').val().trim();
        const email = $('#email').val().trim();
        const phone = $('#phone').val().trim();
        const studentState = $('#student_state').val();
        const schoolName = $('#school_name').val().trim();
        const classLevel = $('#class_level').val();
        const regexEmail = /^([a-zA-Z0-9_.+-])+@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,})+$/;
        const whatsappRegex = /^[0-9]{10,15}$/;

        if (!studentName || !email || !phone) {
          showApplyAlert('warning', '<strong>Missing info:</strong> Name, email, and WhatsApp number are required.');
          return false;
        }

        if (!regexEmail.test(email)) {
          showApplyAlert('danger', '<strong>Invalid email:</strong> Enter a valid email address.');
          return false;
        }

        if (!whatsappRegex.test(phone.replace(/\D/g, ''))) {
          showApplyAlert('danger', '<strong>WhatsApp number:</strong> Enter digits only, min 10 digits.');
          return false;
        }

        if (!studentState) {
          showApplyAlert('warning', '<strong>Location:</strong> Please choose your state or region.');
          return false;
        }

        if (!schoolName) {
          showApplyAlert('warning', '<strong>School:</strong> Please add your school name.');
          return false;
        }

        if (!classLevel) {
          showApplyAlert('warning', '<strong>Class:</strong> Please select your current class.');
          return false;
        }

        const payload = {
          name: studentName,
          email: email,
          phone: phone,
          subject: 'NEET Physics Admission Application',
          msg: [
            'WhatsApp / Mobile: ' + phone,
            'Student Location: ' + studentState,
            'School Name: ' + schoolName,
            'Current Class: ' + classLevel
          ].join('\n'),
          form_context: $('input[name="form_context"]').val() || 'NEET Physics Admission',
          forward_to: $('#forward_to').val() || ''
        };

        submitBtn.prop('disabled', true).html('<span class="button-spinner"></span> Sending');

        $.ajax({
          type: 'POST',
          url: '/api/contact',
          data: payload,
          dataType: 'json'
        })
        .done(function (response) {
          if (response.success) {
            showApplyAlert('success', '<strong>Application received!</strong> We will reach out on WhatsApp within 24 hours.');
            applyForm[0].reset();
          } else {
            showApplyAlert('danger', '<strong>Error:</strong> ' + (response.message || 'Please try again later.'));
          }
        })
        .fail(function () {
          showApplyAlert('danger', '<strong>Server issue:</strong> Could not send application. Please WhatsApp us directly.');
        })
        .always(function () {
          submitBtn.prop('disabled', false).html(defaultBtnText);
        });

        return false;
      });
    }
    
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
    
    // Physics Foundation Form Handler
    if ($('#physics-signup-form').length > 0) {
      $('#physics-alert').hide();
      
      $('#physics-signup-form').on('submit', function (e) {
        e.preventDefault();
        
        // Get form values
        var fullname = $('#fullname-physics').val().trim();
        var age = $('#age-physics').val().trim();
        var email = $('#email-physics').val().trim();
        var phone = $('#phone-physics').val().trim();
        var classLevel = $('#class-physics').val();
        var physicsLevel = $('#physics-level').val();
        var message = $('#message-physics').val().trim();
        var terms = $('#terms-physics').is(':checked');
        
        // Email validation regex
        var emailRegex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        
        // Validation
        if (!fullname || !age || !email || !phone || !classLevel || !physicsLevel) {
          showPhysicsAlert('danger', '<strong>Warning!</strong> Please fill in all required fields.');
          return false;
        }
        
        if (!emailRegex.test(email)) {
          showPhysicsAlert('danger', '<strong>Warning!</strong> Please enter a valid email address.');
          return false;
        }
        
        if (parseInt(age) < 13 || parseInt(age) > 20) {
          showPhysicsAlert('danger', '<strong>Warning!</strong> Please enter a valid age between 13 and 20.');
          return false;
        }
        
        if (!terms) {
          showPhysicsAlert('warning', '<strong>Notice!</strong> Please agree to be contacted regarding the program.');
          return false;
        }
        
        // Prepare data
        var formData = {
          fullname: fullname,
          age: age,
          email: email,
          phone: phone,
          class: classLevel,
          physics_level: physicsLevel,
          message: message || 'No additional message',
          timestamp: new Date().toISOString()
        };
        
        // Disable submit button
        var $submitBtn = $('#physics-submit');
        var originalText = $submitBtn.text();
        $submitBtn.prop('disabled', true).text('Submitting...');
        
        // Send AJAX request
        $.ajax({
          type: "POST",
          url: "assets/php/physics-signup.php",
          data: formData,
          dataType: 'json',
          success: function (response) {
            if (response.success) {
              showPhysicsAlert('success', '<strong>Success!</strong> Your application has been submitted successfully. We will contact you soon!');
              
              // Reset form
              $('#physics-signup-form')[0].reset();
              
              // Scroll to alert
              $('html, body').animate({
                scrollTop: $('#physics-alert').offset().top - 100
              }, 500);
            } else {
              showPhysicsAlert('danger', '<strong>Error!</strong> ' + (response.message || 'There was a problem submitting your application. Please try again.'));
            }
            
            // Re-enable submit button
            $submitBtn.prop('disabled', false).text(originalText);
          },
          error: function (xhr, status, error) {
            showPhysicsAlert('danger', '<strong>Error!</strong> There was a problem submitting your application. Please try again later or contact us directly.');
            console.error("AJAX Error:", status, error);
            
            // Re-enable submit button
            $submitBtn.prop('disabled', false).text(originalText);
          }
        });
        
        return false;
      });
    }
    
    // Helper function to show physics alerts
    function showPhysicsAlert(type, message) {
      var alertClass = 'alert-' + type;
      $('#physics-alert')
        .removeClass('alert-success alert-danger alert-warning')
        .addClass(alertClass)
        .html('<div class="alert ' + alertClass + '">' + message + '</div>')
        .fadeIn();
      
      // Auto-hide success messages after 5 seconds
      if (type === 'success') {
        setTimeout(function () {
          $('#physics-alert').fadeOut('slow');
        }, 5000);
      }
    }
    
    // Phone number formatting for physics form
    $('#phone-physics').on('input', function () {
      var value = $(this).val().replace(/\D/g, '');
      if (value.length > 10) {
        value = value.substring(0, 10);
      }
      $(this).val(value);
    });
    
  });

})(jQuery);
