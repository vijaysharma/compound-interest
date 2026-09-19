'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FiTruck,
  FiPackage,
  FiClock,
  FiRefreshCw,
  FiExternalLink,
  FiSearch,
  FiPlus,
  FiCheckCircle,
  FiAlertCircle,
  FiPrinter,
  FiFileText,
  FiCopy,
  FiX,
  FiMapPin,
  FiDollarSign,
  FiSend,
  FiChevronRight,
} from 'react-icons/fi';
import {
  getShiprocketAccountAction,
  getShiprocketOrdersAction,
  getShiprocketStatementAction,
  getShiprocketTrackingAction,
  createShiprocketOrderAction,
  assignShiprocketCourierAction,
  generateShiprocketPickupAction,
  generateShiprocketLabelAction,
  generateShiprocketInvoiceAction,
  cancelShiprocketOrderAction,
  getShiprocketCouriersAction,
  getPostcodeDetailsAction,
} from '../../actions/admin';
import {
  ShiprocketAccountData,
  ShiprocketOrder,
  ShiprocketStatementItem,
  ShiprocketTrackingData,
  ShiprocketCourierRate,
} from '../../types/shiprocket';
import styles from './ShiprocketDashboard.module.scss';
interface Props {
  token: string;
}
type TabType = 'shipments' | 'create' | 'history' | 'company';
type StatusFilter = 'all' | 'new' | 'in_transit' | 'delivered' | 'cancelled';
const ShiprocketDashboard: React.FC<Props> = ({ token }) => {
  const [activeTab, setActiveTab] = useState<TabType>('shipments');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [account, setAccount] = useState<ShiprocketAccountData | null>(null);
  const [orders, setOrders] = useState<ShiprocketOrder[]>([]);
  const [statement, setStatement] = useState<ShiprocketStatementItem[]>([]);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingStatement, setLoadingStatement] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [trackingModalAwb, setTrackingModalAwb] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<ShiprocketTrackingData | null>(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [shipModalOrder, setShipModalOrder] = useState<ShiprocketOrder | null>(null);
  const [couriersList, setCouriersList] = useState<ShiprocketCourierRate[]>([]);
  const [loadingCouriers, setLoadingCouriers] = useState(false);
  const [assigningCourier, setAssigningCourier] = useState(false);
  // Create order form state
  const [pickupLoc, setPickupLoc] = useState('');
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custAddress2, setCustAddress2] = useState('');
  const [custPincode, setCustPincode] = useState('');
  const [custCity, setCustCity] = useState('');
  const [custState, setCustState] = useState('');
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [weight, setWeight] = useState('0.5');
  const [length, setLength] = useState('10');
  const [breadth, setBreadth] = useState('10');
  const [height, setHeight] = useState('10');
  const [itemName, setItemName] = useState('');
  const [itemSku, setItemSku] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('299');
  const [paymentMode, setPaymentMode] = useState<'Prepaid' | 'COD'>('Prepaid');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [createdOrderResult, setCreatedOrderResult] = useState<{ orderId: number; shipmentId: number } | null>(null);
  const fetchAccount = useCallback(async () => {
    setLoadingAccount(true);
    try {
      const res = await getShiprocketAccountAction(token);
      if (res.success && res.account) {
        setAccount(res.account);
        if (res.account.pickupLocations.length > 0 && !pickupLoc) {
          setPickupLoc(res.account.pickupLocations[0].pickup_location);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load Shiprocket account details';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      setLoadingAccount(false);
    }
  }, [token, pickupLoc]);
  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await getShiprocketOrdersAction({ per_page: 50 }, token);
      if (res.success && res.orders) {
        setOrders(res.orders);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load Shiprocket orders';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      setLoadingOrders(false);
    }
  }, [token]);
  const fetchStatement = useCallback(async () => {
    setLoadingStatement(true);
    try {
      const res = await getShiprocketStatementAction({ per_page: 50 }, token);
      if (res.success && res.data) {
        setStatement(res.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load wallet ledger statement';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      setLoadingStatement(false);
    }
  }, [token]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAccount();
    fetchOrders();
    fetchStatement();
  }, [fetchAccount, fetchOrders, fetchStatement]);
  useEffect(() => {
    if (!custPincode || custPincode.length !== 6) return;
    const clean = custPincode.replace(/\D/g, '');
    if (clean.length === 6) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPincodeLoading(true);
      getPostcodeDetailsAction(clean)
        .then((raw) => {
          if (raw && typeof raw === 'object') {
            const data = raw as { postcode_details?: { city?: string; state?: string } };
            if (data.postcode_details?.city) {
              setCustCity(data.postcode_details.city);
              if (data.postcode_details.state) {
                setCustState(data.postcode_details.state);
              }
            }
          }
        })
        .catch(() => {})
        .finally(() => setPincodeLoading(false));
    }
  }, [custPincode]);
  const handleCopyAwb = (awb: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(awb);
      setAlertMsg({ type: 'success', text: `AWB ${awb} copied to clipboard` });
      setTimeout(() => setAlertMsg(null), 3000);
    }
  };
  const handleOpenTracking = async (awb: string) => {
    setTrackingModalAwb(awb);
    setTrackingData(null);
    setLoadingTracking(true);
    try {
      const res = await getShiprocketTrackingAction(awb, token);
      if (res.success && res.tracking) {
        setTrackingData(res.tracking);
      } else {
        setAlertMsg({ type: 'error', text: 'No live tracking data available yet for this AWB' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tracking lookup failed';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      setLoadingTracking(false);
    }
  };
  const handleOpenShipModal = async (order: ShiprocketOrder) => {
    setShipModalOrder(order);
    setCouriersList([]);
    setLoadingCouriers(true);
    try {
      const pickupPincode =
        order.pickup_address_detail?.pin_code ||
        account?.pickupLocations.find((l) => l.pickup_location === order.pickup_location)?.pin_code ||
        account?.pickupLocations[0]?.pin_code ||
        '';
      const deliveryPincode = order.customer_pincode || '';
      const orderWeight = order.shipments?.[0]?.weight || order.others?.weight || '0.5';
      if (pickupPincode && deliveryPincode) {
        const res = await getShiprocketCouriersAction(
          {
            pickup_postcode: String(pickupPincode),
            delivery_postcode: String(deliveryPincode),
            weight: orderWeight,
            cod: order.payment_method?.toLowerCase() === 'cod' ? 1 : 0,
          },
          token
        );
        if (res.success && res.couriers) {
          setCouriersList(res.couriers);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch serviceable couriers';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      setLoadingCouriers(false);
    }
  };
  const handleAssignCourier = async (shipmentId: number, courierId?: number) => {
    setAssigningCourier(true);
    try {
      const res = await assignShiprocketCourierAction(
        {
          shipment_id: shipmentId,
          courier_id: courierId,
        },
        token
      );
      if (res.success) {
        setAlertMsg({ type: 'success', text: 'Courier assigned and AWB generated successfully!' });
        setShipModalOrder(null);
        await fetchOrders();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to assign courier';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      setAssigningCourier(false);
    }
  };
  const handleSchedulePickup = async (shipmentId: number) => {
    setActionBusy(`pickup-${shipmentId}`);
    try {
      const res = await generateShiprocketPickupAction([shipmentId], token);
      if (res.success) {
        setAlertMsg({ type: 'success', text: 'Pickup scheduled successfully!' });
        await fetchOrders();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to schedule pickup';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      setActionBusy(null);
    }
  };
  const handlePrintLabel = async (shipmentId: number) => {
    setActionBusy(`label-${shipmentId}`);
    try {
      const res = await generateShiprocketLabelAction([shipmentId], token);
      if (res.success && res.label_url) {
        window.open(res.label_url, '_blank', 'noopener,noreferrer');
      } else {
        setAlertMsg({ type: 'error', text: 'Label URL not returned by Shiprocket' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate label';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      setActionBusy(null);
    }
  };
  const handlePrintInvoice = async (orderId: number) => {
    setActionBusy(`invoice-${orderId}`);
    try {
      const res = await generateShiprocketInvoiceAction([orderId], token);
      if (res.success && res.invoice_url) {
        window.open(res.invoice_url, '_blank', 'noopener,noreferrer');
      } else {
        setAlertMsg({ type: 'error', text: 'Invoice URL not returned by Shiprocket' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate invoice';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      setActionBusy(null);
    }
  };
  const handleCancelShipment = async (order: ShiprocketOrder) => {
    const awb = order.shipments?.[0]?.awb;
    if (!window.confirm(`Are you sure you want to cancel order #${order.id}${awb ? ` (AWB: ${awb})` : ''}?`)) {
      return;
    }
    setActionBusy(`cancel-${order.id}`);
    try {
      const res = awb
        ? await cancelShiprocketOrderAction({ awbs: [awb] }, token)
        : await cancelShiprocketOrderAction({ order_ids: [order.id] }, token);
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message || 'Order cancellation request submitted.' });
        await fetchOrders();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel shipment';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      setActionBusy(null);
    }
  };
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupLoc || !custName || !custPhone || !custAddress || !custCity || !custPincode) {
      setAlertMsg({ type: 'error', text: 'Please fill in all mandatory customer and address details.' });
      return;
    }
    setCreatingOrder(true);
    setAlertMsg(null);
    try {
      const payload = {
        order_id: `ORD-${Date.now()}`,
        order_date: new Date().toISOString().slice(0, 10),
        pickup_location: pickupLoc,
        billing_customer_name: custName,
        billing_phone: custPhone,
        billing_email: custEmail || `${custPhone}@customer.rupeecalculator.in`,
        billing_address: custAddress,
        billing_address_2: custAddress2,
        billing_city: custCity,
        billing_state: custState,
        billing_pincode: custPincode,
        billing_country: 'India',
        payment_method: paymentMode,
        sub_total: Number(itemPrice) * Number(itemQty || 1),
        weight: Number(weight || 0.5),
        length: Number(length || 10),
        breadth: Number(breadth || 10),
        height: Number(height || 10),
        order_items: [
          {
            name: itemName || 'Standard Item',
            sku: itemSku || `SKU-${Date.now()}`,
            units: Number(itemQty || 1),
            selling_price: Number(itemPrice || 299),
          },
        ],
      };
      const res = await createShiprocketOrderAction(payload, token);
      if (res.success && res.data?.order_id && res.data?.shipment_id) {
        setCreatedOrderResult({
          orderId: res.data.order_id,
          shipmentId: res.data.shipment_id,
        });
        setAlertMsg({
          type: 'success',
          text: `Shipment order created! Order ID: ${res.data.order_id}, Shipment ID: ${res.data.shipment_id}`,
        });
        await fetchOrders();
      } else {
        throw new Error('Order creation did not return order & shipment IDs');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create shipment order';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      setCreatingOrder(false);
    }
  };
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
        const matchesId = String(o.id).includes(q) || String(o.channel_order_id || '').toLowerCase().includes(q);
        const matchesCust = String(o.customer_name || '').toLowerCase().includes(q) || String(o.customer_phone || '').includes(q);
        const matchesCity = String(o.customer_city || '').toLowerCase().includes(q) || String(o.customer_pincode || '').includes(q);
        const matchesAwb = o.shipments?.some((s) => String(s.awb || '').includes(q));
        return matchesId || matchesCust || matchesCity || matchesAwb;
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);
  const stats = useMemo(() => {
    let inTransit = 0;
    let delivered = 0;
    let pending = 0;
    for (const o of orders) {
      const s = (o.status || '').toUpperCase();
      if (s.includes('DELIVERED')) delivered++;
      else if (['IN TRANSIT', 'OUT FOR DELIVERY', 'SHIPPED', 'PICKED UP'].some((x) => s.includes(x))) inTransit++;
      else pending++;
    }
    return { total: orders.length, inTransit, delivered, pending };
  }, [orders]);
  const volumetricWeight = useMemo(() => {
    const l = Number(length) || 0;
    const b = Number(breadth) || 0;
    const h = Number(height) || 0;
    return ((l * b * h) / 5000).toFixed(2);
  }, [length, breadth, height]);
  const appliedWeight = useMemo(() => {
    const dead = Number(weight) || 0;
    const vol = Number(volumetricWeight) || 0;
    return Math.max(dead, vol).toFixed(2);
  }, [weight, volumetricWeight]);
  const getStatusClass = (statusStr: string) => {
    const s = statusStr.toUpperCase();
    if (s.includes('DELIVERED')) return styles.statusGreen;
    if (s.includes('TRANSIT') || s.includes('OUT FOR DELIVERY')) return styles.statusBlue;
    if (s.includes('PICKUP') || s.includes('SCHEDULED')) return styles.statusOrange;
    if (s.includes('NEW') || s.includes('READY')) return styles.statusPurple;
    if (s.includes('CANCEL') || s.includes('RTO')) return styles.statusRed;
    return styles.statusGray;
  };
  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>
              <FiTruck className={styles.titleIcon} /> Shiprocket Manager
            </h1>
            {account?.user?.company_id && (
              <span className={styles.companyBadge}>
                Company #{account.user.company_id}
              </span>
            )}
          </div>
          <p className={styles.userSubtext}>
            <span>
              <strong>User:</strong> {account?.user?.first_name || 'API'} {account?.user?.last_name || 'User'} ({account?.user?.email || 'Registered'})
            </span>
            {account?.pickupLocations?.[0] && (
              <span>
                • <strong>Warehouse:</strong> {account.pickupLocations[0].pickup_location} ({account.pickupLocations[0].city}, {account.pickupLocations[0].pin_code})
              </span>
            )}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.outlineBtn}
            onClick={() => {
              fetchAccount();
              fetchOrders();
              fetchStatement();
            }}
            disabled={loadingAccount || loadingOrders || loadingStatement}
            title="Refresh All Data"
          >
            <FiRefreshCw className={loadingAccount || loadingOrders ? styles.spinner : ''} /> Refresh
          </button>
          <button
            className={styles.primaryBtn}
            onClick={() => {
              setActiveTab('create');
              setCreatedOrderResult(null);
            }}
          >
            <FiPlus /> New Shipment
          </button>
        </div>
      </div>
      <div className={styles.overviewGrid}>
        <div className={`${styles.statCard} ${styles.statCardHighlight}`}>
          <div className={styles.statLabel}>
            <span>Shiprocket Balance</span>
            <FiDollarSign className={styles.statIcon} />
          </div>
          <div className={styles.statValue}>
            ₹{account?.balance ?? '0.00'}
          </div>
          <div className={styles.statSubtext}>
            <a
              href="https://app.shiprocket.in/billing/recharge"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.rechargeLink}
            >
              Recharge on Shiprocket <FiExternalLink />
            </a>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>
            <span>Total Shipments</span>
            <FiPackage className={styles.statIcon} />
          </div>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statSubtext}>
            <span>All time orders</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>
            <span>In Transit</span>
            <FiTruck className={styles.statIcon} />
          </div>
          <div className={styles.statValue}>{stats.inTransit}</div>
          <div className={styles.statSubtext}>
            <span>En route to destination</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>
            <span>Delivered</span>
            <FiCheckCircle className={styles.statIcon} />
          </div>
          <div className={styles.statValue}>{stats.delivered}</div>
          <div className={styles.statSubtext}>
            <span>Successfully completed</span>
          </div>
        </div>
      </div>
      <div className={styles.tabsBar}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'shipments' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('shipments')}
        >
          <FiTruck /> Shipments & Orders
          <span className={styles.tabBadge}>{orders.length}</span>
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'create' ? styles.tabActive : ''}`}
          onClick={() => {
            setActiveTab('create');
            setCreatedOrderResult(null);
          }}
        >
          <FiSend /> Create & Ship
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'history' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <FiClock /> Wallet History
          <span className={styles.tabBadge}>{statement.length}</span>
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'company' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('company')}
        >
          <FiMapPin /> Company Profile
        </button>
      </div>
      {alertMsg && (
        <div
          className={`${styles.alert} ${alertMsg.type === 'success' ? styles.alertSuccess : styles.alertError}`}
        >
          {alertMsg.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{alertMsg.text}</span>
        </div>
      )}
      {activeTab === 'shipments' && (
        <>
          <div className={styles.filterControls}>
            <div className={styles.statusPills}>
              <button
                className={`${styles.statusPill} ${statusFilter === 'all' ? styles.statusPillActive : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All ({orders.length})
              </button>
              <button
                className={`${styles.statusPill} ${statusFilter === 'new' ? styles.statusPillActive : ''}`}
                onClick={() => setStatusFilter('new')}
              >
                Ready to Ship ({stats.pending})
              </button>
              <button
                className={`${styles.statusPill} ${statusFilter === 'in_transit' ? styles.statusPillActive : ''}`}
                onClick={() => setStatusFilter('in_transit')}
              >
                In Transit ({stats.inTransit})
              </button>
              <button
                className={`${styles.statusPill} ${statusFilter === 'delivered' ? styles.statusPillActive : ''}`}
                onClick={() => setStatusFilter('delivered')}
              >
                Delivered ({stats.delivered})
              </button>
              <button
                className={`${styles.statusPill} ${statusFilter === 'cancelled' ? styles.statusPillActive : ''}`}
                onClick={() => setStatusFilter('cancelled')}
              >
                Cancelled
              </button>
            </div>
            <div className={styles.searchBox}>
              <FiSearch className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search order, customer, AWB..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          {loadingOrders ? (
            <div className={styles.emptyState}>
              <span className={styles.spinner} />
              <p className={styles.emptyDesc}>Loading Shiprocket orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className={styles.emptyState}>
              <FiPackage className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>No shipments found</h3>
              <p className={styles.emptyDesc}>
                {searchQuery
                  ? 'No shipments match your current search query or filter.'
                  : 'You have no registered shipments yet. Click "New Shipment" to create and ship one.'}
              </p>
              <button className={styles.primaryBtn} onClick={() => setActiveTab('create')}>
                <FiPlus /> Create Shipment
              </button>
            </div>
          ) : (
            <div className={styles.ordersList}>
              {filteredOrders.map((order) => {
                const primaryShipment = order.shipments?.[0];
                const awb = primaryShipment?.awb;
                const courier = primaryShipment?.courier || primaryShipment?.sr_courier_name;
                const canShip = !awb || (order.status || '').toUpperCase() === 'NEW';
                const canSchedulePickup = awb && !primaryShipment?.pickup_scheduled_date;
                const isDelivered = (order.status || '').toUpperCase().includes('DELIVERED');
                return (
                  <div key={order.id} className={styles.orderCard}>
                    <div className={styles.orderHeader}>
                      <div className={styles.orderMeta}>
                        <span className={styles.orderIdBadge}>#{order.id}</span>
                        {order.channel_order_id && (
                          <span className={styles.channelBadge}>{order.channel_order_id}</span>
                        )}
                        <span className={styles.orderDate}>
                          {order.created_at ? new Date(order.created_at).toLocaleString() : ''}
                        </span>
                      </div>
                      <span className={`${styles.statusBadge} ${getStatusClass(order.status || '')}`}>
                        {order.status || 'PROCESSING'}
                      </span>
                    </div>
                    <div className={styles.orderBody}>
                      <div>
                        <div className={styles.colTitle}>Customer & Destination</div>
                        <div className={styles.customerName}>{order.customer_name}</div>
                        <div className={styles.customerAddress}>
                          {order.customer_address}
                          {order.customer_city ? `, ${order.customer_city}` : ''}
                          {order.customer_state ? `, ${order.customer_state}` : ''}
                          {order.customer_pincode ? ` - ${order.customer_pincode}` : ''}
                        </div>
                        {order.customer_phone && (
                          <div className={styles.customerAddress}>Phone: {order.customer_phone}</div>
                        )}
                      </div>
                      <div>
                        <div className={styles.colTitle}>Logistics & Courier</div>
                        <div className={styles.shipmentDetails}>
                          <div>
                            <strong>Courier:</strong> {courier || 'Unassigned'}
                          </div>
                          {awb ? (
                            <div className={styles.awbCode}>
                              <span>AWB: {awb}</span>
                              <button
                                className={styles.copyBtn}
                                onClick={() => handleCopyAwb(awb)}
                                title="Copy AWB"
                              >
                                <FiCopy />
                              </button>
                            </div>
                          ) : (
                            <div style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 600 }}>
                              AWB Pending
                            </div>
                          )}
                          <div>
                            <strong>Pickup:</strong> {order.pickup_location || 'Default'}
                          </div>
                          <div>
                            <strong>Weight:</strong> {primaryShipment?.weight || order.others?.weight || '0.5'} kg
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className={styles.colTitle}>Order & Items</div>
                        <div className={styles.orderItemsSummary}>
                          {order.products && order.products.length > 0 ? (
                            order.products.map((p, idx) => (
                              <div key={idx}>
                                • {p.name} (x{p.quantity || 1})
                              </div>
                            ))
                          ) : (
                            <div>Standard Package</div>
                          )}
                        </div>
                        <div className={styles.orderTotal}>
                          ₹{order.total || '0'}
                          <span className={styles.paymentBadge}>
                            {order.payment_method || 'Prepaid'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.orderFooter}>
                      {awb && (
                        <button
                          className={`${styles.actionBtn} ${styles.actionPrimary}`}
                          onClick={() => handleOpenTracking(awb)}
                        >
                          <FiTruck /> Track
                        </button>
                      )}
                      {canShip && (
                        <button
                          className={`${styles.actionBtn} ${styles.actionPrimary}`}
                          onClick={() => handleOpenShipModal(order)}
                        >
                          <FiSend /> Ship / Assign Courier
                        </button>
                      )}
                      {canSchedulePickup && primaryShipment?.id && (
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleSchedulePickup(primaryShipment.id)}
                          disabled={actionBusy === `pickup-${primaryShipment.id}`}
                        >
                          <FiClock /> Schedule Pickup
                        </button>
                      )}
                      {primaryShipment?.id && (
                        <button
                          className={styles.actionBtn}
                          onClick={() => handlePrintLabel(primaryShipment.id)}
                          disabled={actionBusy === `label-${primaryShipment.id}`}
                          title="Generate Shipping Label PDF"
                        >
                          <FiPrinter /> Label
                        </button>
                      )}
                      <button
                        className={styles.actionBtn}
                        onClick={() => handlePrintInvoice(order.id)}
                        disabled={actionBusy === `invoice-${order.id}`}
                        title="Generate Tax Invoice PDF"
                      >
                        <FiFileText /> Invoice
                      </button>
                      {!isDelivered && (
                        <button
                          className={`${styles.actionBtn} ${styles.actionDanger}`}
                          onClick={() => handleCancelShipment(order)}
                          disabled={actionBusy === `cancel-${order.id}`}
                        >
                          <FiX /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {activeTab === 'create' && (
        <form className={styles.formCard} onSubmit={handleCreateOrder}>
          <div className={styles.formSectionTitle}>
            <FiMapPin /> Pickup & Warehouse
          </div>
          <div className={styles.formGrid2}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Pickup Warehouse Location*</label>
              <select
                className={styles.selectInput}
                value={pickupLoc}
                onChange={(e) => setPickupLoc(e.target.value)}
                required
              >
                {account?.pickupLocations.map((loc) => (
                  <option key={loc.id} value={loc.pickup_location}>
                    {loc.pickup_location} ({loc.city}, {loc.pin_code})
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Payment Method*</label>
              <select
                className={styles.selectInput}
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as 'Prepaid' | 'COD')}
              >
                <option value="Prepaid">Prepaid</option>
                <option value="COD">Cash on Delivery (COD)</option>
              </select>
            </div>
          </div>
          <div className={styles.formSectionTitle}>
            <FiMapPin /> Delivery Customer Details
          </div>
          <div className={styles.formGrid3}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Customer Full Name*</label>
              <input
                type="text"
                className={styles.fieldInput}
                placeholder="e.g. Ramesh Kumar"
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Customer Phone Number*</label>
              <input
                type="tel"
                maxLength={10}
                className={styles.fieldInput}
                placeholder="10-digit mobile number"
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Email Address</label>
              <input
                type="email"
                className={styles.fieldInput}
                placeholder="e.g. customer@example.com"
                value={custEmail}
                onChange={(e) => setCustEmail(e.target.value)}
              />
            </div>
          </div>
          <div className={styles.formGrid2}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Delivery Address Line 1*</label>
              <input
                type="text"
                className={styles.fieldInput}
                placeholder="House/Flat, Street, Locality"
                value={custAddress}
                onChange={(e) => setCustAddress(e.target.value)}
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Address Line 2 (Optional)</label>
              <input
                type="text"
                className={styles.fieldInput}
                placeholder="Landmark, Area"
                value={custAddress2}
                onChange={(e) => setCustAddress2(e.target.value)}
              />
            </div>
          </div>
          <div className={styles.formGrid3}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                Destination Pincode* {pincodeLoading && '(Looking up...)'}
              </label>
              <input
                type="text"
                maxLength={6}
                className={styles.fieldInput}
                placeholder="e.g. 560001"
                value={custPincode}
                onChange={(e) => setCustPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>City*</label>
              <input
                type="text"
                className={styles.fieldInput}
                placeholder="e.g. Bengaluru"
                value={custCity}
                onChange={(e) => setCustCity(e.target.value)}
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>State*</label>
              <input
                type="text"
                className={styles.fieldInput}
                placeholder="e.g. Karnataka"
                value={custState}
                onChange={(e) => setCustState(e.target.value)}
                required
              />
            </div>
          </div>
          <div className={styles.formSectionTitle}>
            <FiPackage /> Package & Dimensions
          </div>
          <div className={styles.formGrid4}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Dead Weight (kg)*</label>
              <input
                type="number"
                step="0.05"
                min="0.01"
                className={styles.fieldInput}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Length (cm)*</label>
              <input
                type="number"
                min="1"
                className={styles.fieldInput}
                value={length}
                onChange={(e) => setLength(e.target.value)}
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Breadth (cm)*</label>
              <input
                type="number"
                min="1"
                className={styles.fieldInput}
                value={breadth}
                onChange={(e) => setBreadth(e.target.value)}
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Height (cm)*</label>
              <input
                type="number"
                min="1"
                className={styles.fieldInput}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                required
              />
            </div>
          </div>
          <div className={styles.volumetricCallout}>
            <div>
              <strong>Volumetric Weight:</strong> {volumetricWeight} kg
            </div>
            <div>
              <strong>Applied Weight (Chargeable):</strong> {appliedWeight} kg
            </div>
          </div>
          <div className={styles.formSectionTitle}>
            <FiPackage /> Item Details
          </div>
          <div className={styles.formGrid4}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Item Name*</label>
              <input
                type="text"
                className={styles.fieldInput}
                placeholder="e.g. Handcrafted Cotton Dress"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>SKU (Optional)</label>
              <input
                type="text"
                className={styles.fieldInput}
                placeholder="e.g. SKU-001"
                value={itemSku}
                onChange={(e) => setItemSku(e.target.value)}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Quantity*</label>
              <input
                type="number"
                min="1"
                className={styles.fieldInput}
                value={itemQty}
                onChange={(e) => setItemQty(e.target.value)}
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Unit Price (₹)*</label>
              <input
                type="number"
                min="1"
                className={styles.fieldInput}
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                required
              />
            </div>
          </div>
          {createdOrderResult && (
            <div className={`${styles.alert} ${styles.alertSuccess}`}>
              <div>
                <strong>Shipment Created!</strong> Order ID: #{createdOrderResult.orderId}, Shipment ID: #{createdOrderResult.shipmentId}.
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={() => {
                      const found = orders.find((o) => o.id === createdOrderResult.orderId);
                      if (found) handleOpenShipModal(found);
                    }}
                  >
                    Assign Courier & Ship Now
                  </button>
                  <button
                    type="button"
                    className={styles.outlineBtn}
                    onClick={() => handlePrintLabel(createdOrderResult.shipmentId)}
                  >
                    Print Label
                  </button>
                </div>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              type="button"
              className={styles.outlineBtn}
              onClick={() => setActiveTab('shipments')}
            >
              Cancel
            </button>
            <button type="submit" className={styles.primaryBtn} disabled={creatingOrder}>
              {creatingOrder ? (
                <>
                  <span className={styles.spinner} /> Creating Order...
                </>
              ) : (
                <>
                  <FiPlus /> Create Shipment Order
                </>
              )}
            </button>
          </div>
        </form>
      )}
      {activeTab === 'history' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-heading)' }}>
              Wallet Ledger & Transaction History
            </h3>
            <button
              className={styles.outlineBtn}
              onClick={fetchStatement}
              disabled={loadingStatement}
            >
              <FiRefreshCw className={loadingStatement ? styles.spinner : ''} /> Refresh Ledger
            </button>
          </div>
          {loadingStatement ? (
            <div className={styles.emptyState}>
              <span className={styles.spinner} />
              <p className={styles.emptyDesc}>Loading wallet statement...</p>
            </div>
          ) : statement.length === 0 ? (
            <div className={styles.emptyState}>
              <FiClock className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>No transaction history found</h3>
              <p className={styles.emptyDesc}>
                No wallet transactions or ledger records have been recorded yet.
              </p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description / Action</th>
                    <th>Order / AWB</th>
                    <th>Weight</th>
                    <th>Debit (₹)</th>
                    <th>Credit (₹)</th>
                    <th>Balance (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.date || item.created_at || '—'}</td>
                      <td>
                        <strong>{item.description || item.action || 'Transaction'}</strong>
                      </td>
                      <td>
                        {item.order_id || item.awb_code ? (
                          <div>
                            {item.order_id && <span>Order: #{item.order_id} </span>}
                            {item.awb_code && <span>AWB: {item.awb_code}</span>}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{item.charged_weight || item.applied_weight || '—'}</td>
                      <td className={item.debit_amount ? styles.debitVal : ''}>
                        {item.debit_amount ? `-₹${item.debit_amount}` : '—'}
                      </td>
                      <td className={item.credit_amount ? styles.creditVal : ''}>
                        {item.credit_amount ? `+₹${item.credit_amount}` : '—'}
                      </td>
                      <td>
                        <strong>₹{item.balance_amount || '—'}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {activeTab === 'company' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className={styles.formCard}>
            <div className={styles.formSectionTitle}>
              <FiCheckCircle /> Shiprocket Account Credentials & User
            </div>
            <div className={styles.formGrid3}>
              <div>
                <label className={styles.fieldLabel}>User Name</label>
                <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>
                  {account?.user?.first_name || 'API'} {account?.user?.last_name || 'USER'}
                </div>
              </div>
              <div>
                <label className={styles.fieldLabel}>Registered Email</label>
                <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>
                  {account?.user?.email || 'N/A'}
                </div>
              </div>
              <div>
                <label className={styles.fieldLabel}>Company ID</label>
                <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>
                  #{account?.user?.company_id || 'N/A'}
                </div>
              </div>
            </div>
            {account?.user?.created_at && (
              <div style={{ marginTop: '1rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                Account created on: {new Date(account.user.created_at).toLocaleString()}
              </div>
            )}
          </div>
          <div className={styles.formCard}>
            <div className={styles.formSectionTitle}>
              <FiMapPin /> Registered Pickup Locations & Warehouses ({account?.pickupLocations.length || 0})
            </div>
            {account?.pickupLocations && account.pickupLocations.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {account.pickupLocations.map((loc) => (
                  <div
                    key={loc.id}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md, 8px)',
                      padding: '1rem',
                      background: 'var(--color-bg)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '0.9375rem', color: 'var(--color-heading)' }}>
                        {loc.pickup_location}
                      </strong>
                      <span className={`${styles.statusBadge} ${styles.statusGreen}`}>Active</span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                      <div>{loc.address}</div>
                      {loc.address_2 && <div>{loc.address_2}</div>}
                      <div>
                        {loc.city}, {loc.state} - {loc.pin_code}
                      </div>
                      <div style={{ marginTop: '0.35rem' }}>
                        <strong>Contact:</strong> {loc.name} ({loc.phone})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                No pickup locations configured.
              </p>
            )}
          </div>
        </div>
      )}
      {trackingModalAwb && (
        <div className={styles.modalBackdrop} onClick={() => setTrackingModalAwb(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <FiTruck /> Tracking AWB: {trackingModalAwb}
              </h3>
              <button className={styles.closeBtn} onClick={() => setTrackingModalAwb(null)}>
                <FiX />
              </button>
            </div>
            <div className={styles.modalBody}>
              {loadingTracking ? (
                <div className={styles.emptyState}>
                  <span className={styles.spinner} />
                  <p className={styles.emptyDesc}>Fetching live tracking updates...</p>
                </div>
              ) : trackingData ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 700 }}>
                        Current Status
                      </div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-heading)' }}>
                        {trackingData.shipment_track?.[0]?.current_status || 'In Transit'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 700 }}>
                        Courier Partner
                      </div>
                      <div style={{ fontWeight: 600 }}>
                        {trackingData.shipment_track?.[0]?.courier_name || 'Shiprocket Partner'}
                      </div>
                    </div>
                  </div>
                  {trackingData.shipment_track?.[0]?.pod && (
                    <div style={{ fontSize: '0.8125rem' }}>
                      <a
                        href={trackingData.shipment_track[0].pod}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.rechargeLink}
                      >
                        View Proof of Delivery (POD) <FiExternalLink />
                      </a>
                    </div>
                  )}
                  <div className={styles.timeline}>
                    {trackingData.shipment_track_activities && trackingData.shipment_track_activities.length > 0 ? (
                      trackingData.shipment_track_activities.map((act, i) => (
                        <div key={i} className={styles.timelineItem}>
                          <div className={styles.timelineDot} />
                          <div className={styles.timelineTime}>{act.date}</div>
                          <div className={styles.timelineActivity}>{act.activity}</div>
                          {act.location && <div className={styles.timelineLocation}>{act.location}</div>}
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        No scan events recorded yet for this AWB.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <p className={styles.emptyDesc}>No tracking information found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {shipModalOrder && (
        <div className={styles.modalBackdrop} onClick={() => setShipModalOrder(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <FiSend /> Ship Order #{shipModalOrder.id}
              </h3>
              <button className={styles.closeBtn} onClick={() => setShipModalOrder(null)}>
                <FiX />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ fontSize: '0.875rem', lineHeight: 1.4, color: 'var(--color-text-secondary)' }}>
                <div>
                  <strong>Customer:</strong> {shipModalOrder.customer_name} ({shipModalOrder.customer_city}, {shipModalOrder.customer_pincode})
                </div>
                <div>
                  <strong>Weight:</strong> {shipModalOrder.shipments?.[0]?.weight || shipModalOrder.others?.weight || '0.5'} kg • {shipModalOrder.payment_method || 'Prepaid'}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-heading)' }}>
                  Available Courier Partners
                </h4>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => {
                    const shipmentId = shipModalOrder.shipments?.[0]?.id;
                    if (shipmentId) handleAssignCourier(shipmentId);
                  }}
                  disabled={assigningCourier || !shipModalOrder.shipments?.[0]?.id}
                >
                  Auto-Assign Best Courier
                </button>
              </div>
              {loadingCouriers ? (
                <div className={styles.emptyState}>
                  <span className={styles.spinner} />
                  <p className={styles.emptyDesc}>Calculating live rates & serviceability...</p>
                </div>
              ) : couriersList.length === 0 ? (
                <div className={styles.emptyState}>
                  <p className={styles.emptyDesc}>
                    No couriers returned for this route. You can still auto-assign or check pincode.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {couriersList.map((c) => (
                    <div key={c.courier_company_id} className={styles.courierCard}>
                      <div className={styles.courierInfo}>
                        <span className={styles.courierName}>{c.courier_name}</span>
                        <span className={styles.courierEtd}>Estimated Delivery: {c.etd || '2-4 days'}</span>
                        <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>★ {c.rating || '4.0'}</span>
                      </div>
                      <div className={styles.courierRight}>
                        <span className={styles.courierPrice}>₹{c.rate}</span>
                        <button
                          className={styles.primaryBtn}
                          onClick={() => {
                            const shipmentId = shipModalOrder.shipments?.[0]?.id;
                            if (shipmentId) handleAssignCourier(shipmentId, c.courier_company_id);
                          }}
                          disabled={assigningCourier || !shipModalOrder.shipments?.[0]?.id}
                        >
                          Ship with this <FiChevronRight />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ShiprocketDashboard;
