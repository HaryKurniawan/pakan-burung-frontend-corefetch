import React, { useState, useEffect } from 'react';
import { useProducts } from '../../hooks/useProducts';
import ProductForm from '../../components/admin/ProductForm';
import AdminProductList from '../../components/admin/AdminProductList';
import './admin.css'

// Pakai langsung variabel dari .env
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const SUPABASE_HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

const AdminPanel = () => {
  const { products, createProduct, updateProduct, deleteProduct, loading } = useProducts();
  const [editingProduct, setEditingProduct] = useState(null);

  const [orders, setOrders] = useState([]);
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    fetchOrders();
    fetchStatuses();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=id,order_number,status_id`, {
        headers: SUPABASE_HEADERS
      });
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchStatuses = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/order_status?select=id,nama`, {
        headers: SUPABASE_HEADERS
      });
      const data = await response.json();
      setStatuses(data);
    } catch (error) {
      console.error('Error fetching statuses:', error);
    }
  };

  const handleStatusChange = async (orderId, newStatusId) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
        method: 'PATCH',
        headers: SUPABASE_HEADERS,
        body: JSON.stringify({ status_id: newStatusId })
      });

      if (!response.ok) throw new Error('Gagal update status');

      alert('Status berhasil diperbarui');
      fetchOrders();
    } catch (error) {
      console.error(error);
      alert('Gagal mengubah status');
    }
  };

  const handleProductSubmit = async (productData) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, productData);
      setEditingProduct(null);
    } else {
      await createProduct(productData);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (productId) => {
    await deleteProduct(productId);
  };

  return (
    <div className="admin-panel">
      <h2>Admin Panel</h2>

      {/* Bagian Kelola Status Pesanan */}
    <div className="admin-orders">
  <h3>Kelola Status Pesanan</h3>
  <div className="order-table-wrapper">
    <table className="order-table">
      <thead>
        <tr>
          <th>No. Pesanan</th>
          <th>Status Saat Ini</th>
          <th>Ubah Status</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id}>
            <td className="order-number">{order.order_number}</td>
            <td className="order-status">
              {statuses.find(s => s.id === order.status_id)?.nama || 'Tidak Diketahui'}
            </td>
            <td>
              <select
                className="status-select"
                value={order.status_id}
                onChange={(e) => handleStatusChange(order.id, parseInt(e.target.value))}
              >
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.nama}
                  </option>
                ))}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
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
};

export default AdminPanel;
