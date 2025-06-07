// frontend/src/UploadPage.tsx
import React, { useId, useState } from "react";
import { useActionState } from "react";

interface UploadPageProps {
  authToken: string;
}

export function UploadPage({ authToken }: UploadPageProps) {
  const fileInputId = useId();
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Convert a File to a Data URL for preview
  function readAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });
  }

  // Update preview when the user selects a file
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.currentTarget.files?.[0];
    if (!file) {
      setPreviewUrl("");
      return;
    }
    try {
      const dataUrl = await readAsDataURL(file);
      setPreviewUrl(dataUrl);
    } catch {
      setPreviewUrl("");
    }
  };

  // useActionState manages our POST /api/images action
  const [result, submitUpload, isPending] = useActionState<
    { type: "success" | "error"; message: string } | null,
    FormData
  >(
    async (_prev, formData) => {
      try {
        const res = await fetch("/api/images", {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` },
          body: formData,
        });
        if (!res.ok) {
          throw new Error(`Server responded ${res.status}`);
        }
        return { type: "success", message: "Upload successful!" };
      } catch (err: any) {
        return { type: "error", message: err.message || "Upload failed" };
      }
    },
    null
  );

  return (
    <>
      {/* Status messages */}
      {result && (
        <p className={`message ${result.type}`}>{result.message}</p>
      )}
      {isPending && <p className="message loading">Uploading...</p>}

      <form action={submitUpload}>
        <div>
          <label htmlFor={fileInputId}>Choose image to upload:</label>
          <input
            id={fileInputId}
            name="image"
            type="file"
            accept=".png,.jpg,.jpeg"
            required
            disabled={isPending}
            onChange={handleFileChange}
          />
        </div>

        <div>
          <label>
            Image title:
            <input
              name="name"
              required
              disabled={isPending}
            />
          </label>
        </div>

        {previewUrl && (
          <img
            src={previewUrl}
            alt="Preview"
            style={{ width: "20em", maxWidth: "100%" }}
          />
        )}

        <div>
          <button type="submit" disabled={isPending}>
            Confirm upload
          </button>
        </div>
      </form>
    </>
  );
}
