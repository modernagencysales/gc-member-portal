import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ThemeToggle from '../blueprint/ThemeToggle';

const PrivacyPolicy: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10">
          Last updated: February 17, 2026
        </p>

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p>
              Modern Agency Sales ("we," "us," or "our") operates the GTM Conductor platform and
              related services. This Privacy Policy describes how we collect, use, and protect your
              personal information when you use our website, services, and tools.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>
                <strong>Personal Information:</strong> Name, email address, phone number, LinkedIn
                profile URL, and business information you provide through our forms.
              </li>
              <li>
                <strong>Usage Data:</strong> Information about how you interact with our services,
                including pages visited, features used, and time spent on the platform.
              </li>
              <li>
                <strong>Device Information:</strong> Browser type, operating system, IP address, and
                device identifiers.
              </li>
              <li>
                <strong>Communication Data:</strong> Messages, emails, and other communications you
                send to us or through our platform, including SMS messages if you opt in to receive
                them.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Generate LinkedIn Authority Blueprints and related reports</li>
              <li>Send you service-related communications, updates, and marketing messages</li>
              <li>Send SMS messages if you have opted in to receive them</li>
              <li>Process payments and manage subscriptions</li>
              <li>Respond to your inquiries and support requests</li>
              <li>Analyze usage patterns to improve user experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-3">4. Data Sharing and Third Parties</h2>
            <p className="font-medium">
              We do NOT sell, rent, or share your personal data with third parties for their own
              marketing purposes.
            </p>
            <p className="mt-3">
              We may share your information only in the following limited circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>
                <strong>Service Providers:</strong> We use trusted third-party services (such as
                payment processors, email delivery services, and hosting providers) that process
                data on our behalf and are contractually obligated to protect your information.
              </li>
              <li>
                <strong>Legal Requirements:</strong> We may disclose information if required by law,
                court order, or governmental regulation.
              </li>
              <li>
                <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale
                of assets, your information may be transferred as part of that transaction.
              </li>
              <li>
                <strong>With Your Consent:</strong> We may share information when you explicitly
                authorize us to do so.
              </li>
            </ul>
            <p className="mt-3">
              Under no circumstances will we share your personal data with unaffiliated third
              parties for their own independent use or marketing purposes without your explicit
              consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your personal information,
              including encryption in transit (TLS/SSL), secure database storage, and access
              controls. While no method of transmission or storage is 100% secure, we take
              reasonable precautions to safeguard your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide our services,
              comply with legal obligations, resolve disputes, and enforce our agreements. You may
              request deletion of your data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your personal data</li>
              <li>Opt out of marketing communications</li>
              <li>Opt out of SMS messaging at any time</li>
              <li>Withdraw consent where processing is based on consent</li>
              <li>Lodge a complaint with a data protection authority</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to improve your experience, analyze usage, and
              deliver relevant content. You can manage cookie preferences through your browser
              settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Children's Privacy</h2>
            <p>
              Our services are not directed to individuals under 18 years of age. We do not
              knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material
              changes by posting the updated policy on this page with a revised "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or wish to exercise your data rights,
              please contact us at:
            </p>
            <p className="mt-2">
              <strong>Modern Agency Sales</strong>
              <br />
              Email: support@modernagencysales.com
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <p>&copy; {new Date().getFullYear()} Modern Agency Sales. All rights reserved.</p>
          <div className="flex gap-6">
            <Link
              to="/privacy"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
