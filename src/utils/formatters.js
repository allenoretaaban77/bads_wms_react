
export const formatCurrency = (amount) => {
  return `₱ ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const formatReplinishmentDate = (dateString) => {
  if (!dateString) return "";
  
  const rawDate = dateString.split(" ")[0]; // "2026-05-26"

  return rawDate;
}

export const formatPostingDate = (dateString) => {
  if (!dateString) return "";

  const rawDate = dateString.split(" ")[0]; // "2026-05-26"
  const [year, month, day] = rawDate.split("-");

  return `${year}-${month}-${day}`;
}

export const formatDate = (dateString) => {
  const rawDate = dateString.split(" ")[0]; // "2026-05-26"

  return rawDate;
}

export const toTitleCase = (str = "") => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const formatLongDate = (dateString) =>  {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}