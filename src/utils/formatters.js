
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

export const formatLongDate = (dateString) =>  {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export const formatLongMonth = (dateStr) =>  {
  if (!dateStr || !dateStr.includes('-')) return '';

  const [year, month] = dateStr.split('-');
  
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Convert "07" to 7, then subtract 1 for the zero-indexed array
  const monthIndex = parseInt(month, 10) - 1;
  
  // Safety check in case the input month is out of bounds
  if (monthIndex < 0 || monthIndex > 11) return '';

  return `${months[monthIndex]}, ${year}`;
}

export const getStatusColor = (current) => {
  if (current === "draft") return 'text-gray-300 font-bold capitalize';
  return 'text-green-300 font-bold';
};

export const getStatus = (current) => {
  if (current === "draft") return { text: 'Draft', color: 'text-gray-300 capitalize' };
  return { text: 'Approved', color: 'text-green-300' };
};

export const getPaymentStatus = (status) => {
  if (status === 'credit') return { text: 'Credit', color: 'text-blue-200 capitalize' };
  if (status === 'draft') return { text: 'Draft', color: 'text-gray-300 capitalize' };
  return { text: 'Cash', color: 'text-yellow-300' };
};

export const getPaidStatus = (status) => {
  if (status === 'no') return { text: 'Not Paid', color: 'text-red-200' };
  return { text: 'Paid', color: 'text-yellow-300' };
};

export const getTablePaidStatus = (status) => {
  if (status === 'no') return { text: 'Not Paid', color: 'text-red-600 font-semibold' };
  return { text: 'Paid', color: 'text-green-600 font-semibold' };
};

export const getTableStatus = (current) => {
  if (current === "draft") return { text: 'Draft', color: 'text-gray-600 capitalize font-semibold ' };
  return { text: 'Approved', color: 'text-green-600 font-semibold capitalize' };
};

export const getTableStatusColor = (current) => {
  if (current === "draft") return 'text-gray-600 font-semibold capitalize';
  return 'text-green-600 font-semibold capitalize';
};

export const getTablePaymentStatus = (status) => {
  if (status === 'credit') return { text: 'Credit', color: 'text-blue-600 capitalize font-semibold' };
  if (status === 'draft') return { text: 'Draft', color: 'text-gray-600 capitalize font-semibold' };
  return { text: 'Cash', color: 'text-yellow-500 font-semibold capitalize' };
};