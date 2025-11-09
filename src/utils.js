export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const now = () => new Date().toISOString();

export const exponentialBackoff = (base, attempt) => Math.pow(base, attempt) * 1000; // ms
