import { ReactNode } from "react";
import Link from "next/link";

type CTAProps = { label: string; href?: string; onClick?: () => void };

type EmptyStateProps = {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  primaryCTA?: CTAProps;
  secondaryCTA?: CTAProps;
  icon?: ReactNode;
};

export function EmptyState({ title, description, actionText, onAction, primaryCTA, secondaryCTA, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/50">
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-4 text-2xl">
        {icon || "📦"}
      </div>
      <h3 className="text-xl font-bold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 mt-2 max-w-sm">{description}</p>
      
      <div className="mt-6 flex gap-3">
        {primaryCTA && (
          primaryCTA.href ? (
            <Link href={primaryCTA.href} className="px-6 py-2.5 rounded-full bg-[#0f1b2d] text-white text-sm font-semibold hover:bg-[#1b5b6a] transition shadow-md">
              {primaryCTA.label}
            </Link>
          ) : (
            <button onClick={primaryCTA.onClick} className="px-6 py-2.5 rounded-full bg-[#0f1b2d] text-white text-sm font-semibold hover:bg-[#1b5b6a] transition shadow-md">
              {primaryCTA.label}
            </button>
          )
        )}
        {secondaryCTA && (
          secondaryCTA.href ? (
            <Link href={secondaryCTA.href} className="px-6 py-2.5 rounded-full border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition shadow-sm">
              {secondaryCTA.label}
            </Link>
          ) : (
            <button onClick={secondaryCTA.onClick} className="px-6 py-2.5 rounded-full border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition shadow-sm">
              {secondaryCTA.label}
            </button>
          )
        )}
        {actionText && onAction && !primaryCTA && (
          <button
            onClick={onAction}
            className="px-6 py-2.5 rounded-full bg-[#0f1b2d] text-white text-sm font-semibold hover:bg-[#1b5b6a] transition shadow-md"
          >
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
}
