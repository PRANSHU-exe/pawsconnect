// Enhanced PawsBot using LangGraph-inspired architecture with OpenAI
const { GoogleGenerativeAI } = require('@google/generative-ai');

class LangGraphPawsBot {
  constructor(apiKey, openaiKey = null) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.openaiKey = openaiKey;
    this.conversationStates = new Map();
    this.nodes = new Map();
    this.edges = new Map();
    
    this.setupGraph();
  }

  // Setup the conversation graph
  setupGraph() {
    // Define nodes (states in conversation)
    this.nodes.set('start', this.startNode.bind(this));
    this.nodes.set('classify', this.classifyMessage.bind(this));
    this.nodes.set('emergency', this.emergencyHandler.bind(this));
    this.nodes.set('health', this.healthHandler.bind(this));
    this.nodes.set('behavior', this.behaviorHandler.bind(this));
    this.nodes.set('nutrition', this.nutritionHandler.bind(this));
    this.nodes.set('general', this.generalHandler.bind(this));
    this.nodes.set('followup', this.followupHandler.bind(this));
    this.nodes.set('end', this.endNode.bind(this));

    // Define edges (transitions between states)
    this.edges.set('start', ['classify']);
    this.edges.set('classify', ['emergency', 'health', 'behavior', 'nutrition', 'general']);
    this.edges.set('emergency', ['end']);
    this.edges.set('health', ['followup', 'end']);
    this.edges.set('behavior', ['followup', 'end']);
    this.edges.set('nutrition', ['followup', 'end']);
    this.edges.set('general', ['followup', 'end']);
    this.edges.set('followup', ['end']);
  }

  // Main processing function
  async processMessage(userId, message, context = {}) {
    try {
      // Initialize or get conversation state
      let state = this.getConversationState(userId);
      state.currentMessage = message;
      state.context = { ...state.context, ...context };
      state.timestamp = new Date();

      // Start the graph execution
      let currentNode = 'start';
      let result = null;

      while (currentNode !== 'end') {
        const nodeFunction = this.nodes.get(currentNode);
        if (!nodeFunction) {
          throw new Error(`Unknown node: ${currentNode}`);
        }

        result = await nodeFunction(state);
        currentNode = result.nextNode;
        
        // Update state with result
        state = { ...state, ...result.updates };
      }

      // Update conversation history
      this.updateConversationHistory(userId, message, result.response, state);

      return {
        success: true,
        response: result.response,
        urgency: state.urgency || 'low',
        category: state.category || 'general',
        needsFollowup: state.needsFollowup || false,
        confidence: state.confidence || 0.8,
        context: state.context,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('LangGraph PawsBot Error:', error);
      return this.handleError(message, error);
    }
  }

  // Node implementations
  async startNode(state) {
    return {
      nextNode: 'classify',
      updates: { step: 'classification' }
    };
  }

  async classifyMessage(state) {
    const message = state.currentMessage.toLowerCase();
    let category = 'general';
    let urgency = 'low';
    let confidence = 0.5;

    // Emergency detection
    const emergencyKeywords = ['emergency', 'urgent', 'help', 'dying', 'bleeding', 'poisoning', 'seizure', 'unconscious', 'choking', 'accident'];
    if (emergencyKeywords.some(keyword => message.includes(keyword))) {
      return {
        nextNode: 'emergency',
        updates: { category: 'emergency', urgency: 'critical', confidence: 0.95 }
      };
    }

    // Health detection
    const healthKeywords = ['sick', 'ill', 'disease', 'symptoms', 'vet', 'doctor', 'medicine', 'pain', 'hurt', 'injured', 'wound', 'fever', 'vomiting', 'diarrhea'];
    if (healthKeywords.some(keyword => message.includes(keyword))) {
      return {
        nextNode: 'health',
        updates: { category: 'health', urgency: 'high', confidence: 0.85 }
      };
    }

    // Behavior detection
    const behaviorKeywords = ['behavior', 'training', 'aggressive', 'biting', 'barking', 'destructive', 'anxiety', 'scared', 'socialization', 'discipline'];
    if (behaviorKeywords.some(keyword => message.includes(keyword))) {
      return {
        nextNode: 'behavior',
        updates: { category: 'behavior', urgency: 'medium', confidence: 0.8 }
      };
    }

    // Nutrition detection
    const nutritionKeywords = ['food', 'feed', 'eat', 'nutrition', 'diet', 'treats', 'hungry', 'appetite', 'weight', 'overweight'];
    if (nutritionKeywords.some(keyword => message.includes(keyword))) {
      return {
        nextNode: 'nutrition',
        updates: { category: 'nutrition', urgency: 'low', confidence: 0.75 }
      };
    }

    return {
      nextNode: 'general',
      updates: { category: 'general', urgency: 'low', confidence: 0.6 }
    };
  }

  async emergencyHandler(state) {
    const response = `🚨 **EMERGENCY DETECTED** 🚨

This appears to be an urgent situation. Here's what you should do IMMEDIATELY:

🏥 **SEEK EMERGENCY VET CARE NOW**
• Call your emergency vet clinic right away
• If no emergency clinic available, call: (888) 426-4435 (Pet Poison Helpline)
• Keep your pet calm and warm
• Do NOT give human medications

⚡ **While getting help:**
• Monitor breathing and consciousness
• Keep airways clear
• Apply gentle pressure to bleeding wounds
• Note all symptoms and when they started

🚗 **Transport safely:**
• Use a blanket as a stretcher for large pets
• Keep head elevated if conscious
• Drive carefully - your pet needs you safe too

This is NOT a substitute for professional emergency care. GET VETERINARY HELP IMMEDIATELY.`;

    return {
      nextNode: 'end',
      response,
      updates: { needsFollowup: false }
    };
  }

  async healthHandler(state) {
    const message = state.currentMessage;
    
    try {
      // Use AI to generate health advice
      const model = this.genAI.getGenerativeModel({
        model: "gemini-pro",
        systemInstruction: `You are a professional veterinary AI assistant. Provide helpful advice but always emphasize the need for professional veterinary care for health concerns. Be empathetic and informative.`
      });

      const prompt = `Pet health question: "${message}"\n\nPlease provide:\n1. Immediate care advice\n2. When to see a vet\n3. Warning signs to watch for\n4. Reassurance and support\n\nAlways emphasize professional veterinary care for health issues.`;
      
      const result = await model.generateContent(prompt);
      const aiResponse = await result.response;
      
      const response = `🏥 **Pet Health Guidance**

${aiResponse.text()}

⚠️ **Important Reminder:**
This advice doesn't replace professional veterinary care. For any health concerns, please consult with your veterinarian who can properly examine and diagnose your pet.

🔔 Would you like me to help you find emergency vet services in your area?`;

      return {
        nextNode: 'followup',
        response,
        updates: { needsFollowup: true }
      };
    } catch (error) {
      return this.getFallbackHealthResponse(state);
    }
  }

  async behaviorHandler(state) {
    const message = state.currentMessage;
    
    try {
      const model = this.genAI.getGenerativeModel({
        model: "gemini-pro",
        systemInstruction: `You are a professional animal behavior consultant. Provide practical, positive reinforcement-based training advice. Be encouraging and supportive.`
      });

      const prompt = `Pet behavior question: "${message}"\n\nPlease provide:\n1. Understanding the behavior\n2. Positive training techniques\n3. What NOT to do\n4. Timeline expectations\n5. When to seek professional help\n\nFocus on positive reinforcement and patience.`;
      
      const result = await model.generateContent(prompt);
      const aiResponse = await result.response;
      
      const response = `🎓 **Pet Behavior Guidance**

${aiResponse.text()}

💡 **Remember:**
• Consistency is key - everyone in the household should use the same approach
• Positive reinforcement works better than punishment
• Be patient - behavior change takes time
• Consider professional dog training for persistent issues

🤔 Do you have any specific questions about implementing these techniques?`;

      return {
        nextNode: 'followup',
        response,
        updates: { needsFollowup: true }
      };
    } catch (error) {
      return this.getFallbackBehaviorResponse(state);
    }
  }

  async nutritionHandler(state) {
    const message = state.currentMessage;
    
    try {
      const model = this.genAI.getGenerativeModel({
        model: "gemini-pro",
        systemInstruction: `You are a pet nutrition expert. Provide safe, scientifically-backed nutrition advice for pets. Always emphasize the importance of consulting with veterinarians for dietary changes.`
      });

      const prompt = `Pet nutrition question: "${message}"\n\nPlease provide:\n1. Nutritional guidance\n2. Safe food recommendations\n3. Foods to avoid\n4. Portion guidelines\n5. When to consult a vet about diet\n\nEmphasize safety and professional consultation.`;
      
      const result = await model.generateContent(prompt);
      const aiResponse = await result.response;
      
      const response = `🍽️ **Pet Nutrition Guidance**

${aiResponse.text()}

⚠️ **Safety First:**
• Always introduce new foods gradually
• Consult your vet before major dietary changes
• Every pet is different - what works for one may not work for another

🥗 Would you like specific feeding schedule recommendations for your pet's age and size?`;

      return {
        nextNode: 'followup',
        response,
        updates: { needsFollowup: true }
      };
    } catch (error) {
      return this.getFallbackNutritionResponse(state);
    }
  }

  async generalHandler(state) {
    const message = state.currentMessage;
    
    try {
      const model = this.genAI.getGenerativeModel({
        model: "gemini-pro",
        systemInstruction: `You are PawsBot, a friendly and knowledgeable pet care assistant. Provide helpful, warm, and informative responses about general pet care topics. Use emojis appropriately and maintain a caring tone.`
      });

      const conversationHistory = state.history || [];
      let contextPrompt = `Pet care question: "${message}"`;
      
      if (conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-2);
        contextPrompt += `\n\nRecent conversation context:\n${recentHistory.map(entry => 
          `User: ${entry.userMessage}\nBot: ${entry.botResponse.substring(0, 100)}...`
        ).join('\n')}`;
      }

      contextPrompt += `\n\nPlease provide a helpful, friendly response about pet care.`;
      
      const result = await model.generateContent(contextPrompt);
      const aiResponse = await result.response;
      
      const response = `🐾 ${aiResponse.text()}

💬 Is there anything else you'd like to know about pet care?`;

      return {
        nextNode: 'followup',
        response,
        updates: { needsFollowup: true }
      };
    } catch (error) {
      return this.getFallbackGeneralResponse(state);
    }
  }

  async followupHandler(state) {
    // This node handles follow-up questions and maintains conversation flow
    return {
      nextNode: 'end',
      response: state.response, // Pass through the response from previous node
      updates: {}
    };
  }

  async endNode(state) {
    return {
      response: state.response,
      updates: {}
    };
  }

  // Utility methods
  getConversationState(userId) {
    if (!this.conversationStates.has(userId)) {
      this.conversationStates.set(userId, {
        history: [],
        context: {},
        lastInteraction: new Date(),
        preferences: {}
      });
    }
    return this.conversationStates.get(userId);
  }

  updateConversationHistory(userId, userMessage, botResponse, state) {
    const conversationState = this.getConversationState(userId);
    
    conversationState.history.push({
      userMessage,
      botResponse,
      category: state.category,
      urgency: state.urgency,
      timestamp: new Date()
    });

    // Keep last 10 conversations
    if (conversationState.history.length > 10) {
      conversationState.history = conversationState.history.slice(-10);
    }

    conversationState.lastInteraction = new Date();
  }

  handleError(message, error) {
    console.error('PawsBot Error:', error);
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent')) {
      return {
        success: true,
        response: `🚨 I'm experiencing technical difficulties, but this seems urgent! Please contact your emergency veterinarian immediately or call animal poison control: (888) 426-4435`,
        urgency: 'critical',
        category: 'emergency'
      };
    }

    return {
      success: true,
      response: `🤖 I'm having some technical difficulties right now, but I don't want to leave you without help! While I'm getting back online, you can:\n\n• 📱 Post your question in our community\n• 📞 Contact your veterinarian for health concerns\n• 🆘 Call emergency vet for urgent situations\n\nI'll be back online soon! 🐾`,
      urgency: 'low',
      category: 'general'
    };
  }

  // Fallback responses when AI fails
  getFallbackHealthResponse(state) {
    return {
      nextNode: 'end',
      response: `🏥 I'm having trouble accessing my full knowledge right now, but health concerns are important!\n\n**General Health Red Flags:**\n• Loss of appetite for 24+ hours\n• Persistent vomiting or diarrhea\n• Difficulty breathing\n• Extreme lethargy\n• Signs of pain\n\n📞 **When in doubt, call your vet!** It's always better to be safe.`,
      updates: { needsFollowup: false }
    };
  }

  getFallbackBehaviorResponse(state) {
    return {
      nextNode: 'end',
      response: `🎓 Training takes patience! Here are some universal tips:\n\n• **Positive reinforcement** works best\n• **Consistency** from all family members\n• **Short training sessions** (5-10 minutes)\n• **High-value treats** for motivation\n• **Never punish** - redirect instead\n\n🏆 Every pet learns at their own pace!`,
      updates: { needsFollowup: false }
    };
  }

  getFallbackNutritionResponse(state) {
    return {
      nextNode: 'end',
      response: `🍽️ Nutrition basics while I'm offline:\n\n• **Fresh water** always available\n• **Age-appropriate** pet food\n• **Regular feeding schedule**\n• **Avoid** chocolate, onions, grapes, xylitol\n• **Portion control** based on size/activity\n\n⚠️ Always consult your vet for dietary changes!`,
      updates: { needsFollowup: false }
    };
  }

  getFallbackGeneralResponse(state) {
    return {
      nextNode: 'end',
      response: `🐾 I'm temporarily offline, but here's what you can do:\n\n• 📱 Ask our community for advice\n• 🔍 Browse our knowledge base\n• 📞 Contact your vet for concerns\n• 🆘 Emergency vet for urgent issues\n\nI'll be back soon with better answers! 🤖`,
      updates: { needsFollowup: false }
    };
  }

  // Cleanup old conversation states
  cleanup() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const [userId, state] of this.conversationStates.entries()) {
      if (state.lastInteraction < oneDayAgo) {
        this.conversationStates.delete(userId);
      }
    }
  }
}

module.exports = LangGraphPawsBot;