import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../test-utils';
import userEvent from '@testing-library/user-event';
import IcpWizard from '../../../../components/tam/IcpWizard';

describe('IcpWizard', () => {
  const mockOnComplete = vi.fn();
  const defaultProps = { onComplete: mockOnComplete, userId: 'user-1' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders step 1 with business model options', () => {
    render(<IcpWizard {...defaultProps} />);

    expect(screen.getByText('Business Model')).toBeInTheDocument();
    expect(screen.getByText('B2B SaaS / Software')).toBeInTheDocument();
    expect(screen.getByText('E-commerce / DTC')).toBeInTheDocument();
    expect(screen.getByText('Agencies')).toBeInTheDocument();
  });

  it('renders seed company domains input field in step 1', () => {
    render(<IcpWizard {...defaultProps} />);

    expect(
      screen.getByText('Enter your best current clients or ideal companies')
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., stripe.com')).toBeInTheDocument();
  });

  it('adds and removes seed domains', async () => {
    const user = userEvent.setup();
    render(<IcpWizard {...defaultProps} />);

    const input = screen.getByPlaceholderText('e.g., stripe.com');
    const addButton = screen.getAllByText('Add')[0]; // First Add button is for domains

    // Add a domain
    await user.type(input, 'stripe.com');
    await user.click(addButton);

    expect(screen.getByText('stripe.com')).toBeInTheDocument();
    expect(screen.getByText('1/10')).toBeInTheDocument();

    // Add another
    await user.type(input, 'hubspot.com');
    await user.click(addButton);

    expect(screen.getByText('hubspot.com')).toBeInTheDocument();
    expect(screen.getByText('2/10')).toBeInTheDocument();
  });

  it('strips protocol and path from domain input', async () => {
    const user = userEvent.setup();
    render(<IcpWizard {...defaultProps} />);

    const input = screen.getByPlaceholderText('e.g., stripe.com');
    const addButton = screen.getAllByText('Add')[0];

    await user.type(input, 'https://stripe.com/pricing');
    await user.click(addButton);

    expect(screen.getByText('stripe.com')).toBeInTheDocument();
  });

  it('prevents duplicate domains', async () => {
    const user = userEvent.setup();
    render(<IcpWizard {...defaultProps} />);

    const input = screen.getByPlaceholderText('e.g., stripe.com');
    const addButton = screen.getAllByText('Add')[0];

    await user.type(input, 'stripe.com');
    await user.click(addButton);

    await user.type(input, 'stripe.com');
    await user.click(addButton);

    // Should only appear once
    const chips = screen.getAllByText('stripe.com');
    expect(chips).toHaveLength(1);
    expect(screen.getByText('1/10')).toBeInTheDocument();
  });

  it('adds domain on Enter key', async () => {
    const user = userEvent.setup();
    render(<IcpWizard {...defaultProps} />);

    const input = screen.getByPlaceholderText('e.g., stripe.com');

    await user.type(input, 'acme.com{Enter}');

    expect(screen.getByText('acme.com')).toBeInTheDocument();
  });

  it('disables Next button when required fields are empty', () => {
    render(<IcpWizard {...defaultProps} />);

    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
  });

  it('enables Next button when business model and whatYouSell are filled', async () => {
    const user = userEvent.setup();
    render(<IcpWizard {...defaultProps} />);

    // B2B SaaS is already selected by default
    const whatYouSell = screen.getByPlaceholderText('e.g., Marketing automation software');
    await user.type(whatYouSell, 'CRM software');

    const nextButton = screen.getByText('Next');
    expect(nextButton).not.toBeDisabled();
  });

  it('navigates through all 4 steps', async () => {
    const user = userEvent.setup();
    render(<IcpWizard {...defaultProps} />);

    // Step 1: fill required fields
    await user.type(screen.getByPlaceholderText('e.g., Marketing automation software'), 'CRM');
    await user.click(screen.getByText('Next'));

    // Step 2: Company Filters
    expect(screen.getByText('Company Filters')).toBeInTheDocument();
    await user.click(screen.getByText('11-50'));
    await user.click(screen.getByText('Next'));

    // Step 3: Contact Targeting
    expect(screen.getByText('Contact Targeting')).toBeInTheDocument();
    await user.click(screen.getByText('Next'));

    // Step 4: Review & Launch
    expect(screen.getByText('Review & Launch')).toBeInTheDocument();
    expect(screen.getByText('Start Building')).toBeInTheDocument();
  });

  it('shows seed companies in review step', async () => {
    const user = userEvent.setup();
    render(<IcpWizard {...defaultProps} />);

    // Step 1: fill required + add seed domain
    await user.type(screen.getByPlaceholderText('e.g., Marketing automation software'), 'CRM');
    const domainInput = screen.getByPlaceholderText('e.g., stripe.com');
    await user.type(domainInput, 'stripe.com{Enter}');
    await user.click(screen.getByText('Next'));

    // Step 2: select employee size
    await user.click(screen.getByText('11-50'));
    await user.click(screen.getByText('Next'));

    // Step 3: skip
    await user.click(screen.getByText('Next'));

    // Step 4: verify seed companies shown in review
    expect(screen.getByText('Seed Companies:')).toBeInTheDocument();
    expect(screen.getByText('stripe.com')).toBeInTheDocument();
  });

  it('calls onComplete with seedCompanyDomains when submitting', async () => {
    const user = userEvent.setup();
    render(<IcpWizard {...defaultProps} />);

    // Step 1
    await user.type(screen.getByPlaceholderText('e.g., Marketing automation software'), 'CRM');
    await user.type(screen.getByPlaceholderText('e.g., stripe.com'), 'acme.com{Enter}');
    await user.click(screen.getByText('Next'));

    // Step 2
    await user.click(screen.getByText('11-50'));
    await user.click(screen.getByText('Next'));

    // Step 3
    await user.click(screen.getByText('Next'));

    // Step 4: Submit
    await user.click(screen.getByText('Start Building'));

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
    const profile = mockOnComplete.mock.calls[0][0];
    expect(profile.seedCompanyDomains).toEqual(['acme.com']);
    expect(profile.businessModel).toBe('b2b_saas');
    expect(profile.whatYouSell).toBe('CRM');
  });

  it('omits seedCompanyDomains when none provided', async () => {
    const user = userEvent.setup();
    render(<IcpWizard {...defaultProps} />);

    // Step 1
    await user.type(screen.getByPlaceholderText('e.g., Marketing automation software'), 'CRM');
    await user.click(screen.getByText('Next'));

    // Step 2
    await user.click(screen.getByText('11-50'));
    await user.click(screen.getByText('Next'));

    // Step 3
    await user.click(screen.getByText('Next'));

    // Step 4
    await user.click(screen.getByText('Start Building'));

    const profile = mockOnComplete.mock.calls[0][0];
    expect(profile.seedCompanyDomains).toBeUndefined();
  });

  it('navigates back from step 2 to step 1', async () => {
    const user = userEvent.setup();
    render(<IcpWizard {...defaultProps} />);

    await user.type(screen.getByPlaceholderText('e.g., Marketing automation software'), 'CRM');
    await user.click(screen.getByText('Next'));

    expect(screen.getByText('Company Filters')).toBeInTheDocument();
    await user.click(screen.getByText('Back'));

    expect(screen.getByText('Business Model')).toBeInTheDocument();
  });
});
