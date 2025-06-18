import React, { useState } from 'react';
import { useProducts } from '../../hooks/useProducts';
import ProductForm from '../../components/admin/ProductForm';
import AdminProductList from '../../components/admin/AdminProductList';
import OrderStatusManager from '../../components/admin/OrderStatusManager';
import LocationManagerrr from '../../components/admin/LocationManagerrr';
import VoucherManager from '../../components/admin/VoucherManager';
import './admin.css'

const AdminPanel = () => {
  const { products, createProduct, updateProduct, deleteProduct, loading, fetchProducts } = useProducts();
  const [editingProduct, setEditingProduct] = useState(null);

  const handleProductSubmit = async (productData) => {
    try {
      console.log('Submitting product data:', productData);
      
      if (editingProduct) {
        console.log('Updating product with ID:', editingProduct.id);
        await updateProduct(editingProduct.id, productData);
        alert('Produk berhasil diperbarui!');
        setEditingProduct(null);
      } else {
        console.log('Creating new product');
        await createProduct(productData);
        alert('Produk berhasil ditambahkan!');
      }

      // Force refresh products list
      if (fetchProducts) {
        await fetchProducts();
      }
      
    } catch (error) {
      console.error('Error submitting product:', error);
      alert('Gagal menyimpan produk: ' + error.message);
    }
  };

  const handleEditProduct = (product) => {
    console.log('Editing product:', product);
    setEditingProduct(product);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (productId) => {
    try {
      if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
        await deleteProduct(productId);
        alert('Produk berhasil dihapus!');
        
        // Force refresh products list
        if (fetchProducts) {
          await fetchProducts();
        }
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Gagal menghapus produk: ' + error.message);
    }
  };

  return (
    <div className="admin-panel">
      {/* Komponen Kelola Produk */}
      <ProductForm 
        onSubmit={handleProductSubmit}
        editingProduct={editingProduct}
        onCancelEdit={handleCancelEdit}
        loading={loading}
      />

      <AdminProductList 
        products={products}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
      />

      {/* Komponen Kelola Lokasi */}
      <LocationManagerrr />
      
      {/* Komponen Kelola Status Pesanan */}
      <OrderStatusManager />
      
      {/* Komponen Kelola Voucher */}
      <VoucherManager />
    </div>
  );
};

export default AdminPanel;