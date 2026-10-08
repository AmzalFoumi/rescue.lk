import { Camera, Image as ImageIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import type { PhotoDraft } from '../domain/report-draft';
import { Button } from './Button';

interface PhotoStepProps {
  photo: PhotoDraft | null;
  onChange: (photo: PhotoDraft | null) => void;
}

const PICK_BUTTON_CLASS =
  'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-line-input bg-white px-5 font-semibold hover:bg-page';

/** Step 3: an optional photo. The file stays on this device; only its name goes into the report. */
export function PhotoStep({ photo, onChange }: PhotoStepProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const currentUrl = useRef<string | null>(null);

  const replacePreview = (url: string | null) => {
    if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    currentUrl.current = url;
    setPreviewUrl(url);
  };

  // Give the preview's memory back when the screen closes.
  useEffect(
    () => () => {
      if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    },
    [],
  );

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    replacePreview(URL.createObjectURL(file));
    onChange({ fileName: file.name });
  };

  const handleRemove = () => {
    replacePreview(null);
    onChange(null);
  };

  return (
    <div className="space-y-4">
      <p className="text-ink-muted">
        A photo helps operators verify your report faster. This step is
        optional.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <label className={PICK_BUTTON_CLASS}>
          <Camera aria-hidden className="size-5" />
          Take photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="sr-only"
          />
        </label>
        <label className={PICK_BUTTON_CLASS}>
          <ImageIcon aria-hidden className="size-5" />
          Gallery
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="sr-only"
          />
        </label>
      </div>
      {photo && (
        <div className="flex items-center gap-3 rounded-[10px] border border-line bg-white p-3">
          {previewUrl && (
            // A preview of a local file: next/image cannot optimise a blob URL, so a plain img is right here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Photo preview"
              className="size-[72px] rounded-lg object-cover"
            />
          )}
          <p className="min-w-0 flex-1 truncate font-semibold">
            {photo.fileName}
          </p>
          <Button variant="outline" onClick={handleRemove}>
            Remove photo
          </Button>
        </div>
      )}
    </div>
  );
}
