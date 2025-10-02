import * as React from 'react';
import { cn } from '@/lib/utils';

export const Button = React.forwardRef(function Button({ className, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium border border-transparent bg-indigo-600 text-black-300 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
});
Button.displayName = 'Button';

