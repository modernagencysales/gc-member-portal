import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Search } from 'lucide-react';
import { IcpProfile } from '../../../types/tam-types';

const EMPLOYEE_SIZES = ['1-10', '11-50', '51-200', '201-1000', '1000+'];

// Official Prospeo industry enum — free-form values will be rejected by their API
const PROSPEO_INDUSTRIES = [
  'Accommodation Services',
  'Accounting',
  'Administrative and Support Services',
  'Advertising Services',
  'Agriculture, Construction, Mining Machinery Manufacturing',
  'Air, Water, and Waste Program Management',
  'Airlines and Aviation',
  'Alternative Dispute Resolution',
  'Alternative Medicine',
  'Ambulance Services',
  'Amusement Parks and Arcades',
  'Animal Feed Manufacturing',
  'Animation and Post-production',
  'Apparel Manufacturing',
  'Appliances, Electrical, and Electronics Manufacturing',
  'Architecture and Planning',
  'Artists and Writers',
  'Arts and Crafts',
  'Automation Machinery Manufacturing',
  'Automotive',
  'Aviation & Aerospace',
  'Aviation and Aerospace Component Manufacturing',
  'Banking',
  'Biotechnology Research',
  'Blockchain Services',
  'Boilers, Tanks, and Shipping Container Manufacturing',
  'Breweries',
  'Building Equipment Contractors',
  'Building Finishing Contractors',
  'Building Materials',
  'Building Structure and Exterior Contractors',
  'Business Consulting and Services',
  'Business Content',
  'Business Supplies and Equipment',
  'Capital Markets',
  'Chemical Manufacturing',
  'Child Day Care Services',
  'Civic and Social Organizations',
  'Civil Engineering',
  'Claims Adjusting, Actuarial Services',
  'Climate Technology Product Manufacturing',
  'Collection Agencies',
  'Community Services',
  'Computer and Network Security',
  'Computer Games',
  'Computer Hardware',
  'Construction',
  'Construction Hardware Manufacturing',
  'Consumer Goods',
  'Consumer Services',
  'Cosmetics',
  'Credit Intermediation',
  'Dairy Product Manufacturing',
  'Dance Companies',
  'Data Infrastructure and Analytics',
  'Data Security Software Products',
  'Defense and Space Manufacturing',
  'Dentists',
  'Design Services',
  'Digital Accessibility Services',
  'Distilleries',
  'E-Learning',
  'E-Learning Providers',
  'Education Administration Programs',
  'Electric Power Generation',
  'Engineering Services',
  'Engines and Power Transmission Equipment Manufacturing',
  'Entertainment Providers',
  'Environmental Services',
  'Equipment Rental Services',
  'Events Services',
  'Executive Offices',
  'Executive Search Services',
  'Fabricated Metal Products',
  'Facilities Services',
  'Farming',
  'Fashion Accessories Manufacturing',
  'Financial Services',
  'Fire Protection',
  'Food and Beverage Manufacturing',
  'Food and Beverage Retail',
  'Food and Beverage Services',
  'Freight and Package Transportation',
  'Fundraising',
  'Furniture and Home Furnishings Manufacturing',
  'Gambling Facilities and Casinos',
  'General Manufacturing',
  'General Repair and Maintenance',
  'General Retail',
  'General Wholesale',
  'Glass, Ceramics and Concrete Manufacturing',
  'Golf Courses and Country Clubs',
  'Government Administration',
  'Ground Passenger Transportation',
  'Higher Education',
  'Home Health Care Services',
  'Horticulture',
  'Hospitality',
  'Hospitals and Health Care',
  'Household, Laundry and Drycleaning Services',
  'Housing and Community Development',
  'Housing and Socio-Economic Programs',
  'Human Resources',
  'Human Resources Services',
  'HVAC and Refrigeration Equipment Manufacturing',
  'Individual and Family Services',
  'Industrial Machinery Manufacturing',
  'Industry Associations',
  'Information Services',
  'Insurance',
  'Interior Design',
  'International Trade and Development',
  'Internet Marketplace Platforms',
  'Investment Management',
  'Investment, Funds and Trusts',
  'IT Services and IT Consulting',
  'Janitorial Services',
  'Landscaping Services',
  'Law Enforcement',
  'Law Practice',
  'Leather Product Manufacturing',
  'Legal Services',
  'Libraries',
  'Loan Brokers',
  'Luxury Goods and Jewelry',
  'Machinery Manufacturing',
  'Maritime',
  'Maritime Transportation',
  'Market Research',
  'Marketing Services',
  'Mattress and Blinds Manufacturing',
  'Measuring and Control Instrument Manufacturing',
  'Mechanical or Industrial Engineering',
  'Media Production and Publishing',
  'Medical and Diagnostic Laboratories',
  'Medical Equipment Manufacturing',
  'Medical Practices',
  'Mental Health Care',
  'Metal Treatments',
  'Metalworking Machinery Manufacturing',
  'Mobile Food Services',
  'Mobile Gaming Apps',
  'Motor Vehicle Manufacturing',
  'Movies, Videos and Sound',
  'Museums, Historical Sites, and Zoos',
  'Music',
  'Nanotechnology Research',
  'Non-profit Organizations',
  'Office Administration',
  'Oil, Gas, and Mining',
  'Online and Mail Order Retail',
  'Optometrists',
  'Packaging and Containers',
  'Paint, Coating, and Adhesive Manufacturing',
  'Paper and Forest Products',
  'Personal Care Product Manufacturing',
  'Pet Services',
  'Pharmaceutical Manufacturing',
  'Philanthropy',
  'Philanthropic Fundraising Services',
  'Photography',
  'Physical, Occupational and Speech Therapists',
  'Plastics and Rubber Product Manufacturing',
  'Plastics Manufacturing',
  'Political Organizations',
  'Primary and Secondary Education',
  'Primary Metal Manufacturing',
  'Printing Services',
  'Professional Organizations',
  'Professional Services',
  'Professional Training and Coaching',
  'Public Relations and Communications Services',
  'Public Safety',
  'Radio and Television Broadcasting',
  'Railroad Equipment Manufacturing',
  'Ranching and Fisheries',
  'Real Estate',
  'Recreational Facilities',
  'Regenerative Design',
  'Religious Institutions',
  'Renewable Energy',
  'Research Services',
  'Restaurants',
  'Retail Apparel and Fashion',
  'Retail Building Materials and Garden Equipment',
  'Retail Florists',
  'Retail Furniture and Home Furnishings',
  'Retail Groceries',
  'Retail Health and Personal Care Products',
  'Retail Motor Vehicles',
  'Retail Musical Instruments',
  'Retail Office Equipment',
  'Retail Office Supplies and Gifts',
  'Retail Pharmacies',
  'Retail Recyclable Materials & Used Merchandise',
  'Robotics Engineering',
  'Schools',
  'Securities and Commodity Exchanges',
  'Security and Investigations',
  'Semiconductor Manufacturing',
  'Semiconductors',
  'Shipbuilding',
  'Social Networking Platforms',
  'Software Development',
  'Specialty Trade Contractors',
  'Spectator Sports',
  'Sporting Goods Manufacturing',
  'Sports and Recreation Instruction',
  'Sports Teams and Clubs',
  'Staffing and Recruiting',
  'Strategic Management Services',
  'Surveying and Mapping Services',
  'Taxi and Limousine Services',
  'Technology, Information and Internet',
  'Telecommunications',
  'Telephone Call Centers',
  'Textile Manufacturing',
  'Theater Companies',
  'Think Tanks',
  'Tobacco Manufacturing',
  'Translation and Localization',
  'Transportation Equipment Manufacturing',
  'Transportation, Logistics, Supply Chain and Storage',
  'Travel Arrangements',
  'Truck and Railroad Transportation',
  'Turned Products and Fastener Manufacturing',
  'Utilities',
  'Utilities Administration',
  'Utility System Construction',
  'Vehicle Repair and Maintenance',
  'Venture Capital and Private Equity Principals',
  'Veterinary Services',
  'Vocational Rehabilitation Services',
  'Warehousing and Storage',
  'Waste Collection',
  'Waste Treatment and Disposal',
  'Water Supply and Irrigation Systems',
  'Water, Waste, Steam, and Air Conditioning Services',
  'Wellness and Fitness Services',
  'Wholesale Apparel and Sewing Supplies',
  'Wholesale Building Materials',
  'Wholesale Chemical and Allied Products',
  'Wholesale Computer Equipment',
  'Wholesale Drugs and Sundries',
  'Wholesale Food and Beverage',
  'Wholesale Furniture and Home Furnishings',
  'Wholesale Hardware, Plumbing, Heating Equipment',
  'Wholesale Import and Export',
  'Wholesale Machinery',
  'Wholesale Metals and Minerals',
  'Wholesale Motor Vehicles and Parts',
  'Wholesale Recyclable Materials',
  'Wineries',
  'Wine and Spirits',
  'Wireless Services',
  'Wood Product Manufacturing',
];

