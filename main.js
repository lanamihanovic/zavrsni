document.addEventListener("DOMContentLoaded", () => {
  const userData = JSON.parse(localStorage.getItem("userData"));
  initApp(userData);
});

function initApp(userData) {
  const isAdmin = userData?.isAdmin;
  const reviewsList = document.getElementById("reviews-list");
  const addReviewButton = document.getElementById("add-review-button");
  const reviewModal = document.getElementById("review-modal");
  const closeReviewModalButton = document.getElementById("close-review-modal");
  const submitReviewButton = document.getElementById("submit-review");
  const reviewTextarea = document.getElementById("review-textarea");
  const anonymousCheckbox = document.getElementById("anonymous-checkbox");
  const scrollToTopButton = document.getElementById("scroll-to-top");

  // 👤 Prikaz korisničkog profila
  const nav = document.querySelector(".navlinks");
  const profile = document.createElement("li");

  if (userData) {
    profile.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <img src="${userData.image || 'slike/default-avatar.png'}" alt="" style="width:30px; height:30px; border-radius:50%;">
        <span>${userData.username}</span>
        <button id="logout-btn" style="margin-left:10px; background:#e74c3c; border:none; padding:5px 10px; color:#fff; border-radius:5px; cursor:pointer;">Logout</button>
      </div>
    `;
    nav.appendChild(profile);

    document.getElementById("logout-btn").addEventListener("click", () => {
      localStorage.removeItem("userData");
      window.location.href = "login.html";
    });
  }

  // ⭐ Ocjenjivanje zvjezdicama
  let selectedRating = 0;
  const stars = document.querySelectorAll(".star");

  stars.forEach((star) => {
    star.addEventListener("mouseover", () => {
      const value = parseInt(star.getAttribute("data-value"));
      highlightStars(value);
    });

    star.addEventListener("mouseout", () => {
      highlightStars(selectedRating);
    });

    star.addEventListener("click", () => {
      selectedRating = parseInt(star.getAttribute("data-value"));
      highlightStars(selectedRating);
    });
  });

  function highlightStars(rating) {
    stars.forEach((star) => {
      const value = parseInt(star.getAttribute("data-value"));
      star.classList.toggle("selected", value <= rating);
    });
  }

  function renderReviews() {
    const localReviews = JSON.parse(localStorage.getItem("reviews")) || [];

    fetch("./reviews.json")
      .then((response) => response.json())
      .then((data) => {
        const combinedReviews = [...data.reviews, ...localReviews];

        const isIndex =
          window.location.pathname.includes("index.html") ||
          window.location.pathname === "/" ||
          window.location.pathname.endsWith("/index");

        const reviewsToRender = isIndex
          ? combinedReviews.slice(0, 1)
          : combinedReviews;

        if (reviewsList) {
          reviewsList.innerHTML = reviewsToRender
            .map((review) => {
              const isAuthor = userData && review.user_id === userData.id;
              const canDelete = isAdmin || isAuthor;

              const deleteBtn = canDelete
                ? `<button class="delete-btn" data-id="${review.id}">Delete</button>`
                : "";

              return `
                <li class="review-card">
                  <img src="${review.userImage || 'slike/default-avatar.png'}" alt="${review.user}" class="review-image">
                  <div class="review-content">
                    <strong>${review.user}</strong> (${new Date(review.date).toLocaleDateString()}):
                    <p>${review.comment}</p>
                    <span>${"⭐".repeat(review.rating)}</span><br>
                    ${deleteBtn}
                  </div>
                </li>
              `;
            })
            .join("");

        if (isAdmin) {
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.target.dataset.id;

      if (confirm("Are you sure you want to delete this review?")) {
        fetch("http://localhost/zavrsni/delete_reviews.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: parseInt(id) }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.status === "success") {
              // Očisti localStorage (opcionalno ako si već renderirao)
              let reviews = JSON.parse(localStorage.getItem("reviews")) || [];
              reviews = reviews.filter((r) => r.id !== parseInt(id));
              localStorage.setItem("reviews", JSON.stringify(reviews));
              renderReviews();
            } else {
              alert("Greška pri brisanju: " + data.message);
            }
          })
          .catch((err) => {
            alert("Došlo je do greške u komunikaciji s poslužiteljem.");
            console.error(err);
          });
      }
    });
  });
}

        }
      })
      .catch(() => {
        reviewsList.innerHTML = "<p>Unable to load reviews.</p>";
      });
  }

  // Modal logika
  if (addReviewButton) {
    addReviewButton.addEventListener("click", () => {
      if (!userData) {
        alert("You must be logged in to add a review.");
        window.location.href = "login.html";
      } else {
        reviewModal.style.display = "flex";
      }
    });
  }

  if (closeReviewModalButton) {
    closeReviewModalButton.addEventListener("click", () => {
      reviewModal.style.display = "none";
    });
  }

  if (submitReviewButton) {
  submitReviewButton.addEventListener("click", (e) => {
  e.preventDefault();

  if (!reviewTextarea.value.trim()) {
    alert("Please write a review before submitting.");
    return;
  }

  const isAnonymous = anonymousCheckbox?.checked || false;

  const newReview = {
    user: isAnonymous ? "Anonymous" : userData?.username || "Guest",
    userImage: isAnonymous
      ? "slike/default-avatar.png"
      : userData?.image || "slike/default-avatar.png",
    comment: reviewTextarea.value.trim(),
    date: new Date().toISOString(),
    rating: selectedRating || 5,
  };

  fetch("http://localhost/zavrsni/review.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userData.id,
      comment: newReview.comment,
      rating: newReview.rating,
      anonymous: isAnonymous,
      date: newReview.date,
    }),
  })
    .then(async (res) => {
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON: " + text);
      }
    })
    .then((data) => {
      if (data.status === "success") {
        let reviews = JSON.parse(localStorage.getItem("reviews")) || [];
        reviews.push(newReview);
        localStorage.setItem("reviews", JSON.stringify(reviews));

        reviewTextarea.value = "";
        anonymousCheckbox.checked = false;
        selectedRating = 0;
        highlightStars(0);
        reviewModal.style.display = "none";

        renderReviews();
      } else {
        alert("Greška pri upisu u bazu: " + data.message);
      }
    })
    .catch((err) => {
      alert("Greška u komunikaciji s poslužiteljem.");
      console.error(err);
    });
});

  }
  

  // Scroll to top
  window.addEventListener("scroll", () => {
    if (scrollToTopButton) {
      scrollToTopButton.style.display =
        window.scrollY > 300 ? "block" : "none";
    }
  });

  if (scrollToTopButton) {
    scrollToTopButton.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  renderReviews();
}
