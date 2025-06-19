// pages/ProductDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { reviewsAPI } from '../services/api';
import { useCart } from '../hooks/useCart';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [jumlah, setJumlah] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState({ average: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products?id=eq.${id}&select=*,product_photos(*)`);
        setProduct(response.data?.[0]);
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchProductReviews();
    }
  }, [id]);

  const fetchProductReviews = async () => {
    try {
      setLoading(true);
      // Use the new API method to get product reviews from orders
      const reviewsData = await reviewsAPI.getProductReviewsFromOrders(parseInt(id));
      setReviews(reviewsData);
      
      // Calculate average rating
      if (reviewsData.length > 0) {
        const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
        const average = totalRating / reviewsData.length;
        setAverageRating({
          average: average,
          count: reviewsData.length
        });
      } else {
        setAverageRating({ average: 0, count: 0 });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
      setAverageRating({ average: 0, count: 0 });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating, size = 16) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span 
          key={i} 
          className={`star ${i <= rating ? 'star-gold' : 'star-gray'}`}
          style={{ fontSize: `${size}px` }}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  // Function to get all available photos from product_photos
  const getProductPhotos = () => {
    if (!product?.product_photos?.[0]) return [];
    
    const photos = [];
    const photoData = product.product_photos[0];
    
    // Add photos in order if they exist
    if (photoData.url_foto) {
      photos.push({ url: photoData.url_foto, label: 'Foto 1' });
    }
    if (photoData.url_foto_1) {
      photos.push({ url: photoData.url_foto_1, label: 'Foto 2' });
    }
    if (photoData.url_foto_2) {
      photos.push({ url: photoData.url_foto_2, label: 'Foto 3' });
    }
    
    return photos;
  };

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
  };

  const handleBuyNow = () => {
    const item = {
      product_id: product.id,
      jumlah,
      products: product,
    };
    navigate('/checkout', { state: { cartItems: [item], totalAmount: product.harga * jumlah } });
  };

  // Get available photos
  const productPhotos = getProductPhotos();

  return (
    <div className="product-detail-container">
      {/* Product Info Section */}
      <div className="product-info-section">
        

        {/* Updated Photo Display */}
        {productPhotos.length > 0 && (
          <div className="photos-container">
            {productPhotos.map((photo, index) => (
              <img
                key={index}
                src={photo.url}
                alt={photo.label}
                className="product-photo"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ))}
          </div>
        )}

        <h2 className="product-title">{product.nama_produk}</h2>
        <p className="product-price">Rp {Number(product.harga).toLocaleString()}</p>
        <div className="rating-container">
          <div className="rating-display">
            {renderStars(Math.round(averageRating.average), 20)}
            <span className="rating-text">
              {averageRating.average.toFixed(1)} ({averageRating.count} ulasan)
            </span>
          </div>
        </div>
        <p className="product-stock"><strong>Stok:</strong> {product.stok}</p>
        <p className="product-detail"><strong>Detail:</strong> {product.detail_produk}</p>

        {/* Show message if no photos available */}
        {productPhotos.length === 0 && (
          <div className="no-photos-message">
            Tidak ada foto produk tersedia
          </div>
        )}

        {/* Input Jumlah */}
        <div className="quantity-controls">
          <button 
            className="quantity-button" 
            onClick={decrease} 
            disabled={jumlah === 1}
          >
            -
          </button>
          <span className="quantity-display">{jumlah}</span>
          <button 
            className="quantity-button" 
            onClick={increase} 
            disabled={jumlah === product.stok}
          >
            +
          </button>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
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

      {/* Reviews Section - Display Only */}
      <div className="reviews-section">
        <h3 className="reviews-title">Ulasan Produk</h3>
        
        {/* Loading state for reviews */}
        {loading ? (
          <p className="loading-reviews">Memuat ulasan...</p>
        ) : (
          <>
            {/* Rating Summary */}
            <div className="rating-summary">
              <div className="rating-summary-content">
                <div className="average-rating-number">
                  {averageRating.average.toFixed(1)}
                </div>
                <div className="average-rating-stars">
                  {renderStars(Math.round(averageRating.average), 20)}
                </div>
                <div className="rating-count">
                  {averageRating.count} ulasan
                </div>
              </div>
            </div>

            {/* Reviews List */}
            <div>
              <h4 className="reviews-list-title">Semua Ulasan ({reviews.length})</h4>
              {reviews.length === 0 ? (
                <p className="no-reviews">Belum ada ulasan untuk produk ini.</p>
              ) : (
                <div className="reviews-list">
                  {reviews.map((review) => {
                    // Find the specific product in the order items
                    const productInOrder = review.orders?.order_items?.find(item => 
                      item.product_id === parseInt(id)
                    );
                    
                    return (
                      <div key={review.id} className="review-item">
                        <div className="review-header">
                          <div className="review-user-info">
                            <div className="review-username">
                              {review.users?.nama || 'Anonymous'}
                            </div>
                            <div className="review-rating">
                              {renderStars(review.rating)}
                              <span className="review-rating-text">
                                ({review.rating}/5)
                              </span>
                            </div>
                            {/* Show quantity purchased if available */}
                            {productInOrder && (
                              <div className="review-quantity">
                                Membeli {productInOrder.quantity} item
                              </div>
                            )}
                          </div>
                          <span className="review-date">
                            {new Date(review.tanggal).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                        <p className="review-text">{review.ulasan}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;