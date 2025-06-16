import React from 'react';

const CartItem = ({ item, onRemove, onUpdateQuantity }) => {
  const handleRemove = () => {
    onRemove(item.id);
  };

  // ✅ FUNGSI BARU: Handle increment quantity
  const handleIncrement = () => {
    onUpdateQuantity(item.id, item.jumlah + 1);
  };

  // ✅ FUNGSI BARU: Handle decrement quantity
  const handleDecrement = () => {
    if (item.jumlah > 1) {
      onUpdateQuantity(item.id, item.jumlah - 1);
    }
  };

  return (
    <div className="cart-item">
      <div>
        <h4>{item.products.nama_produk}</h4>
        
        {/* ✅ QUANTITY CONTROLS BARU */}
        <div className="quantity-controls">
          <span>Quantity: </span>
          <button 
            className="quantity-btn"
            onClick={handleDecrement}
            disabled={item.jumlah <= 1}
          >
            -
          </button>
          <span className="quantity-display">{item.jumlah}</span>
          <button 
            className="quantity-btn"
            onClick={handleIncrement}
          >
            +
          </button>
        </div>
        
        <p>Price: Rp {Number(item.products.harga).toLocaleString()}</p>
        <p>Subtotal: Rp {(Number(item.products.harga) * item.jumlah).toLocaleString()}</p>
      </div>
      <button 
        className="button danger"
        onClick={handleRemove}
      >
        Remove
      </button>
    </div>
  );
};

export default CartItem;