/**
 * Utility functions for formatting money and handling image URLs
 */

export const formatMoney = (value) => {
  if (value == null || value === "" || isNaN(Number(value))) return "—";
  return Number(value).toLocaleString("vi-VN") + " VNĐ";
};

export const parseImageUrls = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    return value
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean);
  }
  return [];
};

export const splitImageUrls = parseImageUrls;
