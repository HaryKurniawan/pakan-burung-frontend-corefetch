import React from 'react';
import './CartSummary.css';

const CartSummary = ({ 
  totalAmount, 
  discountAmount = 0, 
  finalAmount, 
  appliedVoucher,
  onCheckout, 
  disabled 
}) => {
  return (
    <div className="cart-summary">
      
      <div className="summary-details">
        <div className="summary-row">
          <span>Subtotal</span>
          <span>Rp {totalAmount.toLocaleString()}</span>
        </div>
        
        {appliedVoucher && discountAmount > 0 && (
          <div className="summary-row discount-row">
            <span>Diskon ({appliedVoucher.kode_voucher})</span>
            <span className="discount-amount">
              -Rp {discountAmount.toLocaleString()}
            </span>
          </div>
        )}
        
        <div className="summary-row total-row">
          <span className="total-label">Total</span>
          <span className="total-amount">
            Rp {(finalAmount || totalAmount).toLocaleString()}
          </span>
        </div>
        
        {appliedVoucher && discountAmount > 0 && (
          <div className="savings-info">
            <small>
              🎉 Anda menghemat Rp {discountAmount.toLocaleString()}!
            </small>
          </div>
        )}
      </div>
      
      <button 
        className="checkout-button"
        onClick={onCheckout}
        disabled={disabled}
      >
        Lanjut ke Pembayaran
      </button>
    </div>
  );
};

export default CartSummary;