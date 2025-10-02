import { cn } from '@/lib/utils';

export default function ChatBubble({ children, accent = 'yellow' }) {
  const ring = accent === 'yellow' ? 'ring-yellow-300' : 'ring-purple-300/70';
  const grad =
    accent === 'yellow'
      ? 'from-yellow-200 to-yellow-100'
      : 'from-indigo-200/50 to-fuchsia-200/50';

  return (
    <div className='flex items-start gap-3'>
      <div
        className={cn(
          'mt-1 inline-flex h-9 w-9 flex-none items-center justify-center rounded-full',
          'bg-white/70 ring-1 ring-inset',
          ring
        )}
      >
        <svg viewBox='0 0 24 24' className='h-5 w-5 text-indigo-700'>
          <path
            fill='currentColor'
            d='M12 2a1 1 0 0 1 1 1v1.055a7 7 0 0 1 6 6.945V13a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5V11a7 7 0 0 1 6-6.945V3a1 1 0 0 1 1-1zm-3 9a1 1 0 1 0 0 2h.01A1 1 0 0 0 9 11zm6 0a1 1 0 1 0 0 2h.01A1 1 0 0 0 15 11zM8 16a1 1 0 0 0 1 1h6a1 1 0 1 0 0-2H9a1 1 0 0 0-1 1z'
          />
        </svg>
      </div>
      <div
        className={cn(
          'relative rounded-2xl px-4 py-3 text-sm text-gray-900 shadow-md ring-1 ring-inset',
          'backdrop-blur bg-gradient-to-br',
          grad,
          ring
        )}
      >
        {children}
      </div>
    </div>
  );
}

