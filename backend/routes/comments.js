const express = require('express');
const { body, validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Validation rules for comment creation/update
const commentValidation = [
  body('content')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Comment must be between 1 and 2000 characters')
    .trim()
];

// @route   POST /api/comments
// @desc    Create a new comment
// @access  Private
router.post('/', authenticateToken, commentValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { content, postId, parentCommentId } = req.body;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (!post.isPublished) {
      return res.status(400).json({
        success: false,
        message: 'Cannot comment on unpublished post'
      });
    }

    // If it's a reply, check if parent comment exists
    let parentComment = null;
    if (parentCommentId) {
      parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }

      // Ensure parent comment belongs to the same post
      if (parentComment.post.toString() !== postId) {
        return res.status(400).json({
          success: false,
          message: 'Parent comment does not belong to this post'
        });
      }
    }

    const commentData = {
      content,
      author: req.user._id,
      post: postId,
      parentComment: parentCommentId || null
    };

    const comment = new Comment(commentData);
    await comment.save();

    // Add comment to post's comments array and update count
    await Post.findByIdAndUpdate(postId, {
      $push: { comments: comment._id },
      $inc: { commentsCount: 1 }
    });

    // If it's a reply, add to parent comment's replies
    if (parentComment) {
      parentComment.replies.push(comment._id);
      await parentComment.save();
    }

    await comment.populate('author', 'username fullName profilePicture isVerified');

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: {
        comment
      }
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during comment creation'
    });
  }
});

// @route   GET /api/comments/post/:postId
// @desc    Get comments for a post
// @access  Public
router.get('/post/:postId', optionalAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20, sort = 'newest' } = req.query;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort options
    const sortOptions = {
      'newest': { createdAt: -1 },
      'oldest': { createdAt: 1 },
      'popular': { likesCount: -1 }
    };

    // Get top-level comments (no parent)
    const comments = await Comment.find({
      post: postId,
      parentComment: null,
      isDeleted: false
    })
    .populate('author', 'username fullName profilePicture isVerified')
    .populate({
      path: 'replies',
      populate: {
        path: 'author',
        select: 'username fullName profilePicture isVerified'
      },
      match: { isDeleted: false },
      options: { sort: { createdAt: 1 }, limit: 3 } // Show first 3 replies
    })
    .sort(sortOptions[sort] || sortOptions.newest)
    .skip(skip)
    .limit(parseInt(limit));

    // Add user interaction data if authenticated
    if (req.user) {
      comments.forEach(comment => {
        comment.isLikedByCurrentUser = comment.isLikedByUser(req.user._id);
        comment.replies.forEach(reply => {
          reply.isLikedByCurrentUser = reply.isLikedByUser(req.user._id);
        });
      });
    }

    const total = await Comment.countDocuments({
      post: postId,
      parentComment: null,
      isDeleted: false
    });

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/comments/:commentId/replies
// @desc    Get replies for a comment
// @access  Public
router.get('/:commentId/replies', optionalAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const replies = await Comment.find({
      parentComment: commentId,
      isDeleted: false
    })
    .populate('author', 'username fullName profilePicture isVerified')
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(parseInt(limit));

    // Add user interaction data if authenticated
    if (req.user) {
      replies.forEach(reply => {
        reply.isLikedByCurrentUser = reply.isLikedByUser(req.user._id);
      });
    }

    const total = await Comment.countDocuments({
      parentComment: commentId,
      isDeleted: false
    });

    res.json({
      success: true,
      data: {
        replies,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get replies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/comments/:commentId
// @desc    Update comment
// @access  Private (author only)
router.put('/:commentId', authenticateToken, commentValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (comment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user owns the comment
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments'
      });
    }

    // Update comment
    comment.content = req.body.content;
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    await comment.populate('author', 'username fullName profilePicture isVerified');

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: {
        comment
      }
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during comment update'
    });
  }
});

// @route   DELETE /api/comments/:commentId
// @desc    Delete comment (soft delete)
// @access  Private (author only)
router.delete('/:commentId', authenticateToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (comment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user owns the comment
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments'
      });
    }

    // Soft delete the comment
    await comment.softDelete();

    // Update post's comment count
    await Post.findByIdAndUpdate(comment.post, {
      $inc: { commentsCount: -1 }
    });

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during comment deletion'
    });
  }
});

// @route   POST /api/comments/:commentId/like
// @desc    Like/unlike a comment
// @access  Private
router.post('/:commentId/like', authenticateToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (comment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const isLiked = comment.isLikedByUser(req.user._id);

    if (isLiked) {
      // Unlike the comment
      await comment.removeLike(req.user._id);

      res.json({
        success: true,
        message: 'Comment unliked successfully',
        data: {
          liked: false,
          likesCount: comment.likesCount
        }
      });
    } else {
      // Like the comment
      await comment.addLike(req.user._id);

      res.json({
        success: true,
        message: 'Comment liked successfully',
        data: {
          liked: true,
          likesCount: comment.likesCount
        }
      });
    }
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/comments/:commentId/accept
// @desc    Mark comment as accepted answer
// @access  Private (post author only)
router.post('/:commentId/accept', authenticateToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId)
      .populate('post');

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (comment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user owns the post
    if (comment.post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the post author can accept answers'
      });
    }

    // Check if post is a question
    if (comment.post.type !== 'question') {
      return res.status(400).json({
        success: false,
        message: 'Only questions can have accepted answers'
      });
    }

    // Unmark previous accepted answer if exists
    if (comment.post.acceptedAnswer) {
      await Comment.findByIdAndUpdate(comment.post.acceptedAnswer, {
        isAcceptedAnswer: false
      });
    }

    // Mark this comment as accepted answer
    comment.isAcceptedAnswer = true;
    await comment.save();

    // Update post
    comment.post.acceptedAnswer = comment._id;
    comment.post.isAnswered = true;
    await comment.post.save();

    res.json({
      success: true,
      message: 'Answer accepted successfully',
      data: {
        comment
      }
    });
  } catch (error) {
    console.error('Accept answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/comments/:commentId/report
// @desc    Report a comment
// @access  Private
router.post('/:commentId/report', 
  authenticateToken,
  [
    body('reason')
      .isIn(['spam', 'harassment', 'inappropriate', 'misinformation', 'other'])
      .withMessage('Invalid report reason'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters')
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

      const comment = await Comment.findById(req.params.commentId);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      if (comment.isDeleted) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      // Check if user has already reported this comment
      const hasReported = comment.reports.some(
        report => report.reporter.toString() === req.user._id.toString()
      );

      if (hasReported) {
        return res.status(400).json({
          success: false,
          message: 'You have already reported this comment'
        });
      }

      // Add report
      comment.reports.push({
        reporter: req.user._id,
        reason: req.body.reason,
        description: req.body.description
      });

      comment.reportCount = comment.reports.length;
      await comment.save();

      res.json({
        success: true,
        message: 'Comment reported successfully'
      });
    } catch (error) {
      console.error('Report comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

module.exports = router;