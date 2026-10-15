import api from "./api";

export const getShopHome = async () => {
  const res = await api.get("/shop/home");
  return res.data;
};

export const getCategories = async () => {
  const res = await api.get("/shop/categories");
  return res.data;
};

export const getBrands = async () => {
  const res = await api.get("/shop/brands");
  return res.data;
};

export const getBestSellers = async (limit = 10) => {
  const res = await api.get("/shop/best-sellers", { params: { limit } });
  return res.data;
};

export const getNewArrivals = async (limit = 10) => {
  const res = await api.get("/shop/new-arrivals", { params: { limit } });
  return res.data;
};

export const getFlashSale = async (limit = 6) => {
  const res = await api.get("/shop/flash-sale", { params: { limit } });
  return res.data;
};

export const getValueDeals = async (limit = 10) => {
  const res = await api.get("/shop/value-deals", { params: { limit } });
  return res.data;
};

export const getTopRated = async (minReviews = 1, limit = 10) => {
  const res = await api.get("/shop/top-rated", { params: { min_reviews: minReviews, limit } });
  return res.data;
};

export const shopSearch = async (params = {}) => {
  const res = await api.get("/shop/search", { params });
  return res.data;
};

export const getProductsByCategory = async (category, limit = 20) => {
  const res = await api.get(`/shop/category/${encodeURIComponent(category)}`, { params: { limit } });
  return res.data;
};

export const getRelatedProducts = async (productId, limit = 6) => {
  const res = await api.get(`/shop/products/${productId}/related`, { params: { limit } });
  return res.data;
};

export const getBoughtTogether = async (productId, limit = 4) => {
  const res = await api.get(`/shop/products/${productId}/bought-together`, { params: { limit } });
  return res.data;
};

export const getMembership = async () => {
  const res = await api.get("/shop/membership");
  return res.data;
};
