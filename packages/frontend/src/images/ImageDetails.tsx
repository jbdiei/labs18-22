
import { useParams } from 'react-router';
import type { IApiImageData } from "../../../backend/src/shared/ApiImageData";
import  { ImageNameEditor} from "../ImageNameEditor"

export interface ImageDetailsProps{
    images: IApiImageData[];
    loading:boolean;
    error: boolean;
    setImages: React.Dispatch<React.SetStateAction<IApiImageData[]>>;


}
export function ImageDetails({images, loading,error, setImages} : ImageDetailsProps) {

    
    const {id} = useParams<{id: string}>();
    if (loading) {
    return <p>Loading image details…</p>;
  }
  if (error) {
    return <p>Error loading images. Please try again later.</p>;
  }

  // 2) Find the matching image by ID
  const image = images.find((img) => img.id === id);
  if (!image) {
    return <p>Image not found</p>;
  }

    return (
        <>
            <h2>{image.name}</h2>
            <p>By {image.author.username}</p>

            <ImageNameEditor
                imageId={image.id}
                initialValue={image.name}
                images={images}
                setImages={setImages}
            />
            <img className="ImageDetails-img" src={image.src} alt={image.name} />
        </>
    )
}

