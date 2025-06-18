import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

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


// Storage API for file uploads

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Storage API using Supabase client - RECOMMENDED APPROACH
export const storageAPI = {
  // Upload file to Supabase Storage
  uploadFile: async (file, fileName) => {
    try {
      const { data, error } = await supabase.storage
        .from('product-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-photos')
        .getPublicUrl(fileName);

      return { 
        success: true, 
        url: publicUrl, 
        path: fileName,
        data: data 
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  // Delete file from Supabase Storage
  deleteFile: async (fileName) => {
    try {
      const { data, error } = await supabase.storage
        .from('product-photos')
        .remove([fileName]);

      if (error) {
        console.error('Supabase delete error:', error);
        throw new Error(`Delete failed: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  },

  // Generate unique filename
  generateFileName: (originalName, productId = null) => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    const baseName = originalName.split('.')[0].replace(/[^a-zA-Z0-9]/g, '');
    
    if (productId) {
      return `product_${productId}_${timestamp}_${randomStr}.${extension}`;
    }
    
    return `${baseName}_${timestamp}_${randomStr}.${extension}`;
  },

  // Get file path from URL
  getFilePathFromUrl: (url) => {
    if (!url) return null;
    const publicUrlBase = `${supabaseUrl}/storage/v1/object/public/product-photos/`;
    return url.replace(publicUrlBase, '');
  },

  // List files in bucket (bonus utility)
  listFiles: async () => {
    try {
      const { data, error } = await supabase.storage
        .from('product-photos')
        .list('', {
          limit: 100,
          offset: 0
        });

      if (error) {
        throw new Error(`List failed: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('List error:', error);
      throw error;
    }
  }
};

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



// Add these new API functions to your existing api.js file

// Location Management API - Add this section to your existing addressAPI
// Location Management API - Add this section to your existing addressAPI
export const locationAPI = {
  // Province CRUD
  getAllProvinsi: async () => {
    const response = await api.get('/provinsi?select=*&order=nama.asc');
    return response.data;
  },

  createProvinsi: async (provinsiData) => {
    const response = await api.post('/provinsi', {
      nama: provinsiData.nama
    });
    return response.data[0];
  },

  updateProvinsi: async (provinsiId, provinsiData) => {
    const response = await api.patch(`/provinsi?id=eq.${provinsiId}`, {
      nama: provinsiData.nama,
      updated_at: new Date().toISOString()
    });
    return response.data[0];
  },

  deleteProvinsi: async (provinsiId) => {
    // Check if provinsi has related data
    const kotaCheck = await api.get(`/kota_kabupaten?provinsi_id=eq.${provinsiId}&select=id`);
    if (kotaCheck.data.length > 0) {
      throw new Error('Tidak dapat menghapus provinsi yang masih memiliki kota/kabupaten');
    }
    
    await api.delete(`/provinsi?id=eq.${provinsiId}`);
  },

  // Kota/Kabupaten CRUD - removed tipe field
  getAllKotaKabupaten: async () => {
    const response = await api.get('/kota_kabupaten?select=*,provinsi(nama)&order=nama.asc');
    return response.data;
  },

  createKotaKabupaten: async (kotaData) => {
    const response = await api.post('/kota_kabupaten', {
      nama: kotaData.nama,
      provinsi_id: kotaData.provinsi_id
    });
    return response.data[0];
  },

  updateKotaKabupaten: async (kotaId, kotaData) => {
    const response = await api.patch(`/kota_kabupaten?id=eq.${kotaId}`, {
      nama: kotaData.nama,
      provinsi_id: kotaData.provinsi_id,
      updated_at: new Date().toISOString()
    });
    return response.data[0];
  },

  deleteKotaKabupaten: async (kotaId) => {
    // Check if kota has related data
    const kecamatanCheck = await api.get(`/kecamatan?kota_kabupaten_id=eq.${kotaId}&select=id`);
    if (kecamatanCheck.data.length > 0) {
      throw new Error('Tidak dapat menghapus kota/kabupaten yang masih memiliki kecamatan');
    }
    
    await api.delete(`/kota_kabupaten?id=eq.${kotaId}`);
  },

  // Kecamatan CRUD
  getAllKecamatan: async () => {
    const response = await api.get('/kecamatan?select=*,kota_kabupaten(nama,provinsi(nama))&order=nama.asc');
    return response.data;
  },

  createKecamatan: async (kecamatanData) => {
    const response = await api.post('/kecamatan', {
      nama: kecamatanData.nama,
      kota_kabupaten_id: kecamatanData.kota_kabupaten_id
    });
    return response.data[0];
  },

  updateKecamatan: async (kecamatanId, kecamatanData) => {
    const response = await api.patch(`/kecamatan?id=eq.${kecamatanId}`, {
      nama: kecamatanData.nama,
      kota_kabupaten_id: kecamatanData.kota_kabupaten_id,
      updated_at: new Date().toISOString()
    });
    return response.data[0];
  },

  deleteKecamatan: async (kecamatanId) => {
    // Check if kecamatan has related data
    const addressCheck = await api.get(`/user_addresses?kecamatan_id=eq.${kecamatanId}&select=id`);
    if (addressCheck.data.length > 0) {
      throw new Error('Tidak dapat menghapus kecamatan yang masih digunakan dalam alamat user');
    }
    
    await api.delete(`/kecamatan?id=eq.${kecamatanId}`);
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

// Orders API with stock restoration on cancellation
// Helper function to generate order number
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

export const reviewsAPI = {
  // Create new order review
  createOrderReview: async (reviewData) => {
    const response = await api.post('/order_reviews', {
      user_id: reviewData.user_id,
      order_id: reviewData.order_id,
      rating: reviewData.rating,
      ulasan: reviewData.ulasan,
      tanggal: new Date().toISOString()
    });
    return response.data[0];
  },

  // Update existing order review
  updateOrderReview: async (reviewId, reviewData) => {
    const response = await api.patch(`/order_reviews?id=eq.${reviewId}`, {
      rating: reviewData.rating,
      ulasan: reviewData.ulasan,
      tanggal: new Date().toISOString()
    });
    return response.data[0];
  },

  // Get user's review for a specific order
  getUserOrderReview: async (userId, orderId) => {
    const response = await api.get(
      `/order_reviews?user_id=eq.${userId}&order_id=eq.${orderId}&select=*`
    );
    return response.data[0] || null;
  },

  // Get all reviews for an order (usually just one)
  getOrderReviews: async (orderId) => {
    const response = await api.get(
      `/order_reviews?order_id=eq.${orderId}&select=*,users(nama,username)&order=tanggal.desc`
    );
    return response.data;
  },

  // Get user's all order reviews
  getUserOrderReviews: async (userId) => {
    const response = await api.get(
      `/order_reviews?user_id=eq.${userId}&select=*,orders(order_number,order_items(products(nama_produk),quantity))&order=tanggal.desc`
    );
    return response.data;
  },

  // Delete order review
  deleteOrderReview: async (reviewId) => {
    await api.delete(`/order_reviews?id=eq.${reviewId}`);
  },

  // Get reviews for products (aggregate from order reviews)
  getProductReviewsFromOrders: async (productId) => {
    const response = await api.get(
      `/order_reviews?select=*,users(nama,username),orders(order_items(product_id,products(nama_produk),quantity))&order=tanggal.desc`
    );
    
    // Filter reviews that contain the specific product
    const filteredReviews = response.data.filter(review => 
      review.orders.order_items.some(item => item.product_id === productId)
    );
    
    return filteredReviews;
  }
};


// Products API with file upload support
export const productsAPI = {
  getAll: async () => {
    const response = await api.get('/products?select=*,product_photos(*)&order=id.asc');
    return response.data || [];
  },

  create: async (productData) => {
    try {
      // Extract file data from productData
      const { foto_file, foto_file_1, foto_file_2, ...productFields } = productData;
      
      // Create the product first
      const productResponse = await api.post('/products', productFields);
      const newProduct = productResponse.data[0];

      // Upload photos if they exist
      const photoData = {
        product_id: newProduct.id,
        url_foto: '',
        url_foto_1: '',
        url_foto_2: ''
      };

      // Upload main photo
      if (foto_file) {
        const fileName = storageAPI.generateFileName(foto_file.name, newProduct.id);
        const uploadResult = await storageAPI.uploadFile(foto_file, fileName);
        if (uploadResult.success) {
          photoData.url_foto = uploadResult.url;
        }
      }

      // Upload additional photo 1
      if (foto_file_1) {
        const fileName = storageAPI.generateFileName(foto_file_1.name, newProduct.id);
        const uploadResult = await storageAPI.uploadFile(foto_file_1, fileName);
        if (uploadResult.success) {
          photoData.url_foto_1 = uploadResult.url;
        }
      }

      // Upload additional photo 2
      if (foto_file_2) {
        const fileName = storageAPI.generateFileName(foto_file_2.name, newProduct.id);
        const uploadResult = await storageAPI.uploadFile(foto_file_2, fileName);
        if (uploadResult.success) {
          photoData.url_foto_2 = uploadResult.url;
        }
      }

      // Create photo record if any photos were uploaded
      if (photoData.url_foto || photoData.url_foto_1 || photoData.url_foto_2) {
        await api.post('/product_photos', photoData);
      }

      return newProduct;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  update: async (productId, productData) => {
    try {
      // Extract file data from productData
      const { foto_file, foto_file_1, foto_file_2, ...productFields } = productData;
      
      console.log('Updating product:', productId, productFields);
      
      // Update the product first
      const productResponse = await api.patch(`/products?id=eq.${productId}`, productFields);
      console.log('Product updated:', productResponse);
      
      // Get existing photo record
      const existingPhotosResponse = await api.get(`/product_photos?product_id=eq.${productId}`);
      const existingPhotos = existingPhotosResponse.data[0];
      
      // Prepare photo data
      const photoData = {
        url_foto: existingPhotos?.url_foto || '',
        url_foto_1: existingPhotos?.url_foto_1 || '',
        url_foto_2: existingPhotos?.url_foto_2 || ''
      };

      // Handle main photo upload
      if (foto_file) {
        // Delete old photo if exists
        if (existingPhotos?.url_foto) {
          const oldFileName = storageAPI.getFilePathFromUrl(existingPhotos.url_foto);
          if (oldFileName) {
            await storageAPI.deleteFile(oldFileName);
          }
        }
        
        // Upload new photo
        const fileName = storageAPI.generateFileName(foto_file.name, productId);
        const uploadResult = await storageAPI.uploadFile(foto_file, fileName);
        if (uploadResult.success) {
          photoData.url_foto = uploadResult.url;
        }
      }

      // Handle additional photo 1
      if (foto_file_1) {
        // Delete old photo if exists
        if (existingPhotos?.url_foto_1) {
          const oldFileName = storageAPI.getFilePathFromUrl(existingPhotos.url_foto_1);
          if (oldFileName) {
            await storageAPI.deleteFile(oldFileName);
          }
        }
        
        // Upload new photo
        const fileName = storageAPI.generateFileName(foto_file_1.name, productId);
        const uploadResult = await storageAPI.uploadFile(foto_file_1, fileName);
        if (uploadResult.success) {
          photoData.url_foto_1 = uploadResult.url;
        }
      }

      // Handle additional photo 2
      if (foto_file_2) {
        // Delete old photo if exists
        if (existingPhotos?.url_foto_2) {
          const oldFileName = storageAPI.getFilePathFromUrl(existingPhotos.url_foto_2);
          if (oldFileName) {
            await storageAPI.deleteFile(oldFileName);
          }
        }
        
        // Upload new photo
        const fileName = storageAPI.generateFileName(foto_file_2.name, productId);
        const uploadResult = await storageAPI.uploadFile(foto_file_2, fileName);
        if (uploadResult.success) {
          photoData.url_foto_2 = uploadResult.url;
        }
      }

      // Update or create photo record
      if (existingPhotos) {
        // Update existing photo record
        await api.patch(`/product_photos?product_id=eq.${productId}`, photoData);
      } else if (photoData.url_foto || photoData.url_foto_1 || photoData.url_foto_2) {
        // Create new photo record
        const newPhotoData = {
          product_id: productId,
          ...photoData
        };
        await api.post('/product_photos', newPhotoData);
      }

      return productResponse.data?.[0] || productResponse.data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  delete: async (productId) => {
    try {
      // Get existing photos to delete from storage
      const existingPhotosResponse = await api.get(`/product_photos?product_id=eq.${productId}`);
      const existingPhotos = existingPhotosResponse.data[0];
      
      // Delete photos from storage
      if (existingPhotos) {
        if (existingPhotos.url_foto) {
          const fileName = storageAPI.getFilePathFromUrl(existingPhotos.url_foto);
          if (fileName) await storageAPI.deleteFile(fileName);
        }
        if (existingPhotos.url_foto_1) {
          const fileName = storageAPI.getFilePathFromUrl(existingPhotos.url_foto_1);
          if (fileName) await storageAPI.deleteFile(fileName);
        }
        if (existingPhotos.url_foto_2) {
          const fileName = storageAPI.getFilePathFromUrl(existingPhotos.url_foto_2);
          if (fileName) await storageAPI.deleteFile(fileName);
        }
      }
      
      // Delete related photos record
      await api.delete(`/product_photos?product_id=eq.${productId}`);
      
      // Then delete the product
      await api.delete(`/products?id=eq.${productId}`);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
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

  // ✅ FUNGSI BARU: Update quantity item tertentu
  updateQuantity: async (cartItemId, newQuantity) => {
    await api.patch(`/cart_items?id=eq.${cartItemId}`, {
      jumlah: newQuantity
    });
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

// Tambahkan ini ke file api.js yang sudah ada

// Voucher Management API
export const voucherAPI = {
  // Get all vouchers
  getAllVouchers: async () => {
    const response = await api.get('/vouchers?select=*,users!vouchers_created_by_fkey(username)&order=created_at.desc');
    return response.data;
  },

  // Get active vouchers only
  getActiveVouchers: async () => {
    const now = new Date().toISOString();
    const response = await api.get(
      `/vouchers?status=eq.true&tanggal_mulai=lte.${now}&tanggal_berakhir=gte.${now}&select=*&order=created_at.desc`
    );
    return response.data;
  },

  // Get voucher by code (for validation)
  getVoucherByCode: async (kodeVoucher) => {
    const response = await api.get(`/vouchers?kode_voucher=eq.${kodeVoucher}&select=*`);
    return response.data[0];
  },

  // Create new voucher
  createVoucher: async (voucherData) => {
    const response = await api.post('/vouchers', {
      kode_voucher: voucherData.kode_voucher,
      nama_voucher: voucherData.nama_voucher,
      deskripsi: voucherData.deskripsi,
      tipe_diskon: voucherData.tipe_diskon,
      nilai_diskon: parseFloat(voucherData.nilai_diskon),
      minimal_pembelian: parseFloat(voucherData.minimal_pembelian || 0),
      maksimal_diskon: voucherData.maksimal_diskon ? parseFloat(voucherData.maksimal_diskon) : null,
      maksimal_penggunaan: parseInt(voucherData.maksimal_penggunaan),
      tanggal_mulai: voucherData.tanggal_mulai,
      tanggal_berakhir: voucherData.tanggal_berakhir,
      status: voucherData.status !== undefined ? voucherData.status : true,
      created_by: voucherData.created_by
    });
    return response.data[0];
  },

  // Update voucher
  updateVoucher: async (voucherId, voucherData) => {
    const response = await api.patch(`/vouchers?id=eq.${voucherId}`, {
      kode_voucher: voucherData.kode_voucher,
      nama_voucher: voucherData.nama_voucher,
      deskripsi: voucherData.deskripsi,
      tipe_diskon: voucherData.tipe_diskon,
      nilai_diskon: parseFloat(voucherData.nilai_diskon),
      minimal_pembelian: parseFloat(voucherData.minimal_pembelian || 0),
      maksimal_diskon: voucherData.maksimal_diskon ? parseFloat(voucherData.maksimal_diskon) : null,
      maksimal_penggunaan: parseInt(voucherData.maksimal_penggunaan),
      tanggal_mulai: voucherData.tanggal_mulai,
      tanggal_berakhir: voucherData.tanggal_berakhir,
      status: voucherData.status,
      updated_at: new Date().toISOString()
    });
    return response.data[0];
  },

  // Delete voucher
  deleteVoucher: async (voucherId) => {
    // Check if voucher has been used
    const usageCheck = await api.get(`/voucher_usage?voucher_id=eq.${voucherId}&select=id`);
    if (usageCheck.data.length > 0) {
      throw new Error('Tidak dapat menghapus voucher yang sudah pernah digunakan');
    }
    
    await api.delete(`/vouchers?id=eq.${voucherId}`);
  },

  // Toggle voucher status
  toggleVoucherStatus: async (voucherId, status) => {
    const response = await api.patch(`/vouchers?id=eq.${voucherId}`, {
      status: status,
      updated_at: new Date().toISOString()
    });
    return response.data[0];
  },

  // Validate voucher for use
  validateVoucher: async (kodeVoucher, totalBelanja, userId) => {
    const voucher = await voucherAPI.getVoucherByCode(kodeVoucher);
    
    if (!voucher) {
      throw new Error('Kode voucher tidak ditemukan');
    }

    const now = new Date();
    const tanggalMulai = new Date(voucher.tanggal_mulai);
    const tanggalBerakhir = new Date(voucher.tanggal_berakhir);

    // Check if voucher is active
    if (!voucher.status) {
      throw new Error('Voucher tidak aktif');
    }

    // Check date validity
    if (now < tanggalMulai || now > tanggalBerakhir) {
      throw new Error('Voucher sudah tidak berlaku');
    }

    // Check usage limit
    if (voucher.jumlah_terpakai >= voucher.maksimal_penggunaan) {
      throw new Error('Voucher sudah mencapai batas maksimal penggunaan');
    }

    // Check minimum purchase
    if (totalBelanja < voucher.minimal_pembelian) {
      throw new Error(`Minimal pembelian untuk voucher ini adalah Rp ${voucher.minimal_pembelian.toLocaleString('id-ID')}`);
    }

    // Check if user has used this voucher before (optional business rule)
    const userUsage = await api.get(`/voucher_usage?voucher_id=eq.${voucher.id}&user_id=eq.${userId}&select=id`);
    if (userUsage.data.length > 0) {
      throw new Error('Anda sudah pernah menggunakan voucher ini');
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (voucher.tipe_diskon === 'PERCENTAGE') {
      discountAmount = (totalBelanja * voucher.nilai_diskon) / 100;
      if (voucher.maksimal_diskon && discountAmount > voucher.maksimal_diskon) {
        discountAmount = voucher.maksimal_diskon;
      }
    } else if (voucher.tipe_diskon === 'FIXED') {
      discountAmount = voucher.nilai_diskon;
    }

    return {
      voucher,
      discountAmount,
      finalAmount: totalBelanja - discountAmount
    };
  },

  // Apply voucher (record usage)
  applyVoucher: async (voucherId, userId, orderId, discountAmount) => {
    try {
      // Record voucher usage
      const usageResponse = await api.post('/voucher_usage', {
        voucher_id: voucherId,
        user_id: userId,
        order_id: orderId,
        nilai_diskon_digunakan: discountAmount
      });

      // Update voucher usage count
      const currentVoucher = await api.get(`/vouchers?id=eq.${voucherId}&select=jumlah_terpakai`);
      const newCount = currentVoucher.data[0].jumlah_terpakai + 1;
      
      await api.patch(`/vouchers?id=eq.${voucherId}`, {
        jumlah_terpakai: newCount,
        updated_at: new Date().toISOString()
      });

      return usageResponse.data[0];
    } catch (error) {
      console.error('Error applying voucher:', error);
      throw error;
    }
  },

  // Get voucher usage history
  getVoucherUsage: async (voucherId = null) => {
    let query = '/voucher_usage?select=*,vouchers(kode_voucher,nama_voucher),users(username),orders(id)&order=tanggal_digunakan.desc';
    
    if (voucherId) {
      query = `/voucher_usage?voucher_id=eq.${voucherId}&select=*,vouchers(kode_voucher,nama_voucher),users(username),orders(id)&order=tanggal_digunakan.desc`;
    }
    
    const response = await api.get(query);
    return response.data;
  },

  // Get voucher statistics
  getVoucherStats: async () => {
    const allVouchers = await api.get('/vouchers?select=*');
    const activeVouchers = await api.get('/vouchers?status=eq.true&select=*');
    const totalUsage = await api.get('/voucher_usage?select=nilai_diskon_digunakan');
    
    const totalDiscountGiven = totalUsage.data.reduce((sum, usage) => 
      sum + parseFloat(usage.nilai_diskon_digunakan), 0
    );

    return {
      totalVouchers: allVouchers.data.length,
      activeVouchers: activeVouchers.data.length,
      totalUsage: totalUsage.data.length,
      totalDiscountGiven
    };
  }
};

export default api;