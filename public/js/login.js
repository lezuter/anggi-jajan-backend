document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const message = document.getElementById('message');

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.success) {
      // redirect ke halaman dashboard
      window.location.href = data.redirect || '/admin';
    } else {
      message.textContent = data.message || 'Login gagal';
    }
  } catch (err) {
    console.error(err);
    message.textContent = 'Terjadi kesalahan server';
  }
});
