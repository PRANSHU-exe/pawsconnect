import React from 'react';
import { useParams, Link } from 'react-router-dom';

const PostDetail = () => {
  const { postId } = useParams();
  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="card">
        <h1>Post Details</h1>
        <p>Post ID: {postId}</p>
        <p>Backend integration coming soon!</p>
        <Link to="/categories" className="btn btn-primary">Back to Categories</Link>
      </div>
    </div>
  );
};

export default PostDetail;