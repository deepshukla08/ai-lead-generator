/**
 * ============================================================================
 * MOCK DATA — NOT REAL. DELETE THIS FILE AS EACH PHASE LANDS.
 * ============================================================================
 *
 * Everything here is invented so the UI can be designed and reviewed before
 * the agents exist. It is deliberately confined to one file: when Phase 5
 * produces real leads, delete the leads section and the import breaks, which
 * is exactly the reminder we want.
 *
 * Nothing in here is ever written to the database.
 */

import type {
  Campaign,
  ChatMessage,
  EmailDraft,
  Lead,
  LeadDetail,
  ProductKnowledge,
  TimelineEvent,
} from "@/lib/types";

export const MOCK_PRODUCT_KNOWLEDGE: ProductKnowledge = {
  products: ["Warehouse Robotics Platform", "Fleet Orchestration Suite"],
  services: ["Deployment & integration", "24/7 fleet monitoring"],
  features: [
    "Autonomous pallet movers",
    "WMS integration (SAP, Manhattan, Blue Yonder)",
    "Real-time fleet telemetry",
    "Predictive maintenance",
  ],
  benefits: [
    "Cuts pick-to-ship time by 30-45%",
    "Removes night-shift staffing dependency",
    "Reduces inventory shrinkage",
  ],
  pain_points: [
    "Seasonal labour shortages",
    "Rising warehouse wage costs",
    "Peak-season throughput ceilings",
    "High picker turnover",
  ],
  industries: ["3PL & logistics", "E-commerce fulfilment", "Grocery distribution"],
  company_sizes: ["200-2,000 employees", "2+ warehouses"],
  differentiators: [
    "Retrofits existing racking — no facility rebuild",
    "6-week deployment vs industry-standard 6 months",
    "Per-robot pricing, no platform fee",
  ],
  competitors: ["Locus Robotics", "6 River Systems", "Geek+"],
  use_cases: ["Peak-season surge capacity", "Night-shift automation", "Goods-to-person picking"],
  value_props: [
    "Throughput without headcount",
    "Deploy in six weeks, not six months",
    "Pay per robot, not per platform",
  ],
  success_stories: [
    { customer: "Nordfracht Logistik", outcome: "38% faster pick-to-ship across 3 sites" },
    { customer: "Bolsa Fulfilment", outcome: "Handled 2.4x Black Friday volume, no temp hires" },
  ],
};

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: "c1",
    name: "EU 3PL Expansion",
    goal: "Find third-party logistics operators in Germany and the Netherlands running multi-site warehouses.",
    status: "running",
    target_criteria: { industry: "3PL", region: "EU", employees: "200-2000" },
    created_at: "2026-07-28T09:12:00Z",
    lead_count: 142,
    qualified_count: 38,
    sent_count: 12,
  },
  {
    id: "c2",
    name: "UK Grocery Distribution",
    goal: "Grocery distributors with cold-chain warehouses and seasonal peaks.",
    status: "researching",
    target_criteria: { industry: "grocery", region: "UK" },
    created_at: "2026-08-02T14:40:00Z",
    lead_count: 67,
    qualified_count: 9,
    sent_count: 0,
  },
  {
    id: "c3",
    name: "Nordics E-commerce",
    goal: "Direct-to-consumer brands with in-house fulfilment.",
    status: "draft",
    target_criteria: {},
    created_at: "2026-08-06T08:05:00Z",
    lead_count: 0,
    qualified_count: 0,
    sent_count: 0,
  },
];

