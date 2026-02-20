import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ThemeToggle from '../blueprint/ThemeToggle';

const MSAPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
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
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Master Service Agreement</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10">
          Modern Agency Sales LLC &mdash; Last updated February 2026
        </p>

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-[15px] leading-relaxed">
          <p>
            This Master Service Agreement ("Agreement") is entered into between Modern Agency Sales
            LLC, a Florida limited liability company ("Provider"), and the client identified in the
            applicable Statement of Work ("Client"). By signing a proposal or Statement of Work that
            references this Agreement, Client agrees to be bound by these terms.
          </p>

          {/* 1. Services */}
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Services</h2>
            <p>
              Provider shall perform the services described in one or more Statements of Work
              ("SOW") executed by both parties. Each SOW shall reference this Agreement and describe
              the specific scope of work, deliverables, timelines, and fees. In the event of any
              conflict between a SOW and this Agreement, the terms of this Agreement shall control
              unless the SOW explicitly states otherwise.
            </p>
          </section>

          {/* 2. Term and Termination */}
          <section>
            <h2 className="text-xl font-semibold mb-3">2. Term and Termination</h2>
            <p>
              This Agreement is effective as of the date Client signs the applicable SOW and shall
              continue on a <strong>month-to-month basis</strong> unless terminated by either party.
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                Either party may terminate this Agreement by providing{' '}
                <strong>30 days' written notice</strong> to the other party.
              </li>
              <li>
                Either party may terminate immediately upon written notice if the other party
                materially breaches this Agreement and fails to cure such breach within 15 days of
                receiving written notice of the breach.
              </li>
              <li>
                Upon termination, Client shall pay Provider for all services rendered and expenses
                incurred through the effective date of termination.
              </li>
              <li>
                Sections 4, 5, 6, 7, 8, 9, and 10 shall survive termination of this Agreement.
              </li>
            </ul>
          </section>

          {/* 3. Payment */}
          <section>
            <h2 className="text-xl font-semibold mb-3">3. Payment</h2>
            <p>
              Client agrees to pay Provider the fees specified in the applicable SOW according to
              the following terms:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                All recurring fees shall be billed <strong>monthly via Stripe</strong> on the
                anniversary of the SOW start date unless otherwise specified. Client authorizes
                Provider to charge the payment method on file for recurring amounts.
              </li>
              <li>
                One-time setup fees, if any, are due upon execution of the SOW and are
                non-refundable.
              </li>
              <li>
                Any amounts not paid within 15 days of the due date shall accrue interest at a rate
                of <strong>1.5% per month</strong> (or the maximum rate permitted by law, whichever
                is lower) from the due date until paid in full.
              </li>
              <li>
                Provider reserves the right to <strong>suspend services after 15 days</strong> of
                non-payment. Services will be restored within 2 business days of receipt of all
                outstanding payments.
              </li>
              <li>
                Client is responsible for all taxes, duties, and government assessments arising from
                this Agreement, excluding taxes based on Provider's income.
              </li>
            </ul>
          </section>

          {/* 4. Confidentiality */}
          <section className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-3">4. Confidentiality</h2>
            <p>
              Each party ("Receiving Party") agrees to hold in strict confidence all non-public
              information disclosed by the other party ("Disclosing Party") that is designated as
              confidential or that a reasonable person would understand to be confidential given the
              nature of the information and the circumstances of disclosure ("Confidential
              Information").
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                Confidential Information includes, but is not limited to, business strategies,
                client lists, pricing, proprietary methodologies, login credentials, analytics data,
                campaign performance data, and any other non-public business information.
              </li>
              <li>
                The Receiving Party shall not disclose Confidential Information to any third party
                without the Disclosing Party's prior written consent, except to employees,
                contractors, or agents who have a need to know and are bound by confidentiality
                obligations at least as protective as those in this Agreement.
              </li>
              <li>
                The Receiving Party shall use the same degree of care to protect the Disclosing
                Party's Confidential Information as it uses to protect its own confidential
                information, but in no event less than reasonable care.
              </li>
              <li>
                These confidentiality obligations shall remain in effect for a period of{' '}
                <strong>2 years after termination</strong> of this Agreement.
              </li>
              <li>
                Confidential Information does not include information that: (a) is or becomes
                publicly available through no fault of the Receiving Party; (b) was known to the
                Receiving Party prior to disclosure; (c) is received from a third party without
                restriction; or (d) is independently developed without use of the Disclosing Party's
                Confidential Information.
              </li>
            </ul>
          </section>

          {/* 5. Intellectual Property */}
          <section>
            <h2 className="text-xl font-semibold mb-3">5. Intellectual Property</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Client Content:</strong> Upon full payment of all applicable fees, Client
                shall own all rights, title, and interest in and to the deliverables and content
                created specifically for Client under a SOW, including but not limited to copy,
                creative assets, campaigns, and reports ("Client Content").
              </li>
              <li>
                <strong>Provider Tools and Methods:</strong> Provider retains all rights, title, and
                interest in and to its proprietary tools, software, frameworks, methodologies,
                templates, processes, and know-how, whether developed before or during the
                engagement ("Provider IP"). Nothing in this Agreement transfers ownership of
                Provider IP to Client.
              </li>
              <li>
                <strong>License:</strong> Provider grants Client a non-exclusive, non-transferable
                license to use any Provider IP embedded in the deliverables solely for Client's
                internal business purposes.
              </li>
              <li>
                <strong>Portfolio Rights:</strong> Provider may reference the existence of the
                engagement and use anonymized, aggregated results as part of case studies or
                marketing materials, unless Client provides written notice to the contrary.
              </li>
            </ul>
          </section>

          {/* 6. Representations and Warranties */}
          <section>
            <h2 className="text-xl font-semibold mb-3">6. Representations and Warranties</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Provider represents that it shall perform the services in a{' '}
                <strong>professional and workmanlike manner</strong> consistent with generally
                accepted industry standards.
              </li>
              <li>
                Provider represents that it has the authority to enter into this Agreement and to
                perform the services contemplated herein.
              </li>
              <li>
                Client acknowledges that marketing, lead generation, and outreach services are
                inherently variable and that{' '}
                <strong>Provider makes no guarantees regarding specific outcomes</strong>, including
                but not limited to the number of leads generated, meetings booked, revenue produced,
                or any other performance metric.
              </li>
              <li>
                Client represents that it has the authority to enter into this Agreement and that
                any materials or information provided to Provider do not infringe on any third
                party's intellectual property rights.
              </li>
            </ul>
          </section>

          {/* 7. Limitation of Liability */}
          <section className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                <strong>No Indirect Damages:</strong> Neither party shall be liable to the other for
                any indirect, incidental, special, consequential, or punitive damages, including but
                not limited to loss of profits, revenue, data, or business opportunities, regardless
                of the cause of action or the theory of liability, even if such party has been
                advised of the possibility of such damages.
              </li>
              <li>
                <strong>Liability Cap:</strong> Provider's total aggregate liability arising out of
                or in connection with this Agreement shall not exceed the total fees paid by Client
                to Provider during the <strong>3-month period</strong> immediately preceding the
                event giving rise to the claim.
              </li>
              <li>
                This limitation of liability shall not apply to breaches of Section 4
                (Confidentiality), gross negligence, or willful misconduct.
              </li>
            </ul>
          </section>

          {/* 8. Indemnification */}
          <section>
            <h2 className="text-xl font-semibold mb-3">8. Indemnification</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>By Provider:</strong> Provider shall indemnify, defend, and hold harmless
                Client from and against any third-party claims, damages, losses, and expenses
                (including reasonable attorneys' fees) arising from Provider's gross negligence,
                willful misconduct, or infringement of a third party's intellectual property rights
                in the performance of the services.
              </li>
              <li>
                <strong>By Client:</strong> Client shall indemnify, defend, and hold harmless
                Provider from and against any third-party claims, damages, losses, and expenses
                (including reasonable attorneys' fees) arising from: (a) Client's use of the
                deliverables in a manner not contemplated by this Agreement; (b) Client's breach of
                any representation or warranty; or (c) any materials provided by Client that
                infringe a third party's rights.
              </li>
              <li>
                The indemnifying party's obligations are conditioned on: (a) prompt written notice
                of the claim; (b) sole control of the defense and settlement; and (c) reasonable
                cooperation from the indemnified party at the indemnifying party's expense.
              </li>
            </ul>
          </section>

          {/* 9. Non-Solicitation */}
          <section>
            <h2 className="text-xl font-semibold mb-3">9. Non-Solicitation</h2>
            <p>
              During the term of this Agreement and for a period of <strong>12 months</strong>{' '}
              following its termination, neither party shall directly or indirectly solicit,
              recruit, or hire any employee, contractor, or agent of the other party who was
              involved in the performance of services under this Agreement, without the prior
              written consent of the other party.
            </p>
            <p className="mt-3">
              This restriction shall not apply to general solicitations of employment (such as job
              postings) that are not specifically directed at the other party's personnel.
            </p>
          </section>

          {/* 10. Governing Law and Dispute Resolution */}
          <section>
            <h2 className="text-xl font-semibold mb-3">10. Governing Law and Dispute Resolution</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                This Agreement shall be governed by and construed in accordance with the laws of the{' '}
                <strong>State of Florida</strong>, without regard to its conflict of laws
                principles.
              </li>
              <li>
                Any dispute, controversy, or claim arising out of or relating to this Agreement
                shall first be subject to good-faith negotiation between the parties for a period of
                30 days.
              </li>
              <li>
                If the dispute is not resolved through negotiation, it shall be resolved by{' '}
                <strong>binding arbitration</strong> administered by the American Arbitration
                Association ("AAA") in accordance with its Commercial Arbitration Rules. The
                arbitration shall take place in Florida.
              </li>
              <li>
                The arbitrator's decision shall be final and binding, and judgment on the award may
                be entered in any court having jurisdiction.
              </li>
              <li>
                Each party shall bear its own costs and attorneys' fees in connection with
                arbitration, unless the arbitrator determines otherwise.
              </li>
            </ul>
          </section>

          {/* 11. Entire Agreement */}
          <section>
            <h2 className="text-xl font-semibold mb-3">11. Entire Agreement</h2>
            <p>
              This Agreement, together with any SOWs executed hereunder, constitutes the entire
              agreement between the parties with respect to the subject matter hereof and supersedes
              all prior or contemporaneous understandings, agreements, negotiations,
              representations, and warranties, whether written or oral, relating to such subject
              matter.
            </p>
            <p className="mt-3">
              No modification, amendment, or waiver of any provision of this Agreement shall be
              effective unless in writing and signed by both parties. No failure or delay by either
              party in exercising any right under this Agreement shall constitute a waiver of that
              right.
            </p>
            <p className="mt-3">
              If any provision of this Agreement is held to be invalid or unenforceable, the
              remaining provisions shall continue in full force and effect.
            </p>
          </section>

          {/* Contact */}
          <section className="border-t border-zinc-200 dark:border-zinc-800 pt-8 mt-10">
            <h2 className="text-xl font-semibold mb-3">Questions</h2>
            <p>If you have questions about this Master Service Agreement, please contact us at:</p>
            <p className="mt-2">
              <strong>Modern Agency Sales LLC</strong>
              <br />
              Email:{' '}
              <a
                href="mailto:tim@modernagencysales.com"
                className="text-violet-600 dark:text-violet-400 hover:underline"
              >
                tim@modernagencysales.com
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <p>&copy; {new Date().getFullYear()} Modern Agency Sales LLC. All rights reserved.</p>
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
            <Link to="/terms/msa" className="text-zinc-900 dark:text-zinc-100 font-medium">
              MSA
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MSAPage;
