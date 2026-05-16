import { GoogleGenerativeAI } from '@google/generative-ai';

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function extractCompanyAndCEO(markdown: string) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = genai.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
  
  const prompt = `You are extracting data from a startup's website. Convert the provided markdown into a structured JSON format.
  
  Raw Markdown:
  ${markdown}
  
  Extract the following fields. If a field is not found, use an empty string or empty array.
  Return ONLY valid JSON.
  {
    "name": "string (the company's name)",
    "headline": "string (their main tagline or value proposition)",
    "expertise": ["string (technologies, domains, or core competencies mentioned)"],
    "summary": "string (a concise 2-3 sentence professional summary based on the data)",
    "ceo_name": "string (name of the Founder or CEO, if found)"
  }
  
  Your response MUST be raw JSON, no markdown formatting (do not wrap in \`\`\`json).
  `;

  return _generateAndParseJSON(model, prompt);
}

export async function compileFinalProfile(companyData: any, ceoSearchResults: any) {
  const model = genai.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
  
  const prompt = `We have data about a startup and search results about their CEO. 
  Compile this into a final JSON profile.

  Startup Data:
  ${JSON.stringify(companyData, null, 2)}

  CEO Search Results:
  ${JSON.stringify(ceoSearchResults, null, 2)}

  Return ONLY valid JSON in the exact schema below:
  {
    "name": "string (the company's name)",
    "headline": "string (their main tagline or value proposition)",
    "expertise": ["string (technologies, domains, or core competencies mentioned)"],
    "summary": "string (a concise 2-3 sentence professional summary based on the data)",
    "ceo_name": "string (name of the Founder or CEO, if found)",
    "ceo_info": "string (a concise 2-3 sentence summary of the CEO's background, recent news, or interactions based on the search results. Empty if none found)"
  }

  Your response MUST be raw JSON, no markdown formatting (do not wrap in \`\`\`json).
  `;

  return _generateAndParseJSON(model, prompt);
}

async function _generateAndParseJSON(model: any, prompt: string) {
  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
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
