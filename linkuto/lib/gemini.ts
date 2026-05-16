import { GoogleGenerativeAI } from '@google/generative-ai';

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function extractCompanyAndCEO(markdown: string) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = genai.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
  
  const prompt = `You are a research analyst extracting data from a startup's website or search results. 
  Your goal is to build a professional profile of the company and identify its key leadership.

  Source Content:
  ${markdown}
  
  Extract the following fields accurately. If not found, use an empty string or empty array.
  {
    "name": "string",
    "headline": "string",
    "expertise": ["string"],
    "summary": "string",
    "ceo_name": "string (Full Name of Founder/CEO)",
    "industry": "string",
    "business_model": "string (e.g., B2B SaaS, Marketplace, D2C)",
    "core_value": "string (key features and product value prop)",
    "target_audience": "string",
    "funding_signals": "string (recent rounds, investors, or bootstrap status mentioned)",
    "social_proof": "string (clients, testimonials, or awards)",
    "location": "string (HQ or geographic focus)",
    "scale": "string (team size, user base, revenue range, or growth metrics)"
  }
  
  Return raw JSON only, no markdown wrappers.`;

  return _generateAndParseJSON(model, prompt);
}

export async function compileFinalProfile(companyData: any, ceoSearchResults: any) {
  const model = genai.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
  
  const prompt = `We have data about a startup and search results about their CEO. 
  Compile this into a final JSON profile.

  Startup Data:
  ${JSON.stringify(companyData, null, 2).substring(0, 20000)}

  CEO Search Results:
  ${JSON.stringify(ceoSearchResults, null, 2).substring(0, 50000)}

  Return ONLY valid JSON in the exact schema below:
  {
    "name": "string",
    "headline": "string",
    "expertise": ["string"],
    "summary": "string",
    "ceo_name": "string",
    "industry": "string",
    "business_model": "string",
    "core_value": "string",
    "target_audience": "string",
    "funding_signals": "string",
    "social_proof": "string",
    "location": "string",
    "scale": "string",
    "ceo_info": "string (summary of background and recent interactions)"
  }

  Return raw JSON only, no markdown wrappers.`;

  return _generateAndParseJSON(model, prompt);
}

export async function extractPersonName(content: string) {
  const model = genai.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
  const prompt = `From the following search results about a company, identify the names of the Founder, CEO, or key leadership.
  
  Content:
  ${content}
  
  Return ONLY a JSON object with the most likely primary founder/CEO name:
  {
    "ceo_name": "Full Name"
  }
  
  If not found, return an empty string for the name. Return raw JSON only.`;

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
