const express = require('express');
const { body, validationResult } = require('express-validator');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { authenticateToken } = require('../middleware/auth');
const LangGraphPawsBot = require('../ai-agents/langgraph-pawsbot');

const router = express.Router();

// Initialize LangGraph PawsBot Agent
let langGraphBot = null;

if (process.env.GEMINI_API_KEY) {
  langGraphBot = new LangGraphPawsBot(process.env.GEMINI_API_KEY, process.env.OPENAI_API_KEY);
  console.log('🚀 LangGraph PawsBot Agent initialized');
  
  // Cleanup old conversation states every hour
  setInterval(() => {
    langGraphBot.cleanup();
  }, 60 * 60 * 1000);
} else {
  console.warn('⚠️ GEMINI_API_KEY not found - PawsBot will use fallback responses only');
}

// Fallback to basic Gemini AI for compatibility
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy-key');

// Chat validation
const chatValidation = [
  body('message')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters')
    .trim()
];

// PawsBot system prompt
const PAWSBOT_SYSTEM_PROMPT = `
You are PawsBot, an AI assistant specialized in pet care and animal health. You're part of the PawsConnect community platform.

Your expertise includes:
- Dog and cat care, behavior, and training
- Basic veterinary advice (always recommend consulting a vet for serious issues)
- Pet nutrition and feeding guidelines
- Grooming and hygiene tips
- Pet psychology and behavioral issues
- Small animals care (rabbits, birds, hamsters, etc.)
- Pet safety and emergency first aid

Guidelines:
- Be friendly, helpful, and empathetic
- Always prioritize pet safety and wellbeing
- For serious medical issues, always recommend consulting a veterinarian
- Provide practical, actionable advice
- Ask follow-up questions when needed for better assistance
- Keep responses concise but informative
- Use a warm, caring tone that reflects the community spirit
- Include relevant emojis when appropriate

Important: Never provide medical diagnoses. Always recommend professional veterinary care for health concerns.
`;

// @route   POST /api/chat/pawsbot
// @desc    Chat with PawsBot AI using Enhanced Agent
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

    // Enhanced context building
    let enhancedContext = { ...context };
    
    // Add post context if provided
    if (context && context.type === 'post' && context.postId) {
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

    // Use LangGraph PawsBot Agent if available
    if (langGraphBot) {
      const result = await langGraphBot.processMessage(userId, message, enhancedContext);
      
      return res.json({
        success: result.success,
        data: {
          response: result.response,
          urgency: result.urgency,
          category: result.category,
          needsFollowup: result.needsFollowup,
          confidence: result.confidence,
          context: result.context,
          timestamp: result.timestamp,
          enhanced: true,
          langGraph: true
        }
      });
    }

    // Fallback to basic Gemini implementation
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      systemInstruction: PAWSBOT_SYSTEM_PROMPT
    });

    let prompt = message;
    if (enhancedContext.postInfo) {
      prompt = `Context: User is asking about a post titled "${enhancedContext.postInfo.title}" in the ${enhancedContext.postInfo.category} category. The post content is: "${enhancedContext.postInfo.content}"

User question: ${message}`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const botResponse = response.text();

    res.json({
      success: true,
      data: {
        response: botResponse,
        timestamp: new Date(),
        context: enhancedContext,
        enhanced: false
      }
    });

  } catch (error) {
    console.error('PawsBot chat error:', error);
    
    // Generate intelligent fallback response
    let fallbackResponse = "I'm experiencing technical difficulties right now. ";
    
    if (error.message && error.message.includes('API_KEY')) {
      fallbackResponse += "My AI services are temporarily unavailable. Please try again later or contact support.";
    } else if (error.message && error.message.includes('SAFETY')) {
      fallbackResponse += "I can't process that type of request. Please ask me about general pet care topics!";
    } else {
      // Use the enhanced fallback system
      if (langGraphBot) {
        const fallbackResult = langGraphBot.handleError(req.body.message || '', error);
        fallbackResponse = fallbackResult.response;
      } else {
        fallbackResponse += "Please try rephrasing your question about pet care, and I'll do my best to help!";
      }
    }

    res.status(200).json({
      success: true,
      data: {
        response: fallbackResponse,
        timestamp: new Date(),
        context: { fallback: true, error: error.message },
        enhanced: false
      }
    });
  }
});

