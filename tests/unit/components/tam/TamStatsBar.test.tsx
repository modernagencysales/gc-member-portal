import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test-utils';
import TamStatsBar from '../../../../components/tam/TamStatsBar';
import { TamProjectStats } from '../../../../types/tam-types';

function makeStats(overrides: Partial<TamProjectStats> = {}): TamProjectStats {
  return {
    totalCompanies: 0,
    qualifiedCompanies: 0,
    disqualifiedCompanies: 0,
    pendingCompanies: 0,
    totalContacts: 0,
    emailsVerified: 0,
    emailsCatchAll: 0,
    emailsNotFound: 0,
    linkedinActive: 0,
    linkedinInactive: 0,
    ...overrides,
  };
}

describe('TamStatsBar', () => {
  it('renders all four stat cards', () => {
    render(<TamStatsBar stats={makeStats()} />);

    expect(screen.getByText('Companies')).toBeInTheDocument();
    expect(screen.getByText('Contacts')).toBeInTheDocument();
    expect(screen.getByText('Email Coverage')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn Active')).toBeInTheDocument();
  });

  it('displays correct company totals', () => {
    const stats = makeStats({
      totalCompanies: 150,
      qualifiedCompanies: 80,
      disqualifiedCompanies: 30,
      pendingCompanies: 40,
    });

    render(<TamStatsBar stats={stats} />);

    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('80 qualified')).toBeInTheDocument();
    expect(screen.getByText('30 disqualified')).toBeInTheDocument();
    expect(screen.getByText('40 pending')).toBeInTheDocument();
  });

  it('displays correct contact count', () => {
    render(<TamStatsBar stats={makeStats({ totalContacts: 200 })} />);

    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('calculates email coverage percentage correctly', () => {
    const stats = makeStats({
      totalContacts: 100,
      emailsVerified: 40,
      emailsCatchAll: 10,
      emailsNotFound: 50,
    });

    render(<TamStatsBar stats={stats} />);

    // (40 + 10) / 100 = 50%
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('40 verified')).toBeInTheDocument();
    expect(screen.getByText('10 catch-all')).toBeInTheDocument();
    expect(screen.getByText('50 not found')).toBeInTheDocument();
  });

  it('shows 0% email coverage when no contacts', () => {
    render(<TamStatsBar stats={makeStats({ totalContacts: 0 })} />);

    const percentages = screen.getAllByText('0%');
    expect(percentages.length).toBeGreaterThanOrEqual(1);
  });

  it('calculates LinkedIn active percentage correctly', () => {
    const stats = makeStats({
      totalContacts: 200,
      linkedinActive: 80,
      linkedinInactive: 120,
    });

    render(<TamStatsBar stats={stats} />);

    // 80 / 200 = 40%
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText('80 active')).toBeInTheDocument();
    expect(screen.getByText('120 inactive')).toBeInTheDocument();
  });

  it('formats large numbers with locale string', () => {
    const stats = makeStats({
      totalCompanies: 1500,
      totalContacts: 3000,
    });

    render(<TamStatsBar stats={stats} />);

    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('3,000')).toBeInTheDocument();
  });
});
