import { WarningNotFoundException } from './exceptions/warning-not-found.exception.js';
import type {
  WarningRecord,
  WarningsRepository,
} from './warnings.repository.interface.js';

// requireWarning loads a warning or answers 404 (WarningNotFoundException).
// DRY: every service that needs "the warning or a 404" uses this one function, so the
// lookup and the error are written once and always behave the same way.
// ISP: it asks only for findById (Pick<WarningsRepository, 'findById'>), not the whole
// repository, so it can be tested with a one-method fake.
export const requireWarning = async (
  repository: Pick<WarningsRepository, 'findById'>,
  warningId: string,
): Promise<WarningRecord> => {
  const warning = await repository.findById(warningId);
  if (!warning) {
    throw new WarningNotFoundException(warningId);
  }
  return warning;
};
