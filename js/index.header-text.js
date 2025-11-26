const h1 = document.querySelector('h1');

// Масив вітань
const greetings = [
    'Привіт!',
    'Вітаємо!',
    'Доброго дня!',
    'Ласкаво просимо!',
    'Здоровенькі були!',
    'Добридень!',
    'Раді вас бачити!'
];

// Масив кольорів
const colors = [
    'red',
    'blue',
    'green',
    'purple',
    'orange',
    'crimson',
    'darkblue',
    'darkgreen',
    'tomato',
    'coral'
];

// Вибір рандомного вітання
const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

// Вибір рандомного кольору
const randomColor = colors[Math.floor(Math.random() * colors.length)];

// Застосування
h1.innerText = randomGreeting;
h1.style.color = randomColor;

