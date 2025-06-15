import React from 'react';

const CartSummary = ({ totalAmount, onCheckout, disabled }) => {
  return (
    <div className="cart-summary">
      <h3>Order Summary</h3>
      <p className="order-summary">
        Total: Rp {totalAmount.toLocaleString()}
      </p>
      <button 
        className="checkout-button"
        onClick={onCheckout}
        disabled={disabled}
      >
        Proceed to Checkout
      </button>
    </div>
  );
};

export default CartSummary;