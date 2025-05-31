import { AllImages } from "./images/AllImages.tsx";
import { ImageDetails } from "./images/ImageDetails.tsx";
import { UploadPage } from "./UploadPage.tsx";
import { LoginPage } from "./LoginPage.tsx";
import {Routes, Route} from "react-router";
import { BrowserRouter } from "react-router";
import { MainLayout } from "./MainLayout.tsx";
import { fetchDataFromServer } from "./MockAppData";
import {useState} from "react"
import type { IImageData } from "./MockAppData";
import { ValidRoutes } from "../../backend/src/shared/ValidRoutes.ts";
function App() {
    const [images, setImages] = useState<IImageData[]>(() => fetchDataFromServer());

   return( 
   <BrowserRouter>
   <Routes>
        <Route path={ValidRoutes.HOME} element={<MainLayout/>}>
        <Route index 
        element={<AllImages images={images} setImages={setImages}/>} />
        <Route path={ValidRoutes.IMAGES} element={<ImageDetails images={images}/>}/>
        <Route path={ValidRoutes.UPLOAD} element={<UploadPage />}/>
        <Route path={ValidRoutes.LOGIN} element={<LoginPage />}/>
        </Route>
    </Routes>
    
    </BrowserRouter>
    );
    
}

export default App;
