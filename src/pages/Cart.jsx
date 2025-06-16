import React from 'react';
import { useCart } from '../hooks/useCart';
import { useNavigate } from 'react-router-dom';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import './Cart.css'; // ✅ import CSS baru

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, totalAmount } = useCart(); // ✅ TAMBAH updateQuantity
  const navigate = useNavigate();

  const handleNavigateToCheckout = () => {
    if (cart.length === 0) {
      alert('Keranjang kosong!');
      return;
    }

    navigate('/checkout', {
      state: { cartItems: cart, totalAmount }
    });
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
                onUpdateQuantity={updateQuantity} // ✅ PASS FUNGSI updateQuantity
              />
            ))}
          </div>

          <CartSummary 
            totalAmount={totalAmount}
            onCheckout={handleNavigateToCheckout}
            disabled={cart.length === 0}
          />
        </>
      )}
    </div>
  );
};

export default Cart;