import { Logger } from '@nestjs/common';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import type { WarningFormErrors } from '@rescue-lk/shared';
import { WarningValidator } from './warning.validator.js';
import type { ValidationMode } from './warning.rules.js';
import type { WarningForm } from '../domain/warning-form.js';
import { InMemoryTargetAreaCatalog } from '../target-areas/in-memory-target-area-catalog.js';
import { InvalidWarningException } from '../exceptions/invalid-warning.exception.js';
import { ReportNotVerifiedException } from '../exceptions/report-not-verified.exception.js';
import { WARNING_MESSAGE_MIN_LENGTH } from '../warnings.constants.js';
import {
  VERIFIED_REPORT,
  buildWarningForm,
} from '../testing/warning.fixtures.js';

const MODES: readonly ValidationMode[] = ['DRAFT', 'PUBLISH'];

describe('WarningValidator (step 8.2 validateWarning)', () => {
  let validator: WarningValidator;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    validator = new WarningValidator(new InMemoryTargetAreaCatalog());
    warnSpy = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const validate = (form: WarningForm, mode: ValidationMode) =>
    validator.validate({ form, report: VERIFIED_REPORT, mode });

  const errorsFor = (
    form: WarningForm,
    mode: ValidationMode,
  ): WarningFormErrors => {
    try {
      validate(form, mode);
    } catch (error) {
      if (error instanceof InvalidWarningException) {
        return error.errors;
      }
      throw error;
    }
    return {};
  };

  it.each(MODES)('accepts a complete form in %s mode', (mode) => {
    expect(() => validate(buildWarningForm(), mode)).not.toThrow();
  });

  it.each(MODES)(
    'rejects an unverified report in %s mode with ReportNotVerifiedException',
    (mode) => {
      expect(() =>
        validator.validate({
          form: buildWarningForm(),
          report: { ...VERIFIED_REPORT, status: 'pending_verification' },
          mode,
        }),
      ).toThrow(ReportNotVerifiedException);
    },
  );

  it('checks verification before any field rule', () => {
    expect(() =>
      validator.validate({
        form: buildWarningForm({ message: '' }),
        report: { ...VERIFIED_REPORT, status: 'rejected' },
        mode: 'PUBLISH',
      }),
    ).toThrow(ReportNotVerifiedException);
  });

  describe.each(MODES)('rules that apply in %s mode', (mode) => {
    it('requires a name when the hazard is OTHER', () => {
      expect(
        errorsFor(
          buildWarningForm({ hazard: 'OTHER', otherHazard: ' ' }),
          mode,
        ),
      ).toEqual({ otherHazard: expect.any(String) });
    });

    it('accepts OTHER with a hazard name', () => {
      expect(
        errorsFor(
          buildWarningForm({ hazard: 'OTHER', otherHazard: 'Dam breach' }),
          mode,
        ),
      ).toEqual({});
    });

    it('requires at least one area', () => {
      expect(errorsFor(buildWarningForm({ areaIds: [] }), mode)).toEqual({
        areaIds: expect.stringContaining('at least one'),
      });
    });

    it('names unknown areas', () => {
      expect(
        errorsFor(
          buildWarningForm({ areaIds: ['B-KALU', 'D-ATLANTIS'] }),
          mode,
        ),
      ).toEqual({ areaIds: expect.stringContaining('D-ATLANTIS') });
    });

    it(`requires a message of at least ${WARNING_MESSAGE_MIN_LENGTH} characters, ignoring spaces`, () => {
      const tooShort = `${'x'.repeat(WARNING_MESSAGE_MIN_LENGTH - 1)}   `;

      expect(errorsFor(buildWarningForm({ message: tooShort }), mode)).toEqual({
        message: expect.stringContaining(`${WARNING_MESSAGE_MIN_LENGTH}`),
      });
    });

    it('rejects a hazard or severity outside the vocabulary', () => {
      const form = {
        ...buildWarningForm(),
        hazard: 'TSUNAMI',
        severity: 'EXTREME',
      } as unknown as WarningForm;

      expect(errorsFor(form, mode)).toEqual({
        hazard: expect.any(String),
        severity: expect.any(String),
      });
    });
  });

  it('lets a draft be saved without instructions or channels', () => {
    expect(
      errorsFor(buildWarningForm({ instructions: '', channels: [] }), 'DRAFT'),
    ).toEqual({});
  });

  it('requires instructions and at least one channel to publish', () => {
    expect(
      errorsFor(
        buildWarningForm({ instructions: '  ', channels: [] }),
        'PUBLISH',
      ),
    ).toEqual({
      instructions: expect.any(String),
      channels: expect.any(String),
    });
  });

  it('collects every invalid field into one InvalidWarningException', () => {
    const errors = errorsFor(
      buildWarningForm({ areaIds: [], message: 'short', channels: [] }),
      'PUBLISH',
    );

    expect(Object.keys(errors).sort()).toEqual([
      'areaIds',
      'channels',
      'message',
    ]);
  });

  it('logs a rejected form at warn level with the report id and fields', () => {
    errorsFor(buildWarningForm({ message: 'short' }), 'DRAFT');

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`${VERIFIED_REPORT.id}.*message`)),
    );
  });

  describe('requireCancelReason', () => {
    it('returns the trimmed reason', () => {
      expect(validator.requireCancelReason('  River level has fallen.  ')).toBe(
        'River level has fallen.',
      );
    });

    it('rejects a blank reason with a cancelReason field error', () => {
      const errors = (() => {
        try {
          validator.requireCancelReason('   ');
        } catch (error) {
          if (error instanceof InvalidWarningException) {
            return error.errors;
          }
          throw error;
        }
        return {};
      })();

      expect(errors).toEqual({ cancelReason: 'Give a reason for cancelling.' });
    });
  });
});
