import React from 'react';

const AdminProductList = ({ products, onEdit, onDelete }) => {
  return (
    <div>
      <h3>Manage Products</h3>
      <div>
        {products.map(product => (
          <div key={product.id} className="product-card">
            <h4>{product.nama_produk}</h4>
            <p>Price: Rp {Number(product.harga).toLocaleString()}</p>
            <p>Stock: {product.stok}</p>
            <p>{product.detail_produk}</p>
            <button 
              className="button success"
              onClick={() => onEdit(product)}
            >
              Edit
            </button>
            <button 
              className="button danger"
              onClick={() => onDelete(product.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminProductList;