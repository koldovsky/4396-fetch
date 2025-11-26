// fetch("api/products.json")
//   .then((response) => response.json())
//   .then((stickers) => renderProducts(stickers));

const response = await fetch("api/products.json");
const stickers = await response.json();
renderProducts(stickers);


function renderProducts(products, rate = 1) {
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
                    Buy for ${(product.price * rate).toFixed(2)}
                </button>
            </div>
        </article>`;
    productsHtml.push(productHtml);
  }
  const productListContainer = document.querySelector(".products__list");
  productListContainer.innerHTML = productsHtml.join("");
}

let currencies;
async function changeCurrency() {
    if (!currencies) {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        currencies = await response.json();
    }
    const userSelectedCurrency = document.querySelector('.products__currency').value;
    const convertRate = currencies.rates[userSelectedCurrency];
    renderProducts(stickers, convertRate);
}

document.querySelector('.products__currency').addEventListener('change', changeCurrency);