export const MOCK_LEADS: Lead[] = [
  {
    id: "l1",
    campaign_id: "c1",
    status: "outreach_ready",
    fit_score: 94,
    confidence: 0.88,
    qualification_reason:
      "Operates five multi-client warehouses across DE and NL, publicly hiring 40+ warehouse operatives, and their 2025 annual report names labour cost as the top margin pressure.",
    qualification_evidence: [
      {
        claim: "5 warehouses across Germany and Netherlands",
        source: "nordfracht.example/locations",
      },
      {
        claim: "42 open warehouse operative roles",
        source: "linkedin.com/company/nordfracht/jobs",
      },
      {
        claim: "Labour cost cited as primary margin pressure",
        source: "nordfracht.example/investors/ar2025.pdf",
      },
    ],
    opportunity_summary:
      "Their throughput ceiling is staffing, not space — the exact constraint the Fleet Orchestration Suite removes. Retrofit deployment matters because their Duisburg site was rebuilt in 2023 and they will not rebuild again.",
    opportunity_evidence: [
      {
        claim: "Duisburg racking rebuilt 2023",
        source: "nordfracht.example/news/duisburg-expansion",
      },
      {
        claim: "Runs Manhattan WMS, which we integrate with natively",
        source: "nordfracht.example/technology",
      },
    ],
    rejected_reason: null,
    prospect_company: {
      id: "p1",
      domain: "nordfracht.example",
      name: "Nordfracht Logistik",
      website: "https://nordfracht.example",
      description:
        "Multi-client 3PL operating five distribution centres across Germany and the Netherlands.",
      industry: "3PL & logistics",
      employee_range: "500-1,000",
      country: "Germany",
    },
  },
  {
    id: "l2",
    campaign_id: "c1",
    status: "qualified",
    fit_score: 89,
    confidence: 0.81,
    qualification_reason:
      "Fast-growing e-commerce fulfilment operator with two new sites announced this year and repeated public complaints about peak-season capacity.",
    qualification_evidence: [
      {
        claim: "Two new fulfilment centres announced Q1 2026",
        source: "bolsa.example/press/expansion",
      },
      { claim: "Peak-season delays reported by customers", source: "trustpilot.com/review/bolsa" },
    ],
    opportunity_summary:
      "Peak-season surge capacity is our strongest use case, and their expansion timeline lines up with our six-week deployment.",
    opportunity_evidence: [
      { claim: "New sites go live Q4 2026", source: "bolsa.example/press/expansion" },
    ],
    rejected_reason: null,
    prospect_company: {
      id: "p2",
      domain: "bolsa.example",
      name: "Bolsa Fulfilment",
      website: "https://bolsa.example",
      description: "E-commerce fulfilment provider serving D2C brands across the Benelux.",
      industry: "E-commerce fulfilment",
      employee_range: "200-500",
      country: "Netherlands",
    },
  },
  {
    id: "l3",
    campaign_id: "c1",
    status: "researching",
    fit_score: 76,
    confidence: 0.54,
    qualification_reason:
      "Right industry and size, but no public signal about automation intent or labour pressure. Confidence is low because most of their site is a marketing brochure.",
    qualification_evidence: [
      { claim: "Operates 3 distribution centres", source: "kleinwaren.example/about" },
    ],
    opportunity_summary: null,
    opportunity_evidence: [],
    rejected_reason: null,
    prospect_company: {
      id: "p3",
      domain: "kleinwaren.example",
      name: "Kleinwaren Distribution",
      website: "https://kleinwaren.example",
      description: "Regional distributor of household goods.",
      industry: "3PL & logistics",
      employee_range: "200-500",
      country: "Germany",
    },
  },
  {
    id: "l4",
    campaign_id: "c1",
    status: "rejected",
    fit_score: 22,
    confidence: 0.91,
    qualification_reason:
      "Freight forwarder, not a warehouse operator. They broker capacity and own no facilities, so there is nothing for the platform to run in.",
    qualification_evidence: [
      {
        claim: "Asset-light freight brokerage, no owned warehouses",
        source: "vectorfreight.example/about",
      },
    ],
    opportunity_summary: null,
    opportunity_evidence: [],
    rejected_reason: "No owned warehouse operations — outside the ICP.",
    prospect_company: {
      id: "p4",
      domain: "vectorfreight.example",
      name: "Vector Freight",
      website: "https://vectorfreight.example",
      description: "Asset-light freight brokerage.",
      industry: "Freight brokerage",
      employee_range: "50-200",
      country: "Belgium",
    },
  },
  {
    id: "l5",
    campaign_id: "c1",
    status: "sent",
    fit_score: 91,
    confidence: 0.84,
    qualification_reason:
      "Cold-chain grocery distributor with documented night-shift staffing problems and an active automation budget.",
    qualification_evidence: [
      {
        claim: "€4M automation budget approved for 2026",
        source: "vriesnet.example/news/automation-budget",
      },
      { claim: "Night-shift vacancies open 90+ days", source: "indeed.nl/cmp/vriesnet" },
    ],
    opportunity_summary:
      "Night-shift automation is a direct match, and their approved budget removes the usual procurement delay.",
    opportunity_evidence: [
      {
        claim: "Automation budget already approved",
        source: "vriesnet.example/news/automation-budget",
      },
    ],
    rejected_reason: null,
    prospect_company: {
      id: "p5",
      domain: "vriesnet.example",
      name: "VriesNet Cold Chain",
      website: "https://vriesnet.example",
      description: "Cold-chain grocery distribution across the Netherlands and Belgium.",
      industry: "Grocery distribution",
      employee_range: "1,000-2,000",
      country: "Netherlands",
    },
  },
  {
    id: "l6",
    campaign_id: "c1",
    status: "discovered",
    fit_score: null,
    confidence: null,
    qualification_reason: null,
    qualification_evidence: [],
    opportunity_summary: null,
    opportunity_evidence: [],
    rejected_reason: null,
    prospect_company: {
      id: "p6",
      domain: "hafenlager.example",
      name: "Hafenlager GmbH",
      website: "https://hafenlager.example",
      description: null,
      industry: null,
      employee_range: null,
      country: "Germany",
    },
  },
];

