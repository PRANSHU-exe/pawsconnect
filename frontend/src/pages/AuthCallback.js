import React from 'react';
import { Link } from 'react-router-dom';

const AuthCallback = () => (
  <div className="container" style={{ padding: '2rem 1rem' }}>
    <div className="card" style={{ textAlign: 'center' }}>
      <h1>Authentication Callback</h1>
      <p>OAuth callback handling - Backend integration coming soon!</p>
      <Link to="/" className="btn btn-primary">Back to Home</Link>
    </div>
  </div>
);

export default AuthCallback;