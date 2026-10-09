import type {
  LogReliefDistributionRequest,
  OwnerDto,
  ReliefItem,
} from '@rescue-lk/shared';

/** What the Log distribution form holds while it is being filled in. */
export interface ReliefDraft {
  item: ReliefItem | '';
  quantity: string;
  district: string;
  organisationId: string;
}

export const EMPTY_RELIEF_DRAFT: ReliefDraft = {
  item: '',
  quantity: '',
  district: '',
  organisationId: '',
};

export type ReliefDraftErrors = Partial<Record<keyof ReliefDraft, string>>;

/** The fields that are missing or wrong. An empty object means the form is ready. */
export function validateReliefDraft(draft: ReliefDraft): ReliefDraftErrors {
  const errors: ReliefDraftErrors = {};
  if (!draft.item) errors.item = 'Choose what was distributed.';

  const quantity = Number(draft.quantity);
  if (draft.quantity.trim() === '') {
    errors.quantity = 'Enter how many units went out.';
  } else if (!Number.isInteger(quantity) || quantity < 1) {
    errors.quantity = 'Enter a whole number of one or more.';
  }

  if (!draft.district) errors.district = 'Choose the district it went to.';
  if (!draft.organisationId) {
    errors.organisationId = 'Choose which organisation supplied it.';
  }
  return errors;
}

/**
 * Turns a valid draft into the request body. Returns null when the draft is
 * not ready, so a bad form can never be sent.
 */
export function buildReliefRequest(
  draft: ReliefDraft,
  owners: OwnerDto[],
): LogReliefDistributionRequest | null {
  if (Object.keys(validateReliefDraft(draft)).length > 0) return null;
  const owner = owners.find(
    (candidate) => candidate.organisationId === draft.organisationId,
  );
  if (!owner) return null;
  return {
    item: draft.item as ReliefItem,
    quantity: Number(draft.quantity),
    district: draft.district,
    owner,
  };
}

/** The organisations we know about, taken from the resources they own. */
export function ownersFrom(sources: Array<{ owner: OwnerDto }>): OwnerDto[] {
  const byId = new Map<string, OwnerDto>();
  for (const { owner } of sources) {
    if (!byId.has(owner.organisationId)) byId.set(owner.organisationId, owner);
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}
