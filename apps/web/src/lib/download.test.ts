import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadBlob } from './download';

describe('downloadBlob', () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates an object URL, sets the anchor download name, clicks it, and revokes the URL', () => {
    const blob = new Blob(['test']);
    const mockClick = vi.fn();

    // We can spy on document.createElement
    const createElementSpy = vi.spyOn(document, 'createElement');
    const mockAnchor = {
      href: '',
      download: '',
      click: mockClick,
    };
    createElementSpy.mockReturnValue(
      mockAnchor as unknown as HTMLAnchorElement,
    );

    downloadBlob(blob, 'report.csv');

    expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockAnchor.href).toBe('blob:url');
    expect(mockAnchor.download).toBe('report.csv');
    expect(mockClick).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
  });
});
