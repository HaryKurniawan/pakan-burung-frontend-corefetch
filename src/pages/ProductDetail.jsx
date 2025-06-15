// pages/ProductDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../hooks/useCart'; // Tetap menggunakan useCart hook

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart(); // useCart akan otomatis menggunakan context jika tersedia
  const [product, setProduct] = useState(null);
  const [jumlah, setJumlah] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      const response = await api.get(`/products?id=eq.${id}&select=*,product_photos(*)`);
      setProduct(response.data?.[0]);
    };
    fetchProduct();
  }, [id]);

  if (!product) return <p>Loading...</p>;

  const increase = () => {
    if (jumlah < product.stok) {
      setJumlah(prev => prev + 1);
    }
  };

  const decrease = () => {
    if (jumlah > 1) {
      setJumlah(prev => prev - 1);
    }
  };

  const handleAddToCart = () => {
    addToCart({ ...product, jumlah });
    // Alert sudah ada di dalam addToCart function
  };

  const handleBuyNow = () => {
    const item = {
      product_id: product.id,
      jumlah,
      products: product,
    };
    navigate('/checkout', { state: { cartItems: [item], totalAmount: product.harga * jumlah } });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>{product.nama_produk}</h2>
      <p><strong>Harga:</strong> Rp {Number(product.harga).toLocaleString()}</p>
      <p><strong>Stok:</strong> {product.stok}</p>
      <p><strong>Detail:</strong> {product.detail_produk}</p>

      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        {product.product_photos?.slice(0, 3).map((foto, index) => (
          <img
            key={foto.id || index}
            src={foto.url_foto}
            alt={`Foto ${index + 1}`}
            style={{
              width: '150px',
              height: '150px',
              objectFit: 'cover',
              borderRadius: '8px'
            }}
          />
        ))}
      </div>

      {/* Input Jumlah */}
      <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={decrease} disabled={jumlah === 1}>-</button>
        <span>{jumlah}</span>
        <button onClick={increase} disabled={jumlah === product.stok}>+</button>
      </div>

      {/* Action Buttons */}
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button
          className="button"
          onClick={handleAddToCart}
          disabled={product.stok === 0}
        >
          Add to Cart
        </button>
        <button
          className="button"
          onClick={handleBuyNow}
          disabled={product.stok === 0}
        >
          Beli Sekarang
        </button>
      </div>
    </div>
  );
};

export default ProductDetail;