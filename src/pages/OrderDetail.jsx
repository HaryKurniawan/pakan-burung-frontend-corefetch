import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ordersAPI, reviewsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/common/Header'


const OrderDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [order, setOrder] = useState(null);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderReview, setOrderReview] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    ulasan: ''
  });

  useEffect(() => {
    // Check if order data exists in location state
    if (location.state && location.state.order) {
      setOrder(location.state.order);
      loadOrderDetails(location.state.order);
    } else {
      // Redirect back to orders if no order data
      navigate('/orders');
    }
  }, [location.state, navigate]);

  const loadOrderDetails = async (orderData) => {
    try {
      // Load tracking history
      const tracking = await ordersAPI.getOrderTracking(orderData.id);
      setTrackingHistory(tracking);

      // Load existing review if order is delivered
      if (orderData.order_status.nama === 'delivered') {
        const existingReview = await reviewsAPI.getUserOrderReview(currentUser.id, orderData.id);
        if (existingReview) {
          setOrderReview(existingReview);
        }
      }
    } catch (error) {
      console.error('Error loading order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewOrder = () => {
    if (orderReview) {
      setReviewData({
        rating: orderReview.rating,
        ulasan: orderReview.ulasan
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
      if (orderReview) {
        // Update existing order review
        await reviewsAPI.updateOrderReview(orderReview.id, {
          rating: reviewData.rating,
          ulasan: reviewData.ulasan.trim()
        });
        alert('Ulasan pesanan berhasil diperbarui!');
      } else {
        // Create new order review
        const newReview = await reviewsAPI.createOrderReview({
          user_id: currentUser.id,
          order_id: order.id,
          rating: reviewData.rating,
          ulasan: reviewData.ulasan.trim()
        });
        setOrderReview(newReview);
        alert('Terima kasih atas ulasan pesanan Anda!');
      }
      
      setShowReviewModal(false);
      setReviewData({ rating: 5, ulasan: '' });
      
      // Reload order review
      const updatedReview = await reviewsAPI.getUserOrderReview(currentUser.id, order.id);
      setOrderReview(updatedReview);
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
      <div>
        <p>Memuat detail pesanan...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <p>Data pesanan tidak ditemukan</p>
        <button onClick={() => navigate('/orders')}>
          Kembali ke Daftar Pesanan
        </button>
      </div>
    );
  }

  return (
    <div>
       <Header title="Detail Pesanan" />
      

      <div>
        <h2>No{order.order_number}</h2>
        
        <div>
          <p>Tanggal Pesanan: {new Date(order.created_at).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
          
          <div style={{ backgroundColor: getStatusColor(order.order_status.nama), padding: '8px', borderRadius: '4px', display: 'inline-block' }}>
            {getStatusIcon(order.order_status.nama)} {order.order_status.deskripsi}
          </div>
        </div>

        <div>
          <h3>🛒 Item Pesanan</h3>
          {order.order_items.map(item => (
            <div key={item.id}>
              <div>
                <span>{item.products.nama_produk}</span>
                <span>{item.quantity} × Rp {Number(item.price).toLocaleString()}</span>
                <strong>Rp {Number(item.subtotal).toLocaleString()}</strong>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h3>📍 Alamat Pengiriman</h3>
          <p>{order.user_addresses.alamat_lengkap}</p>
          <p>{order.user_addresses.nama_desa}, RT {order.user_addresses.rt}/RW {order.user_addresses.rw}</p>
          <p>{order.user_addresses.kecamatan?.nama}, {order.user_addresses.kota_kabupaten?.nama}</p>
          <p>{order.user_addresses.provinsi?.nama}</p>
        </div>

        {order.notes && (
          <div>
            <h3>📝 Catatan</h3>
            <p>{order.notes}</p>
          </div>
        )}

        <div>
          <h3>Total: Rp {Number(order.total_amount).toLocaleString()}</h3>
        </div>

      </div>

     
    </div>
  );
};

export default OrderDetail;