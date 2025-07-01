import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {  ordersAPI } from '../services/ordersAPI';
import { productsAPI } from '../services/productsAPI';


import { addressAPI } from '../services/addressAPI';
import { useCart } from '../hooks/useCart';
import { useVouchers } from '../hooks/useVouchers';
import { useProducts } from '../hooks/useProducts';
import { useAuth } from '../context/AuthContext';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  // Extract voucher data from location state
  const { 
    cartItems, 
    totalAmount, 
    appliedVoucher, 
    discountAmount = 0, 
    finalAmount 
  } = location.state || {};
  
  const { clearCart } = useCart();
  const { applyVoucher } = useVouchers();
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

      // Create order with voucher data
      const orderData = {
        userId: currentUser.id,
        originalAmount: totalAmount, // Original amount before discount
        discountAmount: discountAmount, // Discount amount
        totalAmount: finalAmount || totalAmount, // Final amount after discount
        voucherId: appliedVoucher?.id || null, // Voucher ID if applied
        voucherCode: appliedVoucher?.kode_voucher || null, // Voucher code
        shippingAddressId: primaryAddress.id,
        items: cartItems,
        notes: orderNotes
      };

      const order = await ordersAPI.createOrder(orderData);

      // Apply voucher usage if voucher was used
      if (appliedVoucher && discountAmount > 0) {
        try {
          await applyVoucher(
            appliedVoucher.id, 
            currentUser.id, 
            order.id, 
            discountAmount
          );
        } catch (voucherError) {
          console.error('Error applying voucher:', voucherError);
          // Don't fail the entire checkout if voucher application fails
          // The order is already created, just log the error
        }
      }

      // Update stok satu per satu
      for (const item of checks) {
        await productsAPI.updateStock(item.product_id, item.currentStock - item.jumlah);
      }

      // Clear cart
      await clearCart();
      await fetchProducts();

      // Show success message with voucher info
      let successMessage = `Pesanan berhasil dibuat! 
Order Number: ${order.order_number}`;

      if (appliedVoucher && discountAmount > 0) {
        successMessage += `
Subtotal: Rp ${totalAmount.toLocaleString()}
Diskon (${appliedVoucher.kode_voucher}): -Rp ${discountAmount.toLocaleString()}`;
      }

      successMessage += `
Total: Rp ${(finalAmount || totalAmount).toLocaleString()}
Pesanan akan dikirim ke: ${primaryAddress.alamat_lengkap}
Status: Menunggu konfirmasi`;

      alert(successMessage);
      
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
        
        {/* Voucher Section - Show if voucher is applied */}
        {appliedVoucher && discountAmount > 0 && (
          <div className="applied-voucher-checkout">
            <div className="voucher-checkout-header">
              <h4 className="voucher-checkout-title">🎟️ Voucher Diterapkan</h4>
            </div>
            <div className="voucher-checkout-details">
              <div className="voucher-checkout-info">
                <p className="voucher-checkout-name">{appliedVoucher.nama_voucher}</p>
                <p className="voucher-checkout-code">Kode: {appliedVoucher.kode_voucher}</p>
                <p className="voucher-checkout-description">{appliedVoucher.deskripsi}</p>
              </div>
              <div className="voucher-checkout-discount">
                <span className="discount-label">Diskon:</span>
                <span className="discount-value">
                  -Rp {discountAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
        
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
        
        {/* Order Summary */}
        <div className="order-summary-section">
          <div className="summary-row">
            <span className="summary-label">Subtotal:</span>
            <span className="summary-value">
              Rp {Number(totalAmount).toLocaleString()}
            </span>
          </div>
          
          {appliedVoucher && discountAmount > 0 && (
            <div className="summary-row discount-summary-row">
              <span className="summary-label discount-label">
                Diskon ({appliedVoucher.kode_voucher}):
              </span>
              <span className="summary-value discount-value">
                -Rp {discountAmount.toLocaleString()}
              </span>
            </div>
          )}
          
          <div className="summary-row total-summary-row">
            <span className="summary-label total-label">Total Pembayaran:</span>
            <span className="summary-value total-value">
              Rp {(finalAmount || totalAmount).toLocaleString()}
            </span>
          </div>
          
          {appliedVoucher && discountAmount > 0 && (
            <div className="savings-notice">
              <small>🎉 Anda menghemat Rp {discountAmount.toLocaleString()}!</small>
            </div>
          )}
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