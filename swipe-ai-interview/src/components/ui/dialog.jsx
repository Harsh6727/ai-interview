
import * as React from 'react';

export function Dialog({ open, onOpenChange, children }) {
  const [mounted, setMounted] = React.useState(false);
  const createPortalRef = React.useRef(null);

  React.useEffect(() => {
    let cancelled = false;
    setMounted(true);
    if (typeof window !== 'undefined' && !createPortalRef.current) {
      import('react-dom')
        .then((mod) => {
          if (!cancelled) {
            createPortalRef.current = mod?.createPortal ?? null;
          }
        })
        .catch(() => {
          createPortalRef.current = null;
        });
    }
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!open || !mounted) return undefined;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const onKey = (event) => {
      if (event.key === 'Escape') onOpenChange?.(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, mounted, onOpenChange]);

  if (!open || !mounted) return null;

  const node = (
    <div className='fixed inset-0 z-[9999]'>
      <div
        className='absolute inset-0 bg-gradient-to-br from-indigo-900/70 via-purple-900/65 to-indigo-900/70'
        onClick={() => onOpenChange?.(false)}
      />
      <div
        className='absolute inset-0 grid place-items-center p-4'
        onClick={(event) => event.stopPropagation()}
        aria-modal='true'
        role='dialog'
      >
        {children}
      </div>
    </div>
  );

  const createPortal = createPortalRef.current;
  return createPortal ? createPortal(node, document.body) : node;
}

export function DialogContent({ className, children, ...rest }) {
  return (
    <div
      className={[
        'relative grid grid-rows-[auto_minmax(0,1fr)_auto]',
        'w-[min(92vw,1100px)] max-h-[85vh]',
        'rounded-3xl overflow-hidden',
        'border border-indigo-200/70 ring-1 ring-purple-300/40',
        'shadow-[0_20px_60px_-10px_rgba(79,70,229,.35)]',
        'bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80',
        'animate-in fade-in zoom-in-95 duration-150',
        'focus:outline-none',
        className || '',
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}

export function DialogHeader(props) {
  return (
    <div
      className={[
        'px-7 py-5 border-b',
        'bg-gradient-to-r from-indigo-600/95 via-purple-600/95 to-indigo-600/95 text-white',
      ].join(' ')}
      {...props}
    />
  );
}

export function DialogFooter(props) {
  return (
    <div
      className={[
        'px-7 py-4 border-t',
        'bg-gradient-to-r from-yellow-50 to-white',
        'flex justify-end gap-2',
      ].join(' ')}
      {...props}
    />
  );
}

export function DialogTitle(props) {
  return <h2 className='text-lg font-semibold tracking-tight' {...props} />;
}
