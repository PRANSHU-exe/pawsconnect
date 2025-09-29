import React from 'react';
import { useParams, Link } from 'react-router-dom';

const CategoryPosts = () => {
  const { categoryId } = useParams();
  
  const categoryNames = {
    'health-wellness': 'Health & Wellness',
    'behavior': 'Behavior',
    'nutrition': 'Nutrition',
    'grooming': 'Grooming',
    'training': 'Training',
    'general-chat': 'General Chat'
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="card">
        <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {categoryNames[categoryId] || 'Category'} Posts
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Posts page for {categoryId} - Backend integration coming soon!
        </p>
        <Link to="/categories" className="btn btn-primary" style={{ width: '100%' }}>
          Back to Categories
        </Link>
      </div>
    </div>
  );
};

export default CategoryPosts;