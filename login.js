document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  try {
    const res = await fetch('http://localhost/zavrsni/login.php', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    const data = await res.json();

    if (data.status === 'error') {
      alert(data.errors.join('\n'));
    } else {
      localStorage.setItem('userData', JSON.stringify(data.user));
      alert(data.status === 'login' ? 'Prijava uspješna!' : 'Registracija uspješna!');
      window.location.href = "index.html";
    }
  } catch (err) {
    alert('Došlo je do greške: ' + err.message);
    console.error(err);
  }
});
