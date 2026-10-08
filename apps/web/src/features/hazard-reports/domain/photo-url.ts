// The API takes a photo as a URL and has no upload. Until it does, the app sends
// a made-up URL built from the file name and keeps the real file only for the preview.
const MOCK_PHOTO_BASE = 'https://photos.rescue.lk/mock/';

export function mockPhotoUrl(fileName: string): string {
  return `${MOCK_PHOTO_BASE}${encodeURIComponent(fileName)}`;
}

/** The file name inside a photo URL, or null when there is no photo. */
export function photoFileName(url: string | undefined): string | null {
  if (!url) return null;
  const lastPart = url.split('/').pop();
  return lastPart ? decodeURIComponent(lastPart) : null;
}
