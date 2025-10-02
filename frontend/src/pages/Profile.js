import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS, getAuthHeaders } from '../config/api';
import { 
  User, MapPin, Calendar, Edit, Settings, Heart, 
  MessageCircle, Bookmark, Grid, List, Clock 
} from 'lucide-react';

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts'); // posts, questions, saved
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  
  const isOwnProfile = currentUser && currentUser.username === username;

  useEffect(() => {
    fetchProfileData();
  }, [username]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // Fetch user profile
      const userResponse = await fetch(API_ENDPOINTS.USER_BY_USERNAME(username), {
        headers: getAuthHeaders()
      });
      const userData = await userResponse.json();
      
      if (userData.success) {
        setProfileUser(userData.data.user);
      }

      // Fetch user posts (need to use user ID after getting profile)
      if (userData.success && userData.data.user._id) {
        const postsResponse = await fetch(API_ENDPOINTS.USER_POSTS(userData.data.user._id), {
          headers: getAuthHeaders()
        });
        const postsData = await postsResponse.json();
        
        if (postsData.success) {
          setPosts(postsData.data.posts || []);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
        <div className="spinner" style={{ width: '3rem', height: '3rem', margin: '0 auto' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading profile...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="container" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>User Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          The user you're looking for doesn't exist.
        </p>
        <Link to="/" className="btn btn-primary">Back to Home</Link>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-secondary)', minHeight: '100vh' }}>
      <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1200px' }}>
        {/* Profile Header */}
        <div className="card" style={{ 
          padding: '2.5rem',
          marginBottom: '2rem',
          borderRadius: 'var(--radius-xl)'
        }}>
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem'
          }}>
            {/* Top Section - Avatar and Stats */}
            <div style={{ 
              display: 'flex',
              gap: '2rem',
              alignItems: 'flex-start',
              flexWrap: 'wrap'
            }}>
              {/* Avatar */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  background: profileUser.profilePicture 
                    ? `url(${profileUser.profilePicture})` 
                    : 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem',
                  color: 'white',
                  fontWeight: 'bold',
                  border: '4px solid var(--bg-card)',
                  boxShadow: 'var(--shadow-lg)'
                }}>
                  {!profileUser.profilePicture && profileUser.fullName?.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* User Info and Stats */}
              <div style={{ flex: 1, minWidth: '300px' }}>
                {/* Username and Actions */}
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap'
                }}>
                  <h1 style={{ 
                    fontSize: '1.875rem',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    margin: 0
                  }}>
                    {profileUser.username}
                  </h1>
                  
                  {isOwnProfile ? (
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <Link 
                        to="/settings" 
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        <Edit size={16} />
                        Edit Profile
                      </Link>
                      <button 
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        <Settings size={16} />
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* Stats */}
                <div style={{ 
                  display: 'flex',
                  gap: '2rem',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap'
                }}>
                  <div>
                    <span style={{ 
                      fontWeight: '700',
                      fontSize: '1.125rem',
                      color: 'var(--text-primary)'
                    }}>
                      {posts.length}
                    </span>
                    <span style={{ 
                      marginLeft: '0.5rem',
                      color: 'var(--text-secondary)'
                    }}>
                      posts
                    </span>
                  </div>
                </div>

                {/* Full Name and Bio */}
                <div>
                  <h2 style={{ 
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    {profileUser.fullName}
                  </h2>
                  {profileUser.bio && (
                    <p style={{ 
                      color: 'var(--text-primary)',
                      marginBottom: '0.75rem',
                      lineHeight: '1.6'
                    }}>
                      {profileUser.bio}
                    </p>
                  )}
                  
                  {/* Location and Join Date */}
                  <div style={{ 
                    display: 'flex',
                    gap: '1.5rem',
                    flexWrap: 'wrap',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)'
                  }}>
                    {profileUser.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={16} />
                        <span>{profileUser.location}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={16} />
                      <span>Joined {new Date(profileUser.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card" style={{ 
          padding: 0,
          marginBottom: '2rem',
          overflow: 'hidden'
        }}>
          <div style={{ 
            display: 'flex',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <button
              onClick={() => setActiveTab('posts')}
              style={{
                flex: 1,
                padding: '1rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'posts' ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === 'posts' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all var(--transition-base)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Grid size={18} />
              <span>Posts</span>
            </button>
            
            <button
              onClick={() => setActiveTab('questions')}
              style={{
                flex: 1,
                padding: '1rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'questions' ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === 'questions' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all var(--transition-base)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <MessageCircle size={18} />
              <span>Questions</span>
            </button>
            
            {isOwnProfile && (
              <button
                onClick={() => setActiveTab('saved')}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'saved' ? '2px solid var(--primary)' : '2px solid transparent',
                  color: activeTab === 'saved' ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all var(--transition-base)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Bookmark size={18} />
                <span>Saved</span>
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div style={{ 
            padding: '1rem',
            display: 'flex',
            justifyContent: 'flex-end',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <div style={{ 
              display: 'flex',
              gap: '0.5rem',
              background: 'var(--bg-secondary)',
              padding: '0.25rem',
              borderRadius: 'var(--radius-md)'
            }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '0.5rem',
                  background: viewMode === 'grid' ? 'var(--bg-card)' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all var(--transition-base)'
                }}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '0.5rem',
                  background: viewMode === 'list' ? 'var(--bg-card)' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all var(--transition-base)'
                }}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'posts' && (
            <div>
              {posts.length === 0 ? (
                <div className="card" style={{ 
                  padding: '3rem',
                  textAlign: 'center'
                }}>
                  <Grid size={48} style={{ 
                    margin: '0 auto 1rem',
                    color: 'var(--text-muted)'
                  }} />
                  <h3 style={{ 
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    No Posts Yet
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {isOwnProfile 
                      ? 'Share your first post with the community!' 
                      : `${profileUser.username} hasn't posted anything yet.`}
                  </p>
                  {isOwnProfile && (
                    <Link 
                      to="/create-post" 
                      className="btn btn-primary"
                      style={{ marginTop: '1.5rem' }}
                    >
                      Create Your First Post
                    </Link>
                  )}
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: viewMode === 'grid' 
                    ? 'repeat(auto-fill, minmax(300px, 1fr))' 
                    : '1fr',
                  gap: '1.5rem'
                }}>
                  {posts.map(post => (
                    <Link
                      key={post._id}
                      to={`/post/${post._id}`}
                      className="card hover-lift"
                      style={{
                        padding: '1.5rem',
                        textDecoration: 'none',
                        display: 'block'
                      }}
                    >
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '1rem'
                      }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: 'var(--bg-secondary)',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: 'var(--primary)'
                        }}>
                          {post.category}
                        </span>
                        <span style={{ 
                          fontSize: '0.875rem',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <Clock size={14} />
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h3 style={{ 
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        marginBottom: '0.75rem',
                        lineHeight: '1.4'
                      }}>
                        {post.title}
                      </h3>
                      
                      <p style={{ 
                        color: 'var(--text-secondary)',
                        marginBottom: '1rem',
                        lineHeight: '1.6',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {post.content}
                      </p>
                      
                      <div style={{ 
                        display: 'flex',
                        gap: '1.5rem',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Heart size={16} />
                          {post.likesCount || 0}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <MessageCircle size={16} />
                          {post.commentsCount || 0}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
              <MessageCircle size={48} style={{ 
                margin: '0 auto 1rem',
                color: 'var(--text-muted)'
              }} />
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Questions Coming Soon
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                View all questions asked by {isOwnProfile ? 'you' : profileUser.username}.
              </p>
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
              <Bookmark size={48} style={{ 
                margin: '0 auto 1rem',
                color: 'var(--text-muted)'
              }} />
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                No Saved Posts
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Save posts to view them later.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
