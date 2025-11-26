const headerClockContainer = document.querySelector('.header__clock');

function updateClock() {
    const now = new Date();
    headerClockContainer.innerText = now.toLocaleTimeString('uk');
}

// Оновлення годинника кожну секунду
setInterval(updateClock, 1000);

// Початкове встановлення часу
updateClock();