import axios from 'axios';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

const api = axios.create({
  baseURL: `${supabaseUrl}/rest/v1`,
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }
});

// Auth API
export const authAPI = {
  login: async (credentials) => {
    const response = await api.get(
      `/users?username=eq.${credentials.username}&password=eq.${credentials.password}&select=*`
    );
    
    if (response.data.length === 0) {
      throw new Error('Invalid credentials');
    }
    
    return response.data[0];
  },

  register: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data[0];
  },

  updateProfile: async (userId, userData) => {
    const response = await api.patch(`/users?id=eq.${userId}`, userData);
    return response.data[0];
  }
};

// Address API
export const addressAPI = {
  // Get all provinces
  getProvinsi: async () => {
    const response = await api.get('/provinsi?select=*');
    return response.data;
  },

  // Get kota/kabupaten by provinsi
  getKotaKabupaten: async (provinsiId) => {
    const response = await api.get(`/kota_kabupaten?provinsi_id=eq.${provinsiId}&select=*`);
    return response.data;
  },

  // Get kecamatan by kota/kabupaten
  getKecamatan: async (kotaKabupatenId) => {
    const response = await api.get(`/kecamatan?kota_kabupaten_id=eq.${kotaKabupatenId}&select=*`);
    return response.data;
  },

  // Get user addresses
  getUserAddresses: async (userId) => {
    const response = await api.get(`/user_addresses?user_id=eq.${userId}&select=*,provinsi(*),kota_kabupaten(*),kecamatan(*)`);
    return response.data;
  },

  // Add new address
  addAddress: async (addressData) => {
    const response = await api.post('/user_addresses', addressData);
    return response.data[0];
  },

  // Update address
  updateAddress: async (addressId, addressData) => {
    const response = await api.patch(`/user_addresses?id=eq.${addressId}`, addressData);
    return response.data[0];
  },

  // Delete address
  deleteAddress: async (addressId) => {
    await api.delete(`/user_addresses?id=eq.${addressId}`);
  },

  // Set primary address
  setPrimaryAddress: async (userId, addressId) => {
    // Reset all addresses to non-primary
    await api.patch(`/user_addresses?user_id=eq.${userId}`, { is_primary: false });
    // Set selected address as primary
    await api.patch(`/user_addresses?id=eq.${addressId}`, { is_primary: true });
  }
};


// Tambahkan ini ke file api.js Anda

