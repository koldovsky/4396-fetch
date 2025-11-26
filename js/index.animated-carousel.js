const slidesData = [
    '<div class="animated-carousel__slide"><img src="img/baby-yoda.svg" alt="Baby Yoda"></div>',
    '<div class="animated-carousel__slide"><img src="img/banana.svg" alt="Banana"></div>',
    '<div class="animated-carousel__slide"><img src="img/girl.svg" alt="Girl"></div>',
    '<div class="animated-carousel__slide"><img src="img/viking.svg" alt="Viking"></div>',
];

let currentSlideIndex = 0;
let isTransitioning = false;
let slidesToShow = 1;

const track = document.querySelector('.animated-carousel__track');
const btnNext = document.querySelector('.animated-carousel__button--next');
const btnPrev = document.querySelector('.animated-carousel__button--prev');

function getSlidesToShow() {
    if (window.matchMedia("(min-width: 900px)").matches) return 3;
    if (window.matchMedia("(min-width: 600px)").matches) return 2;
    return 1;
}

function renderCarousel() {
    // Clear track
    track.innerHTML = '';

    // We need clones for infinite scroll. 
    // Since max visible is 3, we clone 3 at start and 3 at end.
    const clonesCount = 3;
    
    // Create full list of slides: [clones-end, real-slides, clones-start]
    // Actually: [last-3, real-slides, first-3]
    
    const lastClones = slidesData.slice(-clonesCount);
    const firstClones = slidesData.slice(0, clonesCount);
    
    const allSlides = [...lastClones, ...slidesData, ...firstClones];
    
    track.innerHTML = allSlides.join('');
    
    // Set initial position
    updateCarousel(false);
}

function updateCarousel(animate = true) {
    slidesToShow = getSlidesToShow();
    const slideWidth = 100 / slidesToShow;
    const clonesCount = 3;
    
    // The real index 0 is actually at offset 'clonesCount' in the DOM list
    // So we translate by (currentSlideIndex + clonesCount) * slideWidth
    
    const offset = -(currentSlideIndex + clonesCount) * slideWidth;
    
    if (animate) {
        track.style.transition = 'transform 0.5s ease-in-out';
    } else {
        track.style.transition = 'none';
    }
    
    track.style.transform = `translateX(${offset}%)`;
}

function handleTransitionEnd() {
    isTransitioning = false;
    
    const totalRealSlides = slidesData.length;
    
    // If we went past the last real slide
    if (currentSlideIndex >= totalRealSlides) {
        currentSlideIndex = 0;
        updateCarousel(false);
    }
    // If we went before the first real slide
    else if (currentSlideIndex < 0) {
        currentSlideIndex = totalRealSlides - 1;
        updateCarousel(false);
    }
}

function showNextSlide() {
    if (isTransitioning) return;
    isTransitioning = true;
    currentSlideIndex++;
    updateCarousel(true);
}

function showPrevSlide() {
    if (isTransitioning) return;
    isTransitioning = true;
    currentSlideIndex--;
    updateCarousel(true);
}

// Initialize
renderCarousel();

// Event Listeners
btnNext.addEventListener('click', showNextSlide);
btnPrev.addEventListener('click', showPrevSlide);
track.addEventListener('transitionend', handleTransitionEnd);

window.addEventListener('resize', () => {
    // On resize, we might change slidesToShow, so we need to update position without animation to avoid glitches
    updateCarousel(false);
});
