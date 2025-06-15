import React from 'react';

const CartItem = ({ item, onRemove }) => {
  const handleRemove = () => {
    onRemove(item.id);
  };

  return (
    <div className="cart-item">
      <div>
        <h4>{item.products.nama_produk}</h4>
        <p>Quantity: {item.jumlah}</p>
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