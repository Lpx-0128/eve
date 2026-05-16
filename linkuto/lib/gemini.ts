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

export async function screenApplications(programme: any, applications: any[]) {
  const model = genai.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
  const prompt = `You are an expert venture capital analyst and startup accelerator director. 
  You are screening applications for the following programme:
  
  Programme Name: ${programme.name}
  Description: ${programme.description}
  Industry Focus: ${(programme.industry_focus || []).join(', ')}
  Eligibility: ${programme.eligibility}
  Perks: ${programme.perks}
  
  Here is an array of applications. Each application has an 'id', 'name', and an 'answers' object containing their responses to the application questions.
  
  Applications:
  ${JSON.stringify(applications.map((app: any) => ({
    id: app.id,
    name: app.name,
    answers: app.answers
  })), null, 2)}
  
  Evaluate each application based on how well it fits the programme's requirements using the Relationship Relevance Index (RRI) components.
  For each applicant, estimate the following 4 scores from 0.0 to 1.0:
  - embeddingSim: Semantic similarity based on industry/keywords alignment.
  - engagementScore: Applicant enthusiasm and depth of answers.
  - profileMatch: Exact alignment with programme eligibility and requirements.
  - feedbackScore: Projected feedback/success rating.
  
  Provide a concise, 1-sentence reasoning for the evaluation.
  
  Return ONLY a valid JSON array of objects with the exact schema below:
  [
    {
      "id": "application_id",
      "embeddingSim": number,
      "engagementScore": number,
      "profileMatch": number,
      "feedbackScore": number,
      "reason": "1-sentence reasoning"
    }
  ]
  
  Return raw JSON only, no markdown wrappers.`;

  const rawResults = await _generateAndParseJSON(model, prompt);
  
  // Dynamically import computeRRI to avoid top-level import issues if any
  const { computeRRI } = await import('./rri');
  
  return rawResults.map((result: any) => {
    // Compute RRI score (0.0 - 1.0) and convert to 0-100 scale for UI
    const rriScore = computeRRI({
      embeddingSim: result.embeddingSim || 0,
      engagementScore: result.engagementScore || 0,
      profileMatch: result.profileMatch || 0,
      feedbackScore: result.feedbackScore || 0
    }, false);
    
    return {
      id: result.id,
      score: Math.round(rriScore * 100),
      reason: result.reason
    };
  });
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
