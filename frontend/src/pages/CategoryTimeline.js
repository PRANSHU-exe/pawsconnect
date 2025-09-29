import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import InfiniteScroll from 'react-infinite-scroll-component';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHeart, faComment, faShare, faBookmark, faEllipsisH,
  faFilter, faSearch, faTh, faList, faFire, faClock,
  faUsers, faVideo, faImage, faPaw, faStethoscope,
  faBrain, faAppleAlt, faCut, faDumbbell
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular, faComment as faCommentRegular, faBookmark as faBookmarkRegular } from '@fortawesome/free-regular-svg-icons';

const CategoryTimeline = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'trending', 'popular'
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'images', 'videos', 'questions'
  const [searchTerm, setSearchTerm] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const searchTimeoutRef = useRef(null);

  // Category configurations
  const categoryConfig = {
    'general': {
      name: 'General Chat',
      icon: faUsers,
      color: '#8B5CF6',
      description: 'General pet discussions and community chat'
    },
    'health-wellness': {
      name: 'Health & Wellness',
      icon: faStethoscope,
      color: '#EF4444',
      description: 'Pet health, medical questions, and wellness tips'
    },
    'behavior': {
      name: 'Behavior & Training',
      icon: faBrain,
      color: '#F59E0B',
      description: 'Pet behavior questions and training advice'
    },
    'nutrition': {
      name: 'Nutrition & Feeding',
      icon: faAppleAlt,
      color: '#10B981',
      description: 'Diet, feeding schedules, and nutrition guidance'
    },
    'grooming': {
      name: 'Grooming & Care',
      icon: faCut,
      color: '#EC4899',
      description: 'Grooming tips, hygiene, and general pet care'
    },
    'training': {
      name: 'Training & Exercise',
      icon: faDumbbell,
      color: '#3B82F6',
      description: 'Training methods, exercises, and activity tips'
    }
  };

  const currentCategory = categoryConfig[category] || categoryConfig['general'];

  // Fetch posts with filters
  const fetchPosts = useCallback(async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageNum,
        limit: 20,
        category: category,
        sort: sortBy,
        filter: filterBy,
        search: searchTerm.trim()
      });

      const response = await fetch(`/api/posts/timeline?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        const newPosts = data.data.posts;
        setPosts(prev => reset ? newPosts : [...prev, ...newPosts]);
        setHasMore(data.data.pagination.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, [category, sortBy, filterBy, searchTerm]);

  // Fetch active users
  const fetchActiveUsers = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/group/${category}/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setActiveUsers(data.data.activeUsers);
      }
    } catch (error) {
      console.error('Error fetching active users:', error);
    }
  }, [category]);

  // Load more posts
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchPosts(page + 1, false);
    }
  };

  // Handle search with debounce
  const handleSearch = (value) => {
    setSearchTerm(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      fetchPosts(1, true);
    }, 500);
  };

  // Handle filter changes
  const handleFilterChange = (type, value) => {
    if (type === 'sort') {
      setSortBy(value);
    } else if (type === 'filter') {
      setFilterBy(value);
    }
    fetchPosts(1, true);
  };

  // Like/Unlike post
  const toggleLike = async (postId) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setPosts(prev => prev.map(post => 
          post._id === postId 
            ? { ...post, isLiked: !post.isLiked, likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1 }
            : post
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Save/Unsave post
  const toggleSave = async (postId) => {
    try {
      const response = await fetch(`/api/posts/${postId}/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setPosts(prev => prev.map(post => 
          post._id === postId 
            ? { ...post, isSaved: !post.isSaved }
            : post
        ));
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  useEffect(() => {
    fetchPosts(1, true);
    fetchActiveUsers();
    
    // Set up interval for active users
    const interval = setInterval(fetchActiveUsers, 30000);
    return () => clearInterval(interval);
  }, [category, fetchPosts, fetchActiveUsers]);

  // Render post card
  const renderPostCard = (post) => (
    <article 
      key={post._id}
      className={`post-card ${viewMode === 'grid' ? 'post-card-grid' : 'post-card-list'}`}
      onClick={() => setSelectedPost(post)}
    >
      {/* Post Header */}
      <header className="post-header">
        <div className="post-author">
          <img 
            src={post.author.profilePicture || '/api/placeholder/40/40'} 
            alt={post.author.fullName}
            className="author-avatar"
          />
          <div className="author-info">
            <h4 className="author-name">
              {post.author.fullName}
              {post.author.isVerified && <span className="verified-badge">✓</span>}
            </h4>
            <span className="post-time">{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <button className="post-menu-btn">
          <FontAwesomeIcon icon={faEllipsisH} />
        </button>
      </header>

      {/* Post Content */}
      <div className="post-content">
        <h3 className="post-title">{post.title}</h3>
        {viewMode === 'list' && (
          <p className="post-excerpt">
            {post.content.length > 200 ? `${post.content.substring(0, 200)}...` : post.content}
          </p>
        )}
        
        {/* Post Images */}
        {post.images && post.images.length > 0 && (
          <div className={`post-images ${post.images.length > 1 ? 'multiple-images' : ''}`}>
            {post.images.slice(0, viewMode === 'grid' ? 1 : 4).map((image, index) => (
              <img 
                key={index}
                src={image} 
                alt=""
                className="post-image"
              />
            ))}
            {post.images.length > 4 && viewMode === 'list' && (
              <div className="more-images">+{post.images.length - 4} more</div>
            )}
          </div>
        )}

        {/* Category Badge */}
        <div className="post-category">
          <FontAwesomeIcon icon={currentCategory.icon} />
          <span>{currentCategory.name}</span>
        </div>
      </div>

      {/* Post Actions */}
      <footer className="post-actions">
        <div className="primary-actions">
          <button 
            className={`action-btn ${post.isLiked ? 'liked' : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleLike(post._id); }}
          >
            <FontAwesomeIcon icon={post.isLiked ? faHeart : faHeartRegular} />
            <span>{post.likesCount}</span>
          </button>
          
          <button 
            className="action-btn"
            onClick={(e) => { e.stopPropagation(); navigate(`/post/${post._id}`); }}
          >
            <FontAwesomeIcon icon={faCommentRegular} />
            <span>{post.commentsCount}</span>
          </button>
          
          <button 
            className="action-btn"
            onClick={(e) => { e.stopPropagation(); /* Share functionality */ }}
          >
            <FontAwesomeIcon icon={faShare} />
          </button>
        </div>
        
        <button 
          className={`action-btn ${post.isSaved ? 'saved' : ''}`}
          onClick={(e) => { e.stopPropagation(); toggleSave(post._id); }}
        >
          <FontAwesomeIcon icon={post.isSaved ? faBookmark : faBookmarkRegular} />
        </button>
      </footer>
    </article>
  );

  return (
    <div className="category-timeline">
      {/* Category Header */}
      <header className="category-header" style={{ backgroundColor: currentCategory.color + '15' }}>
        <div className="category-info">
          <div className="category-icon" style={{ color: currentCategory.color }}>
            <FontAwesomeIcon icon={currentCategory.icon} />
          </div>
          <div>
            <h1 className="category-title">{currentCategory.name}</h1>
            <p className="category-description">{currentCategory.description}</p>
          </div>
        </div>
        
        {/* Active Users */}
        {activeUsers.length > 0 && (
          <div className="active-users">
            <span className="active-label">Active now:</span>
            <div className="user-avatars">
              {activeUsers.slice(0, 5).map(user => (
                <img 
                  key={user._id}
                  src={user.profilePicture || '/api/placeholder/30/30'}
                  alt={user.username}
                  className="user-avatar"
                  title={user.fullName}
                />
              ))}
              {activeUsers.length > 5 && (
                <span className="more-users">+{activeUsers.length - 5}</span>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Controls */}
      <div className="timeline-controls">
        <div className="left-controls">
          {/* Search */}
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} />
            <input 
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          
          {/* Filters */}
          <button 
            className={`filter-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FontAwesomeIcon icon={faFilter} />
            Filters
          </button>
        </div>

        <div className="right-controls">
          {/* View Mode */}
          <div className="view-mode-toggle">
            <button 
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              <FontAwesomeIcon icon={faList} />
            </button>
            <button 
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              <FontAwesomeIcon icon={faTh} />
            </button>
          </div>
          
          {/* Create Post */}
          <Link to="/create-post" className="create-post-btn">
            <FontAwesomeIcon icon={faPaw} />
            Share
          </Link>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label>Sort by:</label>
            <div className="filter-options">
              <button 
                className={sortBy === 'recent' ? 'active' : ''}
                onClick={() => handleFilterChange('sort', 'recent')}
              >
                <FontAwesomeIcon icon={faClock} /> Recent
              </button>
              <button 
                className={sortBy === 'trending' ? 'active' : ''}
                onClick={() => handleFilterChange('sort', 'trending')}
              >
                <FontAwesomeIcon icon={faFire} /> Trending
              </button>
              <button 
                className={sortBy === 'popular' ? 'active' : ''}
                onClick={() => handleFilterChange('sort', 'popular')}
              >
                <FontAwesomeIcon icon={faHeart} /> Popular
              </button>
            </div>
          </div>

          <div className="filter-group">
            <label>Content type:</label>
            <div className="filter-options">
              <button 
                className={filterBy === 'all' ? 'active' : ''}
                onClick={() => handleFilterChange('filter', 'all')}
              >
                All Posts
              </button>
              <button 
                className={filterBy === 'images' ? 'active' : ''}
                onClick={() => handleFilterChange('filter', 'images')}
              >
                <FontAwesomeIcon icon={faImage} /> With Images
              </button>
              <button 
                className={filterBy === 'videos' ? 'active' : ''}
                onClick={() => handleFilterChange('filter', 'videos')}
              >
                <FontAwesomeIcon icon={faVideo} /> Videos
              </button>
              <button 
                className={filterBy === 'questions' ? 'active' : ''}
                onClick={() => handleFilterChange('filter', 'questions')}
              >
                <FontAwesomeIcon icon={faComment} /> Questions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Posts Timeline */}
      <main className="posts-timeline">
        <InfiniteScroll
          dataLength={posts.length}
          next={loadMore}
          hasMore={hasMore}
          loader={
            <div className="loading-spinner">
              <div className="spinner"></div>
              <span>Loading more posts...</span>
            </div>
          }
          endMessage={
            <div className="end-message">
              <FontAwesomeIcon icon={faPaw} />
              <p>You've seen all posts in this category!</p>
              <Link to="/create-post" className="btn-primary">Share your story</Link>
            </div>
          }
        >
          <div className={`posts-grid ${viewMode}`}>
            {posts.map(renderPostCard)}
          </div>
        </InfiniteScroll>

        {posts.length === 0 && !loading && (
          <div className="empty-state">
            <FontAwesomeIcon icon={currentCategory.icon} />
            <h3>No posts yet</h3>
            <p>Be the first to share something in {currentCategory.name}!</p>
            <Link to="/create-post" className="btn-primary">Create Post</Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default CategoryTimeline;