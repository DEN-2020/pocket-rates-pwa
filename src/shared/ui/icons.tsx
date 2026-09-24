import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function ConverterIcon(props: IconProps) {
  return <IconBase {...props}><path d="M4 8h13"/><path d="m14 5 3 3-3 3"/><path d="M20 16H7"/><path d="m10 13-3 3 3 3"/></IconBase>;
}

export function ChartIcon(props: IconProps) {
  return <IconBase {...props}><path d="M4 18V6"/><path d="M4 18h16"/><path d="m7 14 4-4 3 2 5-6"/></IconBase>;
}

export function PencilIcon(props: IconProps) {
  return <IconBase {...props}><path d="m4 20 4.2-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z"/><path d="m13.8 7.2 3 3"/></IconBase>;
}

export function SettingsIcon(props: IconProps) {
  return <IconBase {...props}><circle cx="12" cy="12" r="3"/><path d="M19 13.5v-3l-2-.7a7 7 0 0 0-.7-1.7l.9-1.9-2.1-2.1-1.9.9a7 7 0 0 0-1.7-.7L10.5 2h-3l-.7 2a7 7 0 0 0-1.7.7l-1.9-.9L1.1 5.9 2 7.8a7 7 0 0 0-.7 1.7l-2 .7v3l2 .7a7 7 0 0 0 .7 1.7l-.9 1.9 2.1 2.1 1.9-.9a7 7 0 0 0 1.7.7l.7 2h3l.7-2a7 7 0 0 0 1.7-.7l1.9.9 2.1-2.1-.9-1.9a7 7 0 0 0 .7-1.7l2-.7Z" transform="translate(1.5 0) scale(.88)"/></IconBase>;
}

export function RefreshIcon(props: IconProps) {
  return <IconBase {...props}><path d="M20 7v5h-5"/><path d="M18.5 15.5A7 7 0 1 1 19 8"/></IconBase>;
}

export function PlusIcon(props: IconProps) {
  return <IconBase {...props}><path d="M12 5v14"/><path d="M5 12h14"/></IconBase>;
}

export function GripIcon(props: IconProps) {
  return <IconBase {...props}><circle cx="9" cy="7" r=".9" fill="currentColor" stroke="none"/><circle cx="15" cy="7" r=".9" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r=".9" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r=".9" fill="currentColor" stroke="none"/><circle cx="9" cy="17" r=".9" fill="currentColor" stroke="none"/><circle cx="15" cy="17" r=".9" fill="currentColor" stroke="none"/></IconBase>;
}

export function CloseIcon(props: IconProps) {
  return <IconBase {...props}><path d="m6 6 12 12"/><path d="M18 6 6 18"/></IconBase>;
}

export function TrashIcon(props: IconProps) {
  return <IconBase {...props}><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="m6 7 1 13h10l1-13"/><path d="M10 11v5"/><path d="M14 11v5"/></IconBase>;
}

export function SwapIcon(props: IconProps) {
  return <IconBase {...props}><path d="M7 7h12"/><path d="m16 4 3 3-3 3"/><path d="M17 17H5"/><path d="m8 14-3 3 3 3"/></IconBase>;
}

export function ChevronUpIcon(props: IconProps) {
  return <IconBase {...props}><path d="m7 14 5-5 5 5"/></IconBase>;
}

export function ChevronDownIcon(props: IconProps) {
  return <IconBase {...props}><path d="m7 10 5 5 5-5"/></IconBase>;
}
