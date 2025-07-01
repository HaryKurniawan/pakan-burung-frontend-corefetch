import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/ordersAPI';
import { reviewsAPI } from '../services/reviewsAPI';

import { useAuth } from '../context/AuthContext';
import './orders.css'

const Orders = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'
  
  // Review states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    ulasan: ''
  });
  const [orderReviews, setOrderReviews] = useState({});

  useEffect(() => {
    loadOrders();
  }, [currentUser]);

  const loadOrders = async () => {
    try {
      const userOrders = await ordersAPI.getUserOrders(currentUser.id);
      setOrders(userOrders);
      
      // Load existing reviews for delivered orders
      await loadExistingOrderReviews(userOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      alert('Gagal memuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingOrderReviews = async (orders) => {
    try {
      const deliveredOrders = orders.filter(order => order.order_status.nama === 'delivered');
      const reviews = {};
      
      for (const order of deliveredOrders) {
        const existingReview = await reviewsAPI.getUserOrderReview(currentUser.id, order.id);
        if (existingReview) {
          reviews[order.id] = existingReview;
        }
      }
      
      setOrderReviews(reviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  // Filter orders based on active tab
  const getFilteredOrders = () => {
    if (activeTab === 'active') {
      // Pesanan aktif: pending, confirmed, processing, shipped
      return orders.filter(order => 
        ['pending', 'confirmed', 'processing', 'shipped'].includes(order.order_status.nama)
      );
    } else {
      // Pesanan selesai: delivered, cancelled
      return orders.filter(order => 
        ['delivered', 'cancelled'].includes(order.order_status.nama)
      );
    }
  };

  const getOrderCount = (type) => {
    if (type === 'active') {
      return orders.filter(order => 
        ['pending', 'confirmed', 'processing', 'shipped'].includes(order.order_status.nama)
      ).length;
    } else {
      return orders.filter(order => 
        ['delivered', 'cancelled'].includes(order.order_status.nama)
      ).length;
    }
  };

  const handleViewDetails = (order) => {
    // Navigate to order detail page with order data in state
    navigate('/order-detail', { state: { order } });
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

  const handleReviewOrder = (order) => {
    setSelectedOrderForReview(order);
    
    // Check if review already exists for this order
    const existingReview = orderReviews[order.id];
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
      const existingReview = orderReviews[selectedOrderForReview.id];
      
      if (existingReview) {
        // Update existing order review
        await reviewsAPI.updateOrderReview(existingReview.id, {
          rating: reviewData.rating,
          ulasan: reviewData.ulasan.trim()
        });
        alert('Ulasan pesanan berhasil diperbarui!');
      } else {
        // Create new order review
        await reviewsAPI.createOrderReview({
          user_id: currentUser.id,
          order_id: selectedOrderForReview.id,
          rating: reviewData.rating,
          ulasan: reviewData.ulasan.trim()
        });
        alert('Terima kasih atas ulasan pesanan Anda!');
      }
      
      // Refresh reviews
      await loadOrders();
      setShowReviewModal(false);
      setSelectedOrderForReview(null);
      setReviewData({ rating: 5, ulasan: '' });
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Gagal menyimpan ulasan');
    }
  };

  const getStatusColor = (statusName) => {
    const colors = {
      'pending': '#ECEDEC',
      'confirmed': '#FFAC4D',
      'processing': '#FFAC4D',
      'shipped': '#C3EB6D',
      'delivered': '#C3EB6D',
      'cancelled': '#ef4444'
    };
    return colors[statusName] || '#6b7280';
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

  const filteredOrders = getFilteredOrders();

  return (
    <div className="orders-container">
      {/* Tab Navigation */}
      <div className="orders-tabs">
        <button
          className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
         Aktif
          {/* {getOrderCount('active') > 0 && (
            <span className="tab-badge">{getOrderCount('active')}</span>
          )} */}
        </button>
        <button
          className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Selesai
          {/* {getOrderCount('completed') > 0 && (
            <span className="tab-badge">{getOrderCount('completed')}</span>
          )} */}
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            {activeTab === 'active' ? (
              <>
                <p>Tidak ada pesanan aktif</p>
                <p className="no-orders-subtitle">Pesanan yang sedang diproses akan muncul di sini</p>
                <button 
                  onClick={() => navigate('/')}
                  className="shop-now-button"
                >
                  Mulai Belanja
                </button>
              </>
            ) : (
              <>
                <p>Tidak ada pesanan selesai</p>
                <p className="no-orders-subtitle">Pesanan yang sudah selesai atau dibatalkan akan muncul di sini</p>
              </>
            )}
          </div>
        ) : (
          <div className="orders-list">
            {filteredOrders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                 
                  <div 
                    className="order-status"
                    style={{ backgroundColor: getStatusColor(order.order_status.nama) }}
                  >
                    {order.order_status.deskripsi}
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
                    </div>
                  ))}
                </div>

                <div className="order-footer">
                  <div className="order-total">
                   <p>Total:</p> <p>Rp {Number(order.total_amount).toLocaleString()}</p>
                  </div>
                  <div className="order-actions">
                    <div 
                      onClick={() => handleViewDetails(order)}
                      className="view-details-button"
                    >
                      Lihat Detail
                    </div>
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
                    {canReviewOrder(order.order_status.nama) && (
                      <div className="order-review-section">
                        {orderReviews[order.id] ? (
                          <div className="existing-review">
                            
                            <button 
                              onClick={() => handleReviewOrder(order)}
                              className="edit-review-button"
                            >
                              Edit Ulasan
                            </button>
                            {/* {renderStars(orderReviews[order.id].rating)} */}
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleReviewOrder(order)}
                            className="review-button"
                          >
                            Beri Ulasan
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
      {showReviewModal && selectedOrderForReview && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content review-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {orderReviews[selectedOrderForReview.id] ? 'Edit Ulasan Pesanan' : 'Beri Ulasan Pesanan'}
              </h3>
              <button 
                onClick={() => setShowReviewModal(false)}
                className="close-button"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="order-review-info">
                <h4>Pesanan #{selectedOrderForReview.order_number}</h4>
                <div className="review-order-items">
                  <p><strong>Produk yang Anda beli:</strong></p>
                  <div className="products-list">
                    {selectedOrderForReview.order_items.map(item => (
                      <div key={item.id} className="product-item">
                        <span className="product-name">{item.products.nama_produk}</span>
                        <span className="product-qty">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rating-section">
                <label>Rating Keseluruhan Pesanan:</label>
                {renderStars(reviewData.rating, (rating) => setReviewData({...reviewData, rating}))}
                <span className="rating-text">({reviewData.rating} dari 5 bintang)</span>
              </div>

              <div className="review-text-section">
                <label htmlFor="reviewText">Ulasan Anda untuk pesanan ini:</label>
                <textarea
                  id="reviewText"
                  value={reviewData.ulasan}
                  onChange={(e) => setReviewData({...reviewData, ulasan: e.target.value})}
                  placeholder="Bagikan pengalaman Anda dengan pesanan ini secara keseluruhan (kualitas produk, layanan, pengiriman, dll)..."
                  rows="4"
                  className="review-textarea"
                />
                <small>Ulasan ini akan mencakup semua produk dalam pesanan #{selectedOrderForReview.order_number}</small>
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
                  {orderReviews[selectedOrderForReview.id] ? 'Perbarui Ulasan' : 'Kirim Ulasan'}
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