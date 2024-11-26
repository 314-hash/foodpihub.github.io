// Mock data for static hosting
const mockRestaurants = {
    '1': {
        id: '1',
        name: 'Pizza Paradise',
        coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
        rating: 4.8,
        reviewCount: 2500,
        cuisineType: 'Italian',
        deliveryTime: '30-45',
        menu: [
            {
                id: '1',
                name: 'Margherita Pizza',
                description: 'Fresh tomatoes, mozzarella, basil',
                price: 15.99,
                image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591',
                category: 'Pizza'
            },
            {
                id: '2',
                name: 'Pepperoni Pizza',
                description: 'Classic pepperoni with mozzarella',
                price: 16.99,
                image: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee',
                category: 'Pizza'
            }
        ]
    }
};

// Initialize Pi SDK
const Pi = window.Pi;
Pi.init({ version: "2.0", sandbox: true });

// Cart state
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentUser = null;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize Pi Network
        currentUser = await Pi.authenticate(['payments'], onIncompletePaymentFound);
        updateWalletUI();
        
        // Load restaurant data
        await loadRestaurantData();
        
        // Setup event listeners
        setupEventListeners();
        
        // Update cart UI
        updateCartUI();
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize the application');
    }
});

// Load restaurant data
async function loadRestaurantData() {
    showLoading(true);
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const restaurantId = urlParams.get('id') || '1';
        
        // In static version, use mock data
        const restaurant = mockRestaurants[restaurantId];
        if (!restaurant) {
            throw new Error('Restaurant not found');
        }
        
        updateRestaurantUI(restaurant);
        renderMenuItems(restaurant.menu);
    } catch (error) {
        console.error('Error loading restaurant:', error);
        showError('Failed to load restaurant data');
    } finally {
        showLoading(false);
    }
}

// Update restaurant UI
function updateRestaurantUI(restaurant) {
    document.getElementById('restaurant-name').textContent = restaurant.name;
    document.getElementById('restaurant-rating').textContent = '★'.repeat(Math.floor(restaurant.rating));
    document.getElementById('review-count').textContent = `(${restaurant.reviewCount} reviews)`;
    document.getElementById('delivery-time').textContent = `${restaurant.deliveryTime} min`;
    
    const coverImage = document.getElementById('restaurant-cover');
    if (coverImage) {
        coverImage.src = restaurant.coverImage;
        coverImage.alt = restaurant.name;
    }
}

// Render menu items
function renderMenuItems(menu) {
    const container = document.getElementById('menu-items');
    if (!container) return;

    const menuHTML = menu.map(item => `
        <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <img src="${item.image}" alt="${item.name}" class="w-full h-48 object-cover">
            <div class="p-4">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-bold text-lg">${item.name}</h3>
                        <p class="text-gray-500 text-sm">${item.description}</p>
                    </div>
                    <span class="font-bold">π${item.price.toFixed(2)}</span>
                </div>
                <div class="mt-4 flex justify-between items-center">
                    <div class="flex items-center">
                        <i class="fas fa-star text-yellow-400 mr-1"></i>
                        <span class="text-sm">4.9 (120+)</span>
                    </div>
                    <button 
                        onclick="addToCart(${JSON.stringify(item).replace(/"/g, '&quot;')})"
                        class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = menuHTML;
}

// Cart functions
function addToCart(item) {
    if (!currentUser) {
        showError('Please connect your Pi Wallet to add items to cart');
        return;
    }

    cart.push({
        ...item,
        timestamp: new Date().toISOString(),
        userId: currentUser.uid
    });
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    showSuccess('Item added to cart');
}

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    const cartItems = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');

    if (!cartItems || !cartCount || !cartTotal) return;

    cartCount.textContent = cart.length;

    cartItems.innerHTML = cart.map((item, index) => `
        <div class="flex items-center justify-between p-2 border-b">
            <div>
                <h4 class="font-medium">${item.name}</h4>
                <p class="text-sm text-gray-600">π${item.price.toFixed(2)}</p>
            </div>
            <button 
                onclick="removeFromCart(${index})"
                class="text-red-600 hover:text-red-800"
            >
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    cartTotal.textContent = `π${total.toFixed(2)}`;
}

// Pi Network functions
async function onIncompletePaymentFound(payment) {
    showError('Incomplete payment found. Please complete your previous payment first.');
}

function updateWalletUI() {
    const walletButton = document.querySelector('.wallet-button');
    if (!walletButton) return;

    if (currentUser) {
        walletButton.textContent = `Connected: ${currentUser.username}`;
        walletButton.classList.add('connected');
    } else {
        walletButton.textContent = 'Connect Wallet';
        walletButton.classList.remove('connected');
    }
}

// UI helper functions
function showLoading(show) {
    const spinner = document.querySelector('.loading-spinner');
    if (!spinner) return;
    
    spinner.classList.toggle('hidden', !show);
}

function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Event listeners
function setupEventListeners() {
    // Cart toggle
    const cartButton = document.getElementById('cart-btn');
    const cartSidebar = document.getElementById('cart-sidebar');
    
    if (cartButton && cartSidebar) {
        cartButton.addEventListener('click', () => {
            cartSidebar.classList.toggle('translate-x-full');
        });
    }

    // Close cart when clicking outside
    document.addEventListener('click', (e) => {
        if (cartSidebar && !cartSidebar.contains(e.target) && !cartButton.contains(e.target)) {
            cartSidebar.classList.add('translate-x-full');
        }
    });

    // Search functionality
    const searchInput = document.querySelector('input[type="text"]');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
}

// Search functionality
function handleSearch(event) {
    const query = event.target.value.toLowerCase();
    const restaurant = mockRestaurants['1']; // Using mock data
    
    const filteredItems = restaurant.menu.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.description.toLowerCase().includes(query)
    );
    
    renderMenuItems(filteredItems);
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
