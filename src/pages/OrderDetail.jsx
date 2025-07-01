import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/ordersAPI';
import { useAuth } from '../context/AuthContext';
import Header from '../components/common/Header'
import './OrderDetail.css'

const OrderDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copyMessage, setCopyMessage] = useState('');

  useEffect(() => {
    // Check if order data exists in location state
    if (location.state && location.state.order) {
      setOrder(location.state.order);
      setLoading(false);
    } else if (location.state && location.state.orderId) {
      // If only orderId is passed, fetch order from API
      loadOrderFromAPI(location.state.orderId);
    } else {
      // Redirect back to orders if no order data
      navigate('/orders');
    }
  }, [location.state, navigate]);

  const loadOrderFromAPI = async (orderId) => {
    try {
      const orderData = await ordersAPI.getOrderById(orderId);
      setOrder(orderData);
    } catch (error) {
      console.error('Error loading order:', error);
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const copyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(order.order_number);
      setCopyMessage('Order ID berhasil disalin!');
      setTimeout(() => setCopyMessage(''), 2000);
    } catch (error) {
      console.error('Error copying order ID:', error);
      setCopyMessage('Gagal menyalin Order ID');
      setTimeout(() => setCopyMessage(''), 2000);
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
    <div className='orderdetail-contain'>
       <Header title="Detail Pesanan" />
      
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2>No. {order.order_number}</h2>
          <button onClick={copyOrderId}>
            Salin ID
          </button>
        </div>
        
        {copyMessage && (
          <p style={{ color: 'green', fontSize: '14px', margin: '5px 0' }}>
            {copyMessage}
          </p>
        )}
        
        <div>
          <p>Tanggal Pesanan: {new Date(order.created_at).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
          
          <div style={{ backgroundColor: getStatusColor(order.order_status.nama), padding: '8px', borderRadius: '4px', display: 'inline-block' }}>
            {order.order_status.deskripsi}
          </div>
        </div>

        <div>
          <h3>Item Pesanan</h3>
          {order.order_items.map(item => (
            <div key={item.id}>
              <div>
                <span>{item.products.nama_produk}</span>
                <span>{item.quantity || item.jumlah} × Rp {Number(item.price).toLocaleString()}</span>
                <strong>Rp {Number(item.subtotal).toLocaleString()}</strong>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h3>Alamat Pengiriman</h3>
          <p>{order.user_addresses.alamat_lengkap}</p>
          <p>{order.user_addresses.nama_desa}, RT {order.user_addresses.rt}/RW {order.user_addresses.rw}</p>
          <p>{order.user_addresses.kecamatan?.nama}, {order.user_addresses.kota_kabupaten?.nama}</p>
          <p>{order.user_addresses.provinsi?.nama}</p>
        </div>

        {order.notes && (
          <div>
            <h3>Catatan</h3>
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