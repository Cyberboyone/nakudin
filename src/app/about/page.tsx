export const metadata = { title: "About | Nakudin" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl mb-6">About Nakudin</h1>
      <div className="space-y-5 text-text/90 leading-relaxed">
        <p>
          Nakudin is a free reference archive of final year project source
          code and materials for university students. It exists so students
          can study how past projects were structured, researched, and built.
        </p>
        <p>
          Each listing shows a project&apos;s write-up and, for software projects,
          its source code, so you can see how a finished project was put
          together. Materials are for reference and learning only and must
          not be submitted as your own work.
        </p>
        <p>
          Projects are organized by department and academic level —
          undergraduate, postgraduate, diploma, and NCE work.
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