// @route   POST /api/chat/summarize-answers
// @desc    Summarize answers for a post using AI
// @access  Private
router.post('/summarize-answers', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({
        success: false,
        message: 'Post ID is required'
      });
    }

    // Get the post
    const post = await Post.findById(postId)
      .populate('author', 'username fullName');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Get all comments for the post
    const comments = await Comment.find({
      post: postId,
      isDeleted: false,
      parentComment: null // Only top-level comments
    })
    .populate('author', 'username fullName')
    .sort({ likesCount: -1, createdAt: -1 })
    .limit(10); // Limit to prevent token overflow

    if (comments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No answers found to summarize'
      });
    }

    // Prepare the summarization prompt
    const answersText = comments.map(comment => 
      `Answer by ${comment.author.fullName || comment.author.username} (${comment.likesCount} likes): ${comment.content}`
    ).join('\n\n');

    const prompt = `
Please summarize the following answers to this pet care question:

Question: "${post.title}"
Category: ${post.category}
Question Details: "${post.content.substring(0, 500)}"

Answers:
${answersText}

Provide a comprehensive summary that:
1. Highlights the most common/popular advice
2. Notes any conflicting opinions
3. Emphasizes safety considerations
4. Recommends consulting a veterinarian if mentioned
5. Organizes the information clearly

Keep the summary helpful and easy to understand for pet owners.
`;

    // Get the generative model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      systemInstruction: PAWSBOT_SYSTEM_PROMPT
    });

    // Generate summary
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    res.json({
      success: true,
      data: {
        summary,
        totalAnswers: comments.length,
        postTitle: post.title,
        category: post.category,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Summarize answers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate summary. Please try again.'
    });
  }
});

// @route   POST /api/chat/get-advice
// @desc    Get specific advice for pet care scenarios
// @access  Private
router.post('/get-advice', 
  authenticateToken, 
  [
    body('petType')
      .isIn(['dog', 'cat', 'bird', 'fish', 'rabbit', 'hamster', 'guinea-pig', 'turtle', 'snake', 'lizard', 'other'])
      .withMessage('Invalid pet type'),
    body('category')
      .isIn(['health-wellness', 'behavior', 'nutrition', 'grooming', 'training', 'general-chat'])
      .withMessage('Invalid category'),
    body('issue')
      .isLength({ min: 5, max: 500 })
      .withMessage('Issue description must be between 5 and 500 characters')
      .trim(),
    body('petAge')
      .optional()
      .isInt({ min: 0, max: 50 })
      .withMessage('Pet age must be between 0 and 50'),
    body('petBreed')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Pet breed must be less than 100 characters')
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

      const { petType, category, issue, petAge, petBreed, urgency } = req.body;

      // Create detailed prompt for specific advice
      const prompt = `
I need advice for my ${petType}${petAge ? ` (${petAge} years old)` : ''}${petBreed ? ` - ${petBreed}` : ''}.

Category: ${category}
Issue/Question: ${issue}
${urgency ? `Urgency Level: ${urgency}` : ''}

Please provide:
1. Immediate steps I can take
2. Warning signs to watch for
3. When to contact a veterinarian
4. Long-term care recommendations
5. Prevention tips for the future

Focus on practical, safe advice that prioritizes my pet's wellbeing.
`;

      // Get the generative model
      const model = genAI.getGenerativeModel({ 
        model: "gemini-pro",
        systemInstruction: PAWSBOT_SYSTEM_PROMPT
      });

      // Generate advice
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const advice = response.text();

      res.json({
        success: true,
        data: {
          advice,
          petInfo: {
            type: petType,
            age: petAge,
            breed: petBreed
          },
          category,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Get advice error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get advice. Please try again.'
      });
    }
  }
);

