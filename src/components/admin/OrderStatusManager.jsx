import React, { useState, useEffect } from 'react';
import '../styles/OrderStatusManager.css'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

const SUPABASE_HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

const OrderStatusManager = () => {
  const [orders, setOrders] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Hitung jumlah orders per status
  const getOrderCountByStatus = (statusId) => {
    return orders.filter(order => order.status_id === statusId).length;
  };

  // Filter orders berdasarkan status dan search query
  const filteredOrders = orders.filter(order => {
    // Filter berdasarkan status
    const statusMatch = filterStatus === 'all' || order.status_id === parseInt(filterStatus);
    
    // Filter berdasarkan search query (case insensitive)
    const searchMatch = searchQuery === '' || 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase());
    
    return statusMatch && searchMatch;
  });

  // Filter status untuk tombol - kecualikan status "Selesai" dan yang serupa
  const getFilterableStatuses = () => {
    return statuses.filter(status => 
      !status.nama.toLowerCase().includes('selesai') &&
      !status.nama.toLowerCase().includes('complete') &&
      !status.nama.toLowerCase().includes('done')
    );
  };

  // Handler untuk clear search
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Handler untuk paste dari clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setSearchQuery(text.trim());
    } catch (error) {
      console.error('Gagal mengambil data dari clipboard:', error);
      alert('Gagal mengambil data dari clipboard. Pastikan browser mendukung fitur ini.');
    }
  };

  return (
    <div className="admin-orders">
      {/* Search Bar */}
      <div className="search-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Cari berdasarkan No. Pesanan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button 
              onClick={handleClearSearch}
              className="clear-search-btn"
              title="Hapus pencarian"
            >
              ×
            </button>
          )}
        </div>
        <button 
          onClick={handlePaste}
          className="paste-btn"
          title="Paste dari clipboard"
        >
          📋 Paste
        </button>
      </div>

      {/* Filter Status dengan Button */}
      <div className="filter-section">
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            Semua Status
          </button>
          {getFilterableStatuses().map((status) => (
            <button 
              key={status.id}
              className={`filter-btn ${filterStatus === status.id.toString() ? 'active' : ''}`}
              onClick={() => setFilterStatus(status.id.toString())}
            >
              {status.nama} ({getOrderCountByStatus(status.id)})
            </button>
          ))}
        </div>
      </div>

      <div className="order-table-wrapper">
        <table className="order-table">
          <thead>
            <tr className='order-th'>
              <th>No. Pesanan</th>
              <th>Status Saat Ini</th>
              <th>Ubah Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
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
              ))
            ) : (
              <tr>
                <td colSpan="3" className="no-results">
                  {searchQuery ? 
                    `Tidak ditemukan pesanan dengan nomor "${searchQuery}"` : 
                    'Tidak ada data pesanan'
                  }
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderStatusManager;