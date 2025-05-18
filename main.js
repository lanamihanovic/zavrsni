document.addEventListener("DOMContentLoaded", () => {
  const userData = JSON.parse(localStorage.getItem("userData"));
  initApp(userData);
});

function initApp(userData) {
  const isAdmin = userData?.email === "admin@example.com";
  const reviewsList = document.getElementById("reviews-list");
  const addReviewButton = document.getElementById("add-review-button");
  const reviewModal = document.getElementById("review-modal");
  const closeReviewModalButton = document.getElementById("close-review-modal");
  const submitReviewButton = document.getElementById("submit-review");
  const reviewTextarea = document.getElementById("review-textarea");
  const anonymousCheckbox = document.getElementById("anonymous-checkbox");
  const scrollToTopButton = document.getElementById("scroll-to-top");

  const nav = document.querySelector(".navlinks");
  const profile = document.createElement("li");

  if (userData) {
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

    document.getElementById("logout-btn").addEventListener("click", () => {
      localStorage.removeItem("userData");
      window.location.href = "login.html";
    });
  }

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

const normalizedLocalReviews = localReviews.map((r) => ({
  ...r,
  text: r.text || r.comment || "",
  created_at: r.created_at || r.date || new Date().toISOString(),
  user: r.user || "Korisnik",
  userImage: r.userImage || "slike/default-avatar.png",
}));



    fetch("http://localhost/zavrsni/get_reviews.php")
      .then((response) => response.json())
      .then((dbData) => {
        if (dbData.status !== "success") throw new Error("DB error");

        fetch("./reviews.json")
          .then((response) => response.json())
          .then((jsonData) => {
            const jsonReviews = jsonData.reviews.map((r) => ({
              ...r,
              text: r.text || r.comment,
              created_at: r.created_at || r.date,
              user_id: r.user_id || null,
              user: r.user || "Korisnik",
              userImage: r.userImage || "slike/default-avatar.png",
            }));

            const combinedReviews = [
              ...dbData.reviews,
              ...jsonReviews,
              ...normalizedLocalReviews,
            ];

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
                  const isAuthor =
                    userData && review.user_id === userData.id;
                  const canDelete = isAdmin || isAuthor;
                  const deleteBtn =
                    canDelete && review.id
                      ? `<button class="delete-btn" data-id="${review.id}">Delete</button>`
                      : "";

                  return `
              <li class="review-card">
                <img src="${review.userImage}" alt="${review.user}" class="review-image">
                <div class="review-content">
                  <strong>${review.user}</strong><br>
                  <small>${new Date(review.created_at).toLocaleString("hr-HR")}</small>
                  <p>${review.text}</p>
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
                    if (!id || isNaN(id)) return;

                    if (confirm("Jeste li sigurni da želite obrisati ovu recenziju?")) {
                     fetch("http://localhost/zavrsni/delete_reviews.php", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ id: parseInt(id), admin: true }),
})

                        .then((res) => res.json())
                        .then((data) => {
                        if (data.status === "success") {
    newReview.id = data.id; // ⬅️ OBAVEZNO DODATI OVO!
  newReview.comment = newReview.text; // ⬅️ dodatak za kompatibilnost
  newReview.date = newReview.created_at; // ⬅️ dodatak za kompatibilnost

  let reviews = JSON.parse(localStorage.getItem("reviews")) || [];
  reviews.push(newReview);
  localStorage.setItem("reviews", JSON.stringify(reviews));

  reviewTextarea.value = "";
  if (anonymousCheckbox) anonymousCheckbox.checked = false;
  selectedRating = 0;
  highlightStars(0);
  reviewModal.style.display = "none";

  renderReviews();
} else {
  alert("Greška pri upisu u bazu: " + data.message);
}

                        })
                        .catch((err) => {
                          // alert("Greška u komunikaciji s poslužiteljem.");
                          console.error(err);
                        });
                    }
                  });
                });
              }
            }
          });
      });
  }

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
        text: reviewTextarea.value.trim(),
        created_at: new Date().toISOString(),
        rating: selectedRating || 5,
        id: null,
        user_id: userData.id,
      };

      fetch("http://localhost/zavrsni/review.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userData.id,
          text: newReview.text,
          rating: newReview.rating,
          anonymous: isAnonymous,
          created_at: newReview.created_at,
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
            newReview.id = data.id;
            let reviews =
              JSON.parse(localStorage.getItem("reviews")) || [];
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
          // alert("Greška u komunikaciji s poslužiteljem.");
          console.error(err);
        });
    });
  }

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
