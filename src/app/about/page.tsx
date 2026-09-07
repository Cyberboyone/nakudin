export const metadata = { title: "About | Nakudin" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl mb-6">About Nakudin</h1>
      <div className="space-y-5 text-text/90 leading-relaxed">
        <p>
          Nakudin is a free archive of final year project source code and
          materials for university students — built to make final year
          projects less of a mystery and less of a financial burden.
        </p>
        <p>
          Every listing includes the complete project write-up. Where the
          project involves software, the full source code is included too, so
          you can see exactly how it was built, not just read about it.
        </p>
        <p>
          Projects are organized by department and academic level, starting
          with undergraduate work, with postgraduate projects being added over
          time.
        </p>
        <p>
          Nakudin is free to use and supported by ads, so it can stay free.
          Have a project you&apos;d like to see added, or an issue to report?{" "}
          <a href="/contact" className="text-lamp hover:underline">
            Get in touch
          </a>
          .
        </p>
      </div>
    </div>
  );
}
