'use client';
import { useState, useMemo } from 'react';
import type { ShiprocketOrder, StatusFilter } from './types';
export function useShiprocketFilter(orders: ShiprocketOrder[]) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const status = (o.status || '').toUpperCase();
      if (statusFilter === 'new' && !['NEW', 'READY TO SHIP', 'MANIFEST GENERATED'].some((s) => status.includes(s))) {
        return false;
      }
      if (statusFilter === 'in_transit' && !['IN TRANSIT', 'OUT FOR DELIVERY', 'SHIPPED', 'PICKED UP'].some((s) => status.includes(s))) {
        return false;
      }
      if (statusFilter === 'delivered' && !status.includes('DELIVERED')) {
        return false;
      }
      if (statusFilter === 'cancelled' && !['CANCEL', 'RTO'].some((s) => status.includes(s))) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = String(o.id).includes(q);
        const matchesChannel = (o.channel_order_id || '').toLowerCase().includes(q);
        const matchesCust = (o.customer_name || '').toLowerCase().includes(q);
        const matchesPhone = (o.customer_phone || '').includes(q);
        const matchesAwb = (o.shipments?.[0]?.awb || '').toLowerCase().includes(q);
        return matchesId || matchesChannel || matchesCust || matchesPhone || matchesAwb;
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);
  const stats = useMemo(() => {
    let pending = 0;
    let inTransit = 0;
    let delivered = 0;
    let cancelled = 0;
    orders.forEach((o) => {
      const s = (o.status || '').toUpperCase();
      if (['NEW', 'READY TO SHIP', 'MANIFEST GENERATED'].some((st) => s.includes(st))) pending++;
      else if (['IN TRANSIT', 'OUT FOR DELIVERY', 'SHIPPED', 'PICKED UP'].some((st) => s.includes(st))) inTransit++;
      else if (s.includes('DELIVERED')) delivered++;
      else if (['CANCEL', 'RTO'].some((st) => s.includes(st))) cancelled++;
    });
    return { total: orders.length, pending, inTransit, delivered, cancelled };
  }, [orders]);
  return {
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    filteredOrders,
    stats,
  };
}
