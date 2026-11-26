import Link from "next/link";
export default function Forbidden() {
  return (
    <div className="container-x py-24 text-center">
      <h1 className="text-3xl font-semibold text-ink">Access denied</h1>
      <p className="mt-3 text-muted">Your account does not have permission to view this page.</p>
      <Link href="/account" className="btn-primary mt-6">Go to my dashboard</Link>
    </div>
  );
}
