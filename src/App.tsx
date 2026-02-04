import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
const SpaPage = lazy(() => import('./pages/SpaPage'));
const CinemaPage = lazy(() => import('./pages/CinemaPage'));
const ParkingPage = lazy(() => import('./pages/ParkingPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const BookingConfirmationPage = lazy(() => import('./pages/BookingConfirmationPage'));
const ExploreAllProperties = lazy(() => import('./pages/ExploreAllProperties'));

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <ErrorBoundary>
              <Suspense fallback={<div className="min-h-screen" />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/spa" element={<SpaPage />} />
                  <Route path="/cinema" element={<CinemaPage />} />
                  <Route path="/parking" element={<ParkingPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/blog/:id" element={<BlogPostPage />} />
                  <Route path="/properties" element={<ExploreAllProperties />} />
                  <Route path="/payment-success" element={<BookingConfirmationPage />} />
                  <Route path="/booking-confirmation" element={<BookingConfirmationPage />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
