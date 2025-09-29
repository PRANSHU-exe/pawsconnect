const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Validation rules for post creation/update
const postValidation = [
  body('title')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters')
    .trim(),
  body('content')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Content must be between 10 and 5000 characters'),
  body('category')
    .isIn(['health-wellness', 'behavior', 'nutrition', 'grooming', 'training', 'general-chat'])
    .withMessage('Invalid category'),
  body('type')
    .optional()
    .isIn(['question', 'discussion', 'experience', 'photo', 'tip'])
    .withMessage('Invalid post type'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters')
];

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', authenticateToken, postValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const postData = {
      ...req.body,
      author: req.user._id
    };

    const post = new Post(postData);
    await post.save();

    // Add post to user's posts array and update count
    await User.findByIdAndUpdate(req.user._id, {
      $push: { posts: post._id },
      $inc: { totalPosts: 1 }
    });

    await post.populate('author', 'username fullName profilePicture isVerified');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        post
      }
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during post creation'
    });
  }
});

// @route   GET /api/posts
// @desc    Get posts with filters and pagination
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      category,
      type,
      tags,
      sort = 'newest',
      page = 1,
      limit = 10,
      author,
      search
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { isPublished: true };

    // Apply filters
    if (category) query.category = category;
    if (type) query.type = type;
    if (author) query.author = author;
    
    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagsArray };
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { content: searchRegex },
        { tags: searchRegex }
      ];
    }

    // Sort options
    const sortOptions = {
      'newest': { createdAt: -1 },
      'oldest': { createdAt: 1 },
      'popular': { likesCount: -1, commentsCount: -1 },
      'trending': { engagementScore: -1 },
      'most-liked': { likesCount: -1 },
      'most-commented': { commentsCount: -1 }
    };

    const posts = await Post.find(query)
      .populate('author', 'username fullName profilePicture isVerified')
      .populate('petMentioned', 'name type breed profilePicture')
      .sort(sortOptions[sort] || sortOptions.newest)
      .skip(skip)
      .limit(parseInt(limit));

    // Add user interaction data if authenticated
    if (req.user) {
      posts.forEach(post => {
        post.isLikedByCurrentUser = post.isLikedByUser(req.user._id);
      });
    }

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/posts/timeline
// @desc    Get timeline posts for category with advanced filtering
// @access  Private
router.get('/timeline', authenticateToken, async (req, res) => {
  try {
    const {
      category = 'general',
      sort = 'recent',
      filter = 'all',
      search = '',
      page = 1,
      limit = 20
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { isPublished: true };

    // Category filter
    if (category !== 'all') {
      query.category = category;
    }

    // Content type filter
    if (filter === 'images') {
      query.images = { $exists: true, $not: { $size: 0 } };
    } else if (filter === 'videos') {
      query.videos = { $exists: true, $not: { $size: 0 } };
    } else if (filter === 'questions') {
      query.type = 'question';
    }

    // Search filter
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { content: searchRegex },
        { tags: searchRegex }
      ];
    }

    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'trending':
        // Calculate trending based on recent engagement
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        sortOption = { 
          engagementScore: -1, 
          createdAt: -1 
        };
        break;
      case 'popular':
        sortOption = { likesCount: -1, commentsCount: -1 };
        break;
      case 'recent':
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    // Fetch posts
    const posts = await Post.find(query)
      .populate('author', 'username fullName profilePicture isVerified')
      .populate('petMentioned', 'name type breed profilePicture')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Add user interaction data
    const postsWithInteractions = posts.map(post => ({
      ...post,
      isLiked: req.user.likedPosts ? req.user.likedPosts.includes(post._id.toString()) : false,
      isSaved: req.user.savedPosts ? req.user.savedPosts.includes(post._id.toString()) : false
    }));

    // Get total count for pagination
    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      data: {
        posts: postsWithInteractions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
          hasMore: total > parseInt(page) * parseInt(limit)
        },
        category,
        filters: {
          sort,
          filter,
          search
        }
      }
    });
  } catch (error) {
    console.error('Timeline fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch timeline'
    });
  }
});