export const MOCK_DRAFTS: EmailDraft[] = [
  {
    id: "d1",
    lead_id: "l1",
    company_name: "Nordfracht Logistik",
    subject: "Duisburg throughput without another rebuild",
    body: `Hi Marta,

I read that Nordfracht rebuilt the Duisburg racking in 2023 — which makes me think another facility rebuild is off the table for a while, even with 42 warehouse operative roles currently open.

That's the specific case we built for. Our pallet movers retrofit into existing racking and run on your Manhattan WMS, so throughput goes up without touching the layout. Nordfracht's own 2025 report names labour cost as the top margin pressure; we typically take 30-45% out of pick-to-ship time without adding headcount.

Worth 20 minutes to see whether the numbers hold for your sites?

Deep`,
    linkedin_message:
      "Marta — noticed the 40+ warehouse roles open across your DE sites. We retrofit automation into existing racking (no rebuild) and integrate with Manhattan. Worth a quick look?",
    follow_up:
      "Hi Marta — following up on the retrofit idea. Happy to send the Nordfracht-sized numbers rather than a generic deck if that's more useful.",
    cta: "20-minute call this week or next",
    status: "pending",
    revision: 2,
    edited_by_human: false,
    critic_verdict: {
      passed: true,
      notes: [
        "Every claim traces to stored evidence",
        "No invented metrics",
        "Opt-out language present",
      ],
    },
    contact: {
      id: "ct1",
      full_name: "Marta Reinhardt",
      title: "VP Operations",
      role_category: "operations",
      email: "m.reinhardt@nordfracht.example",
      email_status: "verified",
      linkedin_url: "https://linkedin.com/in/mreinhardt",
      confidence: 0.93,
    },
  },
  {
    id: "d2",
    lead_id: "l2",
    company_name: "Bolsa Fulfilment",
    subject: "Two new sites live by Q4 — staffing them?",
    body: `Hi Joris,

Saw the Q1 announcement about the two new fulfilment centres going live in Q4. Congratulations — and, I'd guess, a staffing problem.

We deploy in about six weeks, which is the only reason I'm writing now rather than in October. Peak-season surge capacity is our most common use case; one Benelux operator handled 2.4x Black Friday volume last year without hiring temps.

Would it be useful to see what that looked like?

Deep`,
    linkedin_message:
      "Joris — congrats on the two new FCs. Six-week deployment means we could be live before Q4 peak. Worth a conversation?",
    follow_up: "Circling back before the Q4 planning window closes.",
    cta: "Short call before Q4 planning locks",
    status: "pending",
    revision: 1,
    edited_by_human: false,
    critic_verdict: {
      passed: false,
      notes: [
        '"I\'d guess, a staffing problem" is speculation, not evidence — soften or cut',
        "2.4x figure is from a case study; add attribution",
      ],
    },
    contact: {
      id: "ct2",
      full_name: "Joris van Dam",
      title: "Head of Fulfilment",
      role_category: "operations",
      email: null,
      email_status: "not_found",
      linkedin_url: "https://linkedin.com/in/jorisvandam",
      confidence: 0.62,
    },
  },
];

