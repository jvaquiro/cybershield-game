import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-cyan-accent text-navy-950 active:brightness-90 disabled:bg-dim disabled:text-navy-900',
  secondary:
    'border-2 border-cyan-accent text-cyan-accent active:bg-navy-800 disabled:border-dim disabled:text-dim',
};

/** Touch-first button: at least 48 px tall, no hover-only feedback. */
export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`min-h-12 rounded-xl px-6 text-lg font-bold transition disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
