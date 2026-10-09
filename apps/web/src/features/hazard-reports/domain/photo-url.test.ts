import { describe, expect, it } from 'vitest';
import { mockPhotoUrl, photoFileName } from './photo-url';

describe('mockPhotoUrl', () => {
  it('builds a valid https URL from the file name', () => {
    expect(mockPhotoUrl('flood.jpg')).toBe(
      'https://photos.rescue.lk/mock/flood.jpg',
    );
  });

  it('escapes characters that are not allowed in a URL', () => {
    expect(mockPhotoUrl('my photo #1.jpg')).toBe(
      'https://photos.rescue.lk/mock/my%20photo%20%231.jpg',
    );
  });
});

describe('photoFileName', () => {
  it('gives back the file name that went in', () => {
    expect(photoFileName(mockPhotoUrl('my photo #1.jpg'))).toBe(
      'my photo #1.jpg',
    );
  });

  it('returns null when there is no photo', () => {
    expect(photoFileName(undefined)).toBeNull();
    expect(photoFileName('')).toBeNull();
  });

  it('returns null for a URL that ends with a slash', () => {
    expect(photoFileName('https://photos.rescue.lk/mock/')).toBeNull();
  });
});
