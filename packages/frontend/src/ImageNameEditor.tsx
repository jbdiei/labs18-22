// frontend/src/images/ImageNameEditor.tsx
import { useState } from "react";
import type { IApiImageData } from "../../backend/src/shared/ApiImageData";

interface INameEditorProps {
  /** The ID of the image we're renaming */
  imageId: string;
  /** The current name (to prefill the input) */
  initialValue: string;
  /** The full images array from App */
  images: IApiImageData[];
  /** Setter from App to update the images array */
  setImages: React.Dispatch<React.SetStateAction<IApiImageData[]>>;
}

export function ImageNameEditor({
  imageId,
  initialValue,
  images,
  setImages,
}: INameEditorProps) {
  // Are we currently editing (show input+buttons) or not?
  const [isEditingName, setIsEditingName] = useState(false);
  // Controlled input for the new name
  const [input, setInput] = useState(initialValue);

  // Track if the PUT/POST (simulated fetch) is in flight
  const [isWorking, setIsWorking] = useState(false);
  // Any error text to show if the fetch fails
  const [errorText, setErrorText] = useState<string | null>(null);

  async function handleSubmitPressed() {
    setIsWorking(true);
    setErrorText(null);

    try {
      // Simulate hitting the real API. 
      // (We are using the same URL as in App.tsx when fetching all images.)
      const res = await fetch("/api/images");
      if (!res.ok) {
        throw new Error(`Server responded ${res.status}`);
      }
      // We don't actually care about the returned JSON here—
      // we only use this to decide “did the network call succeed?”
      await res.json();

      // On success, update the in‐memory array in App:
      setImages(
        images.map((img) =>
          img.id === imageId ? { ...img, name: input } : img
        )
      );

      // Close the editor and clear any previous error
      setIsEditingName(false);
      setErrorText(null);
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
