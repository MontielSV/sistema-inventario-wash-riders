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
    icon: 'border-blue-300 bg-blue-200 text-blue-800',
  },
  cyan: {
    eyebrow: 'text-cyan-700',
    title: 'text-cyan-800',
    icon: 'border-cyan-300 bg-cyan-200 text-cyan-800',
  },
  emerald: {
    eyebrow: 'text-emerald-700',
    title: 'text-emerald-800',
    icon: 'border-emerald-300 bg-emerald-200 text-emerald-800',
  },
  red: {
    eyebrow: 'text-rose-700',
    title: 'text-rose-800',
    icon: 'border-rose-300 bg-rose-200 text-rose-800',
  },
  amber: {
    eyebrow: 'text-amber-700',
    title: 'text-amber-800',
    icon: 'border-amber-300 bg-amber-200 text-amber-800',
  },
  sky: {
    eyebrow: 'text-sky-700',
    title: 'text-sky-800',
    icon: 'border-sky-300 bg-sky-200 text-sky-800',
  },
  teal: {
    eyebrow: 'text-teal-700',
    title: 'text-teal-800',
    icon: 'border-teal-300 bg-teal-200 text-teal-800',
  },
  violet: {
    eyebrow: 'text-violet-700',
    title: 'text-violet-800',
    icon: 'border-violet-300 bg-violet-200 text-violet-800',
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
          <span aria-hidden="true" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border [&_svg]:h-6 [&_svg]:w-6 [&_svg]:stroke-[2] ${colors.icon}`}>
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
