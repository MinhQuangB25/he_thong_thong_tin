import type { SVGProps } from 'react'

const paths = {
  dashboard: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  people: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  leave: 'M8 3h8v4H8z M8 5H5v16h14V5h-3 M8 12h8 M8 16h5',
  attendance: 'M12 8v4l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  payroll: 'M3 6h18v12H3z M7 10h.01 M17 14h.01 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  reports: 'M4 3v18h17 M9 16v-5 M14 16V7 M19 16v-9',
  profile: 'M20 21v-2a7 7 0 0 0-14 0v2 M17 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  assistant: 'm12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6z M20 3v4 M18 5h4',
  shield: 'm12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z m-4 9 3 3 5-5',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  logout: 'M9 4H4v16h5 M10 12h11 m-4-4 4 4-4 4',
  arrow: 'M5 12h14 m-6-6 6 6-6 6',
  plus: 'M12 5v14 M5 12h14',
  search: 'M21 21l-4.4-4.4 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  trash: 'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',
  contract: 'M14 3H6v18h12V7z M14 3v4h4 M9 12h6 M9 16h6 M9 8h2',
} as const

export type IconName = keyof typeof paths

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>
    <path d={paths[name]} />
  </svg>
}
