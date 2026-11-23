import Link from "next/link";
export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold text-navy">Page not found</h1>
      <Link href="/" className="btn-primary mt-6">Return home</Link>
    </div>
  );
}
