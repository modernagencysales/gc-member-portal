// ============================================
// Offer Data — All sales copy for both offers
// ============================================

export interface OfferWeek {
  week: number;
  title: string;
  bullets: string[];
  deliverable: string;
}

export interface OfferTool {
  name: string;
  description: string;
}

export interface OfferValueItem {
  label: string;
  soloValue: string;
}

export interface OfferTestimonial {
  quote: string;
  author: string;
  role: string;
  result?: string;
}

export interface OfferFAQ {
  question: string;
  answer: string;
}

export interface OfferData {
  id: 'foundations' | 'engineering';
  name: string;
  tagline: string;
  headline: string;
  subheadline: string;
  problemHeadline: string;
  painPoints: string[];
  agitationText: string;
  solutionHeadline: string;
  solutionDescription: string;
  solutionBullets: string[];
  weeks: OfferWeek[];
  toolsIncluded: OfferTool[];
  valueItems: OfferValueItem[];
  isForYou: string[];
  notForYou: string[];
  price: string;
  priceFull: string;
  paymentPlan: string;
  guarantee: string;
  guaranteeDetails: string;
  spotsTotal: number;
  urgencyText: string;
  testimonials: OfferTestimonial[];
  faqs: OfferFAQ[];
  ctaPrimary: string;
  ctaSecondary: string;
  cohortWeekday: number; // 0=Sun, 1=Mon, 2=Tue, etc.
  cohortWeekOfMonth: number; // 1st, 2nd, 3rd, 4th occurrence
  aboutTimBlurb: string;
}

// ============================================
// GTM Engineering Bootcamp
// ============================================

