/* ====================================
   TRAVEL BOOKING WEBSITE - JAVASCRIPT
   ==================================== */

/* ====================================
   CONSTRUCTORS / OBJETO DEFINITIONS
   ==================================== */

// Product Object: Store item details
function Product(id, name, price, quantity, description, image) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.quantity = quantity;
    this.description = description;
    this.image = image;
}

// Cart Item Object: Store item details in the cart
function Cart(id, price, quantity) {
    this.id = id;
    this.price = price;
    this.quantity = quantity;
}

// Review Object: Store review and rating information
function Review(productId, userName, reviewText, starRating) {
    this.productId = productId;
    this.userName = userName;
    this.reviewText = reviewText;
    this.starRating = starRating;
}

/* ====================================
   GLOBAL VARIABLES
   ==================================== */

var products = [];
var cart = [];
var reviews = [];
var filters = {
    search: "",
    maxPrice: "all",
    sortBy: "name-asc"
};
const BASE_BOOKING_FEE = 20;
const TAX_RATE = 0.13;
let toastTimer = null;

// Currency conversion rates (relative to CAD)
const conversionRates = {
    CAD: 1,
    USD: 0.74,  // Example rate (1 CAD = 0.74 USD)
    EUR: 0.66   // Example rate (1 CAD = 0.66 EUR)
};
var currentCurrency = 'CAD';

const STORAGE_KEYS = {
    cart: "travel_cart",
    reviews: "travel_reviews",
    currency: "travel_currency"
};

/* ====================================
   INITIALIZATION
   ==================================== */

// Function that runs on page load
function initialize() {
    // Populate products array with product objects
    products.push(new Product(1, "Amsterdam", 450.00, 1, "The Venice of the North", "./images/amsterdam.jpg"));
    products.push(new Product(2, "Bangkok", 550.00, 1, "A City of Contrasts", "./images/bangkok.jpg"));
    products.push(new Product(3, "Dubai", 800.00, 1, "A Modern Marvel in the Desert", "./images/dubai.jpg"));
    products.push(new Product(4, "London", 700.00, 1, "A City Rich in History", "./images/london.jpg"));
    products.push(new Product(5, "New York", 650.00, 1, "The City That Never Sleeps", "./images/nyc.jpg"));
    products.push(new Product(6, "Paris", 750.00, 1, "Experience the City of Lights", "./images/paris.jpg"));
    products.push(new Product(7, "Rio de Janeiro", 400.00, 1, "The Marvelous City", "./images/rio.jpg"));
    products.push(new Product(8, "Rome", 600.00, 1, "The Eternal City", "./images/rome.jpg"));
    products.push(new Product(9, "Sidney", 900.00, 1, "A Harbour City with Iconic Landmarks", "./images/sidney.jpg"));
    products.push(new Product(10, "Toronto", 500.00, 1, "A Multicultural Metropolis", "./images/toronto.jpg"));

    setDefaultReviews();
    loadFromStorage();
    bindEvents();
    syncCurrencySelector();
    displayProducts();
    displayCart();
    displayReviews();
    calculateTotal();
}

// Run initialize when the page is loaded
document.addEventListener("DOMContentLoaded", initialize);

function bindEvents() {
    const reviewForm = document.getElementById("reviewForm");
    const destinationSearch = document.getElementById("destinationSearch");
    const priceFilter = document.getElementById("priceFilter");
    const sortBy = document.getElementById("sortBy");

    if (destinationSearch) {
        destinationSearch.addEventListener("input", function (event) {
            filters.search = event.target.value.toLowerCase().trim();
            displayProducts();
        });
    }

    if (priceFilter) {
        priceFilter.addEventListener("change", function (event) {
            filters.maxPrice = event.target.value;
            displayProducts();
        });
    }

    if (sortBy) {
        sortBy.addEventListener("change", function (event) {
            filters.sortBy = event.target.value;
            displayProducts();
        });
    }

    if (!reviewForm) {
        return;
    }

    reviewForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const userName = document.getElementById("userName").value.trim();
        const reviewText = document.getElementById("reviews").value.trim();
        const starRating = document.getElementById("starRating").value;

        reviews.push(new Review(null, userName, reviewText, starRating));
        saveToStorage();
        displayReviews();
        showToast("Feedback submitted successfully.");
        reviewForm.reset();
    });
}

