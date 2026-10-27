import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { uploadImage } from "@/lib/api";
import { errorMessage } from "@/hooks/useApi";

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * A logo field that takes a picture from the device, not a URL.
 *
 * The file is uploaded to Cloudinary with a signature from our API and the
 * resulting secure URL is handed back, so nobody has to paste an image link.
 */
export default function LogoPicker({
  value,
  onChange,
  label = "Logo",
  hint = "PNG or JPG, square works best. Used on payer pages and receipts.",
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Choose an image file (PNG, JPG or WebP).");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That image is larger than 5 MB. Try a smaller one.");
      return;
    }

    setUploading(true);
    try {
      onChange(await uploadImage(file));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setUploading(false);
      // Reset so picking the same file twice still fires a change event.
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex items-center gap-4 rounded-[16px] border border-line bg-cream px-4 py-4">
        <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-[14px] border border-line bg-white">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-contain" />
          ) : (
            <ImagePlus size={20} className="text-ink-faint" aria-hidden="true" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
              {value ? "Replace image" : "Choose image"}
            </button>
            {value ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm text-danger hover:bg-[#fdecea]"
                disabled={uploading}
                onClick={() => {
                  setError(null);
                  onChange(null);
                }}
              >
                <Trash2 size={13} />
                Remove
              </button>
            ) : null}
          </div>
          <p className="hint mt-2">{uploading ? "Uploading…" : hint}</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => pick(event.target.files?.[0])}
      />

      {error ? <p className="error-text">{error}</p> : null}
    </div>
  );
}
