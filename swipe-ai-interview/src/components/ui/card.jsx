import * as React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }) {
  return <div className={cn('rounded-xl border border-gray-200 bg-white shadow', className)} {...props} />;
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('p-4 border-b', className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-4', className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return <div className={cn('p-4 border-t', className)} {...props} />;
}

