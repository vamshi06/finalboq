import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCujGKkHIfs8Uq7dps2GxxFJFJDhG8taFQ';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Generate AI-powered suggestions for BOQ optimization
 * @param boq BOQ data object
 * @returns Promise<string[]> - Array of suggestions from AI
 */
export async function generateAiSuggestions(boq: any): Promise<string[]> {
  try {
    // Prepare BOQ summary for AI analysis
    const departmentTotals: { [key: string]: number } = {};
    const itemCount: { [key: string]: number } = {};

    boq.boqLines?.forEach((line: any) => {
      const dept = line.dept || 'Others';
      if (!departmentTotals[dept]) departmentTotals[dept] = 0;
      if (!itemCount[dept]) itemCount[dept] = 0;
      departmentTotals[dept] += line.elemantraAmount || 0;
      itemCount[dept]++;
    });

    const totalAmount = Object.values(departmentTotals).reduce((a: number, b: number) => a + b, 0);
    const areaSqft = boq.meta?.areaSqft || 1673;
    const costPerSqft = Math.round(totalAmount / areaSqft);

    // Create detailed BOQ summary for AI
    const boqSummary = `
BOQ Summary:
- Total Budget: ₹${totalAmount.toLocaleString()}
- Area: ${areaSqft} sqft
- Cost per Sqft: ₹${costPerSqft}
- Number of Items: ${boq.boqLines?.length || 0}

Department Breakdown:
${Object.entries(departmentTotals)
  .map(([dept, amount]: [string, any]) => `- ${dept}: ₹${amount.toLocaleString()} (${itemCount[dept]} items)`)
  .join('\n')}

Top Expense Items:
${boq.boqLines
  ?.sort((a: any, b: any) => (b.elemantraAmount || 0) - (a.elemantraAmount || 0))
  .slice(0, 10)
  .map((item: any, i: number) => `${i + 1}. ${item.itemName}: ₹${(item.elemantraAmount || 0).toLocaleString()}`)
  .join('\n')}
    `;

    // Call Gemini API
    const prompt = `
You are a construction and interior design expert. Analyze this Bill of Quantities (BOQ) and provide actionable suggestions for cost optimization, material selection improvements, and quality enhancement.

${boqSummary}

Provide suggestions in the following format:
1. Cost Optimization Opportunities (3-4 specific recommendations)
2. Material & Quality Improvements (2-3 specific recommendations)
3. Timeline & Construction Phase Recommendations (2-3 specific recommendations)
4. Risk Mitigation Suggestions (2-3 specific recommendations)

Make sure suggestions are practical, implementable, and specific to the project data provided.
    `;

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract suggestions from response
    const suggestionsText =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse suggestions into array
    if (suggestionsText) {
      // Split by numbered lines or bullet points
      const suggestions = suggestionsText
        .split(/\n+/)
        .map(line => line.trim())
        .filter(line => line.length > 10 && (line.match(/^\d+\./) || line.match(/^[\-\u2022]/)))
        .map(line => line.replace(/^\d+\.\s*/, '').replace(/^[\-\u2022]\s*/, ''))
        .filter(Boolean);
      
      return suggestions.length > 0 ? suggestions : [suggestionsText];
    }

    return getDefaultSuggestions(boq);
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    // Return default suggestions if API fails
    return getDefaultSuggestions(boq);
  }
}

/**
 * Fallback suggestions when AI API fails
 */
function getDefaultSuggestions(boq: any): string[] {
  const departmentTotals: { [key: string]: number } = {};

  boq.boqLines?.forEach((line: any) => {
    const dept = line.dept || 'Others';
    if (!departmentTotals[dept]) departmentTotals[dept] = 0;
    departmentTotals[dept] += line.elemantraAmount || 0;
  });

  const carpentryAmount = departmentTotals['Carpentry'] || 0;
  const paintingAmount = departmentTotals['Painting'] || 0;
  const civilAmount = departmentTotals['Civil'] || 0;
  const totalAmount = Object.values(departmentTotals).reduce((a: number, b: number) => a + b, 0);

  return [
    `💰 Carpentry represents ${Math.round((carpentryAmount / totalAmount) * 100)}% of budget. Consider bulk material purchases for 10-15% discounts.`,
    `🎨 Painting represents ${Math.round((paintingAmount / totalAmount) * 100)}% of budget. Evaluate premium paints with longer warranties to reduce repainting costs.`,
    `🏭 Consider value engineering for finishes - you can achieve similar aesthetics at 15-20% lower cost with smart material choices.`,
    `💧 Upgrade to water-resistant materials in bathrooms and kitchens. This prevents moisture damage and saves 30-40% on future repairs.`,
    `🌿 Use eco-friendly and low-VOC paints for healthier indoor air quality, especially important for bedrooms and children's rooms.`,
    `🔨 Civil work should be completed first before carpentry to avoid rework. This saves 10-15% in labor costs.`,
    `⏰ Schedule painting in final phases to protect fresh finishes. Consider doing touch-ups after all other work is complete.`,
    `📦 Plan phased procurement to avoid storage issues and material degradation. Order items 1-2 weeks before installation.`,
    `🛡️ Include 5-10% contingency buffer for unforeseen expenses like hidden structural issues or price fluctuations.`,
    `📝 Specify material quality standards clearly in contracts. Include brand names, grades, and quality certifications.`
  ];
}

/**
 * Generate cost analysis from BOQ data
 */
export async function generateCostAnalysis(boq: any): Promise<{
  totalBudget: number;
  costPerSqft: number;
  departmentBreakdown: { [key: string]: number };
  topExpenses: Array<{ item: string; amount: number; percentage: number }>;
}> {
  const departmentTotals: { [key: string]: number } = {};
  const areaSqft = boq.meta?.areaSqft || 1673;

  boq.boqLines?.forEach((line: any) => {
    const dept = line.dept || 'Others';
    if (!departmentTotals[dept]) departmentTotals[dept] = 0;
    departmentTotals[dept] += line.elemantraAmount || 0;
  });

  const totalBudget = Object.values(departmentTotals).reduce((a: number, b: number) => a + b, 0);
  const costPerSqft = Math.round(totalBudget / areaSqft);

  const topExpenses = boq.boqLines
    ?.sort((a: any, b: any) => (b.elemantraAmount || 0) - (a.elemantraAmount || 0))
    .slice(0, 10)
    .map((item: any) => ({
      item: item.itemName,
      amount: item.elemantraAmount || 0,
      percentage: Math.round(((item.elemantraAmount || 0) / totalBudget) * 100)
    })) || [];

  return {
    totalBudget,
    costPerSqft,
    departmentBreakdown: departmentTotals,
    topExpenses
  };
}
