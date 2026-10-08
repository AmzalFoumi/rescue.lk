import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { ICON_SIZE } from '../../ui';
import { ActionBar } from '../shell/ActionBar';
import { ScreenHeader } from '../shell/ScreenHeader';

interface StepLoadingProps {
  title: string;
  onBack: () => void;
}

// Shown while a step's report or warning is still loading (e.g. right after
// publishing, before the warning list has refreshed).
export function StepLoading({ title, onBack }: StepLoadingProps) {
  return (
    <>
      <ScreenHeader title={title} subtitle="Loading…" updatedAt={null} />
      <p
        role="status"
        className="flex items-center gap-3 rounded-[10px] border border-[#D9DFE5] bg-white px-4 py-8 text-[14px] text-[#4F5B67]"
      >
        <LoaderCircle
          aria-hidden
          size={ICON_SIZE.large}
          className="animate-spin"
        />
        Loading…
      </p>
      <ActionBar
        left={[
          {
            label: 'Back to monitoring',
            icon: ArrowLeft,
            onClick: onBack,
            variant: 'secondary',
          },
        ]}
      />
    </>
  );
}
