import React from 'react';

export default function Badge({ status }) {
  const getBadgeClass = (s) => {
    switch (s) {
      case 'ACTIVE':
      case 'VALID':
      case 'OUTSTANDING':
      case 'READY_TO_SHIP':
      case 'DELIVERED':
      case 'SHIPPED':
      case 'COMPLETED':
        return 'badge-success';
      case 'PENDING':
      case 'DRAFT':
        return 'badge-warning';
      case 'DISABLED':
      case 'INVALID':
      case 'EXPIRED':
      case 'SHORTAGE':
      case 'REJECTED':
      case 'FAILED':
        return 'badge-danger';
      case 'INVENTORY_CHECKED':
      case 'CLOSED':
      case 'ISSUED':
      default:
        return 'badge-info';
    }
  };

  return (
    <span className={`badge ${getBadgeClass(status)}`}>
      {status}
    </span>
  );
}
