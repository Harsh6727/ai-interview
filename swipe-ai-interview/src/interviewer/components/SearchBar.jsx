import { CLEAR } from "../constants";

export default function SearchBar({ query, onQueryChange, onClear }) {
  return (
    <div className="relative">
      <div className="inline-flex h-9 items-center gap-2 rounded-2xl border border-yellow-300 bg-gradient-to-r from-yellow-200 to-yellow-100 px-3 text-indigo-900 shadow-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path
            fillRule="evenodd"
            d="M8.5 3a5.5 5.5 0 103.473 9.743l3.642 3.642a.75.75 0 101.06-1.06l-3.642-3.642A5.5 5.5 0 008.5 3zm-4 5.5a4 4 0 118 0 4 4 0 01-8 0z"
            clipRule="evenodd"
          />
        </svg>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search name, email or phone"
          className="w-64 bg-transparent text-sm placeholder:text-indigo-900/70 focus:outline-none"
        />
        {query && (
          <button
            onClick={onClear}
            className="ml-1 rounded-md px-2 text-xs text-indigo-900/80 hover:bg-yellow-200/60"
            aria-label="Clear search"
            title="Clear"
          >
            {CLEAR}
          </button>
        )}
      </div>
    </div>
  );
}
