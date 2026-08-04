import "./App.css";
import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import ThemeProvider from "./theme/ThemeContext";
import ScrollToTop from "./components/Nav/ScrollToTop";
import { trackPageView } from "./lib/analytics";
import SmoothScroll from "./components/SmoothScroll";
import RouteTransition from "./components/transition/RouteTransition";
import Platform from "./pages/Platform";
import KioskAttractLoop from "./components/kiosk/KioskAttractLoop";
const TreatmentsPage = lazy(() => import("./pages/Treatments"));
const SupplementsPage = lazy(() => import("./pages/Supplements"));
const ContactPage = lazy(() => import("./pages/Contact"));
const KioskPage = lazy(() => import("./pages/Kiosk"));
const Consult = lazy(() => import("./pages/Consult"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const IntakePage = lazy(() => import("./pages/Intake"));
const PatientPortalPage = lazy(() => import("./pages/PatientPortal"));
const LegalPage = lazy(() => import("./components/LegalPage"));
const DesignStudio = lazy(() => import("./components/studio/DesignStudio"));

// Fires a single page_view per route change (pathname only — no query noise).
function RouteAnalytics() {
  const { pathname } = useLocation();
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <SmoothScroll />
        <ScrollToTop />
        <RouteAnalytics />
        <RouteTransition />
        <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Platform />} />
          <Route path="/treatments" element={<TreatmentsPage />} />
          <Route path="/treatments/:goal" element={<TreatmentsPage />} />
          <Route path="/supplements" element={<SupplementsPage />} />
          <Route path="/kiosk" element={<KioskPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/start" element={<Consult />} />
          <Route path="/start/:slug" element={<Consult />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/intake" element={<IntakePage />} />
          <Route path="/portal" element={<PatientPortalPage />} />
          <Route path="/legal/:policyId" element={<LegalPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <DesignStudio />
        </Suspense>
        <KioskAttractLoop />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
