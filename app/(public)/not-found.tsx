import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container-x py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-brand">404</p>
      <h1 className="mt-2 text-3xl font-semibold text-ink">Page not found</h1>
      <p className="mt-3 text-muted">The page you requested does not exist or has moved.</p>
      <div className="mt-6 flex justify-center gap-3"><Link href="/" className="btn-primary">Home</Link><Link href="/articles" className="btn-secondary">Search articles</Link></div>
    </div>
  );
}
