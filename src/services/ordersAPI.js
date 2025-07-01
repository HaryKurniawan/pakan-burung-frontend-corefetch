import { api } from './baseApi.js';

function generateOrderNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `ORD-${year}${month}${day}-${hours}${minutes}${seconds}`;
}

export const ordersAPI = {
  // Updated createOrder method to handle voucher data
  createOrder: async (orderData) => {
    try {
      // Create main order with voucher information
      const orderPayload = {
        user_id: orderData.userId,
        total_amount: orderData.totalAmount, // Final amount after discount
        original_amount: orderData.originalAmount || orderData.totalAmount, // Original amount before discount
        discount_amount: orderData.discountAmount || 0, // Discount amount
        voucher_id: orderData.voucherId || null, // Voucher ID if applied
        voucher_code: orderData.voucherCode || null, // Voucher code for reference
        shipping_address_id: orderData.shippingAddressId,
        notes: orderData.notes || null,
        order_number: generateOrderNumber(), // Generate unique order number
        created_at: new Date().toISOString()
      };

      const response = await api.post('/orders', orderPayload);
      const order = response.data[0];
      
      // Add order items
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.jumlah,
        price: item.products.harga,
        subtotal: item.products.harga * item.jumlah
      }));
      
      await api.post('/order_items', orderItems);
      
      // Add initial tracking record
      await api.post('/order_tracking', {
        order_id: order.id,
        status_id: 1, // pending
        notes: 'Pesanan dibuat',
        created_by: orderData.userId
      });
      
      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Get user orders
  getUserOrders: async (userId) => {
    const response = await api.get(`/orders?user_id=eq.${userId}&select=*,order_status(*),user_addresses(*,provinsi(*),kota_kabupaten(*),kecamatan(*)),order_items(*,products(*))&order=created_at.desc`);
    return response.data;
  },

  // Get all orders (admin)
  getAllOrders: async () => {
    const response = await api.get('/orders?select=*,users(username,nama_lengkap),order_status(*),user_addresses(*),order_items(*,products(*))&order=created_at.desc');
    return response.data;
  },

  // Get order by ID
  getOrderById: async (orderId) => {
    const response = await api.get(`/orders?id=eq.${orderId}&select=*,users(*),order_status(*),user_addresses(*,provinsi(*),kota_kabupaten(*),kecamatan(*)),order_items(*,products(*))`);
    return response.data[0];
  },

  // Update order status
  updateOrderStatus: async (orderId, statusId, notes, updatedBy) => {
    // Update order status
    await api.patch(`/orders?id=eq.${orderId}`, {
      status_id: statusId,
      updated_at: new Date().toISOString()
    });
    
    // Add tracking record
    await api.post('/order_tracking', {
      order_id: orderId,
      status_id: statusId,
      notes: notes || '',
      created_by: updatedBy
    });
  },

  // Get order tracking history
  getOrderTracking: async (orderId) => {
    const response = await api.get(`/order_tracking?order_id=eq.${orderId}&select=*,order_status(*),users(username,nama_lengkap)&order=created_at.desc`);
    return response.data;
  },

  // Get order statuses
  getOrderStatuses: async () => {
    const response = await api.get('/order_status?select=*&order=id.asc');
    return response.data;
  },

  // Cancel order with stock restoration
  cancelOrder: async (orderId, userId, reason) => {
    try {
      // Get order details with items
      const order = await ordersAPI.getOrderById(orderId);
      
      if (!order) {
        throw new Error('Pesanan tidak ditemukan');
      }

      // Check if order can be cancelled (not already cancelled or completed)
      const cancellableStatuses = [1, 2, 3]; // pending, confirmed, processing
      if (!cancellableStatuses.includes(order.status_id)) {
        throw new Error('Pesanan tidak dapat dibatalkan pada status ini');
      }

      // Get current products data
      const products = await productsAPI.getAll();
      
      // Restore stock for each order item
      for (const orderItem of order.order_items) {
        const currentProduct = products.find(p => p.id === orderItem.product_id);
        
        if (currentProduct) {
          // Add back the quantity to current stock
          const newStock = currentProduct.stok + orderItem.quantity;
          await productsAPI.updateStock(orderItem.product_id, newStock);
          
          console.log(`Stock restored for product ${currentProduct.nama_produk}: +${orderItem.quantity} (${currentProduct.stok} → ${newStock})`);
        }
      }

      // Update order status to cancelled
      const cancelStatusId = 6; // cancelled
      await ordersAPI.updateOrderStatus(
        orderId, 
        cancelStatusId, 
        `Dibatalkan: ${reason}. Stok telah dikembalikan.`, 
        userId
      );

      return {
        success: true,
        message: 'Pesanan berhasil dibatalkan dan stok telah dikembalikan'
      };

    } catch (error) {
      console.error('Error cancelling order:', error);
      throw new Error(`Gagal membatalkan pesanan: ${error.message}`);
    }
  },

  // Helper function to restore stock (can be used for other scenarios)
  restoreOrderStock: async (orderId) => {
    try {
      const order = await ordersAPI.getOrderById(orderId);
      
      if (!order) {
        throw new Error('Pesanan tidak ditemukan');
      }

      const products = await productsAPI.getAll();
      
      for (const orderItem of order.order_items) {
        const currentProduct = products.find(p => p.id === orderItem.product_id);
        
        if (currentProduct) {
          const newStock = currentProduct.stok + orderItem.quantity;
          await productsAPI.updateStock(orderItem.product_id, newStock);
        }
      }

      return true;
    } catch (error) {
      console.error('Error restoring order stock:', error);
      throw error;
    }
  }
};
