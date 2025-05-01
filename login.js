import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// 🔐 Tvoji Supabase podaci
const supabaseUrl = "https://tntyufcvvvuxtoltwjdp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRudHl1ZmN2dnZ1eHRvbHR3amRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyMzAxODgsImV4cCI6MjA2MDgwNjE4OH0.8SnTspqZ8xKWmZZeNxTDyUJJ_tM3AVbaTgc4k5zvNEY";
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const fileInput = document.getElementById("file-input");
  const fileName = document.querySelector(".file-name");

  // Prikaz imena odabrane datoteke (avatar)
  fileInput?.addEventListener("change", function () {
    fileName.textContent = fileInput.files.length > 0
      ? fileInput.files[0].name
      : "No file chosen";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const file = document.getElementById('file-input').files[0];

    if (!email || !password) {
      alert("Unesite email i lozinku.");
      return;
    }

    // 🔐 1. Autentifikacija korisnika
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      alert("Greška pri prijavi: " + authError.message);
      return;
    }

    const user = authData.user;
    const userId = user.id;

    // 🔎 2. Provjera postoji li u tablici users
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (selectError) {
      alert("Greška pri provjeri korisnika: " + selectError.message);
      return;
    }

    // 📸 3. Pretvori sliku u base64 (ako postoji i ako je novi korisnik)
    let avatar_b64 = null;
    if (!existingUser && file) {
      avatar_b64 = await toBase64(file);
    }

    // 💾 4. Upis u bazu ako korisnik ne postoji
    if (!existingUser) {
      const username = name || email.split('@')[0];

      const { error: insertError } = await supabase.from('users').insert([
        {
          id: userId,
          email: user.email,
          username,
          avatar_b64,
          password_hash: 'auth_user', // info placeholder – Supabase Auth brine o pravoj lozinki
        }
      ]);

      if (insertError) {
        alert("Greška pri spremanju korisnika: " + insertError.message);
        return;
      }

      console.log("Novi korisnik spremljen u tablicu users");
    } else {
      console.log("Korisnik već postoji u tablici users");
    }

    // 💾 5. Spremi korisnika u localStorage (za frontend)
    localStorage.setItem("userData", JSON.stringify({
      username: existingUser?.username || name || email.split('@')[0],
      email: user.email,
      image: `data:image/png;base64,${avatar_b64 || existingUser?.avatar_b64 || ""}`,
      isAdmin: false
    }));

    alert("Prijava uspješna!");
    window.location.href = "reviews.html";
  });

  // 📦 Pretvori datoteku u base64
  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
});
