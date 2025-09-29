import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faUsers, faHeart, faPaw, faCamera, faEdit, faCog,
  faMapMarkerAlt, faCalendarAlt, faShieldAlt, faEnvelope,
  faUserPlus, faUserMinus, faEllipsisH, faGrid3x3, faList,
  faBookmark, faUserFriends, faShare, faFlag, faTh
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular, faBookmark as faBookmarkRegular } from '@fortawesome/free-regular-svg-icons';

const UserProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userPets, setUserPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts', 'pets', 'saved', 'liked'
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list'
  const [isFollowing, setIsFollowing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [profileStats, setProfileStats] = useState({
    postsCount: 0,
    followersCount: 0,
    followingCount: 0,
    petsCount: 0
  });

  const isOwnProfile = currentUser?.username === username;

  // Default pet avatars
  const defaultPetAvatars = [
    '🐶', '🐱', '🐰', '🐹', '🐦', '🐠', '🐢', '🦎',
    '🐍', '🐷', '🐴', '🦄', '🐲', '🐾', '🦮', '🐕‍🦺'
  ];

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile
        const profileResponse = await fetch(`/api/users/profile/${username}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        if (!profileResponse.ok) {
          navigate('/404');
          return;
        }

        const profileData = await profileResponse.json();
        if (profileData.success) {
          setProfileUser(profileData.data.user);
          setIsFollowing(profileData.data.isFollowing);
          
          // Fetch user posts
          const postsResponse = await fetch(`/api/posts?author=${profileData.data.user._id}&limit=50`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          });

          const postsData = await postsResponse.json();
          if (postsData.success) {
            setUserPosts(postsData.data.posts);
          }

          // Fetch user pets
          const petsResponse = await fetch(`/api/pets/user/${profileData.data.user._id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          });

          const petsData = await petsResponse.json();
          if (petsData.success) {
            setUserPets(petsData.data.pets || []);
          }

          // Set stats
          setProfileStats({
            postsCount: postsData.data?.posts?.length || 0,
            followersCount: profileData.data.user.totalFollowers || 0,
            followingCount: profileData.data.user.totalFollowing || 0,
            petsCount: petsData.data?.pets?.length || 0
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchUserProfile();
    }
  }, [username, navigate]);

  // Follow/Unfollow user
  const handleFollowToggle = async () => {
    if (!currentUser || !profileUser) return;

    try {
      const response = await fetch(`/api/users/follow/${profileUser._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setIsFollowing(!isFollowing);
        setProfileStats(prev => ({
          ...prev,
          followersCount: isFollowing ? prev.followersCount - 1 : prev.followersCount + 1
        }));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  // Share profile
  const handleShareProfile = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${profileUser.fullName} on PawsConnect`,
        text: `Check out ${profileUser.fullName}'s profile on PawsConnect!`,
        url: window.location.href
      });
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      // Show toast notification
    }
  };

  // Render post grid
  const renderPostGrid = (posts) => (
    <div className={`posts-grid ${viewMode}`}>
      {posts.map(post => (
        <div key={post._id} className="profile-post-card" onClick={() => navigate(`/post/${post._id}`)}>
          {post.images && post.images.length > 0 ? (
            <div className="post-image-wrapper">
              <img src={post.images[0]} alt={post.title} className="post-image" />
              {post.images.length > 1 && (
                <div className="multiple-images-indicator">
                  <FontAwesomeIcon icon={faTh} />
                </div>
              )}
              <div className="post-overlay">
                <div className="post-stats">
                  <span><FontAwesomeIcon icon={faHeart} /> {post.likesCount}</span>
                  <span><FontAwesomeIcon icon={faUsers} /> {post.commentsCount}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="post-text-preview">
              <h4>{post.title}</h4>
              <p>{post.content.substring(0, 100)}...</p>
              <div className="post-stats">
                <span><FontAwesomeIcon icon={faHeart} /> {post.likesCount}</span>
                <span><FontAwesomeIcon icon={faUsers} /> {post.commentsCount}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // Render pet grid
  const renderPetGrid = (pets) => (
    <div className="pets-grid">
      {pets.map(pet => (
        <div key={pet._id} className="pet-card" onClick={() => navigate(`/pet/${pet._id}`)}>
          <div className="pet-avatar">
            {pet.profilePicture ? (
              <img src={pet.profilePicture} alt={pet.name} />
            ) : (
              <span className="pet-emoji">{defaultPetAvatars[pet.type?.charCodeAt(0) % defaultPetAvatars.length] || '🐾'}</span>
            )}
          </div>
          <div className="pet-info">
            <h4>{pet.name}</h4>
            <p>{pet.type} {pet.breed && `• ${pet.breed}`}</p>
            <span className="pet-age">{pet.age} years old</span>
          </div>
        </div>
      ))}
      
      {/* Add pet card for own profile */}
      {isOwnProfile && (
        <div className="pet-card add-pet-card" onClick={() => navigate('/add-pet')}>
          <div className="add-pet-icon">
            <FontAwesomeIcon icon={faPaw} />
          </div>
          <p>Add a Pet</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="profile-not-found">
        <h2>User not found</h2>
        <p>The profile you're looking for doesn't exist.</p>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="user-profile">
      {/* Profile Header */}
      <header className="profile-header">
        <div className="profile-banner">
          {/* Profile Picture */}
          <div className="profile-picture-container">
            <div className="profile-picture">
              {profileUser.profilePicture ? (
                <img src={profileUser.profilePicture} alt={profileUser.fullName} />
              ) : (
                <div className="default-avatar">
                  <FontAwesomeIcon icon={faUser} />
                </div>
              )}
              {isOwnProfile && (
                <button className="change-photo-btn" onClick={() => setShowEditModal(true)}>
                  <FontAwesomeIcon icon={faCamera} />
                </button>
              )}
            </div>
            {profileUser.isVerified && (
              <div className="verification-badge">
                <FontAwesomeIcon icon={faShieldAlt} />
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="profile-info">
            <div className="profile-header-top">
              <div className="profile-names">
                <h1 className="profile-fullname">{profileUser.fullName}</h1>
                <h2 className="profile-username">@{profileUser.username}</h2>
              </div>
              
              {/* Action Buttons */}
              <div className="profile-actions">
                {isOwnProfile ? (
                  <>
                    <button 
                      className="btn-secondary"
                      onClick={() => setShowEditModal(true)}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                      Edit Profile
                    </button>
                    <button className="btn-secondary">
                      <FontAwesomeIcon icon={faCog} />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className={`btn-${isFollowing ? 'secondary' : 'primary'}`}
                      onClick={handleFollowToggle}
                    >
                      <FontAwesomeIcon icon={isFollowing ? faUserMinus : faUserPlus} />
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button className="btn-secondary">
                      <FontAwesomeIcon icon={faEnvelope} />
                    </button>
                    <button className="btn-secondary" onClick={handleShareProfile}>
                      <FontAwesomeIcon icon={faShare} />
                    </button>
                    <button className="btn-secondary">
                      <FontAwesomeIcon icon={faEllipsisH} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Bio */}
            {profileUser.bio && (
              <div className="profile-bio">
                <p>{profileUser.bio}</p>
              </div>
            )}

            {/* Profile Details */}
            <div className="profile-details">
              {profileUser.location && (
                <span className="profile-detail">
                  <FontAwesomeIcon icon={faMapMarkerAlt} />
                  {profileUser.location}
                </span>
              )}
              <span className="profile-detail">
                <FontAwesomeIcon icon={faCalendarAlt} />
                Joined {new Date(profileUser.joinDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long' 
                })}
              </span>
            </div>

            {/* Profile Stats */}
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-number">{profileStats.postsCount}</span>
                <span className="stat-label">Posts</span>
              </div>
              <div 
                className="stat-item clickable" 
                onClick={() => setShowFollowersModal(true)}
              >
                <span className="stat-number">{profileStats.followersCount}</span>
                <span className="stat-label">Followers</span>
              </div>
              <div 
                className="stat-item clickable" 
                onClick={() => setShowFollowingModal(true)}
              >
                <span className="stat-number">{profileStats.followingCount}</span>
                <span className="stat-label">Following</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{profileStats.petsCount}</span>
                <span className="stat-label">Pets</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="profile-tabs">
          <div className="tab-list">
            <button 
              className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              <FontAwesomeIcon icon={faGrid3x3} />
              Posts
            </button>
            <button 
              className={`tab ${activeTab === 'pets' ? 'active' : ''}`}
              onClick={() => setActiveTab('pets')}
            >
              <FontAwesomeIcon icon={faPaw} />
              Pets
            </button>
            {isOwnProfile && (
              <>
                <button 
                  className={`tab ${activeTab === 'saved' ? 'active' : ''}`}
                  onClick={() => setActiveTab('saved')}
                >
                  <FontAwesomeIcon icon={faBookmarkRegular} />
                  Saved
                </button>
                <button 
                  className={`tab ${activeTab === 'liked' ? 'active' : ''}`}
                  onClick={() => setActiveTab('liked')}
                >
                  <FontAwesomeIcon icon={faHeartRegular} />
                  Liked
                </button>
              </>
            )}
          </div>

          {/* View Mode Toggle */}
          {(activeTab === 'posts' || activeTab === 'saved' || activeTab === 'liked') && (
            <div className="view-mode-toggle">
              <button 
                className={viewMode === 'grid' ? 'active' : ''}
                onClick={() => setViewMode('grid')}
              >
                <FontAwesomeIcon icon={faTh} />
              </button>
              <button 
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => setViewMode('list')}
              >
                <FontAwesomeIcon icon={faList} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Profile Content */}
      <main className="profile-content">
        {activeTab === 'posts' && (
          <div className="posts-section">
            {userPosts.length > 0 ? (
              renderPostGrid(userPosts)
            ) : (
              <div className="empty-state">
                <FontAwesomeIcon icon={faUsers} />
                <h3>No posts yet</h3>
                <p>
                  {isOwnProfile 
                    ? "Share your first post with the community!"
                    : `${profileUser.fullName} hasn't posted anything yet.`
                  }
                </p>
                {isOwnProfile && (
                  <Link to="/create-post" className="btn-primary">Create Post</Link>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'pets' && (
          <div className="pets-section">
            {userPets.length > 0 || isOwnProfile ? (
              renderPetGrid(userPets)
            ) : (
              <div className="empty-state">
                <FontAwesomeIcon icon={faPaw} />
                <h3>No pets added</h3>
                <p>{profileUser.fullName} hasn't added any pets yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved' && isOwnProfile && (
          <div className="saved-section">
            <div className="empty-state">
              <FontAwesomeIcon icon={faBookmark} />
              <h3>No saved posts</h3>
              <p>Posts you save will appear here.</p>
            </div>
          </div>
        )}

        {activeTab === 'liked' && isOwnProfile && (
          <div className="liked-section">
            <div className="empty-state">
              <FontAwesomeIcon icon={faHeart} />
              <h3>No liked posts</h3>
              <p>Posts you like will appear here.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UserProfile;