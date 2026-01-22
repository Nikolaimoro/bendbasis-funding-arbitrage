"use client";

export default function AppFooter() {
  return (
    <footer className="mt-12 border-t border-[#343a4e] py-6 flex items-center justify-end gap-3">
      <a
        href="https://x.com/bendbasis"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
        aria-label="X"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4 fill-current"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.504 11.24h-6.662l-5.213-6.818-5.967 6.818H1.68l7.73-8.844L1.25 2.25h6.83l4.713 6.231L18.244 2.25zm-1.161 17.52h1.833L7.08 4.126H5.114l11.97 15.644z" />
        </svg>
      </a>
      <a
        href="https://t.me/bendbasis"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
        aria-label="Telegram"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4 fill-current"
        >
          <path d="M21.76 3.24a1.5 1.5 0 0 0-1.62-.2L2.7 10.4a1.5 1.5 0 0 0 .2 2.8l4.92 1.53 1.88 5.86a1.5 1.5 0 0 0 2.63.5l2.82-3.56 4.98 3.66a1.5 1.5 0 0 0 2.36-.93l3.02-14.1a1.5 1.5 0 0 0-.75-1.92zM9.48 14.3l-.8 3.2-1.06-3.3 9.9-6.16-8.04 6.26z" />
        </svg>
      </a>
    </footer>
  );
}
