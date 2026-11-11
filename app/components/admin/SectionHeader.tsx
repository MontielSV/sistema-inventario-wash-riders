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
    icon: 'border-blue-400 bg-blue-300 text-blue-950',
  },
  cyan: {
    eyebrow: 'text-cyan-700',
    title: 'text-cyan-800',
    icon: 'border-cyan-400 bg-cyan-300 text-cyan-950',
  },
  emerald: {
    eyebrow: 'text-emerald-700',
    title: 'text-emerald-800',
    icon: 'border-emerald-400 bg-emerald-300 text-emerald-950',
  },
  red: {
    eyebrow: 'text-rose-700',
    title: 'text-rose-800',
    icon: 'border-rose-400 bg-rose-300 text-rose-950',
  },
  amber: {
    eyebrow: 'text-amber-700',
    title: 'text-amber-800',
    icon: 'border-amber-400 bg-amber-300 text-amber-950',
  },
  sky: {
    eyebrow: 'text-sky-700',
    title: 'text-sky-800',
    icon: 'border-sky-400 bg-sky-300 text-sky-950',
  },
  teal: {
    eyebrow: 'text-teal-700',
    title: 'text-teal-800',
    icon: 'border-teal-400 bg-teal-300 text-teal-950',
  },
  violet: {
    eyebrow: 'text-violet-700',
    title: 'text-violet-800',
    icon: 'border-violet-400 bg-violet-300 text-violet-950',
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
