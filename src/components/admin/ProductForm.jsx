import React, { useState, useEffect } from 'react';
import './ProductForm.css'

const ProductForm = ({ onSubmit, editingProduct, onCancelEdit, loading }) => {
  const [formData, setFormData] = useState({
    nama_produk: '',
    harga: '',
    stok: '',
    detail_produk: '',
    url_foto: '',
    url_foto_1: '',
    url_foto_2: ''
  });

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        nama_produk: editingProduct.nama_produk,
        harga: editingProduct.harga.toString(),
        stok: editingProduct.stok.toString(),
        detail_produk: editingProduct.detail_produk,
        url_foto: editingProduct.product_photos?.[0]?.url_foto || '',
        url_foto_1: editingProduct.product_photos?.[0]?.url_foto_1 || '',
        url_foto_2: editingProduct.product_photos?.[0]?.url_foto_2 || ''
      });
    } else {
      setFormData({
        nama_produk: '',
        harga: '',
        stok: '',
        detail_produk: '',
        url_foto: '',
        url_foto_1: '',
        url_foto_2: ''
      });
    }
  }, [editingProduct]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData({
      nama_produk: '',
      harga: '',
      stok: '',
      detail_produk: '',
      url_foto: '',
      url_foto_1: '',
      url_foto_2: ''
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCancel = () => {
    onCancelEdit();
    setFormData({
      nama_produk: '',
      harga: '',
      stok: '',
      detail_produk: '',
      url_foto: '',
      url_foto_1: '',
      url_foto_2: ''
    });
  };

  return (
    <div>
      <h3>Add/Edit Product</h3>
      <form onSubmit={handleSubmit}>
        <input
          className="input"
          type="text"
          name="nama_produk"
          placeholder="Product Name"
          value={formData.nama_produk}
          onChange={handleChange}
          required
        />
        <input
          className="input"
          type="number"
          name="harga"
          placeholder="Price"
          value={formData.harga}
          onChange={handleChange}
          required
        />
        <input
          className="input"
          type="number"
          name="stok"
          placeholder="Stock"
          value={formData.stok}
          onChange={handleChange}
          required
        />
        <textarea
          className="textarea"
          name="detail_produk"
          placeholder="Product Description"
          value={formData.detail_produk}
          onChange={handleChange}
          required
        />
        
        {/* Photo URL Fields */}
        <div className="photo-section">
          <h4>Product Photos</h4>
          <input
            className="input"
            type="url"
            name="url_foto"
            placeholder="Main Photo URL"
            value={formData.url_foto}
            onChange={handleChange}
          />
          <input
            className="input"
            type="url"
            name="url_foto_1"
            placeholder="Additional Photo URL 1"
            value={formData.url_foto_1}
            onChange={handleChange}
          />
          <input
            className="input"
            type="url"
            name="url_foto_2"
            placeholder="Additional Photo URL 2"
            value={formData.url_foto_2}
            onChange={handleChange}
          />
        </div>

        {/* Photo Preview */}
        {(formData.url_foto || formData.url_foto_1 || formData.url_foto_2) && (
          <div className="photo-preview">
            <h4>Photo Preview</h4>
            <div className="preview-grid">
              {formData.url_foto && (
                <div className="preview-item">
                  <img src={formData.url_foto} alt="Main preview" />
                  <span>Main Photo</span>
                </div>
              )}
              {formData.url_foto_1 && (
                <div className="preview-item">
                  <img src={formData.url_foto_1} alt="Additional preview 1" />
                  <span>Photo 1</span>
                </div>
              )}
              {formData.url_foto_2 && (
                <div className="preview-item">
                  <img src={formData.url_foto_2} alt="Additional preview 2" />
                  <span>Photo 2</span>
                </div>
              )}
            </div>
          </div>
        )}

        <button className="button" type="submit" disabled={loading}>
          {loading ? 'Loading...' : editingProduct ? 'Update Product' : 'Add Product'}
        </button>
        {editingProduct && (
          <button 
            className="button secondary"
            type="button"
            onClick={handleCancel}
          >
            Cancel Edit
          </button>
        )}
      </form>
    </div>
  );
};

export default ProductForm;