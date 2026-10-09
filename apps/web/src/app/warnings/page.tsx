import { Noto_Sans } from 'next/font/google';
import { AppHeader, WarningWorkflow } from '@/features/warnings';
import './uc1-screen.css';

// Noto Sans is the UC1 design's typeface (SIL Open Font License), self-hosted
// by next/font and applied to this screen only.
const notoSans = Noto_Sans({ subsets: ['latin'], display: 'swap' });

// The design's header runs full width; the workflow below it is capped at 1360px.
// uc1-screen.css hides the shared scaffold header while this page is shown.
export default function WarningsPage() {
  return (
    <div data-uc1-screen className={notoSans.className}>
      <AppHeader />
      <div className="mx-auto w-full max-w-[1360px] px-6 pt-5 pb-14">
        <WarningWorkflow />
      </div>
    </div>
  );
}