function setDefaultReviews() {
    reviews = [
        new Review(1, "Chris", "Great trip to Paris!", 5),
        new Review(2, "Jennifer", "Good tour, but could be better.", 4),
        new Review(3, "Tom", "Not worth the money.", 2),
        new Review(4, "Danielle", "My travel was amazing!", 5)
    ];
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
    localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(reviews));
    localStorage.setItem(STORAGE_KEYS.currency, currentCurrency);
}

function loadFromStorage() {
    const savedCart = localStorage.getItem(STORAGE_KEYS.cart);
    const savedReviews = localStorage.getItem(STORAGE_KEYS.reviews);
    const savedCurrency = localStorage.getItem(STORAGE_KEYS.currency);

    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
        } catch (error) {
            cart = [];
        }
    }

    if (savedReviews) {
        try {
            reviews = JSON.parse(savedReviews);
        } catch (error) {
            setDefaultReviews();
        }
    }

    if (savedCurrency && conversionRates[savedCurrency]) {
        currentCurrency = savedCurrency;
    }
}

function syncCurrencySelector() {
    const selector = document.getElementById("currencySelector");
    if (selector) {
        selector.value = currentCurrency;
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency: currentCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) {
        return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    if (toastTimer) {
        clearTimeout(toastTimer);
    }

    toastTimer = setTimeout(function () {
        toast.classList.remove("show");
    }, 1800);
}

/* ====================================
   CURRENCY FUNCTIONS
   ==================================== */

// Function to update the currency and refresh prices
function updateCurrency() {
    const selectedCurrency = document.getElementById("currencySelector").value;
    currentCurrency = selectedCurrency;
    saveToStorage();
    displayProducts();
    displayCart();
    calculateTotal();
    showToast("Currency updated to " + currentCurrency + ".");
}

// Function to convert price based on selected currency
function convertPrice(price) {
    return price * conversionRates[currentCurrency];
}

/* ====================================
   DISPLAY PRODUCTS
   ==================================== */

// Display product catalog dynamically
function displayProducts() {
    var productDestination = document.getElementById("destination");
    productDestination.innerHTML = "";

    var visibleProducts = getVisibleProducts();

    if (visibleProducts.length === 0) {
        productDestination.innerHTML = '<p class="no-results">No destinations found with current filters.</p>';
        return;
    }

    for (var i = 0; i < visibleProducts.length; i++) {
        var product = visibleProducts[i];

        // Create a new div element for the product
        var productDiv = document.createElement("div");
        productDiv.classList.add("destination");

        const convertedPrice = convertPrice(product.price);
        productDiv.innerHTML =
            '<img src="' + product.image + '" alt="' + product.name + '" >' +
            '<h3>' + product.name + '</h3>' +
            '<p>' + product.description + '</p>' +
            '<p>Price: ' + formatCurrency(convertedPrice) + ' per person</p>' +
            '<button onclick="addToCart(' + product.id + ')" class="addCart" data-price="' + product.price + '" aria-label="Book ' + product.name + '">Book Now</button>';

        productDestination.appendChild(productDiv);
    }
}

function getVisibleProducts() {
    var result = products.slice();

    if (filters.search) {
        result = result.filter(function (product) {
            return product.name.toLowerCase().includes(filters.search) ||
                product.description.toLowerCase().includes(filters.search);
        });
    }

    if (filters.maxPrice !== "all") {
        var max = Number(filters.maxPrice);
        result = result.filter(function (product) {
            return product.price <= max;
        });
    }

    if (filters.sortBy === "price-asc") {
        result.sort(function (a, b) { return a.price - b.price; });
    } else if (filters.sortBy === "price-desc") {
        result.sort(function (a, b) { return b.price - a.price; });
    } else {
        result.sort(function (a, b) { return a.name.localeCompare(b.name); });
    }

    return result;
}

/* ====================================
   DISPLAY CART
   ==================================== */

// Display cart contents
function displayCart() {
    const cartContainer = document.getElementById("cart");
    cartContainer.innerHTML = "";

    if (cart.length === 0) {
        cartContainer.innerHTML = '<p class="no-reviews">Your cart is empty.</p>';
        calculateTotal();
        return;
    }

    for (var i = 0; i < cart.length; i++) {
        const item = cart[i];

        // Create a new element for each item in the cart
        const itemDiv = document.createElement("div");
        itemDiv.classList.add("cart-item");

        // Fill the item's HTML
        itemDiv.innerHTML =
            '<p><b>' + item.name + '</b></p>' +
            '<p><b>Price:</b> ' + formatCurrency(convertPrice(item.price)) + '</p>' +
            '<p><b>Quantity:</b> ' + item.quantity + '</p>' +
            '<p><b>Subtotal:</b> ' + formatCurrency(convertPrice(item.subtotal)) + '</p>' +
            '<button onclick="RemoveFromCart(' + item.id + ')" class="removeCart" aria-label="Remove ' + item.name + ' from cart">Remove</button>';

        // Add the item to the cart container
        cartContainer.appendChild(itemDiv);
    }
    calculateTotal();
}

/* ====================================
   CART FUNCTIONS (ADD/REMOVE)
   ==================================== */

// Add items to cart
function addToCart(id) {
    var quantityToAdd = 1;

    // Search if the item is already in the cart
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].id === id) {
            cart[i].quantity = cart[i].quantity + 1;
            cart[i].subtotal = cart[i].price * cart[i].quantity;
            saveToStorage();
            displayCart();
            showToast("Updated quantity for " + cart[i].name + ".");
            return; // Item found and updated, stop here
        }
    }

    // If not found in the cart, search in the product options
    for (var i = 0; i < products.length; i++) {
        if (products[i].id === id) {
            var newItem = {
                id: products[i].id,
                name: products[i].name,
                price: products[i].price,
                quantity: quantityToAdd,
                subtotal: products[i].price * quantityToAdd
            };

            cart.push(newItem);
            saveToStorage();
            showToast(products[i].name + " added to cart.");
        }
    }
    displayCart(); // Update the cart
}