export const ENGINEERING_OFFER: OfferData = {
  id: 'engineering',
  name: 'GTM Engineering Bootcamp',
  tagline: 'Build a Lead Generation Machine That Brings You 5 High-Quality Clients Every Month',
  headline: 'Stop "Posting Content."\nStart Building Assets.',
  subheadline:
    'Build a Lead Generation Machine That Brings You 5 High-Quality Clients Every Month — In Just 4 Weeks. Without spending your life in the LinkedIn feed.',
  problemHeadline: 'The Reality Check',
  painPoints: [
    'AI flooded LinkedIn with generic garbage. Cold email deliverability dropped 40%. The "Post and Pray" method is dead.',
    "LinkedIn's algorithm now shows your posts to less than 2% of your followers. Tim has 50,000 followers and gets ~1,000 impressions per post.",
    'If you are betting your 2026 revenue on "organic reach," you are betting against the house.',
  ],
  agitationText:
    "In the last 24 months, the rules changed completely. The founders who adapted are thriving. The ones who didn't are wondering where their pipeline went.",
  solutionHeadline: 'The Pivot',
  solutionDescription:
    'We stop acting like Creators and start acting like Engineers. In this bootcamp, we will build a system that combines Data Scrapers, Asset-Based Outbound, and Paid Distribution to force your offer in front of the exact right humans — whether they are active on LinkedIn or not.',
  solutionBullets: [
    'A "Hand-Raiser" Asset that identifies buyers before you ever send a DM',
    'A "Magic List" of 1,000+ verified prospects your competitors can\'t find on Sales Nav (for less than $50)',
    'An Automated Machine (Email + LinkedIn) that delivers your message without landing in spam',
    'A Paid Ad Campaign running for ~$20/day that guarantees visibility',
  ],
  weeks: [
    {
      week: 1,
      title: 'The Asset & The Offer',
      bullets: [
        'Why generic "value" posts fail (and why you don\'t need to be an influencer)',
        'The Lead Magnet Sprint: Use custom AI tools to build a high-value asset in 20 minutes',
        'The "Hand-Raiser" Protocol: Write the single post that identifies buyers before you DM them',
        'Complete funnel setup: Opt-in page, thank you page, and 5-email nurture sequence',
      ],
      deliverable: 'Your core asset created, funnel live, ready to capture leads',
    },
    {
      week: 2,
      title: 'Data Engineering & The "Magic List"',
      bullets: [
        "How to find leads your competitors can't — scraping directories, analyzing tech stacks, finding buying signals",
        'The "Magic Column" Demo: Use AI to visit 10,000 websites and filter out anyone who isn\'t a perfect fit',
        'Sniper vs. Bomber: Building the perfect list for 50 leads (Track A) or 5,000 (Track B)',
        'Tools: Clay for enrichment, Apollo/Sales Nav for initial pulls, custom scrapers for directories',
      ],
      deliverable:
        'A verified list of 1,000-10,000 exact ICP contacts, enriched with impossible-to-find data points, for under $50',
    },
    {
      week: 3,
      title: 'The Machine & The Message',
      bullets: [
        'Infrastructure Setup: Cold email and DM software configured so you never land in spam — domains, DNS, warmup',
        'The "Human" Outbound Sequence: Use Week 2 data to write emails and DMs that look manually typed',
        'Inbox Management: Handle responses without spending all day in Gmail',
        'Tools: Smartlead/Instantly for email, HeyReach/Linked Helper for LinkedIn',
      ],
      deliverable:
        'Outbound campaigns connected, scripted, and ready to launch — both email and LinkedIn sequences live',
    },
    {
      week: 4,
      title: 'Ads & The "Force Multiplier"',
      bullets: [
        'LinkedIn "Thought Leader Ads" — target your exact ICP list with your lead magnet',
        'How to spend ~$50/day to guarantee visibility to your exact prospect list',
        'Turn your best organic posts into ads that generate leads',
        "Retargeting: Catch the people who didn't reply to your email",
        'System Handoff: Keep this machine running in less than 3 hours/week',
      ],
      deliverable:
        'Your first LinkedIn ad campaign live and the "Forever Roadmap" for maintaining the system',
    },
  ],
  toolsIncluded: [
    { name: 'Lead Magnet Ideator', description: 'Finds the "Painkiller" concept for your niche' },
    { name: 'Lead Magnet Creator', description: 'Writes the actual PDF/Doc for you' },
    {
      name: 'The "Eric" Email Writer',
      description: "Trained on the world's best cold email data to write sequences that convert",
    },
    {
      name: 'Clay Templates',
      description: '"One-Click" tables to scrape tech stacks and directories',
    },
  ],
  valueItems: [
    { label: '4x 90-minute live implementation sessions', soloValue: '$2,000' },
    { label: 'Click-by-click screen sharing as we build together', soloValue: '$1,500' },
    { label: 'Complete lead magnet funnel templates', soloValue: '$500' },
    { label: 'Outbound campaign templates (sequences, scripts, follow-ups)', soloValue: '$500' },
    { label: 'LinkedIn ad frameworks', soloValue: '$300' },
    { label: 'ICP list-building framework', soloValue: '$300' },
    { label: '8 weeks access to proprietary AI tool stack', soloValue: '$600' },
    { label: 'Async feedback on your campaigns (Mon-Fri)', soloValue: '$1,000' },
    { label: 'Private accountability group', soloValue: '$300' },
    { label: 'Lifetime access to all recordings', soloValue: '$500' },
  ],
  isForYou: [
    "You're a B2B founder, agency owner, coach, or consultant doing at least $10k/month",
    "You have a validated offer that's already generating revenue",
    'You want to own your lead generation, not outsource it',
    "You're willing to invest 3-5 hours/week to build this",
    "You're willing to use software (we'll teach you, but you must click the buttons)",
  ],
  notForYou: [
    "You're pre-revenue or still validating your offer",
    'You think lead gen is just "posting good content"',
    "You're not willing to implement between sessions",
  ],
  price: '$3,500',
  priceFull: '$4,000',
  paymentPlan: 'Or $1,000/week for 4 weeks ($4,000 total)',
  guarantee: 'The "No-Brainer" Guarantee',
  guaranteeDetails:
    "If after Week 1 you don't have a Lead Magnet asset that you're proud of and a clear path to your first 100 leads, tell me. I'll refund you completely. No questions asked.",
  spotsTotal: 15,
  urgencyText: 'Applications close when spots fill. The last cohort filled in 48 hours.',
  testimonials: [
    {
      quote:
        'Over the course of the program with Tim I doubled revenue in about two months. Some simple details and tips from Tim that were actionable, easy to understand and broke our limiting beliefs. If you are on the fence on whether to join, just take the leap.',
      author: 'Alexandre Olim',
      role: 'Co-Founder at Plutus Media',
      result: '2x revenue in 2 months',
    },
    {
      quote:
        'Building a lead gen system that gets me leads that already are half closed because of my content. Highly recommend this course to anyone who wants to have a reliable lead source.',
      author: 'Laksh Sehgal',
      role: 'Founder at Neuroid',
      result: 'Leads pre-sold by content',
    },
    {
      quote:
        "I was skeptical of the ticket price at first but a couple weeks later it's already paid off for me. His straightforward, no BS approach to sales that injects empathy... it's what we need in modern sales.",
      author: 'Lora Schellenberg',
      role: 'Founder',
      result: 'Paid off in weeks',
    },
    {
      quote:
        "Best course I had about agency leads. Been in the game for 4 years, it's the best course out there I've found.",
      author: 'Saar Bell',
      role: 'CEO',
    },
    {
      quote:
        "Since then we've been growing a lot. If you are on the fence on whether to join, just take the leap. It's really worth it.",
      author: 'Viktor Fazekas',
      role: 'DTC Performance Creatives',
      result: 'Doubled revenue',
    },
  ],
  faqs: [
    {
      question: "What's the difference between GTM Engineering and GTM Foundations?",
      answer:
        'GTM Engineering is for people who already know their niche and are ready to scale with sophisticated tooling. We build the full machine: Clay for enrichment, cold email infrastructure, LinkedIn thought leader ads, and advanced automation. It requires $500+/month in tooling and assumes you already have the foundations in place.\n\nGTM Foundations is for people just getting started with LinkedIn lead generation. We focus on fundamentals: niche clarity, a profile that converts, outreach that gets responses, content that attracts your ICP, and lead magnets. The only tools you need are Linked Helper (~$15-50/month).',
    },
    {
      question: 'What software will I need?',
      answer:
        "During the bootcamp, we'll use free trials for most software. At the end, I'll show you how to access enterprise-level infrastructure for a fraction of the cost. Key tools include Clay ($149/mo), Smartlead or Instantly (~$30-50/mo), HeyReach or Linked Helper (~$50/mo), and LinkedIn ads (~$20-50/day). Total ongoing cost: ~$300-500/month.",
    },
    {
      question: 'How much time will this take?',
      answer:
        '90 minutes per week for the live session, plus 3-5 hours of implementation between sessions. After the bootcamp, the system runs in about 3 hours/week.',
    },
    {
      question: 'What if I miss a live session?',
      answer: "All sessions are recorded. You'll have lifetime access to every recording.",
    },
    {
      question: "What's the refund policy?",
      answer:
        "If after Week 1 you don't have a Lead Magnet asset that you're proud of and a clear path to your first 100 leads, I'll refund you completely. No questions asked. I haven't had to use this yet.",
    },
    {
      question: 'What happens after the bootcamp?',
      answer:
        "Most graduates stick around. The Collective gives you ongoing access to the AI tools, shared infrastructure that cuts your tool costs by 60%, weekly strategy calls, and a built-in path to done-for-you help when you need it. I'll walk through the full offer in Week 4.",
    },
  ],
  ctaPrimary: 'Enroll Now',
  ctaSecondary: "Book a Call to See If It's a Fit",
  cohortWeekday: 1, // Monday
  cohortWeekOfMonth: 4, // 4th Monday of the month
  aboutTimBlurb:
    'Tim built and sold a $4.7M agency using LinkedIn as the primary lead source. He\'s generated 20,000+ opted-in leads, closed $200K+ LTV deals, and taught 300+ B2B business owners the system. He\'s not a "LinkedIn Creator" who sells courses. He is an active operator building real businesses and closing real deals.',
};

