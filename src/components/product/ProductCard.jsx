import React from 'react';
import { useNavigate } from 'react-router-dom'; // gunakan ini untuk navigasi
// Jika kamu belum pakai react-router-dom, beri tahu saya

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/produk/${product.id}`); // arahkan ke halaman detail produk
  };

  // Ambil foto pertama
  const firstPhoto = product.product_photos?.[0]?.url_foto;

  return (
    <div
      className="product-card"
      onClick={handleClick}
      style={{
        cursor: 'pointer',
        border: '1px solid #ddd',
        padding: '12px',
        borderRadius: '8px',
        width: '200px'
      }}
    >
      {/* Foto pertama */}
      {firstPhoto && (
        <img
          src={firstPhoto}
          alt={`Foto ${product.nama_produk}`}
          style={{
            width: '100%',
            height: '150px',
            objectFit: 'cover',
            borderRadius: '6px',
            marginBottom: '8px'
          }}
        />
      )}

      {/* Info dasar */}
      <h3 style={{ fontSize: '16px', margin: '4px 0' }}>{product.nama_produk}</h3>
      <p style={{ fontWeight: 'bold', color: '#444' }}>
        Rp {Number(product.harga).toLocaleString()}
      </p>
    </div>
  );
};

export default ProductCard;