// @route   GET /api/posts/trending
// @desc    Get trending posts
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10, timeframe = '24h' } = req.query;

    // Calculate time threshold
    const timeThresholds = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 168,
      '30d': 720
    };

    const hoursAgo = timeThresholds[timeframe] || 24;
    const timeThreshold = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    const trendingPosts = await Post.find({
      isPublished: true,
      createdAt: { $gte: timeThreshold }
    })
    .populate('author', 'username fullName profilePicture isVerified')
    .populate('petMentioned', 'name type breed profilePicture')
    .sort({ engagementScore: -1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        posts: trendingPosts
      }
    });
  } catch (error) {
    console.error('Get trending posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/posts/categories
// @desc    Get posts grouped by categories with stats
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      { key: 'health-wellness', name: 'Health & Wellness', icon: '🏥' },
      { key: 'behavior', name: 'Behavior', icon: '🧠' },
      { key: 'nutrition', name: 'Nutrition', icon: '🥗' },
      { key: 'grooming', name: 'Grooming', icon: '✂️' },
      { key: 'training', name: 'Training', icon: '🎓' },
      { key: 'general-chat', name: 'General Chat', icon: '💬' }
    ];

    const categoriesWithStats = await Promise.all(
      categories.map(async (category) => {
        const totalPosts = await Post.countDocuments({ 
          category: category.key, 
          isPublished: true 
        });
        
        const recentPosts = await Post.find({ 
          category: category.key, 
          isPublished: true 
        })
        .populate('author', 'username fullName profilePicture isVerified')
        .sort({ createdAt: -1 })
        .limit(3);

        return {
          ...category,
          totalPosts,
          recentPosts
        };
      })
    );

    res.json({
      success: true,
      data: {
        categories: categoriesWithStats
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/posts/:postId
// @desc    Get single post by ID
// @access  Public
router.get('/:postId', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('author', 'username fullName profilePicture isVerified bio')
      .populate('petMentioned', 'name type breed profilePicture');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (!post.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Increment view count
    await post.addView();

    // Add user interaction data if authenticated
    if (req.user) {
      post.isLikedByCurrentUser = post.isLikedByUser(req.user._id);
    }

    res.json({
      success: true,
      data: {
        post
      }
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/posts/:postId
// @desc    Update post
// @access  Private (author only)
router.put('/:postId', authenticateToken, postValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user owns the post
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own posts'
      });
    }

    // Don't allow updating the author or engagement metrics
    const restrictedFields = ['author', 'likes', 'comments', 'shares', 'views', 'likesCount', 'commentsCount', 'sharesCount'];
    restrictedFields.forEach(field => delete req.body[field]);

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.postId,
      req.body,
      { new: true, runValidators: true }
    ).populate('author', 'username fullName profilePicture isVerified');

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: {
        post: updatedPost
      }
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during post update'
    });
  }
});

// @route   DELETE /api/posts/:postId
// @desc    Delete post
// @access  Private (author only)
router.delete('/:postId', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user owns the post
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts'
      });
    }

    // Delete all comments associated with this post
    await Comment.deleteMany({ post: req.params.postId });

    // Remove post from user's posts array and update count
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { posts: post._id },
      $inc: { totalPosts: -1 }
    });

    // Delete the post
    await Post.findByIdAndDelete(req.params.postId);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during post deletion'
    });
  }
});

// @route   POST /api/posts/:postId/like
// @desc    Like/unlike a post
// @access  Private
router.post('/:postId/like', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const isLiked = post.isLikedByUser(req.user._id);

    if (isLiked) {
      // Unlike the post
      await post.removeLike(req.user._id);
      
      // Remove from user's liked posts
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { likedPosts: post._id }
      });

      res.json({
        success: true,
        message: 'Post unliked successfully',
        data: {
          liked: false,
          likesCount: post.likesCount
        }
      });
    } else {
      // Like the post
      await post.addLike(req.user._id);
      
      // Add to user's liked posts
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { likedPosts: post._id }
      });

      res.json({
        success: true,
        message: 'Post liked successfully',
        data: {
          liked: true,
          likesCount: post.likesCount
        }
      });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/posts/:postId/save
// @desc    Save/unsave a post
// @access  Private
router.post('/:postId/save', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const user = await User.findById(req.user._id);
    const isSaved = user.savedPosts ? user.savedPosts.includes(req.params.postId) : false;

    if (isSaved) {
      // Unsave the post
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { savedPosts: post._id }
      });

      res.json({
        success: true,
        message: 'Post unsaved successfully',
        data: {
          saved: false
        }
      });
    } else {
      // Save the post
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { savedPosts: post._id }
      });

      res.json({
        success: true,
        message: 'Post saved successfully',
        data: {
          saved: true
        }
      });
    }
  } catch (error) {
    console.error('Save post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/posts/:postId/share
// @desc    Share a post
// @access  Private
router.post('/:postId/share', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if already shared
    const hasShared = post.shares.some(
      share => share.user.toString() === req.user._id.toString()
    );

    if (hasShared) {
      return res.status(400).json({
        success: false,
        message: 'You have already shared this post'
      });
    }

    // Add share
    post.shares.push({ user: req.user._id });
    post.sharesCount = post.shares.length;
    await post.save();

    res.json({
      success: true,
      message: 'Post shared successfully',
      data: {
        sharesCount: post.sharesCount
      }
    });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/posts/:postId/similar
// @desc    Get similar posts based on category and tags
// @access  Public
router.get('/:postId/similar', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const { limit = 5 } = req.query;

    // Find similar posts based on category and tags
    const similarPosts = await Post.find({
      _id: { $ne: post._id },
      $or: [
        { category: post.category },
        { tags: { $in: post.tags } }
      ],
      isPublished: true
    })
    .populate('author', 'username fullName profilePicture isVerified')
    .sort({ likesCount: -1, createdAt: -1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        posts: similarPosts
      }
    });
  } catch (error) {
    console.error('Get similar posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
