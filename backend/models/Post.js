const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  category: {
    type: String,
    required: true,
    enum: ['health-wellness', 'behavior', 'nutrition', 'grooming', 'training', 'general-chat']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  images: [{
    url: String,
    caption: {
      type: String,
      maxlength: 200
    },
    alt: {
      type: String,
      maxlength: 100
    }
  }],
  petMentioned: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet'
  },
  type: {
    type: String,
    enum: ['question', 'discussion', 'experience', 'photo', 'tip'],
    default: 'discussion'
  },
  // Engagement metrics
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
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  shares: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  views: {
    type: Number,
    default: 0
  },
  // Computed fields
  likesCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  sharesCount: {
    type: Number,
    default: 0
  },
  // Status and moderation
  isPublished: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  // For question-type posts
  isAnswered: {
    type: Boolean,
    default: false
  },
  acceptedAnswer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
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
  // SEO and searchability
  slug: {
    type: String,
    unique: true,
    sparse: true
  },
  searchKeywords: [{
    type: String
  }]
}, {
  timestamps: true
});

// Indexes for performance
postSchema.index({ author: 1 });
postSchema.index({ category: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ likesCount: -1 });
postSchema.index({ isPinned: -1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ slug: 1 });

// Generate slug from title
postSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
    
    // Make slug unique by appending timestamp if needed
    if (this.isNew) {
      this.slug += '-' + Date.now();
    }
  }
  next();
});

// Update engagement counts
postSchema.methods.updateCounts = function() {
  this.likesCount = this.likes.length;
  this.commentsCount = this.comments.length;
  this.sharesCount = this.shares.length;
  return this.save();
};

// Check if user liked the post
postSchema.methods.isLikedByUser = function(userId) {
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// Add like
postSchema.methods.addLike = function(userId) {
  if (!this.isLikedByUser(userId)) {
    this.likes.push({ user: userId });
    this.likesCount = this.likes.length;
  }
  return this.save();
};

// Remove like
postSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  this.likesCount = this.likes.length;
  return this.save();
};

// Add view
postSchema.methods.addView = function() {
  this.views += 1;
  return this.save();
};

// Virtual for engagement score (for sorting)
postSchema.virtual('engagementScore').get(function() {
  const now = new Date();
  const ageInHours = (now - this.createdAt) / (1000 * 60 * 60);
  const baseScore = (this.likesCount * 3) + (this.commentsCount * 5) + (this.views * 0.1);
  
  // Decay score based on age
  const decayFactor = Math.exp(-ageInHours / 24); // Exponential decay over 24 hours
  return baseScore * decayFactor;
});

// Virtual for time since creation
postSchema.virtual('timeAgo').get(function() {
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

// Ensure virtual fields are serialized
postSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Post', postSchema);