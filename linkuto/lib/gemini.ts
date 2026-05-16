import { GoogleGenerativeAI } from '@google/generative-ai';

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function enrichProfile(rawData: any) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = genai.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
  
  const prompt = `Convert this raw LinkedIn profile data into a structured JSON format.
  
  Raw Data:
  ${typeof rawData === 'string' ? rawData : JSON.stringify(rawData)}
  
  Extract the following fields. If a field is not found, use an empty string or empty array.
  Return ONLY valid JSON.
  {
    "name": "string (the person's or company's name)",
    "headline": "string (their professional headline or tagline)",
    "expertise": ["string (technologies, domains, or core competencies mentioned)"],
    "company_history": ["string (names of companies they worked for)"],
    "summary": "string (a concise 2-3 sentence professional summary based on the data)"
  }
  
  Your response MUST be raw JSON, no markdown formatting (do not wrap in \`\`\`json).
  `;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    // Clean up markdown formatting if Gemini still includes it
    if (text.startsWith('\`\`\`json')) {
      text = text.replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
    } else if (text.startsWith('\`\`\`')) {
      text = text.replace(/^\`\`\`\n/, '').replace(/\n\`\`\`$/, '');
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini enrichment error:', error);
    throw new Error('Failed to enrich profile via Gemini API.');
  }
}
