const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Post = require('../models/Post');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile/:username
// @desc    Get user profile by username
// @access  Public (but shows more info if authenticated)
router.get('/profile/:username', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ username })
      .populate('pets', 'name type breed profilePicture')
      .populate('followers', 'username fullName profilePicture')
      .populate('following', 'username fullName profilePicture');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if profile is private and user is not following or is not the owner
    if (user.isPrivate && req.user && req.user._id.toString() !== user._id.toString()) {
      const isFollowing = user.followers.some(
        follower => follower._id.toString() === req.user._id.toString()
      );
      
      if (!isFollowing) {
        return res.json({
          success: true,
          data: {
            user: {
              _id: user._id,
              username: user.username,
              fullName: user.fullName,
              profilePicture: user.profilePicture,
              isPrivate: true,
              totalFollowers: user.totalFollowers,
              totalFollowing: user.totalFollowing,
              joinDate: user.joinDate
            }
          }
        });
      }
    }

    const userData = user.getPublicProfile();

    res.json({
      success: true,
      data: {
        user: userData
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/search
// @desc    Search users
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const searchRegex = new RegExp(q.trim(), 'i');
    
    const users = await User.find({
      $or: [
        { username: searchRegex },
        { fullName: searchRegex }
      ],
      isActive: true,
      isBanned: false
    })
    .select('username fullName profilePicture bio totalFollowers isVerified')
    .sort({ totalFollowers: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await User.countDocuments({
      $or: [
        { username: searchRegex },
        { fullName: searchRegex }
      ],
      isActive: true,
      isBanned: false
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/users/follow/:userId
// @desc    Follow a user
// @access  Private
router.post('/follow/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (userId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentUser = await User.findById(currentUserId);

    // Check if already following
    if (currentUser.following.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You are already following this user'
      });
    }

    // Add to following/followers arrays
    currentUser.following.push(userId);
    userToFollow.followers.push(currentUserId);

    // Update counts
    await currentUser.updateFollowerCount();
    await userToFollow.updateFollowerCount();

    res.json({
      success: true,
      message: 'Successfully followed user',
      data: {
        following: true,
        followersCount: userToFollow.totalFollowers
      }
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/users/follow/:userId
// @desc    Unfollow a user
// @access  Private
router.delete('/follow/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const userToUnfollow = await User.findById(userId);
    if (!userToUnfollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentUser = await User.findById(currentUserId);

    // Check if actually following
    if (!currentUser.following.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You are not following this user'
      });
    }

    // Remove from following/followers arrays
    currentUser.following = currentUser.following.filter(
      id => id.toString() !== userId
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== currentUserId.toString()
    );

    // Update counts
    await currentUser.updateFollowerCount();
    await userToUnfollow.updateFollowerCount();

    res.json({
      success: true,
      message: 'Successfully unfollowed user',
      data: {
        following: false,
        followersCount: userToUnfollow.totalFollowers
      }
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/:userId/followers
// @desc    Get user's followers
// @access  Public
router.get('/:userId/followers', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const user = await User.findById(userId)
      .populate({
        path: 'followers',
        select: 'username fullName profilePicture bio totalFollowers isVerified',
        options: {
          skip,
          limit: parseInt(limit),
          sort: { totalFollowers: -1 }
        }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const total = user.followers.length;

    res.json({
      success: true,
      data: {
        followers: user.followers,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/:userId/following
// @desc    Get users that this user is following
// @access  Public
router.get('/:userId/following', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const user = await User.findById(userId)
      .populate({
        path: 'following',
        select: 'username fullName profilePicture bio totalFollowers isVerified',
        options: {
          skip,
          limit: parseInt(limit),
          sort: { totalFollowers: -1 }
        }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const total = user.following.length;

    res.json({
      success: true,
      data: {
        following: user.following,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/:userId/posts
// @desc    Get user's posts
// @access  Public
router.get('/:userId/posts', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, category } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if profile is private
    if (user.isPrivate && req.user && req.user._id.toString() !== userId) {
      const isFollowing = user.followers.some(
        follower => follower._id.toString() === req.user._id.toString()
      );
      
      if (!isFollowing) {
        return res.status(403).json({
          success: false,
          message: 'This user\'s posts are private'
        });
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { author: userId, isPublished: true };
    
    if (category) {
      query.category = category;
    }

    const posts = await Post.find(query)
      .populate('author', 'username fullName profilePicture isVerified')
      .populate('petMentioned', 'name type breed profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

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
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/suggested
// @desc    Get suggested users to follow
// @access  Private
router.get('/suggested', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const { limit = 5 } = req.query;

    // Find users that current user is not following
    const suggestedUsers = await User.find({
      _id: { 
        $ne: req.user._id,
        $nin: currentUser.following
      },
      isActive: true,
      isBanned: false
    })
    .select('username fullName profilePicture bio totalFollowers isVerified')
    .sort({ totalFollowers: -1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        users: suggestedUsers
      }
    });
  } catch (error) {
    console.error('Get suggested users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/settings
// @desc    Update user settings
// @access  Private
router.put('/settings',
  authenticateToken,
  [
    body('isPrivate').optional().isBoolean().withMessage('isPrivate must be a boolean'),
    body('emailNotifications').optional().isBoolean().withMessage('emailNotifications must be a boolean'),
    body('darkMode').optional().isBoolean().withMessage('darkMode must be a boolean')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const allowedSettings = ['isPrivate', 'emailNotifications', 'darkMode'];
      const updates = {};

      allowedSettings.forEach(setting => {
        if (req.body[setting] !== undefined) {
          updates[setting] = req.body[setting];
        }
      });

      const user = await User.findByIdAndUpdate(
        req.user._id,
        updates,
        { new: true, runValidators: true }
      );

      const userData = user.getPublicProfile();

      res.json({
        success: true,
        message: 'Settings updated successfully',
        data: {
          user: userData
        }
      });
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

module.exports = router;