import React, { useState, useEffect } from 'react';

const ProductForm = ({ onSubmit, editingProduct, onCancelEdit, loading }) => {
  const [formData, setFormData] = useState({
    nama_produk: '',
    harga: '',
    stok: '',
    detail_produk: ''
  });

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        nama_produk: editingProduct.nama_produk,
        harga: editingProduct.harga.toString(),
        stok: editingProduct.stok.toString(),
        detail_produk: editingProduct.detail_produk
      });
    } else {
      setFormData({
        nama_produk: '',
        harga: '',
        stok: '',
        detail_produk: ''
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
      detail_produk: ''
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
      detail_produk: ''
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