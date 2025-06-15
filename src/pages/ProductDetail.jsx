// pages/ProductDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { reviewsAPI } from '../services/api';
import { useCart } from '../hooks/useCart';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [jumlah, setJumlah] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState({ average: 0, count: 0 });
  const [userReview, setUserReview] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, ulasan: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  // Get current user from localStorage or context
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchProduct = async () => {
      const response = await api.get(`/products?id=eq.${id}&select=*,product_photos(*)`);
      setProduct(response.data?.[0]);
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchReviews();
      fetchAverageRating();
      if (currentUser.id) {
        fetchUserReview();
      }
    }
  }, [id, currentUser.id]);

  const fetchReviews = async () => {
    try {
      const reviewsData = await reviewsAPI.getProductReviews(id);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchAverageRating = async () => {
    try {
      const rating = await reviewsAPI.getProductAverageRating(id);
      setAverageRating(rating);
    } catch (error) {
      console.error('Error fetching average rating:', error);
    }
  };

  const fetchUserReview = async () => {
    try {
      const review = await reviewsAPI.getUserProductReview(currentUser.id, id);
      setUserReview(review);
      if (review) {
        setReviewForm({ rating: review.rating, ulasan: review.ulasan });
      }
    } catch (error) {
      console.error('Error fetching user review:', error);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!currentUser.id) {
      alert('Silakan login terlebih dahulu untuk memberikan ulasan');
      return;
    }

    setIsSubmittingReview(true);
    try {
      if (userReview) {
        // Update existing review
        await reviewsAPI.updateReview(userReview.id, reviewForm);
        alert('Ulasan berhasil diperbarui!');
      } else {
        // Create new review
        await reviewsAPI.createReview({
          user_id: currentUser.id,
          product_id: parseInt(id),
          ...reviewForm
        });
        alert('Ulasan berhasil ditambahkan!');
      }
      
      // Refresh data
      await fetchReviews();
      await fetchAverageRating();
      await fetchUserReview();
      setShowReviewForm(false);
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Gagal menyimpan ulasan');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview || !window.confirm('Yakin ingin menghapus ulasan Anda?')) return;

    try {
      await reviewsAPI.deleteReview(userReview.id);
      alert('Ulasan berhasil dihapus');
      
      // Refresh data
      await fetchReviews();
      await fetchAverageRating();
      setUserReview(null);
      setReviewForm({ rating: 5, ulasan: '' });
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Gagal menghapus ulasan');
    }
  };

  const renderStars = (rating, size = 16) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span 
          key={i} 
          style={{ 
            color: i <= rating ? '#ffd700' : '#ddd', 
            fontSize: `${size}px`,
            marginRight: '2px'
          }}
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
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Product Info Section */}
      <div style={{ marginBottom: '40px' }}>
        <h2>{product.nama_produk}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {renderStars(Math.round(averageRating.average), 20)}
            <span style={{ marginLeft: '8px', fontSize: '16px', color: '#666' }}>
              {averageRating.average.toFixed(1)} ({averageRating.count} ulasan)
            </span>
          </div>
        </div>
        <p><strong>Harga:</strong> Rp {Number(product.harga).toLocaleString()}</p>
        <p><strong>Stok:</strong> {product.stok}</p>
        <p><strong>Detail:</strong> {product.detail_produk}</p>

        {/* Updated Photo Display */}
        {productPhotos.length > 0 && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
            {productPhotos.map((photo, index) => (
              <img
                key={index}
                src={photo.url}
                alt={photo.label}
                style={{
                  width: '150px',
                  height: '150px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  border: '1px solid #ddd'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ))}
          </div>
        )}

        {/* Show message if no photos available */}
        {productPhotos.length === 0 && (
          <div style={{ 
            marginTop: '10px', 
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            textAlign: 'center',
            color: '#666'
          }}>
            Tidak ada foto produk tersedia
          </div>
        )}

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

      {/* Reviews Section */}
      <div style={{ borderTop: '1px solid #eee', paddingTop: '30px' }}>
        <h3>Ulasan Produk</h3>
        
        {/* Rating Summary */}
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#333' }}>
              {averageRating.average.toFixed(1)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '5px' }}>
              {renderStars(Math.round(averageRating.average), 20)}
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>
              {averageRating.count} ulasan
            </div>
          </div>
        </div>

        {/* User Review Form */}
        {currentUser.id && (
          <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
            {userReview ? (
              <div>
                <h4>Ulasan Anda</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  {renderStars(userReview.rating)}
                  <span>({userReview.rating}/5)</span>
                </div>
                <p style={{ marginBottom: '10px' }}>{userReview.ulasan}</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => setShowReviewForm(true)}
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={handleDeleteReview}
                    style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#dc3545', color: 'white' }}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h4>Berikan Ulasan</h4>
                <button 
                  onClick={() => setShowReviewForm(true)}
                  style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
                >
                  Tulis Ulasan
                </button>
              </div>
            )}

            {/* Review Form Modal */}
            {showReviewForm && (
              <div style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                backgroundColor: 'rgba(0,0,0,0.5)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{ 
                  backgroundColor: 'white', 
                  padding: '30px', 
                  borderRadius: '8px', 
                  width: '90%', 
                  maxWidth: '500px',
                  maxHeight: '80vh',
                  overflow: 'auto'
                }}>
                  <h4>{userReview ? 'Edit Ulasan' : 'Tulis Ulasan'}</h4>
                  <form onSubmit={handleSubmitReview}>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px' }}>Rating:</label>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                            style={{
                              background: 'none',
                              border: 'none',
                              fontSize: '24px',
                              color: star <= reviewForm.rating ? '#ffd700' : '#ddd',
                              cursor: 'pointer'
                            }}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px' }}>Ulasan:</label>
                      <textarea
                        value={reviewForm.ulasan}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, ulasan: e.target.value }))}
                        required
                        rows={4}
                        style={{ 
                          width: '100%', 
                          padding: '8px', 
                          border: '1px solid #ddd', 
                          borderRadius: '4px',
                          resize: 'vertical'
                        }}
                        placeholder="Tulis ulasan Anda tentang produk ini..."
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '4px' }}
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        style={{ 
                          padding: '8px 16px', 
                          backgroundColor: '#007bff', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px' 
                        }}
                      >
                        {isSubmittingReview ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reviews List */}
        <div>
          <h4>Semua Ulasan ({reviews.length})</h4>
          {reviews.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>Belum ada ulasan untuk produk ini.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {reviews.map((review) => (
                <div 
                  key={review.id} 
                  style={{ 
                    border: '1px solid #eee', 
                    borderRadius: '8px', 
                    padding: '15px' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <div>
                      <strong>{review.users?.nama || 'Anonymous'}</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                        {renderStars(review.rating)}
                        <span style={{ fontSize: '14px', color: '#666' }}>
                          ({review.rating}/5)
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#999' }}>
                      {new Date(review.tanggal).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <p style={{ margin: 0, lineHeight: '1.4' }}>{review.ulasan}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;