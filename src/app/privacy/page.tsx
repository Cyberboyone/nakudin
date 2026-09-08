export const metadata = { title: "Privacy Policy | Nakudin" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl mb-8">Privacy Policy</h1>

      <div className="space-y-8 text-text/90 leading-relaxed">
        <p className="text-sm text-muted">Last updated: September 8, 2026</p>

        <section>
          <h2 className="font-display text-lg mb-2">What Nakudin is</h2>
          <p>
            Nakudin (nakudin.com) is a free platform where university students
            can find final year project source code and materials, organized
            by department and level. This policy explains what information we
            collect when you use the site and why.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Information we collect</h2>
          <p>We collect the following:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong>Contact form submissions</strong> — if you use the
              &ldquo;Report an issue&rdquo; form, we store your message and,
              only if you choose to provide them, your name and email address,
              so we can follow up.
            </li>
            <li>
              <strong>Usage data</strong> — we count page views and downloads
              per project to understand which projects are useful to
              students. This is aggregate and not tied to your identity.
            </li>
            <li>
              <strong>Cookies from advertising</strong> — Nakudin shows ads
              through Google AdSense. Google and its partners use cookies to
              serve ads based on your visits to this and other websites. See
              &ldquo;Advertising&rdquo; below.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Advertising</h2>
          <p>
            We use Google AdSense to show ads on Nakudin. Google, as a
            third-party vendor, uses cookies to serve ads based on your prior
            visits to this website or other websites. Google&apos;s use of
            advertising cookies enables it and its partners to serve ads based
            on your visit to this site and/or other sites on the internet.
          </p>
          <p className="mt-2">
            You can opt out of personalized advertising by visiting{" "}
            <a
              href="https://adssettings.google.com"
              className="text-lamp hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Ads Settings
            </a>
            , or generally at{" "}
            <a
              href="https://www.aboutads.info/choices"
              className="text-lamp hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.aboutads.info/choices
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">How we use your information</h2>
          <p>
            We use contact form submissions only to respond to your message or
            fix the issue you reported. We use aggregate usage data to decide
            which departments and project types to prioritize adding more of.
            We do not sell your personal information to anyone.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Data retention</h2>
          <p>
            Contact messages are kept until resolved and may be deleted
            periodically. You can request deletion of any message you sent by
            contacting us with details identifying it.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Children&apos;s privacy</h2>
          <p>
            Nakudin is intended for university students and is not directed
            at children under 13. We do not knowingly collect personal
            information from children under 13.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Changes to this policy</h2>
          <p>
            We may update this policy as the site changes. Continued use of
            Nakudin after changes means you accept the updated policy.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Contact</h2>
          <p>
            Questions about this policy? Use the{" "}
            <a href="/contact" className="text-lamp hover:underline">
              contact form
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