// ============================================
// GTM Foundations (LinkedIn Client System)
// ============================================

export const FOUNDATIONS_OFFER: OfferData = {
  id: 'foundations',
  name: 'The LinkedIn Client System',
  tagline: 'Book 2-3 Qualified Calls Per Week Using a 30-Minute Daily Routine',
  headline: 'Stop Hoping for Referrals.\nStart Booking Calls.',
  subheadline:
    'Book 2-3 Qualified Calls Per Week Using a 30-Minute Daily Routine. For solopreneurs, freelancers, and small agencies who are tired of the referral rollercoaster.',
  problemHeadline: 'The Reality',
  painPoints: [
    "You're good at what you do. Clients love working with you. But your pipeline is a mystery — feast one month, famine the next.",
    'Posting content (crickets). Sending DMs (feels awkward, no responses). Buying courses ($500 here, $2,000 there — nothing works). Hoping referrals keep coming (stressful).',
    "Meanwhile, you're starting to wonder: am I becoming an AI casualty? Is everyone else figuring this out except me?",
  ],
  agitationText:
    'No. You\'re not behind. You just don\'t have a system. Most LinkedIn advice tells you to "just post more" or "add value in the comments." That worked in 2021. It doesn\'t work now.',
  solutionHeadline: 'The System',
  solutionDescription:
    "We build you a complete LinkedIn client acquisition system — niche, profile, outreach, content, lead magnets, and conversations — all connected, all building on each other. In 4 weeks, you'll have a repeatable 30-minute daily routine that fills your calendar.",
  solutionBullets: [
    'A clear niche and offer that makes your ICP say "I need to talk to this person"',
    'A profile that converts visitors into conversations',
    'Automated outreach sending 100+ connection requests per week',
    'A lead magnet capturing interested prospects while you sleep',
    'A content system you can execute in 2 hours/week',
  ],
  weeks: [
    {
      week: 1,
      title: 'Niche + Offer + Profile',
      bullets: [
        'Find the specific problem you solve (that people will pay for)',
        'Define your ICP so precisely you can find 500+ of them on LinkedIn',
        'Craft an offer statement that makes your ideal client want to talk to you',
        'Rewrite your headline, About section, and banner so your profile converts',
      ],
      deliverable:
        "A clear ICP definition, a compelling offer statement, and a fully rewritten profile you're proud of",
    },
    {
      week: 2,
      title: 'List Building + Outreach',
      bullets: [
        'Build a list of 500+ ideal clients (with or without Sales Navigator)',
        'Set up Linked Helper to send connection requests while you sleep',
        'Write connection request copy that actually gets accepted',
        'Launch your first 100+ connection requests before the session ends',
      ],
      deliverable:
        'Linked Helper running, connection requests going out, and your pipeline building automatically',
    },
    {
      week: 3,
      title: 'Content + Lead Magnets',
      bullets: [
        'Extract content ideas from your real conversations',
        'Create a lead magnet your ICP would pay $100 for (built together in 20 minutes)',
        'Set up landing pages, thank-you pages, and automated delivery',
        'Write the "hand-raiser" post that gets comments and captures leads',
        'Draft 2 weeks of content using proven templates',
      ],
      deliverable:
        'A lead magnet live and working, an opt-in flow that runs automatically, and a content calendar you can execute',
    },
    {
      week: 4,
      title: 'Conversations That Convert',
      bullets: [
        'Learn the Conversation-to-Call framework (stranger to booked call)',
        'Identify buying signals so you know when someone is ready',
        'Master the soft pitch and direct pitch (scripts for both)',
        'Get live feedback on your real DM conversations',
        'Document your complete 30-minute daily system',
      ],
      deliverable:
        'A repeatable system for turning conversations into calls, and likely some calls already booked',
    },
  ],
  toolsIncluded: [
    { name: 'Niche Finder', description: 'Identifies your most profitable niche' },
    {
      name: 'Offer Statement Generator',
      description: 'Crafts a clear offer your ICP can say yes to',
    },
    {
      name: 'Profile Optimizer',
      description: 'Rewrites your profile to convert visitors into conversations',
    },
    {
      name: 'DM Chat Helper',
      description: 'Handles LinkedIn conversations without overthinking every reply',
    },
    { name: 'Lead Magnet Ideator', description: 'Finds the "painkiller" concept your ICP wants' },
    {
      name: 'Lead Magnet Creator',
      description: 'Turns ideas into full lead magnets in 20 minutes',
    },
    {
      name: 'Post Generator',
      description: 'Creates high-performing posts from proven templates',
    },
    {
      name: 'Transcript-to-Post Ideator',
      description: 'Extracts content ideas from your sales calls and conversations',
    },
  ],
  valueItems: [
    { label: '4x 90-minute live sessions (teaching + Q&A)', soloValue: '$2,000' },
    { label: 'Complete profile rewrite guidance', soloValue: '$500' },
    { label: 'Lead magnet creation (done with you)', soloValue: '$500' },
    { label: 'Outreach templates and DM scripts', soloValue: '$300' },
    { label: 'Content calendar templates', soloValue: '$200' },
    { label: '8 weeks access to 8 proprietary AI tools', soloValue: '$600' },
    { label: 'Async support throughout (Mon-Fri)', soloValue: '$500' },
    { label: 'Private cohort community', soloValue: '$200' },
    { label: 'Lifetime access to all recordings', soloValue: '$500' },
  ],
  isForYou: [
    "You want to get started with LinkedIn as a lead source (or restarting after it didn't work)",
    "You have a skill people pay for, but your niche and offer aren't crystal clear yet",
    'You want to build a consistent content + outreach habit',
    "You're not ready to invest $500+/month in sales tooling — you want to keep it simple",
    "You're willing to put in 3-4 hours/week to build this",
  ],
  notForYou: [
    "You have a defined offer, traction, and you're ready to scale with cold email, Clay, and LinkedIn ads (you want GTM Engineering)",
    'You\'re looking for "done-for-you" (you\'ll do the work, with our guidance)',
    'You want to go viral (this is about clients, not clout)',
  ],
  price: '$997',
  priceFull: '$997',
  paymentPlan: 'Or 3 payments of $367 ($1,101 total)',
  guarantee: 'The Guarantee',
  guaranteeDetails:
    "If after Week 2 you don't have a clear offer, a profile you're proud of, and DMs going out to real prospects, tell us. Full refund, no questions asked. We've never had anyone ask.",
  spotsTotal: 30,
  urgencyText: 'First 10 purchases get $100 off.',
  testimonials: [
    {
      quote:
        'I switched over to just implementing your system and I... possibly have a $90,000 deal.',
      author: 'Mary Auguste',
      role: 'Founder',
      result: 'Potential $90K deal',
    },
    {
      quote:
        "Last time we talked, you said 'focus on one niche.' I just went with one niche and it's worked. I've jumped on more calls this month than all the months before. Your scolding was exactly what I needed.",
      author: 'Aazar',
      role: 'Founder',
      result: 'More calls than ever',
    },
    {
      quote:
        'Posted my first lead magnet on LinkedIn a week ago. 11 likes. 8 comments. 2 leads. 1 converted. Crazy how I always worried about how much engagement I received on posts.',
      author: 'Sarim Siddiqui',
      role: 'Founder',
      result: '1 client from first post',
    },
    {
      quote:
        "As a result of following this process I have massively grown my LinkedIn. But the important thing is the number of booked calls into my calendar with qualified leads. I'm really fully booked actually at the moment, almost too booked — with loads of leads coming in through my LinkedIn directly.",
      author: 'Jessie Healy',
      role: 'CMO Webtopia',
      result: 'Fully booked calendar',
    },
    {
      quote:
        'No joke, this Tim really delivered on his promise. The course materials are SUPER easy to consume, super valuable, and most importantly, very actionable and straight to the point. His discovery & closing course section was so insightful that I applied it in two of my calls and already closed a client!',
      author: 'Saief Tissaoui',
      role: 'Founder',
      result: 'Closed client immediately',
    },
    {
      quote:
        "Tim's course is unlike any I've ever taken \u2013 I'm actually going to finish it. I almost never finish courses because they're typically long and boring and full of fluff. Tim's insights are actionable, the videos are concise, and the exercises are relevant, fun, and reinforce the learnings.",
      author: 'Sean Bacastow',
      role: 'Founder',
    },
    {
      quote:
        "Before completing Tim's course, I did not know how to generate leads with LinkedIn content. I now have a content machine that allows me to smash out a week's content in the morning.",
      author: 'Steve Anderson',
      role: 'Director',
      result: "Week's content in one morning",
    },
    {
      quote:
        "The price to value ratio is one of the best I've ever seen. I learned so much \u2014 and I've taken a lot of sales calls in my day. 100% recommended.",
      author: 'Feras Khalbuss',
      role: 'Growth Marketer',
    },
    {
      quote:
        "I've probably bought 10 to 15 different courses about agency stuff, and by far this has the most gems.",
      author: 'Chirag',
      role: 'Founder of Taco',
    },
    {
      quote: "Shout out to Tim's DM automations. First week, we've already got one!",
      author: 'David Card',
      role: 'Founder',
      result: 'Lead in first week',
    },
  ],
  faqs: [
    {
      question: "What if I don't know my niche yet?",
      answer:
        "That's exactly what Week 1 is for. Most people in this bootcamp are juggling multiple services and don't have a clear ICP. You'll leave the first session with a specific niche and offer statement.",
    },
    {
      question: "What if I've tried LinkedIn and it didn't work?",
      answer:
        "That's the majority of people who join. They've posted content, sent DMs, maybe paid for tools or courses that promised results. The difference here is we're building a complete system \u2014 niche, profile, outreach, content, and lead magnets all working together. Most programs only give you one or two pieces.",
    },
    {
      question: 'Do I need Sales Navigator?',
      answer:
        "It helps, but it's not required. Tim teaches methods to find your ICP without it \u2014 including mining your competitors' networks and other techniques that work just as well.",
    },
    {
      question: 'What software do I need to pay for?',
      answer:
        "Linked Helper is the only required tool (~$15-50/month). Sales Navigator is optional (~$80/month). That's it.",
    },
    {
      question: 'How much time will this take?',
      answer:
        '90 minutes per week for the live session, plus 2-3 hours of implementation between sessions. The daily outreach routine takes about 30 minutes.',
    },
    {
      question: 'What if I miss a live session?',
      answer: "All sessions are recorded. You'll have lifetime access.",
    },
    {
      question: "What's the refund policy?",
      answer:
        "If after Week 2 you don't have a clear offer, a profile you're proud of, and DMs going out to real prospects, ask for a full refund. No questions asked.",
    },
    {
      question: "What's the difference between GTM Foundations and GTM Engineering?",
      answer:
        'GTM Foundations is for people getting started with LinkedIn lead generation. We focus on fundamentals: niche clarity, a profile that converts, outreach, content, and lead magnets. Only tools you need are Linked Helper (~$15-50/month).\n\nGTM Engineering is for people who already know their niche and are ready to scale with Clay, cold email, LinkedIn ads, and advanced automation. Requires $500+/month in tooling.\n\nNot sure? Ask yourself: Do I know exactly who I help and what I do for them? If you have to think about it, start with Foundations.',
    },
    {
      question: 'When do people usually book their first call?',
      answer:
        'Most participants have conversations starting in Week 2 (when connection requests go out) and book their first call during Week 4. Some book earlier \u2014 it depends on how quickly you implement and how responsive your ICP is.',
    },
  ],
  ctaPrimary: 'Enroll Now',
  ctaSecondary: "Book a Call to See If It's a Fit",
  cohortWeekday: 0, // Sunday (for "starts on" display — actually Tuesdays for sessions)
  cohortWeekOfMonth: 3, // 3rd week of the month
  aboutTimBlurb:
    "Tim built and sold a $4.7M agency using LinkedIn as the primary lead source. He's generated 20,000+ opted-in leads, closed $200K+ LTV deals, and taught 300+ B2B business owners the system. Before this, he was a teacher for 7 years. He knows how to explain things clearly and make sure you actually implement \u2014 not just take notes.",
};

// ============================================
// Offer lookup
// ============================================

export const OFFERS: Record<'foundations' | 'engineering', OfferData> = {
  foundations: FOUNDATIONS_OFFER,
  engineering: ENGINEERING_OFFER,
};
