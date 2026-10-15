import api from './api';

const productService = {
    getNewProducts: async () => {
        const response = await api.get('/products/new');
        return response.data;
    },
    getFlashSale: async () => {
        const response = await api.get('/products/flash-sale');
        return response.data;
    },
    getProductById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
    },
    searchProducts: async (params) => {
        const response = await api.get('/products/search', { params });
        return response.data;
    }

};

export default productService;