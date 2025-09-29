const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const LangGraphPawsBot = require('../ai-agents/langgraph-pawsbot');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

const router = express.Router();

// Initialize LangGraph PawsBot Agent
let langGraphBot = null;

if (process.env.GEMINI_API_KEY) {
  langGraphBot = new LangGraphPawsBot(process.env.GEMINI_API_KEY, process.env.OPENAI_API_KEY);
  console.log('🚀 Enhanced LangGraph PawsBot Agent initialized');
  
  // Cleanup old conversation states every hour
  setInterval(() => {
    if (langGraphBot && langGraphBot.cleanup) {
      langGraphBot.cleanup();
    }
  }, 60 * 60 * 1000);
} else {
  console.warn('⚠️ GEMINI_API_KEY not found - PawsBot will not be available');
}

// Group Chat Message Schema
const groupChatMessageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: String,
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  category: {
    type: String,
    enum: ['general', 'health-wellness', 'behavior', 'nutrition', 'grooming', 'training'],
    default: 'general'
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  attachments: [{
    url: String,
    type: String,
    name: String
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    content: String,
    timestamp: Date
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance
groupChatMessageSchema.index({ category: 1, createdAt: -1 });
groupChatMessageSchema.index({ user: 1, createdAt: -1 });
groupChatMessageSchema.index({ createdAt: -1 });

const GroupChatMessage = mongoose.model('GroupChatMessage', groupChatMessageSchema);

// Chat validation
const chatValidation = [
  body('message')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters')
    .trim()
];

// @route   POST /api/chat/pawsbot
// @desc    Chat with Enhanced LangGraph PawsBot
// @access  Private
router.post('/pawsbot', authenticateToken, chatValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { message, context } = req.body;
    const userId = req.user._id.toString();

    if (!langGraphBot) {
      return res.status(503).json({
        success: false,
        message: 'PawsBot is temporarily unavailable. Please try again later.'
      });
    }

    // Enhanced context building
    let enhancedContext = { 
      ...context,
      userInfo: {
        username: req.user.username,
        fullName: req.user.fullName
      }
    };
    
    // Add post context if provided
    if (context && context.postId) {
      try {
        const post = await Post.findById(context.postId)
          .populate('author', 'username fullName');
        
        if (post) {
          enhancedContext.postInfo = {
            title: post.title,
            category: post.category,
            content: post.content.substring(0, 500)
          };
        }
      } catch (postError) {
        console.warn('Failed to fetch post context:', postError);
      }
    }

    // Process message with LangGraph bot
    const result = await langGraphBot.processMessage(userId, message, enhancedContext);
    
    res.json({
      success: result.success,
      data: {
        response: result.response,
        urgency: result.urgency,
        category: result.category,
        needsFollowup: result.needsFollowup,
        confidence: result.confidence,
        context: result.context,
        conversationId: result.conversationId,
        timestamp: result.timestamp,
        enhanced: true,
        langGraph: true,
        botVersion: '2.0'
      }
    });

  } catch (error) {
    console.error('PawsBot chat error:', error);
    
    // Intelligent fallback response
    let fallbackResponse = "🤖 I'm experiencing some technical difficulties right now, but I'm here to help! ";
    
    const lowerMessage = (req.body.message || '').toLowerCase();
    if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent')) {
      fallbackResponse = "🚨 I'm having technical issues but this seems urgent! Please contact your veterinarian immediately or call animal poison control: (888) 426-4435";
    } else {
      fallbackResponse += "While I get back online, you can post your question in our community forum where other pet parents can help. Try again in a few minutes! 🐾";
    }

    res.status(200).json({
      success: true,
      data: {
        response: fallbackResponse,
        timestamp: new Date(),
        context: { fallback: true, error: true },
        enhanced: false,
        urgency: lowerMessage.includes('emergency') ? 'high' : 'medium'
      }
    });
  }
});

// @route   POST /api/chat/group/:category
// @desc    Send message to group chat
// @access  Private
router.post('/group/:category', authenticateToken, [
  body('message')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters')
    .trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { category } = req.params;
    const { message, messageType = 'text', attachments = [] } = req.body;
    const userId = req.user._id;
    const username = req.user.username;

    const validCategories = ['general', 'health-wellness', 'behavior', 'nutrition', 'grooming', 'training'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    // Check for user mentions (@username)
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(message)) !== null) {
      const mentionedUser = await User.findOne({ username: match[1] });
      if (mentionedUser) {
        mentions.push(mentionedUser._id);
      }
    }

    // Create new group chat message
    const newMessage = new GroupChatMessage({
      user: userId,
      username,
      message: message.trim(),
      category,
      messageType,
      attachments,
      mentions
    });

    await newMessage.save();
    await newMessage.populate('user', 'username fullName profilePicture isVerified');
    await newMessage.populate('mentions', 'username fullName');

    res.json({
      success: true,
      data: {
        _id: newMessage._id,
        user: newMessage.user,
        username: newMessage.username,
        message: newMessage.message,
        category: newMessage.category,
        messageType: newMessage.messageType,
        attachments: newMessage.attachments,
        mentions: newMessage.mentions,
        reactions: newMessage.reactions,
        timestamp: newMessage.createdAt,
        createdAt: newMessage.createdAt
      }
    });

  } catch (error) {
    console.error('Group chat send error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send group message'
    });
  }
});

