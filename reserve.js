function showSection(section) {
  document.querySelectorAll(".section").forEach((s) =>
    s.classList.remove("active")
  );
  document.getElementById(section).classList.add("active");

  // vizualni feedback na tipke
  document.querySelectorAll(".switch-buttons button").forEach((btn) =>
    btn.classList.remove("active-button")
  );
  const activeBtn = document.querySelector(
    `.switch-buttons button[onclick="showSection('${section}')"]`
  );
  if (activeBtn) activeBtn.classList.add("active-button");
}

document.addEventListener("DOMContentLoaded", () => {
  const tables = document.querySelectorAll(".table");
  const tableNumberSpan = document.getElementById("table-number");
  const selectedTable = document.getElementById("selected-table");
  const hiddenInput = document.getElementById("table-id");

  // ⬇️ više stolova
  let selectedTables = [];

  tables.forEach((table) => {
    table.addEventListener("click", () => {
      const tableId = table.dataset.id;
      table.classList.toggle("selected");

      const idx = selectedTables.indexOf(tableId);
      if (idx > -1) {
        selectedTables.splice(idx, 1);
      } else {
        selectedTables.push(tableId);
      }

      if (selectedTables.length > 0) {
        selectedTable.classList.remove("hidden");
        tableNumberSpan.innerText = `Tables: ${selectedTables.join(", ")}`;
        hiddenInput.value = selectedTables.join(",");
      } else {
        selectedTable.classList.add("hidden");
        hiddenInput.value = "";
        tableNumberSpan.innerText = "";
      }
    });
  });

  // Narudžba
  const orderForm = document.getElementById("order-form");
  if (orderForm) {
    orderForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const name = document.getElementById("order-name").value;
      const dish = document.getElementById("dish").value;
      const deliveryTime = document.getElementById("delivery-time").value;
      const deliveryLocation = document.getElementById("delivery-location").value;

      document.getElementById("customer-name").textContent = name;
      document.getElementById("ordered-dish").textContent = dish;

      let msg = `Dish: ${dish}\nTo: ${deliveryLocation} at ${deliveryTime}`;
      alert(msg); // ili spremi u bazu

      orderForm.style.display = "none";
      document.getElementById("order-confirmation").classList.remove("hidden");
    });
  }
});
document.addEventListener("DOMContentLoaded", () => {
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");

  const userData = JSON.parse(localStorage.getItem("user")); // očekuje: { name: "Ime", email: "email@..." }

  if (userData) {
    if (nameInput) {
      nameInput.value = userData.name;
      nameInput.disabled = true;
    }

    if (emailInput) {
      emailInput.value = userData.email;
      emailInput.disabled = true;
    }
  }

});
