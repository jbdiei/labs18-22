import type {IImageData } from "../MockAppData.ts";
import { ImageGrid } from "./ImageGrid.tsx";



export interface AllImagesProps {
  images: IImageData[];
  setImages: React.Dispatch<React.SetStateAction<IImageData[]>>;
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

