'use client';

import { useState } from 'react';
import { RadioTower } from 'lucide-react';
import type { WarningHazardType, WarningSeverity } from '@rescue-lk/shared';
import { PUBLISH_CHECKS, type SummaryRow } from '../publishing';
import { HAZARD_META } from '../meta';
import { cx, ICON_SIZE, ui } from '../ui';
import { Dialog } from './shell/Dialog';
import { SeverityBadge } from './StatusChip';

interface PublishDialogProps {
  // "Publish this warning?" or "Send update to W-…?".
  title: string;
  severity: WarningSeverity;
  hazard: WarningHazardType;
  hazardLabel: string;
  summary: readonly SummaryRow[];
  // Updates cannot be saved back as a draft.
  canSaveDraft: boolean;
  confirmLabel: string;
  pending: boolean;
  onConfirm: () => void;
  onSaveDraft: () => void;
  onClose: () => void;
}

const TITLE_ID = 'publish-dialog-title';

// PublishDialog is the last check before a warning reaches citizens: a summary, and a
// checklist where every item must be ticked before Publish is enabled.
// Presentational: its text comes from publishReviewText (pure and tested) and actions
// come in as props. DRY: built on the shared Dialog.
// It is rendered only while open, so the ticks always start empty.
export function PublishDialog({
  title,
  severity,
  hazard,
  hazardLabel,
  summary,
  canSaveDraft,
  confirmLabel,
  pending,
  onConfirm,
  onSaveDraft,
  onClose,
}: PublishDialogProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const allChecked = PUBLISH_CHECKS.every((check) => checked[check.id]);
  const HazardIcon = HAZARD_META[hazard].icon;

  return (
    <Dialog titleId={TITLE_ID} onClose={onClose}>
      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-2">
          <h2 id={TITLE_ID} className="text-[20px] font-bold">
            {title}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={severity} />
            <span className="flex items-center gap-1.5 text-[14px] font-semibold">
              <HazardIcon aria-hidden size={ICON_SIZE.medium} />
              {hazardLabel}
            </span>
          </div>
        </div>

        <dl className="grid grid-cols-[140px_minmax(0,1fr)] gap-x-4 gap-y-2 rounded-[8px] bg-[#F7F8FA] px-4 py-3.5 text-[14px] leading-[1.45]">
          {summary.map(({ label, value }) => (
            <div key={label} className="contents">
              <dt className="text-[#4F5B67]">{label}</dt>
              <dd className="break-words">{value}</dd>
            </div>
          ))}
        </dl>

        <fieldset className="rounded-[8px] border border-[#D9DFE5] px-4 pt-2.5 pb-3">
          <legend className="px-1 text-[13px] font-bold">
            Before publishing, confirm
          </legend>
          {PUBLISH_CHECKS.map((check) => (
            <label
              key={check.id}
              className="flex cursor-pointer items-start gap-2.5 py-1.5 text-[14px] leading-[1.45]"
            >
              <input
                type="checkbox"
                checked={!!checked[check.id]}
                onChange={() =>
                  setChecked((current) => ({
                    ...current,
                    [check.id]: !current[check.id],
                  }))
                }
                className="mt-0.5 size-[17px] flex-none"
              />
              <span>{check.label}</span>
            </label>
          ))}
        </fieldset>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className={ui.buttonSecondary}
          >
            Go back
          </button>
          {canSaveDraft && (
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={pending}
              className={ui.buttonSecondary}
            >
              Save as draft
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={!allChecked || pending}
            title={
              allChecked ? undefined : 'Tick every item in the checklist first'
            }
            className={cx(ui.buttonPrimary)}
          >
            <RadioTower aria-hidden size={ICON_SIZE.medium} />
            {pending ? 'Sending…' : confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
