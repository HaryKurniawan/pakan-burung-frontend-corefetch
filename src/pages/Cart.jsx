import React, { useState } from 'react';
import { useCart } from '../hooks/useCart';
import { useVouchers } from '../hooks/useVouchers';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import VoucherSection from '../components/cart/VoucherSection';
import Header from '../components/common/Header';
import NotificationToast from '../components/common/NotificationToast';
import './Cart.css';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, totalAmount } = useCart();
  const { validateVoucher, loading: voucherLoading } = useVouchers();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Voucher state
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [voucherCode, setVoucherCode] = useState('');
  
  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    type: '', // 'success' or 'error'
    message: ''
  });

  // Calculate final amounts
  const finalAmount = totalAmount - discountAmount;

  // Show notification function
  const showNotification = (type, message) => {
    setNotification({
      show: true,
      type,
      message
    });
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      setNotification({
        show: false,
        type: '',
        message: ''
      });
    }, 3000);
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      showNotification('error', 'Masukkan kode voucher');
      return;
    }

    if (!currentUser) {
      showNotification('error', 'Silakan login terlebih dahulu');
      return;
    }

    try {
      const result = await validateVoucher(voucherCode, totalAmount, currentUser.id);
      
      setAppliedVoucher(result.voucher);
      setDiscountAmount(result.discountAmount);
      showNotification('success', `Voucher berhasil diterapkan! Diskon: Rp ${result.discountAmount.toLocaleString()}`);
      
    } catch (error) {
      showNotification('error', error.message);
      setAppliedVoucher(null);
      setDiscountAmount(0);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setDiscountAmount(0);
    setVoucherCode('');
    showNotification('success', 'Voucher berhasil dihapus');
  };

  const handleNavigateToCheckout = () => {
    if (cart.length === 0) {
      showNotification('error', 'Keranjang kosong!');
      return;
    }

    // Pass voucher data to checkout
    const checkoutData = {
      cartItems: cart,
      totalAmount,
      appliedVoucher,
      discountAmount,
      finalAmount
    };

    navigate('/checkout', { state: checkoutData });
  };

  return (
    <div className="cart-container">
      <Header title="keranjang" />

      {/* Notification Toast */}
      <NotificationToast 
        show={notification.show}
        type={notification.type}
        message={notification.message}
      />

      {cart.length === 0 ? (
        <p>Keranjang Anda kosong.</p>
      ) : (
        <>
          <div className="cart-items">
            {cart.map(item => (
              <CartItem 
                key={item.id} 
                item={item} 
                onRemove={removeFromCart}
                onUpdateQuantity={updateQuantity}
              />
            ))}
          </div>

          {/* Voucher Section */}
          <VoucherSection
            voucherCode={voucherCode}
            setVoucherCode={setVoucherCode}
            onApplyVoucher={handleApplyVoucher}
            onRemoveVoucher={handleRemoveVoucher}
            appliedVoucher={appliedVoucher}
            loading={voucherLoading}
          />

          <CartSummary 
            totalAmount={totalAmount}
            discountAmount={discountAmount}
            finalAmount={finalAmount}
            appliedVoucher={appliedVoucher}
            onCheckout={handleNavigateToCheckout}
            disabled={cart.length === 0}
          />
        </>
      )}
    </div>
  );
};

export default Cart;