// Remove items from cart
function RemoveFromCart(id) {
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].id === id) {
            cart[i].quantity = cart[i].quantity - 1;

            if (cart[i].quantity <= 0) {
                const removedName = cart[i].name;
                cart.splice(i, 1); // Completely remove the item
                saveToStorage();
                showToast(removedName + " removed from cart.");
            } else {
                cart[i].subtotal = cart[i].price * cart[i].quantity;
                saveToStorage();
                showToast("Updated quantity for " + cart[i].name + ".");
            }
        }
    }

    displayCart(); // Update the cart display
}

/* ====================================
   CALCULATE TOTALS
   ==================================== */

// Calculate and display order totals
function calculateTotal() {
    var subtotal = 0;
    var bookingFees = BASE_BOOKING_FEE;
    var convertedBookingFees = convertPrice(bookingFees);
    var total;

    // Calculate the subtotal with the loop
    for (var i = 0; i < cart.length; i++) {
        subtotal = subtotal + convertPrice(cart[i].price) * cart[i].quantity;
    }

    // Calculate the tax rate
    var tax = subtotal * TAX_RATE;

    // Calculate the total (with the service fee)
    total = subtotal + tax + convertedBookingFees;

    // Update the values on the page
    document.getElementById("subtotal").innerText = formatCurrency(subtotal);
    document.getElementById("tax").innerText = formatCurrency(tax);
    if (cart.length > 0) {
        document.getElementById("bookingFees").innerText = formatCurrency(convertedBookingFees);
    } else {
        document.getElementById("bookingFees").innerText = formatCurrency(0);
    }
    document.getElementById("total").innerText = formatCurrency(total);
}

/* ====================================
   REVIEWS
   ==================================== */

// Display reviews
function displayReviews() {
    // Get the div element to display reviews list
    var reviewList = document.getElementById("reviewList");
    reviewList.innerHTML = "";

    if (reviews.length === 0) {
        reviewList.innerHTML = '<li class="no-reviews">No reviews yet. Be the first to share!</li>';
        return;
    }

    for (var i = 0; i < reviews.length; i++) {
        var li = document.createElement("li");
        var stars = "⭐".repeat(Number(reviews[i].starRating));
        li.innerHTML = '<h3>' + reviews[i].userName + '</h3>' +
            '<p>' + reviews[i].reviewText + '</p>' +
            '<div class="review-rating"><span>' + stars + '</span><span>' + reviews[i].starRating + '/5</span></div>';
        reviewList.appendChild(li);
    }
}
