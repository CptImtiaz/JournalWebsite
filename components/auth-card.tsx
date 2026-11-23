import { Suspense, type ReactNode } from "react";
import { Flash } from "./client";

export function AuthCard({ title, subtitle, children, wide }: { title: string; subtitle?: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <div className="bg-surface py-14">
      <div className={`mx-auto px-4 ${wide ? "max-w-2xl" : "max-w-md"}`}>
        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-semibold text-navy">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          <div className="mt-6">
            <Suspense><Flash /></Suspense>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