// @route   GET /api/chat/group/:category
// @desc    Get group chat messages
// @access  Private
router.get('/group/:category', authenticateToken, async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 50, before } = req.query;

    const validCategories = ['general', 'health-wellness', 'behavior', 'nutrition', 'grooming', 'training'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    // Build query
    let query = { category, isActive: true };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await GroupChatMessage
      .find(query)
      .populate('user', 'username fullName profilePicture isVerified')
      .populate('mentions', 'username fullName')
      .populate('reactions.user', 'username')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await GroupChatMessage.countDocuments({ category, isActive: true });

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Show chronological order for chat UI
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
          hasMore: total > parseInt(page) * parseInt(limit)
        },
        category
      }
    });

  } catch (error) {
    console.error('Group chat get error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get group messages'
    });
  }
});

// @route   POST /api/chat/group/:category/:messageId/react
// @desc    Add reaction to group chat message
// @access  Private
router.post('/group/:category/:messageId/react', authenticateToken, [
  body('emoji')
    .isLength({ min: 1, max: 10 })
    .withMessage('Emoji is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await GroupChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      r => r.user.toString() === userId.toString() && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction
      message.reactions = message.reactions.filter(
        r => !(r.user.toString() === userId.toString() && r.emoji === emoji)
      );
    } else {
      // Add reaction
      message.reactions.push({
        user: userId,
        emoji,
        timestamp: new Date()
      });
    }

    await message.save();

    res.json({
      success: true,
      data: {
        messageId,
        reactions: message.reactions,
        action: existingReaction ? 'removed' : 'added'
      }
    });

  } catch (error) {
    console.error('Group chat reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process reaction'
    });
  }
});

// Legacy endpoints for compatibility
// @route   POST /api/chat/summarize-answers
router.post('/summarize-answers', authenticateToken, async (req, res) => {
  try {
    const { postId, answers } = req.body;
    
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Answers array is required'
      });
    }

    if (!langGraphBot) {
      return res.status(503).json({
        success: false,
        message: 'PawsBot is not available for summarization'
      });
    }

    const summaryPrompt = `Please summarize these community answers about a pet care question:\n\n${answers.map((answer, index) => 
      `Answer ${index + 1}: ${answer.content || answer}`
    ).join('\n\n')}\n\nProvide a concise, helpful summary highlighting the main consensus and key advice.`;
    
    const response = await langGraphBot.processMessage(
      'system-summarizer', 
      summaryPrompt, 
      { type: 'summary', postId }
    );

    res.json({
      success: true,
      data: {
        postId,
        summary: response.response,
        answersCount: answers.length,
        confidence: response.confidence,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Summarize answers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to summarize answers'
    });
  }
});

// @route   POST /api/chat/emergency-check
router.post('/emergency-check', authenticateToken, [
  body('symptoms')
    .isLength({ min: 5, max: 500 })
    .withMessage('Symptoms description must be between 5 and 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { symptoms, petInfo } = req.body;
    const userId = req.user._id.toString();
    
    if (!langGraphBot) {
      return res.status(503).json({
        success: false,
        message: 'Emergency assessment is not available. Please contact your veterinarian immediately.',
        data: {
          assessment: '🚨 Emergency assessment system is offline. Please contact your veterinarian immediately if this is an emergency.',
          urgencyLevel: 'high',
          immediateAction: true
        }
      });
    }

    const emergencyPrompt = `URGENT: Emergency assessment needed! Symptoms: ${symptoms}${
      petInfo ? `\n\nPet Details:\n- Type: ${petInfo.type || 'Not specified'}\n- Age: ${petInfo.age || 'Not specified'}\n- Breed: ${petInfo.breed || 'Not specified'}\n- Weight: ${petInfo.weight || 'Not specified'}` : ''
    }\n\nPlease assess urgency and provide immediate guidance!`;
    
    const response = await langGraphBot.processMessage(
      userId, 
      emergencyPrompt,
      { type: 'emergency', petInfo, urgent: true }
    );

    res.json({
      success: true,
      data: {
        symptoms,
        assessment: response.response,
        urgencyLevel: response.urgency,
        category: response.category,
        immediateAction: response.urgency === 'critical' || response.urgency === 'high',
        vetRecommended: response.urgency !== 'low',
        confidence: response.confidence,
        timestamp: response.timestamp
      }
    });

  } catch (error) {
    console.error('Emergency check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assess emergency situation',
      data: {
        assessment: '🚨 System error occurred during emergency assessment. Please contact your veterinarian immediately if this is an emergency situation.',
        urgencyLevel: 'high',
        immediateAction: true,
        timestamp: new Date()
      }
    });
  }
});

module.exports = router;