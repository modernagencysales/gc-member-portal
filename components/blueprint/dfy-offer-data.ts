// ============================================
// DFY (Done-For-You) Offer Data
// ============================================

import type { LucideIcon } from 'lucide-react';
import { FileText, Magnet, Users, Link2, Layout, Mail, Video } from 'lucide-react';
import type { OfferValueItem, OfferTestimonial, OfferFAQ } from './offer-data';

// ============================================
// DFY-Specific Types
// ============================================

export interface DFYDeliverable {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface DFYStep {
  number: number;
  title: string;
  description: string;
}

export interface DFYOfferData {
  headline: string;
  subheadline: string;
  problemHeadline: string;
  painPoints: string[];
  agitationText: string;
  solutionHeadline: string;
  solutionDescription: string;
  solutionBullets: string[];
  deliverables: DFYDeliverable[];
  bonuses: DFYDeliverable[];
  steps: DFYStep[];
  resultStatement: string;
  valueItems: OfferValueItem[];
  isForYou: string[];
  notForYou: string[];
  price: string;
  priceFeatures: string[];
  guarantee: string;
  guaranteeDetails: string;
  guaranteeItems: { label: string; detail: string }[];
  testimonials: OfferTestimonial[];
  faqs: OfferFAQ[];
  ctaPrimary: string;
  aboutTimBlurb: string;
}

// ============================================
// Data
// ============================================

export const DFY_OFFER: DFYOfferData = {
  headline: 'Your ICP Sees You on Their Feed and in Their DMs. All Within 2 Weeks.',
  subheadline:
    'We build your complete LinkedIn lead generation system — posts, lead magnet, funnel, DM sequences, and nurture emails — and hand it to you running.',

  problemHeadline: "You've Tried This Before. Here's Why It Didn't Work.",
  painPoints: [
    'You made a lead magnet in Canva. You posted "comment GROWTH to get it." A few people commented. You manually DM\'d them a PDF. Nobody booked a call. Sound familiar?',
    "The asset wasn't the problem — the system around it was. No opt-in page. No qualification. No automated delivery. No follow-up sequence. No outreach beyond your existing network. You were doing 10% of the work and wondering why you got 10% of the results.",
    "Meanwhile, you're still relying on referrals and hoping the right people find you. Every month without a system is another month where one lost client could tank your pipeline — and you're back to rebuilding from scratch.",
  ],
  agitationText:
    "The consultants and founders filling their calendars right now aren't posting and praying. They have a system that puts them in front of their exact ICP on their feed and in their DMs — so by the time a prospect books a call, they already know, like, and trust them.",

  solutionHeadline: 'We Build Your Entire LinkedIn System. You Just Show Up.',
  solutionDescription:
    "We build your entire lead generation engine in 10 business days. You do one 30-minute interview. We handle everything else. Here's what makes it work: your exact ICP sees your content on their LinkedIn feed and gets a personalized DM from you — both leading to the same high-value lead magnet with an automated funnel behind it. They're strangers on day one. By week two, they're booking calls.",
  solutionBullets: [
    'A lead magnet your ICP would actually download — fully researched, designed, and hosted with a complete funnel',
    '10 LinkedIn posts written from your Blueprint, each driving opt-ins from your exact ICP',
    'A verified prospect list of your ideal clients — enriched, not just scraped from Sales Navigator',
    'LinkedIn DM sequences that deliver your lead magnet directly to prospects who say yes',
  ],

  deliverables: [
    {
      icon: FileText,
      title: '10 LinkedIn Posts',
      description: 'Written from your Blueprint, each with a lead magnet CTA',
    },
    {
      icon: Magnet,
      title: '1 Lead Magnet',
      description:
        'Fully researched, designed, and hosted — built to make your ICP want to meet you',
    },
    {
      icon: Users,
      title: 'Verified Prospect List',
      description: 'Your exact ICP — enriched with Apollo, Clay, and verified emails',
    },
    {
      icon: Link2,
      title: 'LinkedIn Outreach (HeyReach)',
      description: 'Connection requests + DM sequences delivering your lead magnet',
    },
    {
      icon: Layout,
      title: 'MagnetLab Funnel',
      description: 'Opt-in page, qualification form, thank-you page, and automated delivery',
    },
  ],

  bonuses: [
    {
      icon: Mail,
      title: '5-Email Nurture Sequence',
      description: "Automated follow-up for leads who don't book immediately",
    },
    {
      icon: Video,
      title: 'MagnetLab Access (3 Months Free)',
      description:
        'AI-powered content engine that keeps creating posts from your meetings and knowledge base',
    },
  ],

  steps: [
    {
      number: 1,
      title: '30-Min Strategy Interview',
      description:
        "We deep-dive into your ICP, your offer, and what makes your clients buy. We'll ask you the 15 questions that matter — not surface-level stuff. Bring call recordings, case studies, whatever you have. We extract what we need.",
    },
    {
      number: 2,
      title: 'We Build Everything',
      description:
        'Lead magnet, funnel, posts, prospect list, DM sequences — all built by our team using the exact tools and processes behind 300+ client systems. You connect your accounts. We do the rest.',
    },
    {
      number: 3,
      title: 'Review, Approve, Go Live',
      description:
        "You review what we've built. Approve it. Everything goes live. Your ICP starts seeing you on their feed and in their DMs — all within 10 business days.",
    },
  ],

  resultStatement:
    "In 10 days: 10 posts scheduled, a lead magnet that would've taken you 25 hours, and your exact ICP seeing you on their feed and in their DMs. By week 2, they're booking calls.",

  valueItems: [],

  isForYou: [
    "You're a B2B founder, consultant, or agency owner who's tried LinkedIn lead gen before but never got the full system working",
    "You don't have time to figure out the tech stack — you'd rather focus on closing deals and delivering for clients",
    'You have a clear offer and know exactly who your ideal client is',
    "You're tired of relying on referrals and want a predictable pipeline that runs even when you're busy with client work",
    "You're willing to invest 1-2 hours total (one interview + approvals) to get the system live",
  ],
  notForYou: [
    "You're pre-revenue or don't have a defined offer yet (start with GTM Foundations instead)",
    "You want to learn how to build the system yourself (that's our Bootcamp — same system, you build it with our guidance over 4 weeks)",
    "You're not willing to connect your LinkedIn account or approve content before it goes live",
  ],

  price: '$2,500',
  priceFeatures: [
    '10 LinkedIn posts written & scheduled',
    '1 lead magnet + complete funnel',
    'Verified prospect list for your ICP',
    'LinkedIn DM sequences (HeyReach)',
    '5-email nurture flow',
    'MagnetLab access (3 months free)',
  ],

  guarantee: 'Zero Risk. Five Guarantees.',
  guaranteeDetails: 'We remove every reason not to do this.',
  guaranteeItems: [
    {
      label: 'Conversations or we keep working — free',
      detail:
        "If you're not starting new conversations with your ICP within 30 days, we rebuild your lead magnet, rewrite your posts, and relaunch your outreach at no additional cost. We don't stop until the system is generating conversations.",
    },
    {
      label: 'You approve everything before it goes live',
      detail:
        'Nothing touches your LinkedIn without your sign-off. Every post, every DM sequence, every lead magnet page — you review and approve it first. Your reputation stays in your hands.',
    },
    {
      label: 'If something breaks, we fix it',
      detail:
        "For 90 days after launch, if anything in your system stops working — funnel, outreach, delivery — we fix it. You're not on your own figuring out someone else's tech stack.",
    },
    {
      label: "1-2 hours of your time. That's it.",
      detail:
        "One 30-minute interview. A few rounds of approvals. That's your total time investment. We built this process specifically so busy founders and consultants don't have to carve out weeks to get a system running.",
    },
    {
      label: 'The system is yours to keep',
      detail:
        "Even if you never work with us again, you keep everything — the lead magnet, the funnel, the posts, the prospect list, the DM sequences. It's built on your accounts. Nothing is held hostage.",
    },
  ],

  testimonials: [
    {
      quote:
        'Over the course of the program with Tim I doubled revenue in about two months. Some simple details and tips from Tim that were actionable, easy to understand and broke our limiting beliefs.',
      author: 'Alexandre Olim',
      role: 'Co-Founder at Plutus Media',
      result: '2x revenue in 2 months',
    },
    {
      quote:
        'Building a lead gen system that gets me leads that already are half closed because of my content. If you want a reliable lead source, this is it.',
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
        'Posted my first lead magnet on LinkedIn a week ago. 11 likes. 8 comments. 2 leads. 1 converted. Crazy how I always worried about how much engagement I received on posts.',
      author: 'Sarim Siddiqui',
      role: 'Founder',
      result: '1 client from first post',
    },
    {
      quote:
        "As a result of following this process I have massively grown my LinkedIn. But the important thing is the number of booked calls into my calendar with qualified leads. I'm really fully booked actually at the moment.",
      author: 'Jessie Healy',
      role: 'CMO Webtopia',
      result: 'Fully booked calendar',
    },
  ],

  faqs: [
    {
      question: 'What exactly do I need to do?',
      answer:
        'One 30-minute interview where we learn everything about your business, ICP, and offer. Then you connect your LinkedIn account to MagnetLab and approve what we build. Total time investment: about 1-2 hours. We handle the rest.',
    },
    {
      question: "I've tried lead magnets before and they didn't work. How is this different?",
      answer:
        'Most people create a PDF, post "comment X to get it," manually DM a few people, and wonder why it didn\'t generate leads. That\'s the asset without the system. We build the complete engine around it: an opt-in page that captures emails, a qualification form that filters your ICP, automated delivery, a 5-email nurture sequence, and distribution via LinkedIn posts and targeted DMs. The lead magnet is the hook. The system is what books calls.',
    },
    {
      question: "Won't my lead magnet just teach people to do it themselves instead of hiring me?",
      answer:
        "This is the most common fear — and it's backwards. When you make something complex sound simple, it proves you're the expert. People read it, think \"this makes so much sense,\" and then realize they don't want to implement it themselves. The better your lead magnet, the more people want to hire you. We've seen this across 300+ clients.",
    },
    {
      question: "Isn't this just cold outreach to a list of strangers?",
      answer:
        "On day one, yes — they don't know you yet. But that's why the system works. They see your posts on their LinkedIn feed. They get a personalized DM offering a free, valuable asset. By the time they opt in and go through your funnel, they already feel like they know you. And if they don't book right away, the nurture sequence keeps you top of mind. That's the difference between cold outreach and a warm system.",
    },
    {
      question: 'I can pull a list from Sales Navigator myself. Why do I need yours?',
      answer:
        "Sales Nav gives you names and titles. We give you enriched, verified contacts with company data and behavioral signals — pulled from Apollo and enriched through Clay. Plus, the list isn't just for browsing. It's loaded directly into your HeyReach DM sequences so outreach starts immediately. The list is the fuel. The system is the engine.",
    },
    {
      question: "What's the difference between this and the Bootcamp?",
      answer:
        'Same system, different approach. The Bootcamp is a 4-week live program where Tim teaches you to build it yourself — one asset per week, with coaching and support. The DFY package means we build it for you in 10 days. Choose the Bootcamp if you want to learn the skill and build it hands-on. Choose DFY if you want the result without the learning curve.',
    },
    {
      question: 'What is MagnetLab and will I need to use it ongoing?',
      answer:
        "MagnetLab is our in-house platform — it hosts your lead magnet, opt-in pages, funnel, and email sequences. It also connects to your meeting note-taker (Grain, Fathom, etc.) and uses AI to extract insights from your client calls, then suggests content based on real conversations. It keeps your content pipeline running even when you're too busy to think about marketing. You get 3 months free, then it's ~$100/month (includes HeyReach for LinkedIn outreach, normally $79/month on its own).",
    },
    {
      question: 'What happens after everything is built? Can you run it for me ongoing?',
      answer:
        'After the build, you have a running system. Posts are scheduled, DM outreach is sending, and leads are being captured. Most clients maintain it themselves — MagnetLab makes it easy to approve new content and the automations keep running. If you want fully hands-off ongoing management (content, outreach, optimization), we offer that too starting at $3,500/month. But many clients never need it.',
    },
    {
      question: 'Only 10 posts — then what?',
      answer:
        'The 10 posts are your launch sprint. They get the system live and leads flowing. After that, MagnetLab keeps generating post ideas from your meetings, client calls, and knowledge base. You just approve and publish. Most clients spend 15-20 minutes per week on content after the initial build.',
    },
    {
      question: 'How long does the whole thing take?',
      answer:
        '10 business days from your interview to a fully live system. Posts scheduled, lead magnet hosted, DM outreach running, funnel delivering.',
    },
    {
      question: "Can I see examples of lead magnets you've built?",
      answer:
        "Yes — the Blueprint you received is built with the same AI methodology we use for DFY lead magnets. We'll also share examples of completed lead magnets during your onboarding call so you can see exactly what you're getting before we start building.",
    },
    {
      question: 'Do I need to buy any other software?',
      answer:
        'No. HeyReach for LinkedIn automation and MagnetLab access are both included in your 3-month free period. No hidden software costs.',
    },
  ],

  ctaPrimary: 'Book Your Strategy Call',

  aboutTimBlurb:
    "Tim built and sold a $4.7M agency using LinkedIn as the primary lead source. He's generated 20,000+ opted-in leads, closed $200K+ LTV deals, and built lead gen systems for 300+ B2B business owners. This isn't theory — it's the exact system his team runs every day. The tools, the processes, the AI — all built in-house because nothing on the market did what he needed. Now his team builds it for you.",
};
