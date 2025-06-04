import type {IApiImageData } from "../../../backend/src/shared/ApiImageData.ts";
import { ImageGrid } from "./ImageGrid.tsx";



export interface AllImagesProps {
  images: IApiImageData[];
  setImages: React.Dispatch<React.SetStateAction<IApiImageData[]>>;
  loading: boolean;
  error: boolean;
}

export function AllImages({ images }: AllImagesProps) {
  if (images.length === 0) {
    return <p>No images available.</p>;
  }

  return (
    <>
      <h2>All Images</h2>
      <ImageGrid images={images}></ImageGrid>
      
    </>
  );
}

