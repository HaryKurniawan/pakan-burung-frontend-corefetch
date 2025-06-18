import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ProductCard.css'; // Import file CSS terpisah

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/produk/${product.id}`);
  };

  const firstPhoto = product.product_photos?.[0]?.url_foto;

  return (
    <div className="product-card" onClick={handleClick}>
      {firstPhoto && (
        <img
          src={firstPhoto}
          alt={`Foto ${product.nama_produk}`}
          className="product-image"
        />
      )}

      <h3 className="product-name">{product.nama_produk}</h3>
      <p className="product-price">
        Rp {Number(product.harga).toLocaleString()}
      </p>
    </div>
  );
};

export default ProductCard;