// @route   GET /api/chat/popular-topics
// @desc    Get popular pet care topics for quick help
// @access  Public
router.get('/popular-topics', async (req, res) => {
  try {
    const topics = [
      {
        category: 'health-wellness',
        title: 'Puppy Vaccination Schedule',
        description: 'Learn about essential vaccinations for puppies',
        icon: '💉'
      },
      {
        category: 'behavior',
        title: 'Dog Separation Anxiety',
        description: 'Help your dog cope with being alone',
        icon: '😰'
      },
      {
        category: 'nutrition',
        title: 'Cat Feeding Guidelines',
        description: 'Proper nutrition for cats at different life stages',
        icon: '🍽️'
      },
      {
        category: 'training',
        title: 'House Training Tips',
        description: 'Effective methods for house training puppies',
        icon: '🏠'
      },
      {
        category: 'grooming',
        title: 'Basic Dog Grooming',
        description: 'Essential grooming tasks for healthy dogs',
        icon: '✂️'
      },
      {
        category: 'health-wellness',
        title: 'Signs of Illness in Cats',
        description: 'Recognize when your cat needs veterinary care',
        icon: '🏥'
      },
      {
        category: 'behavior',
        title: 'Litter Box Problems',
        description: 'Solve common litter box issues with cats',
        icon: '📦'
      },
      {
        category: 'nutrition',
        title: 'Toxic Foods for Pets',
        description: 'Foods that are dangerous for dogs and cats',
        icon: '⚠️'
      }
    ];

    res.json({
      success: true,
      data: {
        topics
      }
    });
  } catch (error) {
    console.error('Get popular topics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/chat/emergency-check
// @desc    Quick emergency assessment
// @access  Private
router.post('/emergency-check', 
  authenticateToken,
  [
    body('symptoms')
      .isArray()
      .withMessage('Symptoms must be an array')
      .notEmpty()
      .withMessage('At least one symptom is required'),
    body('petType')
      .isIn(['dog', 'cat', 'bird', 'fish', 'rabbit', 'hamster', 'guinea-pig', 'turtle', 'snake', 'lizard', 'other'])
      .withMessage('Invalid pet type')
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

      const { symptoms, petType, additionalInfo } = req.body;

      const prompt = `
EMERGENCY ASSESSMENT for ${petType}

Symptoms observed:
${symptoms.map(symptom => `- ${symptom}`).join('\n')}

${additionalInfo ? `Additional information: ${additionalInfo}` : ''}

Please provide:
1. IMMEDIATE URGENCY LEVEL (Low/Medium/High/CRITICAL)
2. Immediate first aid steps if any
3. Clear recommendation on whether to seek emergency veterinary care
4. Warning signs that indicate the situation is worsening
5. What information to have ready when calling the vet

Be clear and direct. If this is potentially serious, emphasize the need for immediate veterinary care.
`;

      // Get the generative model
      const model = genAI.getGenerativeModel({ 
        model: "gemini-pro",
        systemInstruction: PAWSBOT_SYSTEM_PROMPT + "\n\nFor emergency assessments, prioritize safety and err on the side of caution. Always recommend professional veterinary care when in doubt."
      });

      // Generate assessment
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const assessment = response.text();

      res.json({
        success: true,
        data: {
          assessment,
          petType,
          symptoms,
          timestamp: new Date(),
          disclaimer: "This is not a substitute for professional veterinary advice. Contact your veterinarian immediately for any serious concerns."
        }
      });
    } catch (error) {
      console.error('Emergency check error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform emergency check. Please contact your veterinarian immediately if this is urgent.'
      });
    }
  }
);

module.exports = router;