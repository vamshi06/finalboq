/**
 * Requirement Gathering Service
 * Handles multi-step dialogue for BOQ requirement collection
 */

export interface BOQRequirements {
  propertyType?: string;
  area?: number;
  location?: string;
  workTypes?: string[];
  quality?: string;
  additionalNotes?: string;
}

export interface RequirementState {
  conversationId: string;
  state: 'idle' | 'gathering' | 'confirming' | 'complete';
  requirements: BOQRequirements;
  currentStep: number;
  lastActivity: Date;
}

// In-memory state store (can be migrated to Redis later)
const requirementStates = new Map<string, RequirementState>();

// Session timeout: 30 minutes
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Requirement gathering questions with validation
 */
export const REQUIREMENT_QUESTIONS = [
  {
    key: 'propertyType',
    question: '🏠 **What type of property is this for?**\n\nPlease choose one:\n• 1BHK\n• 2BHK\n• 3BHK\n• 4BHK\n• Villa\n• Office\n• Shop/Commercial',
    validation: (value: string) => {
      const validTypes = ['1bhk', '2bhk', '3bhk', '4bhk', 'villa', 'office', 'shop', 'commercial'];
      const normalized = value.toLowerCase().replace(/\s+/g, '');
      return validTypes.some((type) => normalized.includes(type));
    },
    transform: (value: string) => {
      const lower = value.toLowerCase();
      const normalized = lower.replace(/\s+/g, '');

      if (normalized.includes('1bhk')) return '1BHK';
      if (normalized.includes('2bhk')) return '2BHK';
      if (normalized.includes('3bhk')) return '3BHK';
      if (normalized.includes('4bhk')) return '4BHK';
      if (lower.includes('villa')) return 'Villa';
      if (lower.includes('office')) return 'Office';
      if (lower.includes('shop') || lower.includes('commercial')) return 'Shop/Commercial';

      // Fallback: trimmed original answer
      return value.trim();
    },
  },
  {
    key: 'area',
    question: '📏 **What is the carpet area in square feet?**\n\nExample: 900 sqft or just 900',
    validation: (value: string) => {
      const num = parseFloat(value.replace(/[^\d.]/g, ''));
      return !isNaN(num) && num > 0 && num < 100000;
    },
    transform: (value: string) => parseFloat(value.replace(/[^\d.]/g, '')),
  },
  {
    key: 'location',
    question: '📍 **Which location is this property in?**\n\nPlease choose one:\n• BKC, Bandra\n• Wadala\n• Andheri\n• Powai\n• Dadar\n• Navi Mumbai\n• Pune\n• Other (please specify)',
    validation: (value: string) => value.trim().length > 0,
  },
  {
    key: 'workTypes',
    question: '🔨 **What type of work do you need?**\n\nYou can select multiple (comma-separated):\n• Kitchen renovation\n• Bathroom renovation\n• False ceiling\n• Painting (interior)\n• Painting (exterior)\n• Flooring\n• Electrical work\n• Plumbing work\n• Carpentry\n• Full home renovation\n• Other (please specify)',
    validation: (value: string) => value.trim().length > 0,
    transform: (value: string) => value.split(/[,;]/).map(s => s.trim()).filter(Boolean),
  },
  {
    key: 'quality',
    question: '💎 **What quality/budget preference do you have?**\n\nPlease choose one:\n• Economy (Budget-friendly)\n• Standard (Good balance)\n• Premium (High-quality)\n• Luxury (Top-of-the-line)',
    validation: (value: string) => {
      const validQualities = ['economy', 'budget', 'standard', 'premium', 'luxury'];
      return validQualities.some(q => value.toLowerCase().includes(q));
    },
  },
];

/**
 * Get or create requirement state
 */
export function getOrCreateState(conversationId: string): RequirementState {
  let state = requirementStates.get(conversationId);
  
  if (!state) {
    state = {
      conversationId,
      state: 'idle',
      requirements: {},
      currentStep: 0,
      lastActivity: new Date(),
    };
    requirementStates.set(conversationId, state);
  } else {
    state.lastActivity = new Date();
  }
  
  return state;
}

/**
 * Update requirement state
 */
export function updateState(
  conversationId: string,
  updates: Partial<RequirementState>
): RequirementState {
  const state = getOrCreateState(conversationId);
  Object.assign(state, updates);
  state.lastActivity = new Date();
  requirementStates.set(conversationId, state);
  return state;
}

/**
 * Start requirement gathering
 */
export function startGathering(conversationId: string): string {
  const state = getOrCreateState(conversationId);
  
  state.state = 'gathering';
  state.currentStep = 0;
  state.requirements = {};
  
  updateState(conversationId, state);
  
  return `Great! Let me gather some details to create an accurate BOQ for you. 📋\n\n${REQUIREMENT_QUESTIONS[0].question}`;
}

/**
 * Process user answer for current step
 */
