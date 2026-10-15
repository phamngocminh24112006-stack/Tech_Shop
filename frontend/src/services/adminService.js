import api from "./api";

export const getShippers = async () => {
  const res = await api.get("/shippers");
  return res.data;
};

export const getSuppliers = async () => {
  const res = await api.get("/suppliers");
  return res.data;
};

export const getInventoryLogs = async () => {
  const res = await api.get("/suppliers/inventory");
  return res.data;
};

export const restockInventory = async (restockData) => {
  const res = await api.post("/suppliers/inventory", restockData);
  return res.data;
};
