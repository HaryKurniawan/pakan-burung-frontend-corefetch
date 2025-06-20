import React from 'react';
import './CartItem.css';

const CartItem = ({ item, onRemove, onUpdateQuantity }) => {
  const handleIncrement = () => {
    onUpdateQuantity(item.id, item.jumlah + 1);
  };

  const handleDecrement = () => {
    if (item.jumlah > 1) {
      onUpdateQuantity(item.id, item.jumlah - 1);
    } else if (item.jumlah === 1) {
      const confirmRemove = window.confirm(
        `Apakah Anda yakin ingin menghapus "${item.products.nama_produk}" dari keranjang?`
      );
      
      if (confirmRemove) {
        onRemove(item.id);
      }
    }
  };

  return (
    <div className="cart-item">
        <div className="left-cart-item">
          <h5>{item.products.nama_produk}</h5>
          <p>Rp {Number(item.products.harga).toLocaleString()}</p>
        </div>

        
        <div className="quantity-controls">
          <button 
            className="quantity-btn"
            onClick={handleDecrement}
            title={item.jumlah === 1 ? "Klik untuk menghapus dari keranjang" : "Kurangi quantity"}
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
        
      
    </div>
  );
};

export default CartItem;