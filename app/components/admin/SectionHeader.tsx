import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  description: string;
  icon: ReactNode;
  className?: string;
  children?: ReactNode;
}

export default function SectionHeader({
  title,
  description,
  icon,
  className = '',
  children,
}: SectionHeaderProps) {
  return (
    <header className={`flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Wash Riders - {title}</p>
        <div className="mt-2 flex items-center gap-3">
          <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-800">
            {icon}
          </span>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
        </div>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  );
}
