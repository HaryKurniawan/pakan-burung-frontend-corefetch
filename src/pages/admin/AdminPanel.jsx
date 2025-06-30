import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ navigate
import { Modal } from 'antd'; // ✅ modal konfirmasi
import { useAuth } from '../../context/AuthContext'; // ✅ auth context
import { useProducts } from '../../hooks/useProducts';
import ProductForm from '../../components/admin/ProductForm';
import AdminProductList from '../../components/admin/AdminProductList';
import OrderStatusManager from '../../components/admin/OrderStatusManager';
import LocationManagerrr from '../../components/admin/LocationManagerrr';
import VoucherManager from '../../components/admin/VoucherManager';
import './admin.css';

const AdminPanel = () => {
  const { products, createProduct, updateProduct, deleteProduct, loading, fetchProducts } = useProducts();
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const { logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'products', label: 'Kelola Produk', icon: '📦' },
    { id: 'locations', label: 'Kelola Lokasi', icon: '📍' },
    { id: 'orders', label: 'Status Pesanan', icon: '📋' },
    { id: 'vouchers', label: 'Kelola Voucher', icon: '🎫' },
  ];

  const handleLogout = () => {
    Modal.confirm({
      title: 'Konfirmasi Logout',
      content: 'Apakah Anda yakin ingin logout?',
      okText: 'Ya',
      cancelText: 'Batal',
      onOk() {
        logout();
        navigate('/');
      },
    });
  };

  const handleProductSubmit = async (productData) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        alert('Produk berhasil diperbarui!');
        setEditingProduct(null);
      } else {
        await createProduct(productData);
        alert('Produk berhasil ditambahkan!');
      }

      if (fetchProducts) {
        await fetchProducts();
      }
    } catch (error) {
      alert('Gagal menyimpan produk: ' + error.message);
    }
  };

  const handleEditProduct = (product) => {
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
        if (fetchProducts) await fetchProducts();
      }
    } catch (error) {
      alert('Gagal menghapus produk: ' + error.message);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'products':
        return (
          <div className="admin-content">
            <div className="content-header">
              <h2>Kelola Produk</h2>
              <p>Tambah, edit, dan hapus produk yang tersedia</p>
            </div>
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
          </div>
        );
      case 'locations':
        return (
          <div className="admin-content">
            <div className="content-header">
              <h2>Kelola Lokasi</h2>
              <p>Atur lokasi pengiriman dan wilayah layanan</p>
            </div>
            <LocationManagerrr />
          </div>
        );
      case 'orders':
        return (
          <div className="admin-content">
            <div className="content-header">
              <h2>Status Pesanan</h2>
              <p>Kelola dan update status pesanan pelanggan</p>
            </div>
            <OrderStatusManager />
          </div>
        );
      case 'vouchers':
        return (
          <div className="admin-content">
            <div className="content-header">
              <h2>Kelola Voucher</h2>
              <p>Buat dan kelola voucher diskon untuk pelanggan</p>
            </div>
            <VoucherManager />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="modern-admin-panel">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <h3>Admin Panel</h3>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-button">
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        {renderContent()}
      </div>

      <style jsx>{`
        .modern-admin-panel {
          display: flex;
          min-height: 100vh;
          background-color: #f8fafc;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .admin-sidebar {
          width: 280px;
          background: white;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          position: fixed;
          height: 100vh;
          left: 0;
          top: 0;
          z-index: 100;
          box-shadow: 2px 0 4px rgba(0, 0, 0, 0.02);
        }

        .sidebar-header {
          padding: 24px 20px;
          border-bottom: 1px solid #e2e8f0;
        }

        .sidebar-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #1a202c;
        }

        .sidebar-nav {
          flex: 1;
          padding: 16px 0;
        }

        .nav-item {
          width: 100%;
          display: flex;
          align-items: center;
          padding: 14px 20px;
          border: none;
          background: none;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          color: #64748b;
          font-size: 15px;
          font-weight: 500;
          border-radius: 0;
          position: relative;
        }

        .nav-item:hover {
          background-color: #f1f5f9;
          color: #334155;
        }

        .nav-item.active {
          background-color: #475569;
          color: white;
          font-weight: 600;
        }

        .nav-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 4px;
          background-color: #1e293b;
        }

        .nav-icon {
          margin-right: 12px;
          font-size: 16px;
          width: 20px;
          text-align: center;
        }

        .nav-label {
          flex: 1;
        }

        .sidebar-footer {
          padding: 16px 0;
          border-top: 1px solid #e2e8f0;
        }

        .logout-button {
          width: 100%;
          display: flex;
          align-items: center;
          padding: 14px 20px;
          border: none;
          background: none;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          color: #ef4444;
          font-size: 15px;
          font-weight: 500;
        }

        .logout-button:hover {
          background-color: #fef2f2;
          color: #dc2626;
        }

        .admin-main {
          flex: 1;
          margin-left: 280px;
          padding: 32px;
          max-width: calc(100vw - 280px);
          overflow-x: auto;
        }

        .admin-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .content-header {
          margin-bottom: 32px;
        }

        .content-header h2 {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 700;
          color: #1a202c;
        }

        .content-header p {
          margin: 0;
          color: #64748b;
          font-size: 16px;
        }

        /* Override untuk komponen antd */
        :global(.ant-modal-confirm .ant-modal-confirm-btns .ant-btn-primary) {
          background-color: #475569 !important;
          border-color: #475569 !important;
        }

        :global(.ant-modal-confirm .ant-modal-confirm-btns .ant-btn-primary:hover) {
          background-color: #334155 !important;
          border-color: #334155 !important;
        }

        /* Override untuk button dan form elements global */
        :global(.admin-content button[type="submit"]) {
          background-color: #475569 !important;
          border-color: #475569 !important;
          color: white !important;
        }

        :global(.admin-content button[type="submit"]:hover) {
          background-color: #334155 !important;
          border-color: #334155 !important;
        }

        :global(.admin-content .ant-btn-primary) {
          background-color: #475569 !important;
          border-color: #475569 !important;
        }

        :global(.admin-content .ant-btn-primary:hover) {
          background-color: #334155 !important;
          border-color: #334155 !important;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .admin-sidebar {
            width: 260px;
          }
          
          .admin-main {
            margin-left: 260px;
            padding: 24px;
            max-width: calc(100vw - 260px);
          }
        }

        @media (max-width: 768px) {
          .admin-sidebar {
            width: 240px;
          }
          
          .admin-main {
            margin-left: 240px;
            padding: 16px;
            max-width: calc(100vw - 240px);
          }
          
          .content-header h2 {
            font-size: 24px;
          }
          
          .nav-item {
            padding: 12px 16px;
            font-size: 14px;
          }
          
          .sidebar-header {
            padding: 20px 16px;
          }
          
          .logout-button {
            padding: 12px 16px;
            font-size: 14px;
          }
        }

        @media (max-width: 640px) {
          .admin-sidebar {
            width: 70px;
          }
          
          .admin-main {
            margin-left: 70px;
            max-width: calc(100vw - 70px);
          }
          
          .nav-label,
          .sidebar-header h3 {
            display: none;
          }
          
          .nav-item {
            justify-content: center;
            padding: 12px 8px;
          }
          
          .nav-icon {
            margin-right: 0;
          }
          
          .sidebar-header {
            padding: 16px 8px;
            text-align: center;
          }
          
          .logout-button {
            justify-content: center;
            padding: 12px 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;