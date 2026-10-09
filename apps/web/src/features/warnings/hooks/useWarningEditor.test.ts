import { act, renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import type {
  TargetAreaDto,
  VerifiedHazardReportDto,
  WarningDto,
} from '@rescue-lk/shared';
import { editorLabel, useWarningEditor } from './useWarningEditor';
import { useWarningForm } from './useWarningForm';
import { useWorkflowNavigation } from './useWorkflowNavigation';

const REPORT_ID = '665f1b2c9d3e4a00000000a1';
const WARNING_ID = '665f1b2c9d3e4a0012345670';

const reports = [
  {
    id: REPORT_ID,
    hazardType: 'landslide',
    districtName: 'Badulla',
  } as VerifiedHazardReportDto,
];
const areas: TargetAreaDto[] = [
  {
    id: 'D-BADULLA',
    kind: 'DISTRICT',
    name: 'Badulla District',
    districts: ['Badulla'],
  },
];

const warning = (status: WarningDto['status']) =>
  ({
    id: WARNING_ID,
    sourceReportId: REPORT_ID,
    status,
    hazard: 'flood',
    otherHazard: '',
    severity: 'HIGH',
    areaIds: ['D-BADULLA'],
    message: 'Saved message',
    instructions: '',
    channels: ['SMS'],
  }) as unknown as WarningDto;

// The editor working against real navigation and form state.
const setup = () =>
  renderHook(() => {
    const nav = useWorkflowNavigation();
    const form = useWarningForm();
    const editor = useWarningEditor({ nav, form, reports, areas });
    return { nav, form, editor };
  });

describe('useWarningEditor', () => {
  it('creates a warning from a report, pre-filled with its hazard and district', () => {
    const { result } = setup();

    act(() => result.current.editor.createFrom(REPORT_ID));

    expect(result.current.nav.state).toMatchObject({
      step: 'level',
      reportId: REPORT_ID,
      editor: { mode: 'create' },
    });
    expect(result.current.form.values).toMatchObject({
      sourceReportId: REPORT_ID,
      hazard: 'landslide',
      areaIds: ['D-BADULLA'],
      channels: ['SMS', 'PUSH'],
    });
  });

  it('opens a draft in the editor on the area step', () => {
    const { result } = setup();

    act(() => result.current.editor.openWarning(warning('DRAFT')));

    expect(result.current.nav.state).toMatchObject({
      step: 'area',
      editor: { mode: 'draft', warningId: WARNING_ID },
    });
    expect(result.current.form.values.message).toBe('Saved message');
  });

  it('opens an active warning on its delivery status', () => {
    const { result } = setup();

    act(() => result.current.editor.openWarning(warning('ACTIVE')));

    expect(result.current.nav.state).toMatchObject({
      step: 'delivery',
      warningId: WARNING_ID,
      editor: null,
    });
  });

  it('only continues to the area step once the level step is filled in', () => {
    const { result } = setup();
    act(() => result.current.editor.createFrom(null));

    act(() => result.current.editor.continueToArea());
    expect(result.current.nav.state.step).toBe('level');
    expect(Object.keys(result.current.form.errors).sort()).toEqual([
      'hazard',
      'severity',
      'sourceReportId',
    ]);

    act(() => result.current.editor.chooseSource(REPORT_ID));
    act(() => result.current.form.setField('severity', 'HIGH'));
    act(() => result.current.editor.continueToArea());
    expect(result.current.nav.state.step).toBe('area');
  });

  it('starts an update of an active warning on the level step', () => {
    const { result } = setup();

    act(() => result.current.editor.startUpdate(warning('ACTIVE')));

    expect(result.current.nav.state).toMatchObject({
      step: 'level',
      editor: { mode: 'update', warningId: WARNING_ID },
    });
    expect(editorLabel(result.current.nav.state.editor)).toBe(
      'Updating W-345670',
    );
  });

  it.each([
    ['an update', () => warning('ACTIVE'), 'delivery'],
    ['a report', null, 'review'],
  ] as const)(
    'goes back from the level step of %s',
    (_case, start, expected) => {
      const { result } = setup();
      act(() =>
        start
          ? result.current.editor.startUpdate(start())
          : result.current.editor.createFrom(REPORT_ID),
      );

      act(() => result.current.editor.backFromLevel());

      expect(result.current.nav.state.step).toBe(expected);
    },
  );

  it('goes back to monitoring from a warning started without a report', () => {
    const { result } = setup();
    act(() => result.current.editor.createFrom(null));

    act(() => result.current.editor.backFromLevel());

    expect(result.current.nav.state.step).toBe('monitor');
  });

  it('labels a new warning and a draft', () => {
    expect(editorLabel(null)).toBe('New warning');
    expect(editorLabel({ mode: 'create' })).toBe('New warning');
    expect(editorLabel({ mode: 'draft', warningId: WARNING_ID })).toBe(
      'Draft W-345670',
    );
  });
});
