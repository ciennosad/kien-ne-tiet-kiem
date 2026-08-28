export const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Math.round(n)) + "d";

export const todayStr = () => new Date().toISOString().slice(0, 10);

export const monthLabel = (ym) => {
  const [y, m] = ym.split("-");
  return `T${parseInt(m)}/${y.slice(2)}`;
};
