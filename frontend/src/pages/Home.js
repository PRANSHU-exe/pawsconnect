import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: 'bold', 
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #8B5CF6, #10B981)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Welcome to PawsConnect 🐾
        </h1>
        <p style={{ 
          fontSize: '1.25rem', 
          color: 'var(--text-secondary)', 
          maxWidth: '600px', 
          margin: '0 auto 2rem'
        }}>
          A community platform for pet lovers to connect, share experiences, and get expert advice for their furry friends.
        </p>
        
        {!user ? (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
              Join the Community
            </Link>
            <Link to="/login" className="btn btn-outline" style={{ padding: '0.75rem 2rem' }}>
              Sign In
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/create-post" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
              Create Your First Post
            </Link>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '2rem',
        marginBottom: '4rem'
      }}>
        <div className="card">
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💬</div>
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Community Forum</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Ask questions, share experiences, and connect with fellow pet lovers in our supportive community.
          </p>
        </div>


        <div className="card">
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏥</div>
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Health & Wellness</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Access reliable information about pet health, nutrition, and wellness from trusted sources.
          </p>
        </div>
      </div>

      {/* Categories Section */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Explore Categories
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Find discussions and advice for all aspects of pet care
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '4rem'
      }}>
        {[
          { key: 'health-wellness', name: 'Health & Wellness', icon: '🏥', count: '234' },
          { key: 'behavior', name: 'Behavior', icon: '🧠', count: '189' },
          { key: 'nutrition', name: 'Nutrition', icon: '🥗', count: '156' },
          { key: 'grooming', name: 'Grooming', icon: '✂️', count: '98' },
          { key: 'training', name: 'Training', icon: '🎓', count: '87' },
          { key: 'general-chat', name: 'General Chat', icon: '💬', count: '76' }
        ].map(category => (
          <Link 
            key={category.key}
            to={`/category/${category.key}`} 
            className="card"
            style={{ 
              textDecoration: 'none',
              textAlign: 'center',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{category.icon}</div>
            <h4 style={{ marginBottom: '0.25rem', color: 'var(--text-primary)' }}>{category.name}</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {category.count} discussions
            </p>
          </Link>
        ))}
      </div>

      {/* CTA Section */}
      <div className="card" style={{ 
        textAlign: 'center', 
        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
        color: 'white',
        border: 'none'
      }}>
        <h2 style={{ marginBottom: '1rem', color: 'white' }}>
          Ready to Connect with Pet Lovers?
        </h2>
        <p style={{ marginBottom: '2rem', color: 'rgba(255, 255, 255, 0.9)' }}>
          Join thousands of pet parents sharing knowledge, experiences, and love for their furry friends.
        </p>
        <Link to="/categories" className="btn" style={{ 
          backgroundColor: 'white', 
          color: 'var(--primary)',
          padding: '0.75rem 2rem'
        }}>
          Explore Community
        </Link>
      </div>
    </div>
  );
};

export default Home;