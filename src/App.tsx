import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import SpaPage from './pages/SpaPage';
import CinemaPage from './pages/CinemaPage';
import ParkingPage from './pages/ParkingPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/spa" element={<SpaPage />} />
                <Route path="/cinema" element={<CinemaPage />} />
                <Route path="/parking" element={<ParkingPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:id" element={<BlogPostPage />} />
                <Route path="/payment-success" element={<BookingConfirmationPage />} />
                <Route path="/booking-confirmation" element={<BookingConfirmationPage />} />
              </Routes>
            </ErrorBoundary>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
