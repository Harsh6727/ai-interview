import * as React from 'react';
import { cn } from '@/lib/utils';

const TabsContext = React.createContext(null);

export function Tabs({ defaultValue, className, children }) {
  const [value, setValue] = React.useState(defaultValue);
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={cn(className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }) {
  return <div className={cn('flex gap-2', className)} {...props} />;
}

export function TabsTrigger({ value, className, children }) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error('TabsTrigger must be used within Tabs');
  const active = ctx.value === value;

  return (
    <button data-state={active ? 'active' : 'inactive'} aria-selected={active}
      type='button'
      onClick={() => ctx.setValue(value)}
      className={cn(
        'relative isolate inline-flex items-center justify-center',
        'px-4 py-2 text-sm font-medium rounded-md select-none',
        'appearance-none border-0 outline-none ring-0',
        'focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0',
        'transition-none',
        active ? 'text-black/90 hover:bg-white/5' : 'text-white',
        className
      )}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 rounded-md',
          'ring-1 ring-yellow-300',
          'bg-gradient-to-r from-yellow-200 to-yellow-100',
          'transition-opacity duration-150',
          active ? 'opacity-100' : 'opacity-0'
        )}
      />
      <span className='relative z-[1]'>{children}</span>
    </button>
  );
}

export function TabsContent({ value, className, children }) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error('TabsContent must be used within Tabs');
  if (ctx.value !== value) return null;
  return <div className={cn('p-4', className)}>{children}</div>;
}

