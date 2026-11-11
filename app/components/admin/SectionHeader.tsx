import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  description: string;
  icon: ReactNode;
  accent?: 'blue' | 'cyan' | 'emerald' | 'red' | 'amber' | 'sky' | 'teal' | 'violet';
  className?: string;
  children?: ReactNode;
}

const accentStyles = {
  blue: {
    eyebrow: 'text-blue-700',
    title: 'text-blue-900',
    icon: 'bg-blue-100 text-blue-800',
  },
  cyan: {
    eyebrow: 'text-cyan-700',
    title: 'text-cyan-800',
    icon: 'bg-cyan-100 text-cyan-800',
  },
  emerald: {
    eyebrow: 'text-emerald-700',
    title: 'text-emerald-800',
    icon: 'bg-emerald-100 text-emerald-800',
  },
  red: {
    eyebrow: 'text-rose-700',
    title: 'text-rose-800',
    icon: 'bg-rose-100 text-rose-800',
  },
  amber: {
    eyebrow: 'text-amber-700',
    title: 'text-amber-800',
    icon: 'bg-amber-100 text-amber-800',
  },
  sky: {
    eyebrow: 'text-sky-700',
    title: 'text-sky-800',
    icon: 'bg-sky-100 text-sky-800',
  },
  teal: {
    eyebrow: 'text-teal-700',
    title: 'text-teal-800',
    icon: 'bg-teal-100 text-teal-800',
  },
  violet: {
    eyebrow: 'text-violet-700',
    title: 'text-violet-800',
    icon: 'bg-violet-100 text-violet-800',
  },
} as const;

export default function SectionHeader({
  title,
  description,
  icon,
  accent = 'blue',
  className = '',
  children,
}: SectionHeaderProps) {
  const colors = accentStyles[accent];

  return (
    <header className={`flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div>
        <p className={`text-xs font-bold uppercase tracking-widest ${colors.eyebrow}`}>Wash Riders - {title}</p>
        <div className="mt-2 flex items-center gap-3">
          <span aria-hidden="true" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colors.icon}`}>
            {icon}
          </span>
          <h1 className={`text-3xl font-black tracking-tight sm:text-4xl ${colors.title}`}>{title}</h1>
        </div>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  );
}
