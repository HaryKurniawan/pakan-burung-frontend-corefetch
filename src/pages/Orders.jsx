import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Orders.css';

const Orders = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    loadOrders();
  }, [currentUser]);

  const loadOrders = async () => {
    try {
      const userOrders = await ordersAPI.getUserOrders(currentUser.id);
      setOrders(userOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      alert('Gagal memuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (order) => {
    setSelectedOrder(order);
    try {
      const tracking = await ordersAPI.getOrderTracking(order.id);
      setTrackingHistory(tracking);
    } catch (error) {
      console.error('Error loading tracking:', error);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      alert('Harap berikan alasan pembatalan');
      return;
    }

    try {
      await ordersAPI.cancelOrder(selectedOrder.id, currentUser.id, cancelReason);
      await loadOrders();
      setShowCancelModal(false);
      setSelectedOrder(null);
      setCancelReason('');
      alert('Pesanan berhasil dibatalkan');
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Gagal membatalkan pesanan');
    }
  };

  const getStatusColor = (statusName) => {
    const colors = {
      'pending': '#fbbf24',
      'confirmed': '#3b82f6',
      'processing': '#8b5cf6',
      'shipped': '#06b6d4',
      'delivered': '#10b981',
      'cancelled': '#ef4444'
    };
    return colors[statusName] || '#6b7280';
  };

  const getStatusIcon = (statusName) => {
    const icons = {
      'pending': '⏰',
      'confirmed': '✅',
      'processing': '🔄',
      'shipped': '🚚',
      'delivered': '📦',
      'cancelled': '❌'
    };
    return icons[statusName] || '📋';
  };

  const canCancelOrder = (status) => {
    return ['pending', 'confirmed'].includes(status);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>Memuat pesanan...</p>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h2>📋 Pesanan Saya</h2>
        <button 
          onClick={() => navigate('/')}
          className="back-button"
        >
          ← Kembali ke Beranda
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <p>Belum ada pesanan</p>
          <button 
            onClick={() => navigate('/')}
            className="shop-now-button"
          >
            Mulai Belanja
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3 className="order-number">{order.order_number}</h3>
                  <p className="order-date">
                    {new Date(order.created_at).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div 
                  className="order-status"
                  style={{ backgroundColor: getStatusColor(order.order_status.nama) }}
                >
                  {getStatusIcon(order.order_status.nama)} {order.order_status.deskripsi}
                </div>
              </div>

              <div className="order-items">
                {order.order_items.map(item => (
                  <div key={item.id} className="order-item">
                    <span className="item-name">{item.products.nama_produk}</span>
                    <span className="item-quantity">x{item.quantity}</span>
                    <span className="item-price">
                      Rp {Number(item.subtotal).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <div className="order-total">
                  <strong>Total: Rp {Number(order.total_amount).toLocaleString()}</strong>
                </div>
                <div className="order-actions">
                  <button 
                    onClick={() => handleViewDetails(order)}
                    className="view-details-button"
                  >
                    Lihat Detail
                  </button>
                  {canCancelOrder(order.order_status.nama) && (
                    <button 
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowCancelModal(true);
                      }}
                      className="cancel-button"
                    >
                      Batalkan
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && !showCancelModal && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detail Pesanan {selectedOrder.order_number}</h3>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="close-button"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="order-details-section">
                <h4>🛒 Item Pesanan</h4>
                {selectedOrder.order_items.map(item => (
                  <div key={item.id} className="detail-item">
                    <span>{item.products.nama_produk}</span>
                    <span>{item.quantity} × Rp {Number(item.price).toLocaleString()}</span>
                    <strong>Rp {Number(item.subtotal).toLocaleString()}</strong>
                  </div>
                ))}
              </div>

              <div className="shipping-details-section">
                <h4>📍 Alamat Pengiriman</h4>
                <p>{selectedOrder.user_addresses.alamat_lengkap}</p>
                <p>{selectedOrder.user_addresses.nama_desa}, RT {selectedOrder.user_addresses.rt}/RW {selectedOrder.user_addresses.rw}</p>
                <p>{selectedOrder.user_addresses.kecamatan?.nama}, {selectedOrder.user_addresses.kota_kabupaten?.nama}</p>
                <p>{selectedOrder.user_addresses.provinsi?.nama}</p>
              </div>

              {selectedOrder.notes && (
                <div className="notes-section">
                  <h4>📝 Catatan</h4>
                  <p>{selectedOrder.notes}</p>
                </div>
              )}

              <div className="tracking-section">
                <h4>📦 Riwayat Status</h4>
                {trackingHistory.map(track => (
                  <div key={track.id} className="tracking-item">
                    <div className="tracking-status">
                      {getStatusIcon(track.order_status.nama)} {track.order_status.deskripsi}
                    </div>
                    <div className="tracking-time">
                      {new Date(track.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {track.notes && <div className="tracking-notes">{track.notes}</div>}
                  </div>
                ))}
              </div>

              <div className="total-section">
                <h3>Total: Rp {Number(selectedOrder.total_amount).toLocaleString()}</h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content cancel-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Batalkan Pesanan</h3>
              <button 
                onClick={() => setShowCancelModal(false)}
                className="close-button"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <p>Apakah Anda yakin ingin membatalkan pesanan <strong>{selectedOrder?.order_number}</strong>?</p>
              
              <div className="cancel-reason-section">
                <label htmlFor="cancelReason">Alasan Pembatalan:</label>
                <textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Berikan alasan pembatalan..."
                  rows="3"
                  className="cancel-reason-textarea"
                />
              </div>

              <div className="cancel-actions">
                <button 
                  onClick={() => setShowCancelModal(false)}
                  className="cancel-cancel-button"
                >
                  Batal
                </button>
                <button 
                  onClick={handleCancelOrder}
                  className="confirm-cancel-button"
                >
                  Ya, Batalkan Pesanan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;