/// Orders API with stock restoration on cancellation
export const ordersAPI = {
  // Create new order
  createOrder: async (orderData) => {
    const response = await api.post('/orders', {
      user_id: orderData.userId,
      total_amount: orderData.totalAmount,
      shipping_address_id: orderData.shippingAddressId,
      notes: orderData.notes || null
    });
    
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

export const reviewsAPI = {
  // Create new review
  createReview: async (reviewData) => {
    const response = await api.post('/reviews', {
      user_id: reviewData.user_id,
      product_id: reviewData.product_id,
      rating: reviewData.rating,
      ulasan: reviewData.ulasan,
      tanggal: new Date().toISOString()
    });
    return response.data[0];
  },

  // Update existing review
  updateReview: async (reviewId, reviewData) => {
    const response = await api.patch(`/reviews?id=eq.${reviewId}`, {
      rating: reviewData.rating,
      ulasan: reviewData.ulasan,
      tanggal: new Date().toISOString()
    });
    return response.data[0];
  },

  // Get user's review for a specific product
  getUserProductReview: async (userId, productId) => {
    const response = await api.get(
      `/reviews?user_id=eq.${userId}&product_id=eq.${productId}&select=*`
    );
    return response.data[0] || null;
  },

  // Get all reviews for a product
  getProductReviews: async (productId) => {
    const response = await api.get(
      `/reviews?product_id=eq.${productId}&select=*,users(nama,username)&order=tanggal.desc`
    );
    return response.data;
  },

  // Get user's all reviews
  getUserReviews: async (userId) => {
    const response = await api.get(
      `/reviews?user_id=eq.${userId}&select=*,products(nama_produk)&order=tanggal.desc`
    );
    return response.data;
  },

  // Delete review
  deleteReview: async (reviewId) => {
    await api.delete(`/reviews?id=eq.${reviewId}`);
  },

  // Get average rating for a product
  getProductAverageRating: async (productId) => {
    const response = await api.get(
      `/reviews?product_id=eq.${productId}&select=rating`
    );
    
    if (response.data.length === 0) {
      return { average: 0, count: 0 };
    }
    
    const ratings = response.data.map(review => review.rating);
    const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    
    return {
      average: Math.round(average * 10) / 10, // Round to 1 decimal place
      count: ratings.length
    };
  }
};

// Products API
export const productsAPI = {
  getAll: async () => {
    const response = await api.get('/products?select=*,product_photos(*)&order=id.asc');
    return response.data || [];
  },

  create: async (productData) => {
    // Extract photo data from productData
    const { url_foto, url_foto_1, url_foto_2, ...productFields } = productData;
    
    // Create the product first
    const productResponse = await api.post('/products', productFields);
    const newProduct = productResponse.data[0];

    // If there are photo URLs, create the product_photos record
    if (url_foto || url_foto_1 || url_foto_2) {
      const photoData = {
        product_id: newProduct.id,
        url_foto: url_foto || null,
        url_foto_1: url_foto_1 || null,
        url_foto_2: url_foto_2 || null
      };

      await api.post('/product_photos', photoData);
    }

    return newProduct;
  },

  update: async (productId, productData) => {
    try {
      // Extract photo data from productData
      const { url_foto, url_foto_1, url_foto_2, ...productFields } = productData;
      
      console.log('Updating product:', productId, productFields);
      console.log('Photo data:', { url_foto, url_foto_1, url_foto_2 });
      
      // Update the product first
      const productResponse = await api.patch(`/products?id=eq.${productId}`, productFields);
      console.log('Product updated:', productResponse);
      
      // Handle photo updates - always try to update photos
      // Check if product_photos record exists
      const existingPhotosResponse = await api.get(`/product_photos?product_id=eq.${productId}`);
      console.log('Existing photos:', existingPhotosResponse.data);
      
      const photoData = {
        url_foto: url_foto || '',
        url_foto_1: url_foto_1 || '',
        url_foto_2: url_foto_2 || ''
      };

      if (existingPhotosResponse.data && existingPhotosResponse.data.length > 0) {
        // Update existing photo record
        console.log('Updating existing photos with:', photoData);
        const photoUpdateResponse = await api.patch(`/product_photos?product_id=eq.${productId}`, photoData);
        console.log('Photos updated:', photoUpdateResponse);
      } else {
        // Create new photo record
        console.log('Creating new photo record');
        const newPhotoData = {
          product_id: productId,
          ...photoData
        };
        const photoCreateResponse = await api.post('/product_photos', newPhotoData);
        console.log('Photos created:', photoCreateResponse);
      }

      return productResponse.data?.[0] || productResponse.data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  delete: async (productId) => {
    // Delete related photos first (if any)
    await api.delete(`/product_photos?product_id=eq.${productId}`);
    // Then delete the product
    await api.delete(`/products?id=eq.${productId}`);
  },

  updateStock: async (productId, newStock) => {
    await api.patch(`/products?id=eq.${productId}`, { stok: newStock });
  }
};

// Cart API
export const cartAPI = {
  getCart: async (userId) => {
    const cartResponse = await api.get(`/carts?user_id=eq.${userId}&select=id`);
    const cartData = cartResponse.data[0];

    if (cartData) {
      const cartItemsResponse = await api.get(
        `/cart_items?cart_id=eq.${cartData.id}&select=*,products(*)`
      );
      return cartItemsResponse.data || [];
    }
    
    return [];
  },

  addToCart: async (userId, productId, jumlah = 1) => {
    let cartResponse = await api.get(`/carts?user_id=eq.${userId}&select=id`);
    let cartData = cartResponse.data[0];

    if (!cartData) {
      const newCartResponse = await api.post('/carts', { user_id: userId });
      cartData = newCartResponse.data[0];
    }

    const existingItemResponse = await api.get(
      `/cart_items?cart_id=eq.${cartData.id}&product_id=eq.${productId}&select=*`
    );
    const existingItem = existingItemResponse.data[0];

    if (existingItem) {
      await api.patch(`/cart_items?id=eq.${existingItem.id}`, {
        jumlah: existingItem.jumlah + jumlah
      });
    } else {
      await api.post('/cart_items', {
        cart_id: cartData.id,
        product_id: productId,
        jumlah: jumlah
      });
    }
  },

  removeFromCart: async (cartItemId) => {
    await api.delete(`/cart_items?id=eq.${cartItemId}`);
  },

  clearCart: async (userId) => {
    const cartResponse = await api.get(`/carts?user_id=eq.${userId}&select=id`);
    const cartData = cartResponse.data[0];

    if (cartData) {
      await api.delete(`/cart_items?cart_id=eq.${cartData.id}`);
    }
  }
};

export default api;