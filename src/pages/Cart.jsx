import React, { useState } from 'react';
import { useCart } from '../hooks/useCart';
import { useVouchers } from '../hooks/useVouchers';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import VoucherSection from '../components/cart/VoucherSection';
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
  const [voucherError, setVoucherError] = useState('');
  const [voucherSuccess, setVoucherSuccess] = useState('');

  // Calculate final amounts
  const finalAmount = totalAmount - discountAmount;

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError('Masukkan kode voucher');
      return;
    }

    if (!currentUser) {
      setVoucherError('Silakan login terlebih dahulu');
      return;
    }

    try {
      setVoucherError('');
      setVoucherSuccess('');
      
      const result = await validateVoucher(voucherCode, totalAmount, currentUser.id);
      
      setAppliedVoucher(result.voucher);
      setDiscountAmount(result.discountAmount);
      setVoucherSuccess(`Voucher berhasil diterapkan! Diskon: Rp ${result.discountAmount.toLocaleString()}`);
      
    } catch (error) {
      setVoucherError(error.message);
      setAppliedVoucher(null);
      setDiscountAmount(0);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setDiscountAmount(0);
    setVoucherCode('');
    setVoucherError('');
    setVoucherSuccess('');
  };

  const handleNavigateToCheckout = () => {
    if (cart.length === 0) {
      alert('Keranjang kosong!');
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
      <h2>Keranjang Belanja</h2>

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
            voucherError={voucherError}
            voucherSuccess={voucherSuccess}
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