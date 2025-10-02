import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400',
        className
      )}
      {...props}
    />
  );
});
Input.displayName = 'Input';

