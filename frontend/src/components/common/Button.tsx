/**
 * Button.tsx — Reusable button component with design system variants and loading state.
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-blue-600/25 active:scale-[0.98]',
        secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700 active:scale-[0.98]',
        outline: 'border border-slate-600 bg-transparent hover:bg-slate-800 text-slate-200 active:scale-[0.98]',
        destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-red-600/25 active:scale-[0.98]',
        ghost: 'hover:bg-slate-800 text-slate-300 hover:text-white',
        link: 'text-blue-500 underline-offset-4 hover:underline p-0 h-auto',
        success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-emerald-600/25 active:scale-[0.98]',
      },
      size: {
        sm: 'h-8 px-3 text-xs gap-1.5',
        md: 'h-10 px-4 py-2 gap-2',
        lg: 'h-11 px-6 text-base gap-2.5',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current" />}
        {!isLoading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
