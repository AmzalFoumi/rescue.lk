// Shared Tailwind class sets for the warnings screen (colours and radii from
// the UC1 design), so components stay consistent without repeating them.

export const cx = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(' ');

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4E89]';

const buttonBase = `inline-flex items-center justify-center gap-2 rounded-[8px] px-4 py-2 text-[14px] font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

export const ui = {
  card: 'rounded-[10px] border border-[#D9DFE5] bg-white',
  cardHeader:
    'flex items-center justify-between gap-3 border-b border-[#E1E6EB] px-4 py-3',
  sectionTitle: 'text-[15px] font-bold text-[#17212B]',
  label: 'block text-[13px] font-semibold text-[#2E3A46]',
  hint: 'text-[12.5px] text-[#4F5B67]',
  text: 'text-[14px] text-[#2E3A46]',
  mono: 'font-mono text-[12.5px] text-[#4F5B67]',
  input: `w-full rounded-[6px] border bg-white px-3 py-2 text-[14px] text-[#17212B] disabled:bg-[#F3F5F7] ${focusRing}`,
  inputBorder: 'border-[#C5CDD6]',
  inputInvalid: 'border-[#9F1D1D]',
  choice: `flex cursor-pointer items-start gap-2 rounded-[8px] border border-[#D9DFE5] bg-white p-3 has-[:checked]:border-[#1D4E89] has-[:checked]:bg-[#E8EFF8] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[#1D4E89]`,
  buttonPrimary: `${buttonBase} bg-[#1D4E89] text-white hover:bg-[#173F70]`,
  buttonSecondary: `${buttonBase} border border-[#C5CDD6] bg-white text-[#2E3A46] hover:bg-[#F3F5F7]`,
  buttonDanger: `${buttonBase} border border-[#EFC4C4] bg-white text-[#9F1D1D] hover:bg-[#FCEDED]`,
  alert:
    'flex items-start gap-2 rounded-[8px] border border-[#EFC4C4] bg-[#FCEDED] px-3 py-2 text-[13.5px] text-[#9F1D1D]',
} as const;

// Lucide icon sizes, in pixels.
export const ICON_SIZE = { small: 14, medium: 16, large: 18 } as const;
