import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { productsAPI, addressAPI, ordersAPI } from '../services/api';
import { useCart } from '../hooks/useCart';
import { useProducts } from '../hooks/useProducts';
import { useAuth } from '../context/AuthContext';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { cartItems, totalAmount } = location.state || {};
  const { clearCart } = useCart();
  const { fetchProducts } = useProducts();
  const [loading, setLoading] = useState(false);
  const [primaryAddress, setPrimaryAddress] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [orderNotes, setOrderNotes] = useState('');

  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      alert('Tidak ada produk untuk di-checkout.');
      navigate('/cart');
      return;
    }
    
    loadPrimaryAddress();
  }, [cartItems, navigate, currentUser]);

  const loadPrimaryAddress = async () => {
    try {
      const addresses = await addressAPI.getUserAddresses(currentUser.id);
      const primary = addresses.find(addr => addr.is_primary);
      setPrimaryAddress(primary);
    } catch (error) {
      console.error('Error loading primary address:', error);
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleCheckout = async () => {
    if (!primaryAddress) {
      alert('Pilih alamat pengiriman terlebih dahulu.');
      return;
    }

    setLoading(true);

    try {
      const products = await productsAPI.getAll();

      // Cek stok dulu
      const checks = cartItems.map(item => {
        const found = products.find(p => p.id === item.product_id);
        if (!found) throw new Error(`Produk ${item.product_id} tidak ditemukan`);
        if (item.jumlah > found.stok) {
          throw new Error(`${item.products?.nama_produk || 'Produk'} stok kurang. Tersedia: ${found.stok}`);
        }
        return { ...item, currentStock: found.stok };
      });

      // Create order
      const orderData = {
        userId: currentUser.id,
        totalAmount: totalAmount,
        shippingAddressId: primaryAddress.id,
        items: cartItems,
        notes: orderNotes
      };

      const order = await ordersAPI.createOrder(orderData);

      // Update stok satu per satu
      for (const item of checks) {
        await productsAPI.updateStock(item.product_id, item.currentStock - item.jumlah);
      }

      // Clear cart
      await clearCart();
      await fetchProducts();

      alert(`Pesanan berhasil dibuat! 
Order Number: ${order.order_number}
Total: Rp ${totalAmount.toLocaleString()}
Pesanan akan dikirim ke: ${primaryAddress.alamat_lengkap}
Status: Menunggu konfirmasi`);
      
      navigate('/orders');
    } catch (err) {
      console.error(err);
      alert(`Checkout gagal: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingAddress) {
    return (
      <div className="loading-container">
        <p>Memuat data checkout...</p>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h2>🛒 Checkout</h2>
        <button 
          onClick={() => navigate('/cart')}
          className="back-button"
        >
          ← Kembali ke Keranjang
        </button>
      </div>

      {/* Alamat Pengiriman */}
      <div className="address-section">
        <div className="address-header">
          <h3 className="address-title">📍 Alamat Pengiriman</h3>
          <button 
            onClick={() => navigate('/address')}
            className="manage-address-button"
          >
            ✏️ Kelola Alamat
          </button>
        </div>
        
        {primaryAddress ? (
          <div className="primary-address-card">
            <div className="address-badge-container">
              <span className="primary-badge">
                ✓ ALAMAT UTAMA
              </span>
              <strong className="address-village-name">{primaryAddress.nama_desa}</strong>
            </div>
            
            <div className="address-details">
              <p className="address-detail-item">
                <strong>Alamat:</strong> {primaryAddress.alamat_lengkap}
              </p>
              <p className="address-detail-item">
                <strong>Desa/Kelurahan:</strong> {primaryAddress.nama_desa}, RT {primaryAddress.rt}/RW {primaryAddress.rw}
              </p>
              <p className="address-detail-item">
                <strong>Kecamatan:</strong> {primaryAddress.kecamatan?.nama || 'N/A'}
              </p>
              <p className="address-detail-item">
                <strong>Kota/Kabupaten:</strong> {primaryAddress.kota_kabupaten?.nama || 'N/A'}
              </p>
              <p className="address-detail-item">
                <strong>Provinsi:</strong> {primaryAddress.provinsi?.nama || 'N/A'}
              </p>
              {primaryAddress.catatan_alamat && (
                <p className="address-note">
                  <strong>Catatan:</strong> {primaryAddress.catatan_alamat}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="no-address-warning">
            <p className="warning-text">
              ⚠️ Belum ada alamat pengiriman yang dipilih
            </p>
            <button 
              onClick={() => navigate('/address')}
              className="add-address-button"
            >
              + Tambah Alamat
            </button>
          </div>
        )}
      </div>

      {/* Detail Pesanan */}
      <div className="order-details-section">
        <h3 className="order-details-title">📦 Detail Pesanan</h3>
        
        {cartItems?.map(item => (
          <div key={item.id} className="order-item">
            <div className="order-item-details">
              <h4 className="order-item-name">
                {item.products?.nama_produk}
              </h4>
              <p className="order-item-quantity">
                {item.jumlah} × Rp {Number(item.products?.harga || 0).toLocaleString()}
              </p>
            </div>
            <div className="order-item-price">
              <strong className="order-item-total">
                Rp {(Number(item.products?.harga || 0) * item.jumlah).toLocaleString()}
              </strong>
            </div>
          </div>
        ))}
        
        {/* Catatan Pesanan */}
        <div className="order-notes-section">
          <label htmlFor="orderNotes" className="notes-label">
            📝 Catatan Pesanan (Opsional)
          </label>
          <textarea
            id="orderNotes"
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            placeholder="Tambahkan catatan khusus untuk pesanan Anda..."
            className="order-notes-textarea"
            rows="3"
          />
        </div>
        
        <div className="total-section">
          <h3 className="total-label">Total Pembayaran:</h3>
          <h3 className="total-amount">
            Rp {Number(totalAmount).toLocaleString()}
          </h3>
        </div>
      </div>

      {/* Tombol Checkout */}
      <div className="checkout-button-section">
        <button 
          onClick={handleCheckout} 
          disabled={loading || !primaryAddress}
          className={`checkout-button ${(!primaryAddress || loading) ? 'checkout-button-disabled' : 'checkout-button-enabled'}`}
        >
          {loading ? '⏳ Memproses...' : '💳 Buat Pesanan'}
        </button>
        
        {!primaryAddress && (
          <p className="address-required-note">
            * Pilih alamat pengiriman untuk melanjutkan pembayaran
          </p>
        )}
      </div>
    </div>
  );
};

export default Checkout;