"use client";

import Link from "next/link";
import { ReactNode } from "react";

type CTA = {
  label: string;
  href?: string;
  onClick?: () => void;
};

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  primaryCTA?: CTA;
  secondaryCTA?: CTA;
};

function CTAButton({ cta, primary }: { cta: CTA; primary: boolean }) {
  const className = primary
    ? "inline-flex items-center justify-center rounded-xl bg-[var(--brand-ocean)] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[var(--hover-navy)]"
    : "inline-flex items-center justify-center rounded-xl border border-[var(--mint-border)] bg-[var(--brand-glow)] px-4 py-2 text-sm font-bold text-[var(--brand-ocean)] transition-colors hover:bg-[var(--mint-light)]";

  if (cta.href) {
    return (
      <Link href={cta.href} className={className}>
        {cta.label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={cta.onClick} className={className}>
      {cta.label}
    </button>
  );
}

export default function EmptyState({ icon, title, description, primaryCTA, secondaryCTA }: EmptyStateProps) {
  return (
    <div className="mx-auto w-full max-w-[280px] rounded-xl border border-[var(--mint-border)] bg-[var(--brand-sand)] p-12 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center text-[var(--brand-ocean)]">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-[var(--brand-ink)]">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      {(primaryCTA || secondaryCTA) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {primaryCTA && <CTAButton cta={primaryCTA} primary />}
          {secondaryCTA && <CTAButton cta={secondaryCTA} primary={false} />}
        </div>
      )}
    </div>
  );
}