export function processAnswer(
  conversationId: string,
  answer: string
): {
  success: boolean;
  message: string;
  isComplete?: boolean;
  requirements?: BOQRequirements;
} {
  const state = getOrCreateState(conversationId);
  
  if (state.state !== 'gathering') {
    return {
      success: false,
      message: 'No active requirement gathering session. Type "I need BOQ" or "generate estimate" to start.',
    };
  }
  
  const currentQuestion = REQUIREMENT_QUESTIONS[state.currentStep];
  
  if (!currentQuestion) {
    return {
      success: false,
      message: 'Invalid step. Please restart by typing "generate BOQ".',
    };
  }
  
  // Validate answer
  if (!currentQuestion.validation(answer)) {
    return {
      success: false,
      message: `❌ Invalid answer. Please provide a valid response.\n\n${currentQuestion.question}`,
    };
  }
  
  // Transform and store answer
  const value = currentQuestion.transform ? currentQuestion.transform(answer) : answer;
  state.requirements[currentQuestion.key as keyof BOQRequirements] = value as any;
  
  // Move to next step
  state.currentStep++;
  
  // Check if all questions answered
  if (state.currentStep >= REQUIREMENT_QUESTIONS.length) {
    state.state = 'confirming';
    updateState(conversationId, state);
    
    return {
      success: true,
      message: generateConfirmationMessage(state.requirements),
      isComplete: true,
      requirements: state.requirements,
    };
  }
  
  // Ask next question
  const nextQuestion = REQUIREMENT_QUESTIONS[state.currentStep];
  updateState(conversationId, state);
  
  return {
    success: true,
    message: `✅ Got it!\n\n${nextQuestion.question}`,
  };
}

/**
 * Generate confirmation message
 */
function generateConfirmationMessage(requirements: BOQRequirements): string {
  const workList = Array.isArray(requirements.workTypes)
    ? requirements.workTypes.join(', ')
    : requirements.workTypes || 'Not specified';
  
  return `📋 **Perfect! Here's what I understood:**

🏠 **Property:** ${requirements.propertyType || 'N/A'}
📏 **Area:** ${requirements.area || 'N/A'} sqft
📍 **Location:** ${requirements.location || 'N/A'}
🔨 **Work Required:** ${workList}
💎 **Quality Level:** ${requirements.quality || 'N/A'}

${requirements.additionalNotes ? `📝 **Notes:** ${requirements.additionalNotes}\n\n` : ''}**Shall I generate the BOQ with these details?** ✨

Reply with:
• **"Yes"** or **"Generate"** to proceed with BOQ generation
• **"No"** or **"Change"** to modify requirements
• Specify what to change (e.g., "change location to Pune")`;
}

/**
 * Check if user wants to confirm
 */
export function isConfirmation(message: string): boolean {
  const confirmWords = ['yes', 'y', 'generate', 'proceed', 'confirm', 'ok', 'okay', 'sure', 'go ahead', 'please'];
  const lowerMessage = message.toLowerCase().trim();
  return confirmWords.some(word => lowerMessage === word || lowerMessage.startsWith(word));
}

/**
 * Check if user wants to cancel/restart
 */
export function isCancellation(message: string): boolean {
  const cancelWords = ['no', 'n', 'cancel', 'stop', 'restart', 'start over'];
  const lowerMessage = message.toLowerCase().trim();
  return cancelWords.some(word => lowerMessage === word);
}

/**
 * Reset state to idle
 */
export function resetState(conversationId: string): RequirementState {
  return updateState(conversationId, {
    state: 'idle',
    requirements: {},
    currentStep: 0,
  });
}

/**
 * Get current state
 */
export function getState(conversationId: string): RequirementState | undefined {
  return requirementStates.get(conversationId);
}

/**
 * Check if user wants to start BOQ generation
 */
export function detectBOQInitiation(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  const initiationPhrases = [
    'i need boq',
    'need boq',
    'want boq',
    'require boq',
    'i need quotation',
    'need quotation',
    'i need estimate',
    'need estimate',
    'get estimate',
    'want estimate',
    'get quotation',
    'want quotation',
    'renovation estimate',
    'cost estimate',
    'project estimate',
  ];
  
  return initiationPhrases.some(phrase => lowerMessage.includes(phrase));
}

/**
 * Clean up expired states
 */
export function cleanupExpiredStates(): void {
  const now = new Date().getTime();
  
  for (const [id, state] of requirementStates.entries()) {
    const lastActivityTime = state.lastActivity.getTime();
    if (now - lastActivityTime > SESSION_TIMEOUT_MS) {
      requirementStates.delete(id);
      console.log(`🧹 Cleaned up expired requirement state: ${id}`);
    }
  }
}

// Run cleanup every 10 minutes
setInterval(cleanupExpiredStates, 10 * 60 * 1000);

/**
 * Mark state as complete
 */
export function markComplete(conversationId: string): void {
  updateState(conversationId, { state: 'complete' });
}
