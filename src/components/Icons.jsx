import React from 'react'

const paths = {
  bracket: <path d="M4 4h5v4H4V4Zm11 0h5v4h-5V4ZM9 6h6M12 6v12m-8-2h5v4H4v-4Zm11 0h5v4h-5v-4Zm-6 2h6" />,
  users: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87m-2-11.96a4 4 0 0 1 0 7.75" />,
  upload: <path d="M12 16V3m0 0L7 8m5-5 5 5M5 14v6h14v-6" />,
  download: <path d="M12 3v13m0 0 5-5m-5 5-5-5M5 21h14" />,
  check: <path d="m5 12 4 4L19 6" />,
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  swap: <path d="m7 7 3-3m-3 3 3 3M7 7h10m0 10-3 3m3-3-3-3m3 3H7" />,
  trophy: <path d="M8 21h8m-4-4v4m5-18v6a5 5 0 0 1-10 0V3h10Zm0 2h3v2a4 4 0 0 1-4 4M7 5H4v2a4 4 0 0 0 4 4" />,
  save: <path d="M5 3h12l2 2v16H5V3Zm3 0v6h8V3M8 21v-7h8v7" />,
  rotate: <path d="M20 11a8 8 0 1 0-2.34 5.66M20 4v7h-7" />,
  shuffle: <path d="M16 3h5v5m0-5-7 7M4 7h3l10 10h4m0 0v-5m0 5h-5M4 17h3l3-3" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
}

export function Icon({ name, size = 20, className = '' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      {paths[name]}
    </svg>
  )
}
