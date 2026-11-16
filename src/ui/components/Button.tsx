import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-cyan-accent text-navy-950 shadow-[0_0_0_1px_var(--color-cyan-accent),0_6px_24px_-8px_var(--color-cyan-accent)] active:brightness-90 disabled:bg-dim disabled:text-navy-900 disabled:shadow-none',
  secondary:
    'border-2 border-cyan-accent/70 bg-navy-950/60 text-cyan-accent active:bg-navy-800 disabled:border-dim disabled:text-dim',
};

/** Touch-first button: at least 48 px tall, no hover-only feedback. */
export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`font-display min-h-14 rounded-md px-7 text-2xl transition active:translate-y-px disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
