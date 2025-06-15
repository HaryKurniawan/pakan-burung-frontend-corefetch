import React from 'react';
import ProductList from '../components/product/ProductList';
import { useProducts } from '../hooks/useProducts';

const Home = () => {
  const { products, loading } = useProducts();

  if (loading) {
    return <div>Loading products...</div>;
  }

  return (
    <div>
      <h2>Products</h2>
      <ProductList products={products} />
    </div>
  );
};

export default Home;