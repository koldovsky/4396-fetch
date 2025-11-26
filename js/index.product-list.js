const stickers = [
  {
    id: 1,
    name: "Baby Yoda",
    price: 5.99,
    image: "img/baby-yoda.svg",
    description:
      "The Child from The Mandalorian series. A cute and popular character. Perfect for Star Wars fans.",
  },
  {
    id: 2,
    name: "Banana",
    price: 4.99,
    image: "img/banana.svg",
    description:
      "A fun and cheerful banana sticker. Great for adding some fruity humor to your collection.",
  },
  {
    id: 3,
    name: "Girl",
    price: 5.49,
    image: "img/girl.svg",
    description:
      "A stylish girl character sticker. Perfect for personalizing your belongings.",
  },
  {
    id: 4,
    name: "Viking",
    price: 6.49,
    image: "img/viking.svg",
    description:
      "A fierce Viking warrior sticker. Ideal for fans of Norse mythology and history.",
  },
];

function renderProducts(products) {
    const productsHtml = [];
    for (const product of products) {
        const productHtml = `
        <article class="products__item">
            <img class="products__image" src="${product.image}" alt="${product.name}">
            <h3 class="products__name">${product.name}</h3>
            <p class="products__description">${product.description}</p>
            </p>
            <div class="products__actions">
                <button class="products__button products__button--info button button-card">
                    Info
                </button>
                <button class="products__button products__button--buy button button-card">
                    Buy for ${product.price}
                </button>
            </div>
        </article>`;
        productsHtml.push(productHtml);
    }
    const productListContainer = document.querySelector(".products__list");
    productListContainer.innerHTML = productsHtml.join("");
}

renderProducts(stickers);