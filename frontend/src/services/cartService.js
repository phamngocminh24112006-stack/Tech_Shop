import api from './api';

const cartService = {
    getCartItems: async (accountId) => {
        const response = await api.get(`/cart/${accountId}`);
        return response.data;
    },
    addToCart: async (accountId, productId, quantity = 1) => {
        const response = await api.post('/cart/add', { account_id: accountId, product_id: productId, quantity });
        return response.data;
    },
    removeFromCart: async (accountId, productId) => {
        const response = await api.delete(`/cart/items/${accountId}/${productId}`);
        return response.data;
    }
};

export default cartService;