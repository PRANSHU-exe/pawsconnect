import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/posts/categories');
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data.categories);
      } else {
        setError('Failed to load categories');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      // Show demo data if backend is not available
      setCategories([
        { key: 'health-wellness', name: 'Health & Wellness', icon: '🏥', totalPosts: 234, recentPosts: [] },
        { key: 'behavior', name: 'Behavior', icon: '🧠', totalPosts: 189, recentPosts: [] },
        { key: 'nutrition', name: 'Nutrition', icon: '🥗', totalPosts: 156, recentPosts: [] },
        { key: 'grooming', name: 'Grooming', icon: '✂️', totalPosts: 98, recentPosts: [] },
        { key: 'training', name: 'Training', icon: '🎓', totalPosts: 87, recentPosts: [] },
        { key: 'general-chat', name: 'General Chat', icon: '💬', totalPosts: 76, recentPosts: [] }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem 1rem' }}>
        <div className="loading">
          <div className="spinner"></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Community Categories
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
          Browse pet care topics by category to find the information you need
        </p>
      </div>

      {error && (
        <div style={{ 
          backgroundColor: 'var(--error)', 
          color: 'white', 
          padding: '1rem', 
          borderRadius: '0.5rem',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          {error} - Showing demo data
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
        gap: '2rem'
      }}>
        {categories.map(category => (
          <Link 
            key={category.key}
            to={`/category/${category.key}`} 
            className="card"
            style={{ 
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '2.5rem', marginRight: '1rem' }}>{category.icon}</div>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem' }}>
                  {category.name}
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {category.totalPosts} discussions
                </p>
              </div>
            </div>
            
            {category.recentPosts && category.recentPosts.length > 0 ? (
              <div>
                <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Recent Discussions:
                </h4>
                {category.recentPosts.slice(0, 2).map((post, index) => (
                  <div key={index} style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-muted)', 
                    marginBottom: '0.25rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    • {post.title}
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  Join the discussion and be the first to post in this category!
                </p>
              </div>
            )}
          </Link>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          color: 'white',
          border: 'none'
        }}>
          <h3 style={{ marginBottom: '1rem', color: 'white' }}>Have a Question?</h3>
          <p style={{ marginBottom: '1.5rem', color: 'rgba(255, 255, 255, 0.9)' }}>
            Can't find what you're looking for? Ask our AI assistant or start a new discussion!
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/pawsbot" className="btn" style={{ 
              backgroundColor: 'white', 
              color: 'var(--primary)'
            }}>
              🤖 Ask PawsBot
            </Link>
            <Link to="/create-post" className="btn" style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              color: 'white',
              border: '2px solid white'
            }}>
              Start Discussion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;