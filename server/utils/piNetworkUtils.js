const { PiNetwork } = require('@pinetwork-js/sdk');

// Initialize Pi Network SDK with your API key
const piNetwork = new PiNetwork({
    apiKey: process.env.PI_API_KEY,
    walletPrivateKey: process.env.PI_WALLET_PRIVATE_KEY
});

// Validate a payment with Pi Network
async function validatePayment(payment) {
    try {
        const validatedPayment = await piNetwork.validatePayment(payment);
        return validatedPayment.status === 'completed';
    } catch (error) {
        console.error('Payment validation error:', error);
        return false;
    }
}

// Handle incomplete payments
async function handleIncompletePayment(payment) {
    try {
        const completedPayment = await piNetwork.completePayment(payment);
        return completedPayment;
    } catch (error) {
        console.error('Error completing payment:', error);
        throw error;
    }
}

// Get user's Pi balance
async function getPiBalance(userId) {
    try {
        const balance = await piNetwork.getUserBalance(userId);
        return balance;
    } catch (error) {
        console.error('Error getting Pi balance:', error);
        throw error;
    }
}

// Create a new payment
async function createPayment(amount, memo, metadata) {
    try {
        const payment = await piNetwork.createPayment({
            amount,
            memo,
            metadata
        });
        return payment;
    } catch (error) {
        console.error('Error creating payment:', error);
        throw error;
    }
}

module.exports = {
    validatePayment,
    handleIncompletePayment,
    getPiBalance,
    createPayment
};
