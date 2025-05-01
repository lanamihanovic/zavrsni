import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://tntyufcvvvuxtoltwjdp.supabase.co";
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRudHl1ZmN2dnZ1eHRvbHR3amRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyMzAxODgsImV4cCI6MjA2MDgwNjE4OH0.8SnTspqZ8xKWmZZeNxTDyUJJ_tM3AVbaTgc4k5zvNEY';                
;
const supabase = createClient(supabaseUrl, supabaseKey);



document.addEventListener("DOMContentLoaded", () => {
  const userData = JSON.parse(localStorage.getItem("userData"));

  if (userData) {
    supabase
      .from("users")
      .select("id")
      .eq("username", userData.username)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          window.location.href = "register.html";
        } else {
          initApp(userData);
        }
      });
  } else {
    initApp(null);
  }
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
        <img src="${userData.image || 'slike/default-avatar.png'}" alt="User" style="width:30px; height:30px; border-radius:50%;">
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
            .map((review, index) => {
              const deleteBtn =
                isAdmin && index >= data.reviews.length
                  ? `<button class="delete-btn" data-index="${index - data.reviews.length}">Delete</button>`
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
                const index = parseInt(e.target.dataset.index);
                if (confirm("Are you sure you want to delete this review?")) {
                  const reviews = JSON.parse(localStorage.getItem("reviews")) || [];
                  reviews.splice(index, 1);
                  localStorage.setItem("reviews", JSON.stringify(reviews));
                  renderReviews();
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

      if (reviewTextarea.value.trim()) {
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
        alert("Please write a review before submitting.");
      }
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
