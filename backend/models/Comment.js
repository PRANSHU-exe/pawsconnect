const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  // Engagement
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  // Status
  isAcceptedAnswer: {
    type: Boolean,
    default: false
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  // Moderation
  reportCount: {
    type: Number,
    default: 0
  },
  reports: [{
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['spam', 'harassment', 'inappropriate', 'misinformation', 'other']
    },
    description: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ likesCount: -1 });

// Update likes count
commentSchema.methods.updateLikesCount = function() {
  this.likesCount = this.likes.length;
  return this.save();
};

// Check if user liked the comment
commentSchema.methods.isLikedByUser = function(userId) {
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// Add like
commentSchema.methods.addLike = function(userId) {
  if (!this.isLikedByUser(userId)) {
    this.likes.push({ user: userId });
    this.likesCount = this.likes.length;
  }
  return this.save();
};

// Remove like
commentSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  this.likesCount = this.likes.length;
  return this.save();
};

// Soft delete
commentSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.content = '[This comment has been deleted]';
  return this.save();
};

// Virtual for time since creation
commentSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Virtual for depth in thread (for nested comments)
commentSchema.virtual('depth').get(function() {
  let depth = 0;
  let current = this.parentComment;
  while (current) {
    depth++;
    current = current.parentComment;
  }
  return depth;
});

// Ensure virtual fields are serialized
commentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Comment', commentSchema);