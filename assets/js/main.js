// Initialisierung der GLightbox
const lightbox = GLightbox({
  touchNavigation: true,
  loop: true,
});

(function () {
  "use strict";

  // Apply .scrolled class to the body as the page is scrolled down
  function toggleScrolled() {
    const selectBody = document.querySelector("body");
    const selectHeader = document.querySelector("#header");
    if (
      !selectHeader.classList.contains("scroll-up-sticky") &&
      !selectHeader.classList.contains("sticky-top") &&
      !selectHeader.classList.contains("fixed-top")
    )
      return;
    window.scrollY > 100
      ? selectBody.classList.add("scrolled")
      : selectBody.classList.remove("scrolled");
  }

  document.addEventListener("scroll", toggleScrolled);
  window.addEventListener("load", toggleScrolled);

  // Mobile nav toggle

  const mobileNavToggleBtn = document.querySelector(".mobile-nav-toggle");

  function mobileNavToogle() {
    document.querySelector("body").classList.toggle("mobile-nav-active");
    mobileNavToggleBtn.classList.toggle("bi-list");
    mobileNavToggleBtn.classList.toggle("bi-x");

    // Wenn das Menü geschlossen wird, alle Dropdowns zurücksetzen
    if (!document.body.classList.contains("mobile-nav-active")) {
      const dropdownToggles = document.querySelectorAll(
        ".navigation .toggle-btn-dropdown"
      );
      dropdownToggles.forEach((toggle) => {
        toggle.parentNode.classList.remove("active"); // Entfernt die aktive Klasse vom Dropdown-Container
        toggle.parentNode.nextElementSibling.classList.remove(
          "dropdown-active"
        ); // Schließt das Dropdown
      });
    }
  }
  mobileNavToggleBtn.addEventListener("click", mobileNavToogle);

  // Hide mobile nav on same-page/hash links
  document.querySelectorAll("#navigation a").forEach((navigation) => {
    navigation.addEventListener("click", () => {
      if (document.querySelector(".mobile-nav-active")) {
        mobileNavToogle();
      }
    });
  });

  // Toggle mobile nav dropdowns

  document
    .querySelectorAll(".navigation .toggle-btn-dropdown")
    .forEach((navigation) => {
      navigation.addEventListener("click", function (e) {
        e.preventDefault();
        this.parentNode.classList.toggle("active"); // Öffnet oder schließt den Dropdown-Container
        this.parentNode.nextElementSibling.classList.toggle("dropdown-active"); // Öffnet oder schließt das Dropdown
        e.stopImmediatePropagation();
      });
    });

  //Scroll top button
  let scrollTop = document.querySelector(".scroll-to-top");

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100
        ? scrollTop.classList.add("active")
        : scrollTop.classList.remove("active");
    }
  }
  scrollTop.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

  window.addEventListener("load", toggleScrollTop);
  document.addEventListener("scroll", toggleScrollTop);

  //animate items on scroll function and init
  function aosInit() {
    AOS.init({
      duration: 600,
      easing: "ease-in-out",
      once: true,
      mirror: false,
    });
  }
  window.addEventListener("load", aosInit);

  //create carousel indicators
  document.querySelectorAll(".carousel-indicators").forEach((carouselIndicator) => {
    carouselIndicator
      .closest(".carousel")
      .querySelectorAll(".carousel-item")
      .forEach((carouselItem, index) => {
        if (index === 0) {
          carouselIndicator.innerHTML += `<li data-bs-target="#${carouselIndicator.closest(".carousel").id}" data-bs-slide-to="${index}" class="active"></li>`;
        } else {
          carouselIndicator.innerHTML += `<li data-bs-target="#${carouselIndicator.closest(".carousel").id}" data-bs-slide-to="${index}"></li>`;
        }
      });
  });
})(); 

// Funktion zum Abrufen der Wetterdaten

document.addEventListener("DOMContentLoaded", () => {
  const mapElement = document.getElementById("map");
  if (mapElement) {
    // Koordinaten und Stadtname aus den data-Attributen abrufen
    const lat = parseFloat(mapElement.dataset.lat) || 53.5511; // Standard: Hamburg
    const lon = parseFloat(mapElement.dataset.lon) || 9.9937;
    const city = mapElement.dataset.city || "Hamburg"; // Standard: Hamburg

    // Karte initialisieren
    const map = L.map("map").setView([lat, lon], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);

    // Marker hinzufügen
    L.marker([lat, lon]).addTo(map).bindPopup("City: " + city).openPopup();
  }
});


// for the graph in the /stock page

document.addEventListener("DOMContentLoaded", () => {
  if (typeof historicalData === "undefined" || historicalData.length === 0) {
    console.log("No historical data available to render the graph.");
    return;
  }

  const canvas = document.getElementById("priceChart");
  const labels = historicalData.map(data => new Date(data.date).toLocaleDateString());
  const prices = historicalData.map(data => data.close);

  const ctx = canvas.getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Closing Price",
        data: prices,
        borderColor: "#7cc2d3", // Linienfarbe
        borderWidth: 2,
        fill: false,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: "#fff", // Farbe des Labels zu Weiß
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Date",
            color: "#fff", // Farbe des Titels der x-Achse
          },
          ticks: {
            color: "#fff", //Farbe der x-Achsen-Beschriftung
          }
        },
        y: {
          title: {
            display: true,
            text: "Price",
            color: "#fff", // Farbe des Titels der y-Achse
          },
          ticks: {
            color: "#fff", // Farbe der y-Achsen-Beschriftung
          },
          suggestedMin: Math.min(...prices) - 10, // 10 Einheiten unter dem niedrigsten Wert
          suggestedMax: Math.max(...prices) + 10, // 10 Einheiten über dem höchsten Wert
        }
      }
    }
  });
});