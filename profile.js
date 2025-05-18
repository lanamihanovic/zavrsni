document.addEventListener("DOMContentLoaded", async () => {
  const userData = JSON.parse(localStorage.getItem("userData"));
  if (!userData) {
    alert("Not logged in.");
    window.location.href = "login.html";
    return;
  }

  // 👤 Sidebar i profil
  document.getElementById("user-name").textContent = userData.username || "User";
  const avatarSrc = userData.image
    ? (userData.image.startsWith("data:image/") ? userData.image : `data:image/png;base64,${userData.image}`)
    : "slike/default-avatar.png";
  document.getElementById("user-image").src = avatarSrc;

  // 👤 Account sekcija
  document.getElementById("account-username").textContent = userData.username || "Unknown";
  document.getElementById("account-email").textContent = userData.email || "Unknown";
  document.getElementById("account-created").textContent = userData.created_at
    ? new Date(userData.created_at).toLocaleString()
    : "N/A";

  try {
    const res = await fetch(`http://127.0.0.1/zavrsni/get_user_dashboard_data.php?user_id=${userData.id}`);
    const text = await res.text();

    try {
      const data = JSON.parse(text);

      if (data.status === "success") {
        populateList("reservation-list", data.reservations, "reservation");
        populateList("order-list", data.orders, "order");
        populateList("review-list", data.reviews, "review");
      } else {
        console.error("API error:", data.message);
        alert("Error: " + data.message);
      }
    } catch (jsonErr) {
      console.error("⚠️ Response is not valid JSON:\n", text);
      alert("Invalid server response format.");
    }

  } catch (err) {
    console.error("❌ Fetch error:", err);
    alert("Unable to fetch data from the server.");
  }

  // Navigacija
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".dashboard-section").forEach(sec => sec.classList.remove("active"));
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active-button"));
      document.getElementById(btn.dataset.section).classList.add("active");
      btn.classList.add("active-button");
    });
  });

  // Logout
  document.getElementById("logout-btn")?.addEventListener("click", () => {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("userData");
      window.location.href = "login.html";
    }
  });

  // Delete account
  document.getElementById("delete-account-btn")?.addEventListener("click", async () => {
    if (!confirm("Are you sure you want to delete your account?")) return;
    try {
      const res = await fetch(`http://127.0.0.1/zavrsni/delete_user.php?id=${userData.id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.status === "success") {
        alert("Account deleted successfully.");
        localStorage.removeItem("userData");
        window.location.href = "index.html";
      } else {
        alert("Error deleting account: " + data.message);
      }
    } catch (err) {
      alert("Failed to connect to the server.");
      console.error(err);
    }
  });
});

function populateList(id, items, type) {
  const list = document.getElementById(id);
  list.innerHTML = "";
  if (!items || items.length === 0) {
    list.innerHTML = "<li>No data found.</li>";
    return;
  }

  items.forEach(item => {
    const li = document.createElement("li");

    if (type === "reservation") {
      li.textContent = `Table ${item.tables} on ${item.date} at ${item.time} — Guests: ${item.guests}${item.note ? ` | Note: ${item.note}` : ""}`;

    } else if (type === "order") {
      let itemsList = "No items";

      try {
        let itemsArray = [];

        // Parse items if it's a string
        if (typeof item.items === "string") {
          itemsArray = JSON.parse(item.items);
        } else if (Array.isArray(item.items)) {
          itemsArray = item.items;
        }

        // Count duplicates
        const itemCounts = {};
        itemsArray.forEach(i => {
          const name = typeof i === "string" ? i : i.name;
          if (name) {
            itemCounts[name] = (itemCounts[name] || 0) + 1;
          }
        });

        // Format result: "Edamame x2, Ramen x1"
        itemsList = Object.entries(itemCounts)
          .map(([name, count]) => `${name} x${count}`)
          .join(", ");

      } catch (err) {
        console.error("Error parsing order items:", err);
        itemsList = typeof item.items === "string" ? item.items : "Unknown format";
      }

      li.textContent = `Items: ${itemsList} — Location: ${item.delivery_location} at ${item.delivery_time}`;

    } else if (type === "review") {
      li.textContent = `${item.text} (${item.rating}/5) on ${new Date(item.created_at).toLocaleDateString()}`;

    } else {
      li.textContent = JSON.stringify(item);
    }

    list.appendChild(li);
  });
}
