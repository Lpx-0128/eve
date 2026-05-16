import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const organiserId = "mock-organiser-id"; // We just need a dummy ID
    
    // 1. Create a dummy programme
    const programmeRef = db.collection("programmes").doc();
    const programmeData = {
      name: "Global AI Innovators Accelerator 2026",
      description: "A prestigious 12-week accelerator designed exclusively for AI-first startups building the next generation of generative AI applications, infrastructure, and developer tools. We are looking for highly technical founders with a proven track record.",
      organiserId: organiserId,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      programmeType: "Accelerator",
      startDate: "2026-09-01",
      endDate: "2026-11-30",
      applicationDeadline: "2026-08-15",
      location: "San Francisco, CA (Hybrid)",
      maxParticipants: 15,
      eligibility: "Must be a registered company. Must have a working MVP utilizing Generative AI. At least one technical co-founder.",
      perks: "$100k investment for 5% equity. Access to NVIDIA GPUs. Mentorship from OpenAI engineers.",
      websiteUrl: "https://example.com/ai-innovators",
      industry_focus: ["AI/ML", "Developer Tools", "Infrastructure"],
      applicationQuestions: [
        {
          id: "q1",
          label: "What is your startup's core product and how does it use AI?",
          type: "text",
          isCustom: true
        },
        {
          id: "q2",
          label: "Describe your technical architecture and any proprietary models/datasets.",
          type: "text",
          isCustom: true
        },
        {
          id: "q3",
          label: "What is your current traction (MRR, active users, pilots)?",
          type: "text",
          isCustom: true
        }
      ]
    };
    
    await programmeRef.set(programmeData);

    // 2. Create mock applications
    const mockApplications = [
      {
        programmeId: programmeRef.id,
        participantId: "user-1",
        name: "NeuroCore Systems",
        email: "founder@neurocore.ai",
        status: "pending",
        appliedAt: new Date().toISOString(),
        answers: {
          q1: "We build an LLM orchestration layer that dynamically routes requests between smaller, cheaper models and GPT-4 based on task complexity, saving enterprise companies up to 60% on API costs while maintaining 99% accuracy.",
          q2: "We fine-tuned Llama-3 on a proprietary dataset of 5M enterprise queries. Our architecture uses a custom rust-based router and Redis for extremely low-latency caching.",
          q3: "Currently at $15k MRR. We have 3 enterprise pilots running, including one with a Fortune 500 logistics company."
        }
      },
      {
        programmeId: programmeRef.id,
        participantId: "user-2",
        name: "GreenMarket",
        email: "hello@greenmarket.eco",
        status: "pending",
        appliedAt: new Date(Date.now() - 86400000).toISOString(),
        answers: {
          q1: "GreenMarket is an online marketplace connecting local farmers with consumers. We use AI to write better product descriptions for the farmers.",
          q2: "We are built on Shopify and use the OpenAI API to generate text.",
          q3: "We just launched last week, no revenue yet but we have 50 farmers signed up."
        }
      },
      {
        programmeId: programmeRef.id,
        participantId: "user-3",
        name: "DataForge Analytics",
        email: "ceo@dataforge.io",
        status: "pending",
        appliedAt: new Date(Date.now() - 172800000).toISOString(),
        answers: {
          q1: "We are building an automated data pipeline tool for data engineers. It uses AI to automatically write SQL transformations based on plain English requests.",
          q2: "Our backend is written in Python (FastAPI). We utilize LangChain to interface with Anthropic's Claude 3.5 Sonnet to parse the user's intent into dbt models.",
          q3: "$5k MRR, growing 20% MoM. 12 active B2B customers."
        }
      },
      {
        programmeId: programmeRef.id,
        participantId: "user-4",
        name: "PizzaBot",
        email: "mike@pizzabot.com",
        status: "pending",
        appliedAt: new Date(Date.now() - 259200000).toISOString(),
        answers: {
          q1: "We are building a robot that makes pizza. It uses computer vision AI to know when the pizza is perfectly cooked.",
          q2: "We use a Raspberry Pi with a standard camera module and YOLOv8 for crust color detection.",
          q3: "We have built 1 prototype in my garage. Looking for funding to build the second one."
        }
      },
      {
        programmeId: programmeRef.id,
        participantId: "user-5",
        name: "SynthVoice API",
        email: "founders@synthvoice.io",
        status: "pending",
        appliedAt: new Date(Date.now() - 345600000).toISOString(),
        answers: {
          q1: "SynthVoice is an ultra-low latency text-to-speech API designed for conversational AI agents. We achieve sub-100ms latency for streaming audio generation.",
          q2: "We developed a proprietary diffusion model optimized for Apple Silicon and NVIDIA Tensor Cores. It's built in C++ and CUDA, bypassing Python entirely for inference speed.",
          q3: "$50k MRR. We are the default voice provider for 4 major AI calling platforms."
        }
      }
    ];

    const batch = db.batch();
    mockApplications.forEach(app => {
      const appRef = db.collection("applications").doc();
      batch.set(appRef, app);
    });
    
    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      programmeId: programmeRef.id,
      message: `Created 1 sample programme with 5 applications successfully.` 
    });
  } catch (error: any) {
    console.error("Seeding error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
