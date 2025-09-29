import React from 'react';
import { useParams, Link } from 'react-router-dom';

const Profile = () => {
  const { username } = useParams();
  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="card">
        <h1>User Profile</h1>
        <p>Username: {username}</p>
        <p>Backend integration coming soon!</p>
        <Link to="/" className="btn btn-primary">Back to Home</Link>
      </div>
    </div>
  );
};

export default Profile;