export const metadata = { title: "Terms of Use | Nakudin" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl mb-8">Terms of Use</h1>

      <div className="space-y-8 text-text/90 leading-relaxed">
        <p className="text-sm text-muted">Last updated: September 8, 2026</p>

        <section>
          <p>
            By using Nakudin (nakudin.com), you agree to the following terms.
            If you don&apos;t agree, please don&apos;t use the site.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">What Nakudin provides</h2>
          <p>
            Nakudin gives students free access to project source code and
            materials for reference and learning purposes. Projects are
            provided &ldquo;as is&rdquo;, without any guarantee of accuracy,
            originality-checking, or suitability for submission as your own
            work at any institution.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Academic integrity</h2>
          <p>
            Materials on Nakudin are meant as reference material to help you
            learn — study existing approaches, understand code structure, and
            get ideas for your own original work. Submitting someone
            else&apos;s project as your own may violate your institution&apos;s
            academic integrity policy. You are responsible for how you use
            what you download.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Content ownership and takedown requests</h2>
          <p>
            Projects hosted on Nakudin are sourced from existing student work.
            If you are the original author of a project on this site and did
            not consent to its being hosted here, or if you believe a listing
            infringes your rights, contact us through the{" "}
            <a href="/contact" className="text-lamp hover:underline">
              contact form
            </a>{" "}
            with the project&apos;s title or link, and we will review and
            remove it promptly.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Acceptable use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Re-upload downloaded materials to another paid platform for resale</li>
            <li>Use automated tools to scrape or bulk-download the entire catalog</li>
            <li>Attempt to bypass or interfere with the site&apos;s security</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">No warranty</h2>
          <p>
            Nakudin is provided free of charge, without warranties of any
            kind. We do not guarantee uninterrupted availability, and we are
            not liable for any outcome resulting from your use of materials
            found here — including academic outcomes.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Changes</h2>
          <p>
            We may update these terms as the site evolves. Continued use after
            changes means you accept the updated terms.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Contact</h2>
          <p>
            Questions about these terms? Use the{" "}
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
