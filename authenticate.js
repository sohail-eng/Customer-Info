(() => {
  const passwordEl = document.getElementById('website-password');
  const copyBtn = document.getElementById('copy-password');
  const msgEl = document.getElementById('wp-message');
  const whatsappLink = document.getElementById('whatsapp-link');

  const TXT_PATH = 'website_password.txt'; // your password file path on GitHub Pages root

  function showMessage(text, timeout = 3000) {
    msgEl.textContent = text;
    msgEl.setAttribute('aria-hidden', 'false');
    if (timeout) setTimeout(() => { msgEl.textContent = ''; msgEl.setAttribute('aria-hidden', 'true'); }, timeout);
  }

  // Load the website password file
  fetch(TXT_PATH, { cache: 'no-cache' })
    .then(resp => {
      if (!resp.ok) throw new Error('Not found');
      return resp.text();
    })
    .then(txt => {
      const trimmed = txt.replace(/\r/g, '').trim();
      if (!trimmed) {
        passwordEl.textContent = '(password file is empty)';
        return;
      }
      passwordEl.textContent = trimmed;
      passwordEl.title = 'Website password (click copy)';
    })
    .catch(err => {
      passwordEl.textContent = '(unable to load password)';
      console.warn('Failed to load website_password.txt:', err);
      showMessage('Could not load password. Try Refresh or WhatsApp contact.');
    });

  // Copy password to clipboard
  copyBtn.addEventListener('click', async () => {
    const text = passwordEl.textContent.trim();
    if (!text || text.startsWith('(')) {
      showMessage('No password to copy.');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showMessage('Password copied to clipboard ✅');
    } catch (e) {
      try {
        const range = document.createRange();
        range.selectNodeContents(passwordEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand('copy');
        sel.removeAllRanges();
        showMessage('Password copied (fallback).');
      } catch (err) {
        console.error('Copy failed', err);
        showMessage('Copy failed. Please copy manually.');
      }
    }
  });

  // Clicking password copies it as well
  passwordEl.addEventListener('click', () => copyBtn.click());
})();
