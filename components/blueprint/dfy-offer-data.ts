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
  testimonials: OfferTestimonial[];
  faqs: OfferFAQ[];
  ctaPrimary: string;
  aboutTimBlurb: string;
}

// ============================================
// Data
// ============================================

export const DFY_OFFER: DFYOfferData = {
  headline: 'Start Getting Warm Leads From\nLinkedIn in 2 Weeks. Guaranteed.',
  subheadline:
    'We build your complete LinkedIn lead generation system — posts, lead magnet, funnel, outreach — and hand it to you running.',

  problemHeadline: "You Don't Have a Lead Gen Problem. You Have a Build Problem.",
  painPoints: [
    "You know LinkedIn works for lead generation. You've seen others do it. But between running your business and trying to figure out the tech stack, you never actually get the system built.",
    'You bought courses. Watched tutorials. Maybe even started setting things up. But the lead magnet is half-done, the outreach never launched, and the funnel is still a Google Doc.',
    'Every week that passes without a working system is another week of relying on referrals and hoping the right people find you.',
  ],
  agitationText:
    "The founders who are growing right now didn't figure it all out themselves. They got someone to build it for them — so they could focus on closing deals, not configuring software.",

  solutionHeadline: 'We Build Your Entire System. You Just Show Up.',
  solutionDescription:
    "In 10 business days, we build and launch your complete LinkedIn lead generation system. You do a 30-minute interview, connect your accounts, and approve what we build. That's it.",
  solutionBullets: [
    'A lead magnet your ICP would actually download — fully designed and hosted',
    '4 LinkedIn posts written from your Blueprint, ready to publish',
    'A verified prospect list matched to your exact ICP',
    'HeyReach connection request campaigns configured and running',
    'MagnetLab funnel built around your lead magnet with opt-in and delivery',
  ],

  deliverables: [
    {
      icon: FileText,
      title: '4 LinkedIn Posts',
      description: 'Written and published from your Blueprint',
    },
    {
      icon: Magnet,
      title: '1 Lead Magnet',
      description: 'Fully built from your Blueprint',
    },
    {
      icon: Users,
      title: 'Lead List Sourced',
      description: 'Verified prospects matched to your ICP',
    },
    {
      icon: Link2,
      title: 'HeyReach Setup',
      description: 'Connection request campaigns running',
    },
    {
      icon: Layout,
      title: 'MagnetLab Setup',
      description: 'Full funnel built around your lead magnet',
    },
  ],

  bonuses: [
    {
      icon: Mail,
      title: '5-Email Nurture Flow',
      description: 'Written for post-lead-magnet delivery',
    },
    {
      icon: Video,
      title: 'VSL Script',
      description: 'For your lead magnet thank-you page',
    },
  ],

  steps: [
    {
      number: 1,
      title: '30-Min Interview + Data Dump',
      description:
        'You give us everything you have — call recordings, docs, existing content. We extract what we need.',
    },
    {
      number: 2,
      title: 'Log Into MagnetLab',
      description: 'Connect your LinkedIn account so we can schedule your posts directly.',
    },
    {
      number: 3,
      title: 'We Deliver, You Approve',
      description: 'We build everything. You review, approve, and it goes live.',
    },
  ],

  resultStatement:
    'In 10 days: a full funnel, a lead magnet that would have taken you 25 hours to make, and ideal prospects reaching out.',

  valueItems: [
    { label: 'Lead magnet — fully researched, designed, and hosted', soloValue: '$2,000' },
    { label: '4 LinkedIn posts — written from your Blueprint', soloValue: '$800' },
    { label: 'Verified prospect list matched to your ICP', soloValue: '$500' },
    { label: 'HeyReach setup — connection campaigns configured and running', soloValue: '$750' },
    { label: 'MagnetLab funnel — opt-in page, thank-you page, delivery', soloValue: '$1,000' },
    { label: '5-email nurture sequence — written and loaded', soloValue: '$500' },
    { label: 'VSL script for thank-you page', soloValue: '$300' },
    { label: '30-minute strategy interview + system walkthrough', soloValue: '$500' },
  ],

  isForYou: [
    "You're a B2B founder, consultant, or agency owner who knows LinkedIn works but hasn't built the system yet",
    "You'd rather pay someone to build it right than spend 40+ hours figuring it out yourself",
    'You have a clear offer and know who your ideal client is',
    'You want leads coming in within 2 weeks, not 2 months',
    "You're willing to invest 1-2 hours total (interview + approvals) to get your system live",
  ],
  notForYou: [
    "You're pre-revenue or don't have a defined offer yet (start with GTM Foundations instead)",
    "You want to learn how to build the system yourself (that's our Bootcamp)",
    "You're not willing to connect your LinkedIn account or approve content before it goes live",
  ],

  price: '$2,500',
  priceFeatures: [
    '4 LinkedIn posts written & published',
    '1 lead magnet fully built',
    'Lead list sourced for your ICP',
    'HeyReach setup + campaigns running',
    'MagnetLab setup + full funnel',
    '5-email nurture flow',
    'VSL script for thank-you page',
  ],

  guarantee: 'The 2-Week Guarantee',
  guaranteeDetails:
    "If you're not getting connection requests approved in 2 weeks, we write another week of content for you — free. No questions asked.",

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
        'You do a 30-minute interview where we learn about your business, ICP, and offer. Then you connect your LinkedIn account to MagnetLab. We build everything. You review, approve, and it goes live. Total time investment: about 1-2 hours.',
    },
    {
      question: 'How long does it take?',
      answer:
        '10 business days from your interview to a fully live system. Posts scheduled, lead magnet hosted, outreach running, funnel delivering.',
    },
    {
      question: 'What if I already have a lead magnet?',
      answer:
        "We'll review it. If it's solid, we'll use it and build the funnel around it. If it needs work, we'll rebuild it using your Blueprint data. Either way, you end up with a lead magnet that converts.",
    },
    {
      question: "What's the difference between this and the Bootcamp?",
      answer:
        'The Bootcamp teaches you how to build the system yourself over 4 weeks with live sessions. The DFY package means we build it for you in 10 days. Same system, different approach. Choose the Bootcamp if you want to learn the skill. Choose DFY if you want the result without the learning curve.',
    },
    {
      question: 'Do I need to buy any other software?',
      answer:
        "HeyReach (~$50/month) for LinkedIn automation and MagnetLab access are included in the setup. You don't need to buy anything else to get started.",
    },
    {
      question: 'What happens after the 10 days?',
      answer:
        "You'll have a running system. Posts are scheduled, outreach is sending, and leads are being captured. You can maintain it yourself (we show you how) or upgrade to ongoing management.",
    },
    {
      question: "What's the refund policy?",
      answer:
        "If you're not getting connection requests approved in 2 weeks, we write another week of content for you — free. No questions asked. We stand behind the system because it works.",
    },
    {
      question: "Can I see examples of lead magnets you've built?",
      answer:
        "Yes — request a free Blueprint at the top of our site. That's a sample of the AI-powered analysis and lead magnet approach we use. Your DFY lead magnet will be built using the same methodology, customized to your business.",
    },
  ],

  ctaPrimary: 'Get Started',

  aboutTimBlurb:
    "Tim built and sold a $4.7M agency using LinkedIn as the primary lead source. He's generated 20,000+ opted-in leads, closed $200K+ LTV deals, and built lead gen systems for 300+ B2B business owners. The DFY package is the same system he runs for his own businesses — built by his team, using the exact tools and processes that work.",
};