interface WizardStep2Props {
  formData: Partial<IcpProfile>;
  setFormData: (data: Partial<IcpProfile>) => void;
  industryInput: string;
  setIndustryInput: (v: string) => void;
  countriesInput: string;
  setCountriesInput: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
  isValid: boolean;
}

const WizardStep2CompanyFilters: React.FC<WizardStep2Props> = ({
  formData,
  setFormData,
  setIndustryInput,
  countriesInput,
  setCountriesInput,
  onNext,
  onBack,
  isValid,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedIndustries = formData.industryKeywords || [];

  const filteredIndustries = useMemo(() => {
    if (!searchQuery.trim()) return PROSPEO_INDUSTRIES;
    const q = searchQuery.toLowerCase();
    return PROSPEO_INDUSTRIES.filter(
      (ind) => ind.toLowerCase().includes(q) && !selectedIndustries.includes(ind)
    );
  }, [searchQuery, selectedIndustries]);

  const updateIndustries = (industries: string[]) => {
    setFormData({ ...formData, industryKeywords: industries });
    setIndustryInput(industries.join(', '));
  };

  const addIndustry = (industry: string) => {
    if (!selectedIndustries.includes(industry)) {
      updateIndustries([...selectedIndustries, industry]);
    }
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const removeIndustry = (industry: string) => {
    updateIndustries(selectedIndustries.filter((i) => i !== industry));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleEmployeeSize = (size: string) => {
    const current = formData.employeeSizeRanges || [];
    if (current.includes(size)) {
      setFormData({ ...formData, employeeSizeRanges: current.filter((s) => s !== size) });
    } else {
      setFormData({ ...formData, employeeSizeRanges: [...current, size] });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Company Filters</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Define the characteristics of your ideal customer companies
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
            Employee Size (select all that apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {EMPLOYEE_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleEmployeeSize(size)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  formData.employeeSizeRanges?.includes(size)
                    ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 border-2 border-violet-500'
                    : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-2 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
            Geography
          </label>
          <div className="space-y-2">
            {['us_only', 'specific_countries', 'global'].map((geo) => (
              <label
                key={geo}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.geography === geo
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                <input
                  type="radio"
                  name="geography"
                  value={geo}
                  checked={formData.geography === geo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      geography: e.target.value as 'us_only' | 'specific_countries' | 'global',
                    })
                  }
                  className="w-5 h-5 text-violet-500"
                />
                <span className="text-zinc-900 dark:text-white font-medium">
                  {geo === 'us_only'
                    ? 'US Only'
                    : geo === 'specific_countries'
                      ? 'Specific Countries'
                      : 'Global'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {formData.geography === 'specific_countries' && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Country names (comma-separated)
            </label>
            <input
              type="text"
              value={countriesInput}
              onChange={(e) => setCountriesInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="e.g., United States, Canada, United Kingdom"
            />
          </div>
        )}

        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.usEmployeeFilter || false}
              onChange={(e) => setFormData({ ...formData, usEmployeeFilter: e.target.checked })}
              className="w-5 h-5 rounded border-zinc-300 dark:border-zinc-600 text-violet-500 focus:ring-violet-500"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              Filter for US-based employees (75%+ in US)
            </span>
          </label>
        </div>

        <div ref={dropdownRef}>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Industries
          </label>

          {/* Selected industries */}
          {selectedIndustries.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedIndustries.map((ind) => (
                <span
                  key={ind}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300"
                >
                  {ind}
                  <button
                    type="button"
                    onClick={() => removeIndustry(ind)}
                    className="hover:text-violet-900 dark:hover:text-violet-100"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search input */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
              placeholder="Search industries (e.g., Software, Marketing, SaaS)"
            />
          </div>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="mt-1 max-h-48 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg">
              {filteredIndustries.length > 0 ? (
                filteredIndustries
                  .filter((ind) => !selectedIndustries.includes(ind))
                  .slice(0, 20)
                  .map((ind) => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => addIndustry(ind)}
                      className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                    >
                      {ind}
                    </button>
                  ))
              ) : (
                <div className="px-4 py-3 text-sm text-zinc-400">No matching industries found</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default WizardStep2CompanyFilters;
