import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const industries = ["Fintech", "HealthTech", "AI/ML", "SaaS", "Logistics", "Sustainability", "EdTech", "Cybersecurity", "Web3", "E-commerce"];
    const locations = ["San Francisco", "London", "Singapore", "New York", "Berlin", "Tokyo", "Dubai", "Sydney", "Toronto", "Paris"];
    
    const sponsorNames = ["Venture Peak", "Nexus Capital", "Horizon Funds", "Starlight Ventures", "Alpha Bridge", "Echo Partners", "Quantum Growth", "Blue Chip VC", "Iron Gate", "Velocity Capital"];
    const mentorNames = ["Alex Rivera", "Sarah Jenkins", "Michael Zhang", "Priya Sharma", "David Smith", "Emma Wilson", "Robert Brown", "Linda Garcia", "Thomas Mueller", "Yuki Tanaka"];
    
    const mockEntities = [];

    // Generate 25 Sponsors
    for (let i = 0; i < 25; i++) {
      const industry = industries[i % industries.length];
      mockEntities.push({
        name: `${sponsorNames[i % sponsorNames.length]} ${Math.floor(i / 10) + 1}`,
        type: "Sponsor",
        summary: `Strategic investment firm focused on ${industry} innovation.`,
        industry: industry,
        location: locations[i % locations.length],
        investment_thesis: `We are looking for high-growth startups in ${industry} that demonstrate strong product-market fit and a scalable technical architecture. We provide not just capital, but strategic access to global markets in ${locations[i % locations.length]}.`,
        expertise: [industry, "Scale-up Strategy", "Market Entry"],
        mockEngagementScore: Math.random() * 0.5 + 0.5, // 0.5 - 1.0
        mockFeedbackScore: Math.random() * 0.4 + 0.6,   // 0.6 - 1.0
        createdAt: new Date().toISOString()
      });
    }

    // Generate 25 Mentors
    for (let i = 0; i < 25; i++) {
      const industry = industries[(i + 5) % industries.length];
      mockEntities.push({
        name: `${mentorNames[i % mentorNames.length]} ${Math.floor(i / 10) + 1}`,
        type: "Mentor",
        summary: `Expert mentor with 15+ years of experience in ${industry} and leadership.`,
        industry: industry,
        location: locations[(i + 3) % locations.length],
        expertise: [industry, "Team Management", "Technical Architecture", "Fundraising"],
        summary: `I help early-stage founders navigate the complexities of ${industry}. My background includes leadership roles at top tech companies in ${locations[(i + 3) % locations.length]}.`,
        mockEngagementScore: Math.random() * 0.5 + 0.5,
        mockFeedbackScore: Math.random() * 0.4 + 0.6,
        createdAt: new Date().toISOString()
      });
    }

    // Batch upload to avoid timeout and stay efficient
    const BATCH_SIZE = 20;
    for (let i = 0; i < mockEntities.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const currentBatch = mockEntities.slice(i, i + BATCH_SIZE);
      
      currentBatch.forEach(entity => {
        const docRef = db.collection("entities").doc();
        batch.set(docRef, entity);
      });
      
      await batch.commit();
    }

    return NextResponse.json({ 
      success: true, 
      count: mockEntities.length, 
      message: `Seeded ${mockEntities.length} mock profiles (Sponsors & Mentors) successfully.` 
    });
  } catch (error: any) {
    console.error("Seeding error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
