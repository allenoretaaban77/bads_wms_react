
export const formatCurrency = (amount) => {
  return `₱ ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const formatReplinishmentDate = (dateString) => {
  const rawDate = dateString.split(" ")[0]; // "2026-05-26"

  return rawDate;
}