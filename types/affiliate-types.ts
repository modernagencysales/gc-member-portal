/**
 * Affiliate Program Types
 */

export type AffiliateStatus = 'pending' | 'approved' | 'active' | 'rejected' | 'suspended';
export type ReferralStatus = 'clicked' | 'enrolled' | 'paying' | 'paid_in_full' | 'commission_paid';
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';
export type AssetType = 'swipe_copy' | 'image' | 'video' | 'document';

export interface Affiliate {
  id: string;
  email: string;
  name: string;
  company: string | null;
  slug: string;
  code: string;
  status: AffiliateStatus;
  commissionAmount: number;
  stripeConnectAccountId: string | null;
  stripeConnectOnboarded: boolean;
  bootcampStudentId: string | null;
  photoUrl: string | null;
  bio: string | null;
  applicationNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Referral {
  id: string;
  affiliateId: string;
  referredEmail: string | null;
  referredName: string | null;
  bootcampStudentId: string | null;
  totalPrice: number;
  amountPaid: number;
  status: ReferralStatus;
  attributedAt: Date;
  enrolledAt: Date | null;
  paidInFullAt: Date | null;
  commissionPaidAt: Date | null;
  createdAt: Date;
}

export interface AffiliatePayout {
  id: string;
  affiliateId: string;
  referralId: string;
  amount: number;
  stripeTransferId: string | null;
  status: PayoutStatus;
  createdAt: Date;
  paidAt: Date | null;
}

export interface AffiliateAsset {
  id: string;
  title: string;
  description: string | null;
  assetType: AssetType;
  contentText: string | null;
  fileUrl: string | null;
  sortOrder: number;
  isVisible: boolean;
  createdAt: Date;
}

export interface AffiliateApplicationData {
  name: string;
  email: string;
  company?: string;
  bio?: string;
  applicationNote?: string;
  bootcampStudentId?: string;
}

export interface AffiliateStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarned: number;
  pendingPayouts: number;
}

export interface AffiliateAdminStats {
  totalAffiliates: number;
  activeAffiliates: number;
  pendingApplications: number;
  totalReferrals: number;
  totalCommissionsPaid: number;
  pendingPayouts: number;
}
