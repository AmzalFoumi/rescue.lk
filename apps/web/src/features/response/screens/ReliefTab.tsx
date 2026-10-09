'use client';

import { useState } from 'react';
import type {
  DistrictDto,
  ReliefDistributionDto,
  ReliefItem,
  RescueTeamDto,
  ShelterDto,
} from '@rescue-lk/shared';
import { useResponseApi } from '../api/api-context';
import { ReliefTable } from '../components/ReliefTable';
import { Button, Field, INPUT_CLASS, Notice, Panel } from '../components/ui';
import { formatNumber, percentage } from '../domain/format';
import { RELIEF_ITEM_LABELS } from '../domain/presentation';
import {
  buildReliefRequest,
  EMPTY_RELIEF_DRAFT,
  ownersFrom,
  validateReliefDraft,
  type ReliefDraft,
  type ReliefDraftErrors,
} from '../domain/relief-draft';
import { reliefByDistrict } from '../domain/summaries';
import { useAsyncAction } from '../hooks/use-async-action';

const ITEMS = Object.keys(RELIEF_ITEM_LABELS) as ReliefItem[];

/** The Relief tab: log food, water and medicine as they are distributed. */
export function ReliefTab({
  distributions,
  teams,
  shelters,
  districts,
  onLogged,
}: {
  distributions: ReliefDistributionDto[];
  /** Teams and shelters tell us which organisations exist. */
  teams: RescueTeamDto[];
  shelters: ShelterDto[];
  districts: DistrictDto[];
  onLogged: (message: string) => void;
}) {
  const api = useResponseApi();
  const [draft, setDraft] = useState<ReliefDraft>(EMPTY_RELIEF_DRAFT);
  const [errors, setErrors] = useState<ReliefDraftErrors>({});

  const owners = ownersFrom([...teams, ...shelters, ...distributions]);
  const set = (patch: Partial<ReliefDraft>) =>
    setDraft((current) => ({ ...current, ...patch }));

  const log = useAsyncAction(async (current: ReliefDraft) => {
    const body = buildReliefRequest(current, owners);
    if (!body) return;
    await api.logRelief(body);
    setDraft(EMPTY_RELIEF_DRAFT);
    onLogged(
      `${formatNumber(body.quantity)} ${RELIEF_ITEM_LABELS[body.item].toLowerCase()} logged.`,
    );
  });

  function submit() {
    const found = validateReliefDraft(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    void log.run(draft);
  }

  const byDistrict = reliefByDistrict(distributions, districts);
  const total = distributions.reduce((sum, row) => sum + row.quantity, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Log distribution">
          <div className="space-y-3 p-4">
            <Field id="relief-item" label="Item" error={errors.item}>
              <select
                id="relief-item"
                className={INPUT_CLASS}
                value={draft.item}
                onChange={(event) =>
                  set({ item: event.target.value as ReliefItem })
                }
              >
                <option value="">Choose an item…</option>
                {ITEMS.map((item) => (
                  <option key={item} value={item}>
                    {RELIEF_ITEM_LABELS[item]}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="relief-qty" label="Quantity" error={errors.quantity}>
              <input
                id="relief-qty"
                type="number"
                min={1}
                className={INPUT_CLASS}
                value={draft.quantity}
                onChange={(event) => set({ quantity: event.target.value })}
              />
            </Field>
            <Field
              id="relief-district"
              label="Destination district"
              error={errors.district}
            >
              <select
                id="relief-district"
                className={INPUT_CLASS}
                value={draft.district}
                onChange={(event) => set({ district: event.target.value })}
              >
                <option value="">Choose a district…</option>
                {districts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              id="relief-owner"
              label="Supplied by"
              error={errors.organisationId}
            >
              <select
                id="relief-owner"
                className={INPUT_CLASS}
                value={draft.organisationId}
                onChange={(event) =>
                  set({ organisationId: event.target.value })
                }
              >
                <option value="">Choose an organisation…</option>
                {owners.map((owner) => (
                  <option
                    key={owner.organisationId}
                    value={owner.organisationId}
                  >
                    {owner.name}
                  </option>
                ))}
              </select>
            </Field>
            <Button onClick={submit} disabled={log.pending}>
              {log.pending ? 'Logging…' : 'Log distribution'}
            </Button>
            {log.error && (
              <Notice tone="danger" onDismiss={log.clearError}>
                {log.error}
              </Notice>
            )}
          </div>
        </Panel>

        <Panel title="Distributed by district">
          {byDistrict.length === 0 ? (
            <p className="px-4 py-6 text-center text-ink-muted">
              Nothing has been distributed yet.
            </p>
          ) : (
            <div className="space-y-2.5 p-4">
              {byDistrict.map((row) => (
                <div
                  key={row.district}
                  className="grid grid-cols-[minmax(90px,1fr)_minmax(0,2fr)_auto] items-center gap-2 text-sm"
                >
                  <span className="truncate">{row.name}</span>
                  <span
                    className="h-2 overflow-hidden rounded-full bg-neutral-bg"
                    aria-hidden="true"
                  >
                    <span
                      className="block h-full bg-primary"
                      style={{ width: percentage(row.share, 1) }}
                    />
                  </span>
                  <span className="text-right font-semibold">
                    {formatNumber(row.quantity)}
                  </span>
                </div>
              ))}
              <p className="text-xs text-ink-muted">
                {`${formatNumber(total)} items in total, all organisations.`}
              </p>
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Recent distribution records">
        <ReliefTable distributions={distributions} districts={districts} />
      </Panel>
    </div>
  );
}