export const MOCK_LEAD_DETAIL: LeadDetail = {
  ...MOCK_LEADS[0],
  research: {
    summary:
      "Nordfracht Logistik is a multi-client 3PL running five distribution centres across Germany and the Netherlands, with roughly 800 employees. Their 2025 annual report identifies warehouse labour cost as the primary pressure on operating margin. They rebuilt the Duisburg facility in 2023 and run Manhattan WMS across all sites.",
    signals: {
      hiring: ["42 open warehouse operative roles", "3 open automation engineer roles"],
      technology: ["Manhattan WMS", "SAP ERP"],
      news: [
        "Duisburg facility expansion completed 2023",
        "Named preferred 3PL for two grocery chains",
      ],
      financial: ["Revenue up 14% YoY", "Operating margin down 2.1 points"],
    },
    sources: [
      "https://nordfracht.example/locations",
      "https://nordfracht.example/investors/ar2025.pdf",
      "https://linkedin.com/company/nordfracht/jobs",
      "https://nordfracht.example/technology",
      "https://nordfracht.example/news/duisburg-expansion",
    ],
    created_at: "2026-08-05T11:20:00Z",
  },
  contacts: [
    {
      id: "ct1",
      full_name: "Marta Reinhardt",
      title: "VP Operations",
      role_category: "operations",
      email: "m.reinhardt@nordfracht.example",
      email_status: "verified",
      linkedin_url: "https://linkedin.com/in/mreinhardt",
      confidence: 0.93,
    },
    {
      id: "ct3",
      full_name: "Stefan Böhm",
      title: "Director of Automation",
      role_category: "engineering",
      email: "s.boehm@nordfracht.example",
      email_status: "guessed",
      linkedin_url: "https://linkedin.com/in/stefanboehm",
      confidence: 0.55,
    },
    {
      id: "ct4",
      full_name: "Annika Voss",
      title: "Chief Executive Officer",
      role_category: "ceo",
      email: null,
      email_status: "not_found",
      linkedin_url: "https://linkedin.com/in/annikavoss",
      confidence: 0.71,
    },
  ],
  drafts: [MOCK_DRAFTS[0]],
  timeline: [
    {
      id: "t1",
      kind: "discovered",
      message: "Found via prospecting run for 'EU 3PL Expansion'",
      created_at: "2026-08-05T10:02:00Z",
    },
    {
      id: "t2",
      kind: "researched",
      message: "Researched 5 sources, 4 signal categories extracted",
      created_at: "2026-08-05T11:20:00Z",
    },
    {
      id: "t3",
      kind: "qualified",
      message: "Scored 94 with 0.88 confidence",
      created_at: "2026-08-05T11:24:00Z",
    },
    {
      id: "t4",
      kind: "contact_found",
      message: "3 decision makers found, 1 verified address",
      created_at: "2026-08-05T11:41:00Z",
    },
    {
      id: "t5",
      kind: "draft_generated",
      message: "Draft revision 2 generated, Critic passed",
      created_at: "2026-08-05T12:03:00Z",
    },
  ],
};

export const MOCK_TIMELINE: TimelineEvent[] = [
  {
    id: "g1",
    kind: "email_replied",
    message: "VriesNet Cold Chain replied to outreach",
    created_at: "2026-08-07T07:44:00Z",
  },
  {
    id: "g2",
    kind: "draft_generated",
    message: "Draft generated for Bolsa Fulfilment — Critic flagged 2 issues",
    created_at: "2026-08-07T06:15:00Z",
  },
  {
    id: "g3",
    kind: "qualified",
    message: "Nordfracht Logistik scored 94",
    created_at: "2026-08-05T11:24:00Z",
  },
  {
    id: "g4",
    kind: "rejected",
    message: "Vector Freight rejected — no owned warehouses",
    created_at: "2026-08-05T11:12:00Z",
  },
  {
    id: "g5",
    kind: "email_sent",
    message: "Outreach sent to VriesNet Cold Chain",
    created_at: "2026-08-04T16:30:00Z",
  },
  {
    id: "g6",
    kind: "discovered",
    message: "67 companies discovered for 'UK Grocery Distribution'",
    created_at: "2026-08-02T14:52:00Z",
  },
];

export const MOCK_CHAT: ChatMessage[] = [
  {
    id: "m1",
    role: "user",
    content: "Find 3PL companies in Germany and the Netherlands that could use our robots.",
    created_at: "2026-08-05T10:00:00Z",
  },
  {
    id: "m2",
    role: "assistant",
    content:
      "I'll search for third-party logistics operators in those markets, then research and qualify each one against what I know about your platform.\n\nFound 142 companies. 38 scored above 70 — the strongest signal is open warehouse operative roles combined with multi-site operations.",
    agent_outputs: [
      { agent: "Prospecting", status: "done", detail: "142 companies found" },
      { agent: "Research", status: "done", detail: "142 researched, 517 sources read" },
      { agent: "Qualification", status: "done", detail: "38 above 70, 22 rejected as out-of-ICP" },
    ],
    created_at: "2026-08-05T10:04:00Z",
  },
  {
    id: "m3",
    role: "user",
    content: "Prepare outreach for everything above 85.",
    created_at: "2026-08-05T11:50:00Z",
  },
  {
    id: "m4",
    role: "assistant",
    content:
      "Preparing outreach for 12 leads above 85. I found decision makers for 11 of them — Hafenlager GmbH has no discoverable contact, so I've skipped it rather than guess an address.\n\nDrafts are waiting for your approval. The Critic flagged 2 for speculation not backed by evidence.",
    agent_outputs: [
      { agent: "Contact", status: "done", detail: "11 of 12 contacts found, 1 skipped" },
      { agent: "Outreach", status: "done", detail: "11 drafts generated" },
      { agent: "Critic", status: "done", detail: "9 passed, 2 flagged" },
    ],
    created_at: "2026-08-05T12:05:00Z",
  },
];
