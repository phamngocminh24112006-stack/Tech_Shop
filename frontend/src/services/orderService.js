import api from './api';

const orderService = {
    checkout: async (orderData) => {
        // orderData bao gồm: account_id, receiver_address, receiver_phone, payment_method
        const response = await api.post('/orders/checkout', orderData);
        return response.data;
    },
    getHistory: async (accountId) => {
        const response = await api.get(`/orders/history/${accountId}`);
        return response.data;
    },
    getOrderDetails: async (orderId) => {
        const response = await api.get(`/orders/${orderId}`);
        return response.data;
    }
};

export default orderService;