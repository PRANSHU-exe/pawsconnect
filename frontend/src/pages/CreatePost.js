import React from 'react';
import { Link } from 'react-router-dom';

const CreatePost = () => (
  <div className="container" style={{ padding: '2rem 1rem' }}>
    <div className="card">
      <h1>Create New Post</h1>
      <p>Post creation form - Backend integration coming soon!</p>
      <Link to="/" className="btn btn-primary">Back to Home</Link>
    </div>
  </div>
);

export default CreatePost;