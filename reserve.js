document.addEventListener("DOMContentLoaded", () => {
  const userData = JSON.parse(localStorage.getItem("userData"));
  initApp(userData);

  setupTableSelection();
  setupReservationForm();
  setupOrderForm();
  autoFillUserData();
  autoFillReserve();
  showSection("reserve");
});

function showSection(id) {
  document.querySelectorAll(".section").forEach((sec) =>
    sec.classList.remove("active")
  );
  const target = document.getElementById(id);
  if (target) target.classList.add("active");
}

// Inicijalizacija korisničkog profila u navigaciji
function initApp(userData) {
  const nav = document.querySelector(".navlinks");
  if (!nav || !userData) return;

  const profile = document.createElement("li");
  profile.innerHTML = `
    <div style="display:flex; align-items:center; gap:10px;">
      <a href="profile.html" style="display:flex; align-items:center; gap:10px; text-decoration:none; color:inherit;">
        <img src="${userData.image || 'slike/default-avatar.png'}" alt="" style="width:30px; height:30px; border-radius:50%;">
        <span style="text-decoration: underline; cursor: pointer;">${userData.username}</span>
      </a>
      <button id="logout-btn" style="margin-left:10px; background:#e74c3c; border:none; padding:5px 10px; color:#fff; border-radius:5px; cursor:pointer;">Logout</button>
    </div>
  `;
  nav.appendChild(profile);

  const logoutBtn = document.getElementById("logout-btn");
  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("userData");
    window.location.href = "login.html";
  });
}

// Rezervacija
function setupTableSelection() {
  const tables = document.querySelectorAll(".table");
  const tableNumberSpan = document.getElementById("table-number");
  const selectedTable = document.getElementById("selected-table");
  const hiddenInput = document.getElementById("table-id");

  let selectedTables = [];

  tables.forEach((table) => {
    table.addEventListener("click", () => {
      const tableId = table.dataset.id;
      table.classList.toggle("selected");

      const index = selectedTables.indexOf(tableId);
      if (index > -1) {
        selectedTables.splice(index, 1);
      } else {
        selectedTables.push(tableId);
      }

      if (selectedTables.length > 0) {
        selectedTable.classList.remove("hidden");
        tableNumberSpan.textContent = `Tables: ${selectedTables.join(", ")}`;
        hiddenInput.value = selectedTables.join(",");
      } else {
        selectedTable.classList.add("hidden");
        tableNumberSpan.textContent = "";
        hiddenInput.value = "";
      }
    });
  });
}

function setupReservationForm() {
  const form = document.querySelector(".reservation-form");
  if (!form) return;

  const dateInput = document.getElementById("date");
  const timeInput = document.getElementById("time");
  const today = new Date().toISOString().split("T")[0];

  dateInput.value = today;
  dateInput.min = today;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    if (!formData.get("table-id")) {
      alert("Odaberi barem jedan stol!");
      return;
    }

    try {
      const res = await fetch("http://localhost/zavrsni/reservation.php", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.status === "success") {
        alert("Rezervacija spremljena!");
        form.reset();
        document.querySelectorAll(".table.selected").forEach(t => t.classList.remove("selected"));
        document.getElementById("selected-table").classList.add("hidden");
        document.getElementById("table-number").textContent = "";
        document.getElementById("table-id").value = "";
        dateInput.value = today;
      } else {
        alert(data.errors.join("\n"));
      }
    } catch (err) {
      alert("Greška: " + err.message);
    }
  });
}

function setupOrderForm() {
  const orderForm = document.getElementById("order-form");
  if (!orderForm) return;

  orderForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    const formData = new FormData(orderForm);
    formData.append("items", JSON.stringify(cart));

    try {
      const response = await fetch("http://localhost/zavrsni/reservation.php", {
        method: "POST",
        body: formData
      });
      const data = await response.json();

      if (data.status === "success") {
        alert("Order placed!");
        cart = [];
        renderCart();
        orderForm.reset();

        const confirmation = document.getElementById("order-confirmation");
        if (confirmation) confirmation.classList.remove("hidden");

        const name = formData.get("name");
        const ordered = cart.map(i => i.name).join(", ");
        const custEl = document.getElementById("customer-name");
        const dishEl = document.getElementById("ordered-dish");
        if (custEl) custEl.textContent = name;
        if (dishEl) dishEl.textContent = ordered;

      } else {
        alert(data.errors.join("\n"));
      }
    } catch (err) {
      alert("Greška u narudžbi: " + err.message);
    }
  });
}

function autoFillUserData() {
  const userData = JSON.parse(localStorage.getItem("userData"));
  if (!userData) return;

  const nameInput = document.getElementById("order-name");
  const emailInput = document.getElementById("order-email");

  if (nameInput) {
    nameInput.value = userData.username;
    nameInput.readOnly = true;
  }

  if (emailInput) {
    emailInput.value = userData.email;
    emailInput.readOnly = true;
  }

  const orderName = document.getElementById("order-name");
  const orderEmail = document.getElementById("order-email");

  if (orderName) {
    orderName.value = userData.username;
    orderName.readOnly = true;
  }

  if (orderEmail) {
    orderEmail.value = userData.email;
    orderEmail.readOnly = true;
  }
}
function autoFillReserve() {
  const userData = JSON.parse(localStorage.getItem("userData"));
  if (!userData) return;

  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");

  if (nameInput) {
    nameInput.value = userData.username;
    nameInput.readOnly = true;
  }

  if (emailInput) {
    emailInput.value = userData.email;
    emailInput.readOnly = true;
  }

  const reservationName = document.getElementById("name");
  const reservationEmail = document.getElementById("email");

  if (reservationName) {
    reservationName.value = userData.username;
    reservationName.readOnly = true;
  }

  if (reservationEmail) {
    reservationEmail.value = userData.email;
    reservationEmail.readOnly = true;
  }
}

// Košarica
let cart = [];

function addToCart() {
  const select = document.getElementById("dish");
  const selected = select.options[select.selectedIndex];
  const name = selected.value;
  const price = parseFloat(selected.dataset.price);

  cart.push({ name, price });
  renderCart();
}

function renderCart() {
  const list = document.getElementById("cart-list");
  list.innerHTML = "";
  let total = 0;

  cart.forEach((item, index) => {
    total += item.price;
    const li = document.createElement("li");
    li.textContent = `${item.name} - $${item.price.toFixed(2)}`;
    const btn = document.createElement("button");
    btn.textContent = "Remove";
    btn.onclick = () => {
      cart.splice(index, 1);
      renderCart();
    };
    li.appendChild(btn);
    list.appendChild(li);
  });

  document.getElementById("total-price").textContent = total.toFixed(2);
}
