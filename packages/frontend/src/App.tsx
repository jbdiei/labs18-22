// frontend/src/App.tsx
import  { useState, useEffect, useRef } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
} from "react-router";

import { AllImages }    from "./images/AllImages";
import { ImageDetails } from "./images/ImageDetails";
import { UploadPage }   from "./UploadPage";
import { LoginPage }    from "./LoginPage";
import { MainLayout }   from "./MainLayout";
import { ImageSearchForm } from "./images/ImageSearchForm";
import { ProtectedRoute } from "./ProtectedRoute";

import type { IApiImageData } from "../../backend/src/shared/ApiImageData";
import { ValidRoutes }        from "../../backend/src/shared/ValidRoutes";

function AppRoutes() {
  const navigate = useNavigate();

  // ─── 1) Auth state + redirect callback ───
  const [authToken, setAuthToken] = useState<string>("");

  function handleAuthSuccess(token: string) {
    setAuthToken(token);
    // Redirect immediately upon login or registration
    navigate("/", { replace: true });
  }

  // ─── 2) Image gallery state (unchanged) ───
  const [images, setImages]     = useState<IApiImageData[]>([]);
  const [loading, setLoading]   = useState<boolean>(true);
  const [error, setError]       = useState<boolean>(false);
  const [searchString, setSearchString] = useState<string>("");


  function handleImageRename(id: string, newName: string) {
    setImages(current =>
      current.map(img =>
        img.id === id
          ? { ...img, name: newName }
          : img
      )
    );
  }

  const latestRequestRef = useRef(0);


  async function fetchImages(nameFilter?: string) {
    latestRequestRef.current += 1;
    const requestId = latestRequestRef.current;

    setLoading(true);
    setError(false);
    try {
      const url =
        nameFilter && nameFilter.trim() !== ""
          ? `/api/images?name=${encodeURIComponent(nameFilter)}`
          : `/api/images`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: IApiImageData[] = await res.json();
      if (requestId === latestRequestRef.current) {
        setImages(data);
      }
    } catch {
      if (requestId === latestRequestRef.current) {
        setError(true);
      }
    } finally {
      if (requestId === latestRequestRef.current) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    // Initial load & whenever authToken changes, re-fetch (will 401 if no token)
    fetchImages();
  }, [authToken]);

  function handleImageSearch() {
    fetchImages(searchString);
  }

  return (
    <Routes>
      <Route path={ValidRoutes.HOME} element={<MainLayout />}>
        <Route
          index
          element={
            <ProtectedRoute authToken={authToken}>
            <AllImages
              images={images}
              loading={loading}
              error={error}
              setImages={setImages}
              searchPanel={
                <ImageSearchForm
                  searchString={searchString}
                  onSearchStringChange={setSearchString}
                  onSearchRequested={handleImageSearch}
                />
              }
            /></ProtectedRoute>
          }
        />
        <Route
          path={ValidRoutes.IMAGES}
          element={
          <ProtectedRoute authToken={authToken}>
            <ImageDetails
              images={images}
              loading={loading}
              setImages={setImages}
              error={error}
              authToken={authToken}
              onRename={handleImageRename}
            /></ProtectedRoute>
          }
        />
        <Route path={ValidRoutes.UPLOAD} element={
        <ProtectedRoute authToken={authToken}><UploadPage authToken={authToken} /></ProtectedRoute>} />

        {/* Public: Login */}
        <Route
          path={ValidRoutes.LOGIN}
          element={<LoginPage onAuthSuccess={handleAuthSuccess} />}
        />

        {/* Public: Register */}
        <Route
          path="/register"
          element={
            <LoginPage
              isRegistering={true}
              onAuthSuccess={handleAuthSuccess}
            />
          }
        />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
