import api from './api';

const analyticsService = {
    getPriceSegments: async () => {
        const response = await api.get('/analytics/price-segments');
        return response.data;
    },
    getShipperPerformance: async () => {
        const response = await api.get('/analytics/shipper-performance');
        return response.data;
    },
    getCustomerTiers: async () => {
        const response = await api.get('/analytics/customer-tiers');
        return response.data;
    }
};

export default analyticsService;