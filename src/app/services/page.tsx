import type { Metadata } from "next";
import ServiceRequestForm from "@/components/ServiceRequestForm";
import Link from "next/link";

const BASE_URL = "https://www.nakudin.com";

export const metadata: Metadata = {
  title: "Services | Nakudin",
  description:
    "Get your final year project written, or commission a website or application. Built by the team behind Nakudin's student project archive.",
  alternates: { canonical: `${BASE_URL}/services` },
  openGraph: {
    title: "Services | Nakudin",
    description:
      "Get your final year project written, or commission a website or application.",
    url: `${BASE_URL}/services`,
    type: "website",
  },
};

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-3xl md:text-4xl">Services</h1>
      <p className="mt-4 text-muted max-w-xl leading-relaxed">
        In addition to the free archive, we offer paid services for students
        and organisations who need something built.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mt-10">
        {/* Final-year project writing */}
        <div className="border border-border bg-surface px-6 py-6">
          <h2 className="font-display text-xl">Final Year Project Writing</h2>
          <p className="text-sm text-muted mt-2 leading-relaxed">
            Complete project write-up for any level — undergraduate,
            postgraduate, diploma, or NCE. Includes abstract, chapters 1–5,
            references, and any code or materials for software-based topics.
          </p>
          <ul className="mt-4 space-y-1.5 text-sm text-muted">
            <li className="flex gap-2"><span className="text-lamp">✓</span> All departments</li>
            <li className="flex gap-2"><span className="text-lamp">✓</span> Plagiarism-free, custom-written</li>
            <li className="flex gap-2"><span className="text-lamp">✓</span> Source code included for software topics</li>
            <li className="flex gap-2"><span className="text-lamp">✓</span> Revisions until approval</li>
          </ul>
        </div>

        {/* Website & app development */}
        <div className="border border-border bg-surface px-6 py-6">
          <h2 className="font-display text-xl">Website &amp; App Development</h2>
          <p className="text-sm text-muted mt-2 leading-relaxed">
            Custom websites and mobile/desktop applications, built to your
            spec. E-commerce, portfolios, management systems, API backends —
            anything from a landing page to a full-stack application.
          </p>
          <ul className="mt-4 space-y-1.5 text-sm text-muted">
            <li className="flex gap-2"><span className="text-lamp">✓</span> Responsive, modern design</li>
            <li className="flex gap-2"><span className="text-lamp">✓</span> Hosting &amp; deployment handled</li>
            <li className="flex gap-2"><span className="text-lamp">✓</span> Source code delivered</li>
            <li className="flex gap-2"><span className="text-lamp">✓</span> Post-launch support</li>
          </ul>
        </div>
      </div>

      {/* Request form */}
      <section className="mt-14">
        <h2 className="font-display text-2xl mb-2">Request a quote</h2>
        <p className="text-muted text-sm mb-6">
          Fill in the form below and we&apos;ll get back to you within 24 hours.
          You can also reach us directly via{" "}
          <Link href="/contact" className="text-lamp hover:underline">
            the contact page
          </Link>.
        </p>
        <ServiceRequestForm />
      </section>
    </div>
  );
}