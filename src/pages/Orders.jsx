import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI, reviewsAPI } from '../services/api';
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
  
  // Review states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    ulasan: ''
  });
  const [productReviews, setProductReviews] = useState({});

  useEffect(() => {
    loadOrders();
  }, [currentUser]);

  const loadOrders = async () => {
    try {
      const userOrders = await ordersAPI.getUserOrders(currentUser.id);
      setOrders(userOrders);
      
      // Load existing reviews for delivered orders
      await loadExistingReviews(userOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      alert('Gagal memuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingReviews = async (orders) => {
    try {
      const deliveredOrders = orders.filter(order => order.order_status.nama === 'delivered');
      const reviews = {};
      
      for (const order of deliveredOrders) {
        for (const item of order.order_items) {
          const existingReview = await reviewsAPI.getUserProductReview(currentUser.id, item.product_id);
          if (existingReview) {
            reviews[item.product_id] = existingReview;
          }
        }
      }
      
      setProductReviews(reviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
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

  const handleReviewProduct = (product, orderId) => {
    setSelectedProduct({ ...product, orderId });
    
    // Check if review already exists
    const existingReview = productReviews[product.id];
    if (existingReview) {
      setReviewData({
        rating: existingReview.rating,
        ulasan: existingReview.ulasan
      });
    } else {
      setReviewData({
        rating: 5,
        ulasan: ''
      });
    }
    
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewData.ulasan.trim()) {
      alert('Harap berikan ulasan Anda');
      return;
    }

    try {
      const existingReview = productReviews[selectedProduct.id];
      
      if (existingReview) {
        // Update existing review
        await reviewsAPI.updateReview(existingReview.id, {
          rating: reviewData.rating,
          ulasan: reviewData.ulasan.trim()
        });
        alert('Ulasan berhasil diperbarui!');
      } else {
        // Create new review
        await reviewsAPI.createReview({
          user_id: currentUser.id,
          product_id: selectedProduct.id,
          rating: reviewData.rating,
          ulasan: reviewData.ulasan.trim()
        });
        alert('Terima kasih atas ulasan Anda!');
      }
      
      // Refresh reviews
      await loadOrders();
      setShowReviewModal(false);
      setSelectedProduct(null);
      setReviewData({ rating: 5, ulasan: '' });
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Gagal menyimpan ulasan');
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

  const canReviewOrder = (status) => {
    return status === 'delivered';
  };

  const renderStars = (rating, onRatingChange = null) => {
    return (
      <div className="rating-stars">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''} ${onRatingChange ? 'clickable' : ''}`}
            onClick={onRatingChange ? () => onRatingChange(star) : undefined}
          >
            ⭐
          </span>
        ))}
      </div>
    );
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
                    <div className="item-info">
                      <span className="item-name">{item.products.nama_produk}</span>
                      <span className="item-quantity">x{item.quantity}</span>
                      <span className="item-price">
                        Rp {Number(item.subtotal).toLocaleString()}
                      </span>
                    </div>
                    
                    {canReviewOrder(order.order_status.nama) && (
                      <div className="item-review">
                        {productReviews[item.product_id] ? (
                          <div className="existing-review">
                            {renderStars(productReviews[item.product_id].rating)}
                            <button 
                              onClick={() => handleReviewProduct(item.products, order.id)}
                              className="edit-review-button"
                            >
                              Edit Ulasan
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleReviewProduct(item.products, order.id)}
                            className="review-button"
                          >
                            ⭐ Beri Ulasan
                          </button>
                        )}
                      </div>
                    )}
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
                    <div className="item-details">
                      <span>{item.products.nama_produk}</span>
                      <span>{item.quantity} × Rp {Number(item.price).toLocaleString()}</span>
                      <strong>Rp {Number(item.subtotal).toLocaleString()}</strong>
                    </div>
                    
                    {canReviewOrder(selectedOrder.order_status.nama) && (
                      <div className="item-review-inline">
                        {productReviews[item.product_id] ? (
                          <div className="review-status">
                            <span>Sudah diulas:</span>
                            {renderStars(productReviews[item.product_id].rating)}
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleReviewProduct(item.products, selectedOrder.id)}
                            className="review-button-small"
                          >
                            Beri Ulasan
                          </button>
                        )}
                      </div>
                    )}
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

      {/* Review Modal */}
      {showReviewModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content review-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {productReviews[selectedProduct.id] ? 'Edit Ulasan' : 'Beri Ulasan'}
              </h3>
              <button 
                onClick={() => setShowReviewModal(false)}
                className="close-button"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="product-info">
                <h4>{selectedProduct.nama_produk}</h4>
              </div>

              <div className="rating-section">
                <label>Rating:</label>
                {renderStars(reviewData.rating, (rating) => setReviewData({...reviewData, rating}))}
                <span className="rating-text">({reviewData.rating} dari 5 bintang)</span>
              </div>

              <div className="review-text-section">
                <label htmlFor="reviewText">Ulasan Anda:</label>
                <textarea
                  id="reviewText"
                  value={reviewData.ulasan}
                  onChange={(e) => setReviewData({...reviewData, ulasan: e.target.value})}
                  placeholder="Bagikan pengalaman Anda dengan produk ini..."
                  rows="4"
                  className="review-textarea"
                />
              </div>

              <div className="review-actions">
                <button 
                  onClick={() => setShowReviewModal(false)}
                  className="cancel-review-button"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSubmitReview}
                  className="submit-review-button"
                >
                  {productReviews[selectedProduct.id] ? 'Perbarui Ulasan' : 'Kirim Ulasan'}
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