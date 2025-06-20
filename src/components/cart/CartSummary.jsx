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
        <div className="summary-row">
          <span>Ongkir</span>
          <span>Rp 0</span>
        </div>

        <div className="summary-row">
          <span>Vocher</span>
          <span>Rp -0</span>
        </div>
        
        {appliedVoucher && discountAmount > 0 && (
          <div className="summary-row discount-row">
            <span>Diskon ({appliedVoucher.kode_voucher})</span>
            <span className="discount-amount">
              -Rp {discountAmount.toLocaleString()}
            </span>
          </div>
        )}

        <hr />
        
        <div className="bottom-cart-summary">
          <div className="bottom-sumary-teks">
            <span className="total-label">Total</span> <br />
            <span className="total-amount">Rp {(finalAmount || totalAmount).toLocaleString()}</span>
          </div>
          <button className="checkout_button" onClick={onCheckout} disabled={disabled}>
            Checkout
          </button>
        </div>
        
        {appliedVoucher && discountAmount > 0 && (
          <div className="savings-info">
            <small>
              🎉 Anda menghemat Rp {discountAmount.toLocaleString()}!
            </small>
          </div>
        )}

      </div>
      
      
    </div>
  );
};

export default CartSummary;