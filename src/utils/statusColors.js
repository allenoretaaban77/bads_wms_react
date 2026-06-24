export const getStatusColor = (status) => {
  switch (status) {
    case 'In Stock':
      return 'text-green-600 bg-green-0';
    case 'Low Stock':
      return 'text-yellow-600 bg-yellow-0';
    case 'No Stock':
      return 'text-red-600 bg-red-0';
    default:
      return 'text-gray-600 bg-gray-0';
  }
};

export const getStatusTextColor = (status) => {
  switch (status) {
    case 'In Stock':
      return 'text-green-600';
    case 'Low Stock':
      return 'text-yellow-600';
    case 'No Stock':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};
