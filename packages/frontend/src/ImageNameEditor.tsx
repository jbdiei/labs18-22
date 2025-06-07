// frontend/src/images/ImageNameEditor.tsx
import { useState } from "react";
import type { IApiImageData } from "../../backend/src/shared/ApiImageData";

interface INameEditorProps {
  imageId: string;
  initialValue: string;
  images: IApiImageData[];
  setImages: React.Dispatch<React.SetStateAction<IApiImageData[]>>;
}

export function ImageNameEditor({
  imageId,
  initialValue,
  images,
  setImages,
}: INameEditorProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [input, setInput] = useState(initialValue);
  const [isWorking, setIsWorking] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  async function handleSubmitPressed() {
    setIsWorking(true);
    setErrorText(null);

    try {
      const res = await fetch(`/api/images/${imageId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: input }),
      });

      if (res.status === 204) {
        // Persist change locally so UI updates immediately
        setImages(
          images.map(img =>
            img.id === imageId ? { ...img, name: input } : img
          )
        );
        setIsEditingName(false);
        setErrorText(null);
      } else if (res.status === 404) {
        const payload = await res.json();
        setErrorText(payload.message || "Image not found");
      } else if (res.status === 422) {
        const payload = await res.json();
        setErrorText(payload.message);
      } else {
        const payload = await res.json();
        throw new Error(payload.message || `Server responded ${res.status}`);
      }
    } catch (err) {
      console.error("Name update failed:", err);
      setErrorText("Failed to update name. Please try again.");
    } finally {
      setIsWorking(false);
    }
  }

  if (isEditingName) {
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
          disabled={input.trim().length === 0 || isWorking}
          onClick={handleSubmitPressed}
        >
          Submit
        </button>
        <button onClick={() => setIsEditingName(false)} disabled={isWorking}>
          Cancel
        </button>

        {isWorking && <p>Working…</p>}
        {errorText && <p style={{ color: "red" }}>{errorText}</p>}
      </div>
    );
  } else {
    return (
      <div style={{ margin: "1em 0" }}>
        <button onClick={() => setIsEditingName(true)}>Edit name</button>
      </div>
    );
  }
}
