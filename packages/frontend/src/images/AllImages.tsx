import type {IApiImageData } from "../../../backend/src/shared/ApiImageData.ts";
import { ImageGrid } from "./ImageGrid.tsx";


export interface AllImagesProps {
  images: IApiImageData[];
  setImages: React.Dispatch<React.SetStateAction<IApiImageData[]>>;
  loading: boolean;
  error: boolean;
  searchPanel?: React.ReactNode;
}

export function AllImages({
  images,
  loading,
  error,
  searchPanel,
}: AllImagesProps) {
  // If you need loading/error here, you can handle them:
  if (loading) {
    return <p>Loading images…</p>;
  }
  if (error) {
    return <p>Error loading images.</p>;
  }

  return (
    <>
      <h2>All Images</h2>
      {/* Render the search panel (if provided) */}
      {searchPanel}
      <ImageGrid images={images} />
    </>
  );
}

