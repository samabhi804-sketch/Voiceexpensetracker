/// <reference path="../types/speechRecognition.d.ts" />

interface ParsedExpense {
  amount: number;
  description: string;
  date?: Date;
}

/**
 * Parses voice input text to extract expense information
 * Handles various speech patterns like:
 * - "Spent 25 dollars on coffee"
 * - "I paid $30 for gas"
 * - "Bought lunch for 15 bucks"
 * - "Coffee was 4.50"
 */
export function parseVoiceInput(text: string): ParsedExpense | null {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const normalizedText = text.toLowerCase().trim();
  
  // Amount extraction patterns
  const amountPatterns = [
    /(?:spent|paid|cost|was|for)\s*\$?(\d+(?:\.\d{2})?)\s*(?:dollars?|bucks?|$)/i,
    /\$(\d+(?:\.\d{2})?)/,
    /(\d+(?:\.\d{2})?)\s*(?:dollars?|bucks?)/i,
    /(?:spent|paid|cost|was)\s*(\d+(?:\.\d{2})?)/i,
  ];

  let amount: number | null = null;
  
  for (const pattern of amountPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      const parsedAmount = parseFloat(match[1]);
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        amount = parsedAmount;
        break;
      }
    }
  }

  if (!amount) {
    return null;
  }

  // Description extraction - remove amount and common expense words
  let description = text
    .replace(/(?:spent|paid|cost|was|for|i|bought|purchase|purchased)\s*/gi, '')
    .replace(/\$?\d+(?:\.\d{2})?\s*(?:dollars?|bucks?)?/gi, '')
    .replace(/(?:on|for)\s*/gi, '')
    .replace(/(?:this\s+(?:morning|afternoon|evening|night))/gi, '')
    .replace(/(?:today|yesterday|earlier)/gi, '')
    .trim();

  // Clean up description
  description = description.replace(/^(?:on|for|at)\s+/i, '');
  description = description.replace(/\s+/g, ' ').trim();
  
  // If description is too short or empty, try to extract from original text
  if (description.length < 2) {
    const words = text.split(' ').filter(word => 
      !word.match(/^\$?\d+/) && 
      !['spent', 'paid', 'cost', 'was', 'for', 'on', 'i', 'dollars', 'dollar', 'bucks', 'buck'].includes(word.toLowerCase())
    );
    description = words.join(' ').trim();
  }

  // Fallback description
  if (description.length < 2) {
    description = 'Expense';
  }

  // Capitalize first letter
  description = description.charAt(0).toUpperCase() + description.slice(1);

  // Date extraction (basic - defaults to today)
  let date = new Date();
  
  if (normalizedText.includes('yesterday')) {
    date = new Date(Date.now() - 24 * 60 * 60 * 1000);
  } else if (normalizedText.includes('this morning')) {
    date.setHours(9, 0, 0, 0);
  } else if (normalizedText.includes('this afternoon')) {
    date.setHours(14, 0, 0, 0);
  } else if (normalizedText.includes('this evening') || normalizedText.includes('tonight')) {
    date.setHours(19, 0, 0, 0);
  }

  return {
    amount,
    description,
    date
  };
}

/**
 * Validates parsed expense data
 */
export function validateParsedExpense(expense: ParsedExpense): boolean {
  return (
    expense &&
    typeof expense.amount === 'number' &&
    expense.amount > 0 &&
    expense.amount < 10000 && // reasonable upper limit
    typeof expense.description === 'string' &&
    expense.description.length > 0 &&
    expense.description.length < 200 // reasonable description length
  );
}

/**
 * Formats amount for display
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Speech recognition error handler
 */
export function handleSpeechError(error: SpeechRecognitionErrorEvent): string {
  switch (error.error) {
    case 'no-speech':
      return "No speech detected. Please try speaking again.";
    case 'audio-capture':
      return "Microphone access denied. Please check your permissions.";
    case 'not-allowed':
      return "Microphone access is required for voice input.";
    case 'network':
      return "Network error. Please check your connection and try again.";
    case 'aborted':
      return "Speech recognition was aborted.";
    case 'service-not-allowed':
      return "Speech recognition service is not allowed.";
    default:
      return "Speech recognition failed. Please try again.";
  }
}

/**
 * Check if browser supports speech recognition
 */
export function isSpeechRecognitionSupported(): boolean {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}
