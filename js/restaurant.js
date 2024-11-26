// Restaurant page functionality
let restaurant = null;
let menuItems = [];

// Initialize Pi SDK
const Pi = window.Pi;
const piConfig = {
    version: "2.0",
    sandbox: true,
    apiKey: "YOUR_PI_API_KEY", // Replace with your actual Pi API key
};

let currentUser = null;
let authenticatedPiUser = null;

// Initialize Pi SDK and authenticate user
async function initPiNetwork() {
    try {
        Pi.init(piConfig);
        currentUser = await Pi.authenticate(['payments'], onIncompletePaymentFound);
        authenticatedPiUser = currentUser;
        updateWalletUI();
    } catch (error) {
        console.error('Error initializing Pi Network:', error);
    }
}

// Handle incomplete payments
async function onIncompletePaymentFound(payment) {
    try {
        await handleIncompletePayment(payment);
    } catch (err) {
        console.error('Error handling incomplete payment:', err);
    }
}

// Update wallet UI
function updateWalletUI() {
    const walletButton = document.querySelector('.wallet-button');
    if (authenticatedPiUser) {
        walletButton.textContent = `Connected: ${authenticatedPiUser.username}`;
        walletButton.classList.add('connected');
    } else {
        walletButton.textContent = 'Connect Wallet';
        walletButton.classList.remove('connected');
    }
}

// Load restaurant data with error handling and loading states
async function loadRestaurantData() {
    const urlParams = new URLSearchParams(window.location.search);
    const restaurantId = urlParams.get('id');
    
    if (!restaurantId) {
        showError('Restaurant ID is required');
        return;
    }

    showLoading(true);
    try {
        const response = await fetch(`/api/restaurants/${restaurantId}`);
        if (!response.ok) {
            throw new Error('Failed to load restaurant data');
        }
        
        restaurant = await response.json();
        updateRestaurantUI(restaurant);
        await loadMenuItems(restaurantId);
    } catch (error) {
        console.error('Error loading restaurant:', error);
        showError('Failed to load restaurant data. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Update restaurant UI
function updateRestaurantUI(restaurant) {
    document.getElementById('restaurant-name').textContent = restaurant.name;
    document.getElementById('restaurant-cover').src = restaurant.coverImage;
    document.getElementById('restaurant-rating').textContent = '★'.repeat(Math.floor(restaurant.rating));
    document.getElementById('review-count').textContent = `(${restaurant.reviewCount} reviews)`;
    document.getElementById('cuisine-type').textContent = restaurant.cuisineType;
    document.getElementById('delivery-time').textContent = `${restaurant.deliveryTime} min`;
    
    // Update restaurant metadata
    updateRestaurantMetadata(restaurant);
}

// Enhanced cart functionality with Pi Network integration
async function addToCart(item) {
    if (!authenticatedPiUser) {
        showError('Please connect your Pi Wallet to add items to cart');
        return;
    }

    cart.push({
        ...item,
        timestamp: new Date().toISOString(),
        userId: authenticatedPiUser.uid
    });
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    showSuccess('Item added to cart');
}

// Process payment with Pi Network
async function processPayment(total) {
    if (!authenticatedPiUser) {
        showError('Please connect your Pi Wallet to proceed');
        return;
    }

    try {
        const payment = await Pi.createPayment({
            amount: total,
            memo: `Food order from ${restaurant.name}`,
            metadata: { orderId: generateOrderId() }
        });

        if (payment.status === 'completed') {
            await submitOrder(payment);
            clearCart();
            showSuccess('Order placed successfully!');
        } else {
            showError('Payment failed. Please try again.');
        }
    } catch (error) {
        console.error('Payment error:', error);
        showError('Payment processing failed. Please try again.');
    }
}

// Submit order to backend
async function submitOrder(payment) {
    try {
        const response = await fetch(`/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: cart,
                payment: payment,
                userId: authenticatedPiUser.uid,
                restaurantId: restaurant.id
            })
        });

        if (!response.ok) {
            throw new Error('Failed to submit order');
        }

        return await response.json();
    } catch (error) {
        console.error('Order submission error:', error);
        throw error;
    }
}

// UI helper functions
function showLoading(show) {
    const spinner = document.querySelector('.loading-spinner');
    if (show) {
        spinner.classList.remove('hidden');
    } else {
        spinner.classList.add('hidden');
    }
}

function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Utility functions
function generateOrderId() {
    return 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Load menu items
async function loadMenuItems(restaurantId) {
    try {
        const response = await fetch(`/api/restaurants/${restaurantId}/menu`);
        menuItems = await response.json();
        
        // Group items by category
        const categories = groupByCategory(menuItems);
        renderMenuCategories(categories);
    } catch (error) {
        console.error('Error loading menu items:', error);
    }
}

// Group menu items by category
function groupByCategory(items) {
    return items.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {});
}

// Render menu categories
function renderMenuCategories(categories) {
    const container = document.getElementById('menu-categories');
    container.innerHTML = '';

    Object.entries(categories).forEach(([category, items]) => {
        const categoryElement = document.createElement('div');
        categoryElement.innerHTML = `
            <h2 class="text-xl font-bold mb-4">${category}</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${items.map(item => `
                    <div class="flex items-center space-x-4 p-4 border rounded-lg">
                        <img src="${item.image}" alt="${item.name}" class="w-24 h-24 object-cover rounded-lg">
                        <div class="flex-1">
                            <h3 class="font-bold">${item.name}</h3>
                            <p class="text-gray-600 text-sm">${item.description}</p>
                            <div class="flex items-center justify-between mt-2">
                                <span class="font-bold">π${item.price.toFixed(2)}</span>
                                <button 
                                    onclick="addToCart(${JSON.stringify(item).replace(/"/g, '&quot;')})"
                                    class="px-4 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                >
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(categoryElement);
    });
}

// Cart functionality
const cartIcon = document.getElementById('cart-icon');
const cartDropdown = document.getElementById('cart-dropdown');
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Toggle cart dropdown
cartIcon.addEventListener('click', () => {
    cartDropdown.classList.toggle('hidden');
});

// Close cart when clicking outside
document.addEventListener('click', (e) => {
    if (!cartIcon.contains(e.target)) {
        cartDropdown.classList.add('hidden');
    }
});

// Remove item from cart
function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

// Update cart UI
function updateCartUI() {
    const cartItems = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');

    // Update cart count
    cartCount.textContent = cart.length;

    // Update cart items
    cartItems.innerHTML = cart.map((item, index) => `
        <div class="flex items-center justify-between">
            <div>
                <h4 class="font-medium">${item.name}</h4>
                <p class="text-sm text-gray-600">π${item.price.toFixed(2)}</p>
            </div>
            <button 
                onclick="removeFromCart(${index})"
                class="text-red-600 hover:text-red-800"
            >
                Remove
            </button>
        </div>
    `).join('');

    // Update total
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    cartTotal.textContent = `π${total.toFixed(2)}`;
}

// Search functionality
const searchInput = document.querySelector('input[type="text"]');
searchInput.addEventListener('input', debounce(handleSearch, 300));

function handleSearch(event) {
    const query = event.target.value.toLowerCase();
    const filteredItems = menuItems.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.description.toLowerCase().includes(query)
    );
    
    const categories = groupByCategory(filteredItems);
    renderMenuCategories(categories);
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize page with Pi Network
document.addEventListener('DOMContentLoaded', () => {
    initPiNetwork();
    loadRestaurantData();
    updateCartUI();
});
