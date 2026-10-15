import api from "./api";

export const getProductReviews = async (productId) => {
  const res = await api.get(`/reviews/product/${productId}`);
  return res.data;
};

export const submitReview = async (reviewData) => {
  const res = await api.post("/reviews", reviewData);
  return res.data;
};
