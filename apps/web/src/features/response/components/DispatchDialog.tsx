import type {
  DistrictDto,
  RescueTeamDto,
  ResponseTargetDto,
} from '@rescue-lk/shared';
import { placeLabel } from '../domain/format';
import {
  HAZARD_PRESENTATION,
  ORGANISATION_KIND_LABELS,
} from '../domain/presentation';
import { Button, Notice } from './ui';

/**
 * Step 7: the officer confirms before a team is committed. The text says the
 * availability is checked again, which is what the API does.
 */
export function DispatchDialog({
  report,
  team,
  districts,
  pending,
  error,
  onConfirm,
  onCancel,
}: {
  report: ResponseTargetDto;
  team: RescueTeamDto;
  districts: DistrictDto[];
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const rows: Array<[string, string]> = [
    ['Incident', HAZARD_PRESENTATION[report.hazardType].label],
    ['Location', placeLabel(report.placeName, report.district, districts)],
    ['Team', team.name],
    [
      'Owner',
      `${team.owner.name} (${ORGANISATION_KIND_LABELS[team.owner.kind]})`,
    ],
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispatch-dialog-title"
        className="w-full max-w-lg space-y-4 rounded-[10px] border border-line bg-white p-6"
      >
        <h2 id="dispatch-dialog-title" className="text-xl font-bold">
          Dispatch this team?
        </h2>
        <dl className="grid grid-cols-[110px_minmax(0,1fr)] gap-y-2 rounded-[8px] bg-page p-4 text-sm">
          {rows.map(([key, value]) => (
            <div key={key} className="col-span-2 grid grid-cols-subgrid">
              <dt className="text-ink-muted">{key}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-[13px] text-ink-muted">
          Availability is checked again when you confirm, in case another
          officer has taken this team.
        </p>
        {error && <Notice tone="danger">{error}</Notice>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={pending}>
            Back
          </Button>
          <Button onClick={onConfirm} disabled={pending}>
            {pending ? 'Dispatching…' : 'Confirm dispatch'}
          </Button>
        </div>
      </div>
    </div>
  );
}
