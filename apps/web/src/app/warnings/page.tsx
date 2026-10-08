import { Noto_Sans } from 'next/font/google';
import { WarningWorkflow } from '@/features/warnings';
import './uc1-screen.css';

// Noto Sans is the UC1 design's typeface (SIL Open Font License), self-hosted
// by next/font and applied to this screen only.
const notoSans = Noto_Sans({ subsets: ['latin'], display: 'swap' });

export default function WarningsPage() {
  return (
    <div
      data-uc1-screen
      className={`${notoSans.className} mx-auto w-full max-w-[1360px] px-6 pt-5 pb-14`}
    >
      <WarningWorkflow />
    </div>
  );
}
