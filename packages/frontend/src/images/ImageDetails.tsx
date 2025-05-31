
import { useParams } from 'react-router';
import type { IImageData } from "../MockAppData";
export interface ImageDetailsProps{
    images: IImageData[];

}
export function ImageDetails({images} : ImageDetailsProps) {

    
    const {id} = useParams<{id: string}>()
    const image = images.find(image => image.id ===id );
    if (!image) {
        return <h2>Image not found</h2>;
    }

    return (
        <>
            <h2>{image.name}</h2>
            <p>By {image.author.username}</p>
            <img className="ImageDetails-img" src={image.src} alt={image.name} />
        </>
    )
}

