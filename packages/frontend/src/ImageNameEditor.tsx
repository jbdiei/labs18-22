// frontend/src/images/ImageNameEditor.tsx
import { useState } from "react";

interface ImageNameEditorProps {
  imageId: string;
  initialValue: string;
  authToken: string;
  /** Called after the server confirms a 204 rename */
  onRename: (id: string, newName: string) => void;
}

export function ImageNameEditor({
  imageId,
  initialValue,
  authToken,
  onRename,
}: ImageNameEditorProps) {
  const [isEditing, setIsEditing]   = useState(false);
  const [input, setInput]           = useState(initialValue);
  const [isWorking, setIsWorking]   = useState(false);
  const [errorText, setErrorText]   = useState<string | null>(null);

  async function handleSubmit() {
    setIsWorking(true);
    setErrorText(null);

    try {
      const res = await fetch(`/api/images/${imageId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ name: input.trim() }),
      });

      if (res.status === 204) {
        // Tell App to update its state
        onRename(imageId, input.trim());
        setIsEditing(false);
        return;
      }

      // Handle not-found
      if (res.status === 404) {
        const payload = await res.json().catch(() => ({}));
        setErrorText(payload.message || "Image not found");
        return;
      }

      // Handle name-too-long
      if (res.status === 422) {
        const payload = await res.json().catch(() => ({}));
        setErrorText(payload.message || "Name exceeds length limit");
        return;
      }

      // Other errors
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload.message || `Server responded ${res.status}`);
    } catch (err: any) {
      console.error("Name update failed:", err);
      setErrorText("Failed to update name. Please try again.");
    } finally {
      setIsWorking(false);
    }
  }

  if (isEditing) {
    return (
      <div style={{ margin: "1em 0" }}>
        <label>
          New Name{" "}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isWorking}
          />
        </label>
        <button
          onClick={handleSubmit}
          disabled={isWorking || input.trim().length === 0}
        >
          Submit
        </button>
        <button
          onClick={() => setIsEditing(false)}
          disabled={isWorking}
        >
          Cancel
        </button>

        {isWorking && <p>Working…</p>}
        {errorText && <p style={{ color: "red" }}>{errorText}</p>}
      </div>
    );
  } else {
    return (
      <div style={{ margin: "1em 0" }}>
        <button onClick={() => setIsEditing(true)}>
          Edit name
        </button>
      </div>
    );
  }
}
