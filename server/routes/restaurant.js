const express = require('express');
const router = express.Router();
const { PiNetwork } = require('@pinetwork-js/sdk');
const { validatePayment } = require('../utils/piNetworkUtils');

// Sample data - Replace with database queries in production
const restaurants = {
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
            // Add more menu items here
        ]
    }
    // Add more restaurants here
};

// Get restaurant details
router.get('/:id', (req, res) => {
    const restaurant = restaurants[req.params.id];
    if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.json(restaurant);
});

// Get restaurant menu
router.get('/:id/menu', (req, res) => {
    const restaurant = restaurants[req.params.id];
    if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.json(restaurant.menu);
});

// Submit order
router.post('/orders', async (req, res) => {
    try {
        const { items, payment, userId, restaurantId } = req.body;

        // Validate the payment with Pi Network
        const isValid = await validatePayment(payment);
        if (!isValid) {
            return res.status(400).json({ error: 'Invalid payment' });
        }

        // Create order in database (implement your database logic here)
        const order = {
            id: generateOrderId(),
            items,
            userId,
            restaurantId,
            payment,
            status: 'confirmed',
            createdAt: new Date()
        };

        // In production, save the order to your database
        // await Order.create(order);

        res.status(201).json(order);
    } catch (error) {
        console.error('Order submission error:', error);
        res.status(500).json({ error: 'Failed to process order' });
    }
});

// Get restaurant reviews
router.get('/:id/reviews', (req, res) => {
    const restaurant = restaurants[req.params.id];
    if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
    }

    // In production, fetch reviews from database
    const reviews = [
        {
            id: '1',
            userId: 'user1',
            userName: 'John Doe',
            rating: 5,
            comment: 'Amazing pizza! The crust was perfect and the toppings were fresh. Delivery was quick too!',
            createdAt: new Date('2024-01-15'),
            orderedItems: ['Margherita Pizza']
        }
        // Add more reviews here
    ];

    res.json(reviews);
});

// Submit review
router.post('/:id/reviews', (req, res) => {
    const { userId, rating, comment } = req.body;
    const restaurant = restaurants[req.params.id];
    
    if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
    }

    // In production, save review to database
    const review = {
        id: generateReviewId(),
        userId,
        restaurantId: req.params.id,
        rating,
        comment,
        createdAt: new Date()
    };

    res.status(201).json(review);
});

// Utility functions
function generateOrderId() {
    return 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateReviewId() {
    return 'review_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

module.exports = router;
