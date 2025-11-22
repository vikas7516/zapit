// Contact form logic externalized for CSP compliance
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    if (window.emailjs && emailjs.init) {
      try { emailjs.init('gAGcNt-xeY47Q2E3G'); } catch(e) {}
    }

    const form = document.getElementById('contactForm');
    if (!form) return;
    const statusEl = document.getElementById('formStatus');
    const submitBtn = document.getElementById('submitBtn');

    function setStatus(msg, type) {
      if (!statusEl) return;
      statusEl.textContent = msg;
      // Remove previous status classes
      statusEl.className = statusEl.className.replace(/\bstatus-\w+/g, '');
      // Add appropriate status class for CSP compliance
      if (type === 'error') statusEl.classList.add('status-error');
      else if (type === 'success') statusEl.classList.add('status-success');
      else statusEl.classList.add('status-info');
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      setStatus('Sending...','info');
      if (submitBtn) submitBtn.disabled = true;

      try {
        const serviceID = 'service_bzazpkj';
        const templateID = 'template_contact';
        const params = {
          from_name: form.name.value,
          reply_to: form.email.value,
          subject: form.subject.value,
          message: form.message.value
        };
        const res = await emailjs.send(serviceID, templateID, params);
        if (res && res.status === 200) {
          setStatus('Message sent successfully!','success');
          form.reset();
        } else {
          setStatus('Failed to send message. Please try again later.','error');
        }
      } catch (err) {
        // Swallow console logs in production; show user-friendly status only
        setStatus('An error occurred. Please try again.','error');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });
})();
