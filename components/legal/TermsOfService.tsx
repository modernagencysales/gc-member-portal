import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ThemeToggle from '../blueprint/ThemeToggle';

const TermsOfService: React.FC = () => {
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
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10">
          Last updated: February 17, 2026
        </p>

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the services provided by Modern Agency Sales ("we," "us," or
              "our"), including the GTM Conductor platform, LinkedIn Authority Blueprints, Growth
              Collective portal, and related tools, you agree to be bound by these Terms of Service.
              If you do not agree, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Description of Services</h2>
            <p>
              We provide marketing automation, LinkedIn optimization, lead generation, and business
              growth services. Our platform includes tools for Blueprint generation, outreach
              campaigns, content creation, and related business services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
            <p>
              To access certain features, you may be required to create an account. You are
              responsible for maintaining the confidentiality of your credentials and for all
              activities that occur under your account. You agree to provide accurate and complete
              information and to notify us immediately of any unauthorized use.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Use our services for unlawful purposes</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt our services</li>
              <li>Reverse engineer, decompile, or disassemble any part of our platform</li>
              <li>
                Use our services to send spam or unsolicited messages in violation of applicable
                laws
              </li>
              <li>Misrepresent your identity or affiliation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Payments and Subscriptions</h2>
            <p>
              Certain services require payment. By subscribing, you agree to pay all applicable
              fees. Payments are processed through Stripe. Subscription terms, pricing, and refund
              policies are provided at the time of purchase. We reserve the right to modify pricing
              with reasonable notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Intellectual Property</h2>
            <p>
              All content, features, and functionality of our services — including text, graphics,
              logos, software, and AI-generated outputs — are owned by Modern Agency Sales and
              protected by applicable intellectual property laws. You retain ownership of any data
              you submit to our platform.
            </p>
          </section>

          <section className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-3">7. SMS Messaging Terms</h2>
            <p>
              By providing your phone number and opting in, you consent to receive SMS messages from
              Modern Agency Sales. These messages may include:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Service notifications and updates</li>
              <li>Appointment reminders and confirmations</li>
              <li>Marketing and promotional messages</li>
              <li>Account alerts and security notifications</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-2">Message Frequency</h3>
            <p>
              Message frequency varies based on your account activity and preferences. You may
              receive up to 10 messages per month depending on your service usage.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-2">Opt-Out Procedures</h3>
            <p>
              You may opt out of SMS messaging at any time by using any of the following methods:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>
                <strong>Reply STOP:</strong> Reply "STOP" to any SMS message you receive from us to
                immediately unsubscribe from all SMS communications.
              </li>
              <li>
                <strong>Email Us:</strong> Send an opt-out request to support@modernagencysales.com
                with "SMS Opt-Out" in the subject line.
              </li>
              <li>
                <strong>Contact Support:</strong> Reach out to our support team to request removal
                from SMS lists.
              </li>
            </ul>
            <p className="mt-3">
              After opting out, you will receive a one-time confirmation message. You will not
              receive any further SMS messages unless you re-subscribe.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-2">Costs</h3>
            <p>
              Message and data rates may apply depending on your mobile carrier and plan. We are not
              responsible for any charges from your carrier.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-2">Help</h3>
            <p>
              For help with SMS messaging, reply "HELP" to any message or contact us at
              support@modernagencysales.com.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Disclaimer of Warranties</h2>
            <p>
              Our services are provided "as is" and "as available" without warranties of any kind,
              either express or implied. We do not guarantee that our services will be
              uninterrupted, error-free, or secure. Results from using our marketing and lead
              generation tools may vary.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Modern Agency Sales shall not be liable for
              any indirect, incidental, special, consequential, or punitive damages arising from
              your use of our services. Our total liability shall not exceed the amount you paid us
              in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Modern Agency Sales, its officers, employees,
              and agents from any claims, damages, or expenses arising from your use of our services
              or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Termination</h2>
            <p>
              We may suspend or terminate your access to our services at any time for violation of
              these Terms or for any other reason at our discretion. Upon termination, your right to
              use our services ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the
              United States. Any disputes shall be resolved through binding arbitration or in the
              courts of competent jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">13. Changes to These Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. Changes will be effective when
              posted on this page. Your continued use of our services after changes constitutes
              acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">14. Contact Us</h2>
            <p>If you have questions about these Terms of Service, please contact us at:</p>
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

export default TermsOfService;
