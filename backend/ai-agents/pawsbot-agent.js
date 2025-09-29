// Enhanced PawsBot AI Agent using LangGraph-inspired architecture
// This provides a more sophisticated AI response system with state management

const { GoogleGenerativeAI } = require('@google/generative-ai');

class PawsBotAgent {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = null;
    this.conversationHistory = new Map(); // Store conversation states
    this.initialize();
  }

  initialize() {
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-pro",
      systemInstruction: this.getSystemPrompt()
    });
  }

  getSystemPrompt() {
    return `
You are PawsBot, an advanced AI veterinary assistant and pet care expert for the PawsConnect community platform.

CORE EXPERTISE:
- Veterinary knowledge and pet health assessment
- Animal behavior analysis and training guidance  
- Pet nutrition and dietary recommendations
- Emergency first aid for pets
- Breed-specific care requirements
- Multi-species knowledge (dogs, cats, birds, reptiles, small mammals)

RESPONSE FRAMEWORK:
1. ASSESS the situation urgency (Low/Medium/High/CRITICAL)
2. PROVIDE immediate actionable advice
3. IDENTIFY when professional veterinary care is needed
4. OFFER follow-up questions for clarification
5. EDUCATE with relevant pet care knowledge

SAFETY PROTOCOLS:
- ALWAYS prioritize pet safety and welfare
- NEVER provide definitive medical diagnoses
- IMMEDIATELY recommend emergency vet care for serious symptoms
- Acknowledge limitations and defer to veterinary professionals
- Use clear urgency indicators for time-sensitive issues

COMMUNICATION STYLE:
- Empathetic and reassuring tone
- Clear, concise, actionable advice
- Use relevant emojis to enhance readability
- Ask follow-up questions when context is needed
- Provide structured responses with bullet points

EMERGENCY KEYWORDS: If user mentions any of these, immediately assess urgency:
- "emergency", "urgent", "can't breathe", "seizure", "bleeding", "poisoning", 
- "won't eat", "vomiting blood", "unconscious", "severe pain", "accident"

Remember: You're a trusted member of the PawsConnect community helping fellow pet parents!
`;
  }

  // Main message processing with state management
  async processMessage(userId, message, context = {}) {
    try {
      // Retrieve or create conversation state
      const conversationState = this.getConversationState(userId);
      
      // Analyze message for urgency and context
      const messageAnalysis = this.analyzeMessage(message);
      
      // Build enhanced prompt with conversation history
      const enhancedPrompt = this.buildEnhancedPrompt(
        message, 
        context, 
        conversationState, 
        messageAnalysis
      );

      // Generate AI response
      const result = await this.model.generateContent(enhancedPrompt);
      const response = await result.response;
      const botResponse = response.text();

      // Update conversation state
      this.updateConversationState(userId, message, botResponse, messageAnalysis);

      return {
        success: true,
        response: botResponse,
        urgency: messageAnalysis.urgency,
        context: {
          messageType: messageAnalysis.type,
          followUpNeeded: messageAnalysis.needsFollowUp,
          veterinaryRecommended: messageAnalysis.needsVet
        },
        timestamp: new Date()
      };

    } catch (error) {
      console.error('PawsBot Agent Error:', error);
      
      // Intelligent fallback based on message content
      return {
        success: false,
        response: this.generateIntelligentFallback(message, error),
        urgency: 'medium',
        context: { fallback: true },
        timestamp: new Date()
      };
    }
  }

  // Analyze incoming message for patterns and urgency
  analyzeMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    // Emergency keywords
    const emergencyKeywords = [
      'emergency', 'urgent', 'bleeding', 'seizure', 'unconscious', 
      'can\'t breathe', 'choking', 'poisoning', 'accident', 'hit by car'
    ];
    
    // Health concern keywords
    const healthKeywords = [
      'sick', 'ill', 'vomiting', 'diarrhea', 'blood', 'pain', 
      'won\'t eat', 'lethargic', 'fever', 'cough', 'limping'
    ];
    
    // Behavioral keywords
    const behaviorKeywords = [
      'aggressive', 'biting', 'barking', 'anxiety', 'destructive', 
      'training', 'behavior', 'discipline', 'socialization'
    ];
    
    // Nutrition keywords
    const nutritionKeywords = [
      'food', 'feed', 'eating', 'diet', 'nutrition', 'treats', 
      'weight', 'overweight', 'underweight', 'appetite'
    ];

    let urgency = 'low';
    let type = 'general';
    let needsVet = false;
    let needsFollowUp = false;

    // Determine urgency and type
    if (emergencyKeywords.some(keyword => lowerMessage.includes(keyword))) {
      urgency = 'critical';
      type = 'emergency';
      needsVet = true;
    } else if (healthKeywords.some(keyword => lowerMessage.includes(keyword))) {
      urgency = 'high';
      type = 'health';
      needsVet = true;
      needsFollowUp = true;
    } else if (behaviorKeywords.some(keyword => lowerMessage.includes(keyword))) {
      urgency = 'medium';
      type = 'behavior';
      needsFollowUp = true;
    } else if (nutritionKeywords.some(keyword => lowerMessage.includes(keyword))) {
      urgency = 'low';
      type = 'nutrition';
    }

    return {
      urgency,
      type,
      needsVet,
      needsFollowUp,
      keywords: this.extractKeywords(lowerMessage)
    };
  }

  // Build enhanced prompt with conversation context
  buildEnhancedPrompt(message, context, conversationState, analysis) {
    let prompt = `User Message: "${message}"\n`;
    
    // Add urgency context
    prompt += `\nMessage Analysis: ${analysis.type} (${analysis.urgency} urgency)\n`;
    
    // Add conversation history if exists
    if (conversationState.history.length > 0) {
      prompt += '\nRecent Conversation Context:\n';
      conversationState.history.slice(-3).forEach(entry => {
        prompt += `User: ${entry.userMessage}\nBot: ${entry.botResponse.substring(0, 200)}...\n`;
      });
    }
    
    // Add specific context if provided
    if (context.petInfo) {
      prompt += `\nPet Information: ${context.petInfo.type}`;
      if (context.petInfo.age) prompt += `, ${context.petInfo.age} years old`;
      if (context.petInfo.breed) prompt += `, ${context.petInfo.breed}`;
      prompt += '\n';
    }
    
    // Add specialized instructions based on analysis
    if (analysis.urgency === 'critical') {
      prompt += '\n🚨 EMERGENCY RESPONSE REQUIRED: Provide immediate emergency guidance and strongly emphasize need for immediate veterinary care.\n';
    } else if (analysis.needsVet) {
      prompt += '\n⚕️ Health concern detected: Include veterinary consultation recommendation in your response.\n';
    }
    
    return prompt;
  }

  // Get or create conversation state for user
  getConversationState(userId) {
    if (!this.conversationHistory.has(userId)) {
      this.conversationHistory.set(userId, {
        history: [],
        petProfiles: [],
        preferences: {},
        lastInteraction: new Date()
      });
    }
    return this.conversationHistory.get(userId);
  }

  // Update conversation state after interaction
  updateConversationState(userId, userMessage, botResponse, analysis) {
    const state = this.getConversationState(userId);
    
    state.history.push({
      userMessage,
      botResponse,
      analysis,
      timestamp: new Date()
    });
    
    // Keep only last 10 interactions to manage memory
    if (state.history.length > 10) {
      state.history = state.history.slice(-10);
    }
    
    state.lastInteraction = new Date();
  }

  // Extract relevant keywords from message
  extractKeywords(message) {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'my', 'your', 'his', 'her', 'its', 'our', 'their'];
    
    return message
      .split(' ')
      .filter(word => word.length > 2 && !commonWords.includes(word))
      .slice(0, 10); // Top 10 keywords
  }

  // Intelligent fallback responses when AI fails
  generateIntelligentFallback(message, error) {
    const lowerMessage = message.toLowerCase();
    
    // Emergency fallback
    if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent')) {
      return `🚨 **EMERGENCY NOTICE**: I'm experiencing technical difficulties, but this seems urgent! 

**IMMEDIATE ACTION REQUIRED:**
• Contact your emergency veterinarian NOW
• Call animal poison control if suspected poisoning: (888) 426-4435
• Keep your pet calm and safe
• Do not give human medications

🏥 **Find Emergency Vet**: Search "emergency vet near me" or contact your regular vet's after-hours line.`;
    }
    
    // Health concern fallback
    if (lowerMessage.includes('sick') || lowerMessage.includes('health')) {
      return `⚕️ I'm temporarily offline, but health concerns are important!

**General Health Red Flags:**
• Loss of appetite for 24+ hours
• Persistent vomiting or diarrhea  
• Difficulty breathing
• Extreme lethargy
• Signs of pain

📞 **When in doubt, call your vet!** It's always better to be safe when it comes to your pet's health.`;
    }
    
    // Default technical fallback
    return `🤖 I'm experiencing technical difficulties right now, but I don't want to leave you without help!

**While I'm offline:**
• 📱 Post your question in our community for fellow pet parents
• 🔍 Browse our knowledge base and articles  
• 📞 Contact your veterinarian for health concerns
• 🆘 Call emergency vet for urgent situations

I'll be back online soon to provide personalized AI assistance! 🐾`;
  }

  // Clean up old conversation states (call periodically)
  cleanupOldStates() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const [userId, state] of this.conversationHistory.entries()) {
      if (state.lastInteraction < oneDayAgo) {
        this.conversationHistory.delete(userId);
      }
    }
  }
}

module.exports = PawsBotAgent;