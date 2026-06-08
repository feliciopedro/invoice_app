import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';

// Pages
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Dashboard } from '@/pages/Dashboard';
import { Clients } from '@/pages/Clients';
import { Invoices } from '@/pages/Invoices';
import { InvoiceDetail } from '@/pages/InvoiceDetail';
import { InvoiceForm } from '@/pages/InvoiceForm';
import { Settings } from '@/pages/Settings';

// Create TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Workspace Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="clients" element={<Clients />} />
                      <Route path="invoices" element={<Invoices />} />
                      <Route path="invoices/new" element={<InvoiceForm />} />
                      <Route path="invoices/:id" element={<InvoiceDetail />} />
                      <Route path="invoices/:id/edit" element={<InvoiceForm />} />
                      <Route path="settings" element={<Settings />} />
                      
                      {/* Fallback redirects */}
                      <Route path="" element={<Navigate to="/dashboard" replace />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
        
        {/* Global Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f1b2d',
              color: '#f8fafc',
              border: '1px solid #1a2a3f',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#f59e0b',
                secondary: '#0f1b2d',
              },
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
