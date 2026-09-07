import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <p className="font-display text-3xl mb-3">Not on the shelf</p>
      <p className="text-muted mb-8">
        That page doesn&apos;t exist — it may have been removed, or the link
        might be wrong.
      </p>
      <Link
        href="/"
        className="inline-block bg-lamp text-ink font-medium px-5 py-2.5 text-sm hover:brightness-110 transition"
      >
        Back to Nakudin
      </Link>
    </div>
  );
}
