const slides = [
  '<div class="carousel__slide"><img src="img/baby-yoda.svg" alt="Baby Yoda"></div>',
  '<div class="carousel__slide"><img src="img/banana.svg" alt="Banana"></div>',
  '<div class="carousel__slide"><img src="img/girl.svg" alt="Girl"></div>',
  '<div class="carousel__slide"><img src="img/viking.svg" alt="Viking"></div>',
];

let currentSlideIndex = 0;

function renderCarousel() {
  const trackContainer = document.querySelector(
    ".product-carousel__track-container"
  );
  trackContainer.innerHTML = slides[currentSlideIndex];
  if (window.matchMedia("(min-width: 600px)").matches) {
    const secondSlideIndex = (currentSlideIndex + 1) % slides.length;
    trackContainer.innerHTML += slides[secondSlideIndex];
    if (window.matchMedia("(min-width: 900px)").matches) {
      const thirdSlideIndex = (currentSlideIndex + 2) % slides.length;
      trackContainer.innerHTML += slides[thirdSlideIndex];
    }
  }
}

function showNextSlide() {
  currentSlideIndex = (currentSlideIndex + 1) % slides.length;
  renderCarousel();
}

function showPrevSlide() {
  currentSlideIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
  renderCarousel();
}

// setInterval(showNextSlide, 3000);
renderCarousel();

const btnNext = document.querySelector(".product-carousel__button--next");
const btnPrev = document.querySelector(".product-carousel__button--prev");

btnNext.addEventListener("click", showNextSlide);
btnPrev.addEventListener("click", showPrevSlide);

window.addEventListener("resize", renderCarousel);