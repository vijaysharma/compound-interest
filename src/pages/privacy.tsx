import SEOHead from '../components/SEOHead';
import Breadcrumb from '../components/Breadcrumb';
const privacySchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Privacy Policy — Rupee Calculator',
  url: 'https://rupees.vercel.app/privacy',
  description:
    'Privacy policy for Rupee Calculator. We collect zero personal data — all calculations run 100% client-side in your browser.',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://rupees.vercel.app/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Privacy Policy',
        item: 'https://rupees.vercel.app/privacy',
      },
    ],
  },
};
const Privacy = () => {
  const lastUpdated = 'August 31, 2026';
  return (
    <main className="w-full max-w-3xl mx-auto px-4 py-8">
      <SEOHead
        title="Privacy Policy — Rupee Calculator (Zero Data Collection)"
        description="Rupee Calculator collects zero personal data. All financial calculations run 100% client-side in your browser. No cookies, no tracking, no server transmission."
        canonicalPath="/privacy"
        schema={privacySchema}
        noIndex={false}
      />
      <Breadcrumb items={[{ name: 'Home', href: '/' }, { name: 'Privacy Policy' }]} />
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-xs opacity-60">Last updated: {lastUpdated}</p>
      </header>
      <div className="prose prose-sm max-w-none space-y-8 text-base-content">
        {/* TL;DR */}
        <div className="p-5 bg-success/10 border border-success/30 rounded-xl">
          <p className="font-bold text-sm mb-1">🔒 TL;DR — Our Privacy Guarantee</p>
          <p className="text-sm opacity-85 leading-relaxed">
            <strong>Rupee Calculator collects zero personal or financial data.</strong> Every
            calculation — SIP returns, EMI schedules, FD maturity values, and PPP conversions — runs
            entirely within your browser using JavaScript. No financial numbers are ever transmitted
            to our servers, stored in any database, or shared with any third party.
          </p>
        </div>
        <section>
          <h2 className="text-xl font-bold mb-3">1. Information We Do NOT Collect</h2>
          <p className="text-sm opacity-80 leading-relaxed mb-3">
            Unlike most financial websites, Rupee Calculator does not collect, store, or process:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm opacity-80">
            <li>Your salary, income, or investment amounts entered in calculators</li>
            <li>Loan amounts, EMI values, or interest rates you input</li>
            <li>Mutual fund preferences or portfolio holdings</li>
            <li>
              Personal identification information (name, email, phone) — unless you choose to create
              an account
            </li>
            <li>Financial goals, retirement targets, or wealth projections</li>
            <li>Browser fingerprints or device identifiers</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold mb-3">
            2. How Calculator Data Works (Client-Side Architecture)
          </h2>
          <p className="text-sm opacity-80 leading-relaxed">
            All mathematical computations on Rupee Calculator execute locally in your web browser
            using JavaScript. When you enter ₹10,000 as a monthly SIP amount, that number is used
            purely within your browser's memory to compute the result — it is never sent over the
            internet to any server.
          </p>
          <p className="text-sm opacity-80 leading-relaxed mt-3">
            This is fundamentally different from server-side calculators where your inputs are
            transmitted to a remote server for processing and potentially logged. Our client-side
            architecture ensures mathematical zero-knowledge privacy by design.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold mb-3">3. Optional Account Registration</h2>
          <p className="text-sm opacity-80 leading-relaxed">
            Some advanced features (such as Mutual Fund CAGR analysis with live AMFI data and the
            PPP calculator) require creating a free account. If you register, we collect and store
            only your email address for authentication purposes. We never share this with third
            parties for marketing purposes.
          </p>
          <p className="text-sm opacity-80 leading-relaxed mt-2">
            You may delete your account at any time by contacting us, after which all associated
            data is permanently removed from our systems.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold mb-3">4. External Data APIs</h2>
          <p className="text-sm opacity-80 leading-relaxed">
            To display live mutual fund NAV data and macroeconomic indicators, your browser makes
            direct API calls to:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm opacity-80 mt-2">
            <li>
              <strong>AMFI India API</strong> (api.mfapi.in) — for mutual fund NAV history. This
              call does not transmit any personal information.
            </li>
            <li>
              <strong>World Bank API</strong> (api.worldbank.org) — for PPP conversion factors.
              Standard HTTP request metadata (IP address) may be visible to World Bank per their
              privacy terms.
            </li>
            <li>
              <strong>IMF DataMapper API</strong> — for inflation forecasts. Same standard HTTP
              metadata applies.
            </li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold mb-3">5. Cookies</h2>
          <p className="text-sm opacity-80 leading-relaxed">
            Rupee Calculator uses minimal cookies strictly necessary for authentication (login
            session management). We do not use advertising cookies, tracking pixels, or third-party
            analytics cookies. We do not use Google Analytics, Meta Pixel, or similar tracking
            tools.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold mb-3">6. Security</h2>
          <p className="text-sm opacity-80 leading-relaxed">
            Our website is served exclusively over HTTPS with strict transport security (HSTS). We
            implement Content Security Policy (CSP) headers, X-Frame-Options protections, and follow
            OWASP security best practices.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold mb-3">7. Changes to This Policy</h2>
          <p className="text-sm opacity-80 leading-relaxed">
            We may update this privacy policy from time to time. The "Last updated" date at the top
            of this page reflects the most recent revision. Material changes will be communicated to
            registered users via email.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold mb-3">8. Contact</h2>
          <p className="text-sm opacity-80 leading-relaxed">
            For privacy-related questions or account deletion requests, please contact us through
            the{' '}
            <a href="https://rupees.vercel.app/" className="text-primary hover:underline">
              Rupee Calculator website
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
};
export default Privacy;
