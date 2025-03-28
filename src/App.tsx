
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Login from '@/pages/Login';
import ResetPassword from '@/pages/ResetPassword';
import Index from '@/pages/Index';
import Movies from '@/pages/Movies';
import MovieDetail from '@/pages/MovieDetail';
import Series from '@/pages/Series';
import SeriesDetail from '@/pages/SeriesDetail';
import Admin from '@/pages/Admin';
import NotFound from '@/pages/NotFound';
import Watchlist from '@/pages/Watchlist';
import Favorites from '@/pages/Favorites';
import Rated from '@/pages/Rated';
import './App.css';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<Index />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/movies/:id" element={<MovieDetail />} />
            <Route path="/series" element={<Series />} />
            <Route path="/series/:id" element={<SeriesDetail />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/rated" element={<Rated />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
