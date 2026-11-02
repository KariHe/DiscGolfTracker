/** Stroke icon paths, drawn on a 24×24 grid. */
export const icon = {
  back: <path d="M15 18l-6-6 6-6" />,
  scorecard: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M4 10h16M10 4v16" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16v4z" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  updown: <path d="M7 9l5-5 5 5M7 15l5 5 5-5" />,
  home: <path d="M3 11l9-7 9 7M5 10v10h14V10" />,
  courses: <path d="M5 21V4M5 4h12l-2.5 4 2.5 4H5" />,
  players: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.5a3.5 3.5 0 010 7M18 14.2c2.1.7 3.5 2.8 3.5 5.8" />
    </>
  ),
  history: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
}
