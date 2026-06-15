import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const baseStyles = "relative inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-700 disabled:pointer-events-none disabled:opacity-50 rounded-md overflow-hidden";
    
    const variants = {
      primary: "bg-zinc-100 text-zinc-950 hover:bg-white shadow-sm",
      secondary: "bg-zinc-900 text-zinc-100 border border-zinc-800 hover:bg-zinc-800 hover:text-white",
      ghost: "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-9 px-4 py-2 text-sm",
      lg: "h-10 px-6 text-sm",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center bg-inherit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
          </motion.div>
        ) : null}
        <span className={cn(isLoading && "opacity-0")}>{children}</span>
      </motion.button>
    );
  }
);
Button.displayName = "Button";
