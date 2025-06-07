import { AllImages } from "./images/AllImages.tsx";
import { ImageDetails } from "./images/ImageDetails.tsx";
import { UploadPage } from "./UploadPage.tsx";
import { LoginPage } from "./LoginPage.tsx";
import {Routes, Route} from "react-router";
import { BrowserRouter } from "react-router";
import { MainLayout } from "./MainLayout.tsx";
// import { fetchDataFromServer } from "../../backend/src/shared/ApiImageData.ts";
import {useState, useEffect, useRef } from "react"
import type { IApiImageData } from "../../backend/src/shared/ApiImageData.ts";
import { ValidRoutes } from "../../backend/src/shared/ValidRoutes.ts";
import { ImageSearchForm } from "./images/ImageSearchForm.tsx";
function App() {
  const [images, setImages] = useState<IApiImageData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
//   // 3) “Did an error occur (network failure / bad status / invalid JSON)?”
  const [error, setError] = useState<boolean>(false);
  const [searchString, setSearchString] = useState<string>("");
  

  const ref = useRef(0);


  async function fetchImages(nameFilter?: string) {
    ref.current = ref.current + 1;
    const lastRequestRef = ref.current
    setLoading(true);
    setError(false);
    try {
      // Build URL: if nameFilter is non-empty, go to /api/images/search?name=...
      // Otherwise, fetch all images at /api/images
      const url =
        nameFilter && nameFilter.trim() !== ""
          ? `/api/images?name=${encodeURIComponent(nameFilter)}`
          : `/api/images`;
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data: IApiImageData[] = await res.json();
      if (lastRequestRef === ref.current) {
        setImages(data);
        setError(false);
      }
    } catch (err) {
      // 5) Only set error if no newer request has started
      if (lastRequestRef === ref.current) {
        setError(true);
      }
    } finally {
      // 6) Only clear loading if this is still the latest request
      if (lastRequestRef === ref.current) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
      fetchImages();
  }, []);

  // 4) Handler: invoked when user submits the search form
  function handleImageSearch() {
    // console.log("Search requested for:", searchString);
    // (Later you can replace this console.log with a fetch to `/api/images/search?name=${searchString}` 
    //  or directly use getImages(searchString) to update images via state. For now, it just logs.)
     fetchImages(searchString);
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path={ValidRoutes.HOME} element={<MainLayout />}>
          <Route
            index
            element={
              <AllImages
                images={images}
                setImages={setImages}
                loading={loading}
                error={error}
                // 5) Inject the search panel here:
                searchPanel={
                  <ImageSearchForm
                    searchString={searchString}
                    onSearchStringChange={setSearchString}
                    onSearchRequested={handleImageSearch}
                  />
                }
              />
            }
          />

          <Route
            path={ValidRoutes.IMAGES}
            element={<ImageDetails images={images} setImages={setImages} loading={loading} error={error} />}
          />
          <Route path={ValidRoutes.UPLOAD} element={<UploadPage />} />
          <Route path={ValidRoutes.LOGIN} element={<LoginPage />} />
          <Route path="/register" element={<LoginPage isRegistering={true} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

