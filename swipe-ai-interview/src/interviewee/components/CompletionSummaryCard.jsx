
export default function CompletionSummaryCard({ completedInfo }) {
  if (!completedInfo) return null;

  return (
    <div className='mt-6'>
      <div className='mx-auto w-full max-w-[1100px] rounded-2xl border border-yellow-200 bg-white/95 shadow-xl overflow-hidden'>
        <div className='bg-gradient-to-r from-yellow-300 to-yellow-100 px-6 py-4 border-b border-yellow-200'>
          <h3 className='text-indigo-900 text-base font-semibold'>Test Completed</h3>
        </div>

        <div className='px-6 py-5 grid gap-6 sm:grid-cols-3'>
          <div>
            <div className='text-sm text-indigo-700/80'>Name</div>
            <div className='font-medium'>{completedInfo.name || '???'}</div>
          </div>
          <div>
            <div className='text-sm text-indigo-700/80'>Email</div>
            <div className='font-medium'>{completedInfo.email || '???'}</div>
          </div>
          <div>
            <div className='text-sm text-indigo-700/80'>Phone</div>
            <div className='font-medium'>{completedInfo.phone || '???'}</div>
          </div>
        </div>

        <div className='px-6 pb-6'>
          <div className='w-full text-center font-semibold text-indigo-900 bg-gradient-to-r from-yellow-200 to-yellow-100 border border-yellow-300 rounded-xl py-3'>
            🎉 Awesome! Your results will be out soon. Keep an eye on your email!
          </div>
        </div>
      </div>
    </div>
  );
}

