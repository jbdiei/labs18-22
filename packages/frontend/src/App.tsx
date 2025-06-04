import { AllImages } from "./images/AllImages.tsx";
import { ImageDetails } from "./images/ImageDetails.tsx";
import { UploadPage } from "./UploadPage.tsx";
import { LoginPage } from "./LoginPage.tsx";
import {Routes, Route} from "react-router";
import { BrowserRouter } from "react-router";
import { MainLayout } from "./MainLayout.tsx";
// import { fetchDataFromServer } from "../../backend/src/shared/ApiImageData.ts";
import {useState, useEffect} from "react"
import type { IApiImageData } from "../../backend/src/shared/ApiImageData.ts";
import { ValidRoutes } from "../../backend/src/shared/ValidRoutes.ts";

function App() {
  const [images, setImages] = useState<IApiImageData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
//   // 3) “Did an error occur (network failure / bad status / invalid JSON)?”
  const [error, setError] = useState<boolean>(false);
  useEffect(() => {

    fetch("/api/images")
      .then((res) => {
        if (!res.ok) {
          
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json() as Promise<IApiImageData[]>;
      })
      .then((data) => {
        setImages(data);
        setError(false);
      })
      .catch((_) => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);


   return( 
   <BrowserRouter>
   <Routes>
        <Route path={ValidRoutes.HOME} element={<MainLayout/>}>
        <Route index 
        element={<AllImages images={images} setImages={setImages} loading={loading} error={error}/>} />
        <Route path={ValidRoutes.IMAGES} element={<ImageDetails images={images} loading={loading} error={error} setImages={setImages}/>}/>
        <Route path={ValidRoutes.UPLOAD} element={<UploadPage />}/>
        <Route path={ValidRoutes.LOGIN} element={<LoginPage />}/>
        </Route>
    </Routes>
    
    </BrowserRouter>
    );
    
}

export default App;

