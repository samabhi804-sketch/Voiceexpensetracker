/**
 * Category mapping for automatic expense categorization
 */
const categoryKeywords: Record<string, string[]> = {
  'Food & Dining': [
    'restaurant', 'coffee', 'lunch', 'dinner', 'breakfast', 'cafe', 'starbucks',
    'mcdonalds', 'kfc', 'pizza', 'burger', 'food', 'eat', 'meal', 'snack',
    'restaurant', 'diner', 'bistro', 'bakery', 'donut', 'sandwich', 'sushi',
    'chinese', 'italian', 'mexican', 'thai', 'indian', 'fast food', 'takeout'
  ],
  'Groceries': [
    'grocery', 'groceries', 'supermarket', 'walmart', 'target', 'costco',
    'whole foods', 'safeway', 'kroger', 'publix', 'trader joes', 'market',
    'vegetables', 'fruits', 'meat', 'dairy', 'bread', 'milk', 'eggs',
    'shopping', 'food shopping', 'weekly shopping'
  ],
  'Transportation': [
    'gas', 'gasoline', 'fuel', 'car', 'uber', 'lyft', 'taxi', 'train',
    'bus', 'subway', 'metro', 'parking', 'toll', 'vehicle', 'transport',
    'travel', 'commute', 'flight', 'airline', 'airport', 'rental car',
    'auto', 'motorcycle', 'bike repair'
  ],
  'Entertainment': [
    'movie', 'cinema', 'theater', 'concert', 'show', 'game', 'bowling',
    'amusement', 'park', 'zoo', 'museum', 'netflix', 'spotify', 'music',
    'entertainment', 'fun', 'leisure', 'hobby', 'sports', 'gym membership',
    'streaming', 'subscription', 'gaming', 'books', 'magazine'
  ],
  'Shopping': [
    'amazon', 'clothes', 'clothing', 'shoes', 'shirt', 'pants', 'dress',
    'store', 'mall', 'shopping', 'purchase', 'buy', 'bought', 'retail',
    'electronics', 'phone', 'computer', 'laptop', 'accessories', 'jewelry',
    'cosmetics', 'makeup', 'perfume', 'home goods', 'furniture'
  ],
  'Utilities': [
    'electric', 'electricity', 'gas bill', 'water', 'internet', 'phone bill',
    'cable', 'utility', 'utilities', 'bill', 'power', 'heating', 'cooling',
    'trash', 'garbage', 'recycling', 'sewer', 'landline', 'mobile bill'
  ],
  'Healthcare': [
    'doctor', 'hospital', 'pharmacy', 'medicine', 'prescription', 'medical',
    'health', 'dental', 'dentist', 'clinic', 'checkup', 'surgery', 'therapy',
    'insurance', 'copay', 'medication', 'drugs', 'treatment', 'appointment',
    'urgent care', 'emergency room', 'specialist'
  ],
  'Other': [
    'miscellaneous', 'misc', 'other', 'various', 'random', 'unknown'
  ]
};

/**
 * Categorizes an expense based on its description
 * Uses keyword matching with prioritized categories
 */
export function categorizeExpense(description: string): string {
  if (!description || typeof description !== 'string') {
    return 'Other';
  }

  const normalizedDescription = description.toLowerCase().trim();
  
  // Priority order for categories (more specific first)
  const categoryOrder = [
    'Healthcare',
    'Transportation', 
    'Groceries',
    'Food & Dining',
    'Utilities',
    'Entertainment',
    'Shopping',
    'Other'
  ];

  // Find the best matching category
  for (const category of categoryOrder) {
    const keywords = categoryKeywords[category] || [];
    
    for (const keyword of keywords) {
      if (normalizedDescription.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }

  // Default fallback
  return 'Other';
}

/**
 * Gets suggested categories based on partial input
 */
export function getSuggestedCategories(description: string): string[] {
  if (!description || description.length < 2) {
    return Object.keys(categoryKeywords);
  }

  const normalizedDescription = description.toLowerCase();
  const suggestions: Array<{ category: string; score: number }> = [];

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    let score = 0;
    
    for (const keyword of keywords) {
      if (normalizedDescription.includes(keyword.toLowerCase())) {
        score += keyword.length; // Longer matches get higher scores
      }
    }
    
    if (score > 0) {
      suggestions.push({ category, score });
    }
  }

  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.category);
}

/**
 * Gets all available categories
 */
export function getAllCategories(): string[] {
  return Object.keys(categoryKeywords);
}

/**
 * Validates if a category exists
 */
export function isValidCategory(category: string): boolean {
  return Object.keys(categoryKeywords).includes(category);
}

/**
 * Gets category icon class for display
 */
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'Food & Dining': 'fas fa-utensils',
    'Groceries': 'fas fa-shopping-cart',
    'Transportation': 'fas fa-car',
    'Entertainment': 'fas fa-film',
    'Shopping': 'fas fa-shopping-bag',
    'Utilities': 'fas fa-bolt',
    'Healthcare': 'fas fa-heartbeat',
    'Other': 'fas fa-tag'
  };
  return icons[category] || 'fas fa-receipt';
}

/**
 * Gets category color classes for display
 */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'Food & Dining': 'bg-blue-100 text-blue-600',
    'Groceries': 'bg-green-100 text-green-600', 
    'Transportation': 'bg-red-100 text-red-600',
    'Entertainment': 'bg-purple-100 text-purple-600',
    'Shopping': 'bg-pink-100 text-pink-600',
    'Utilities': 'bg-yellow-100 text-yellow-600',
    'Healthcare': 'bg-indigo-100 text-indigo-600',
    'Other': 'bg-gray-100 text-gray-600'
  };
  return colors[category] || 'bg-gray-100 text-gray-600';
}
