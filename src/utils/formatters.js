
export const formatCurrency = (amount) => {
  return `₱ ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}