import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FilterProvider } from './contexts/FilterContext';
import { 
  Dashboard, 
  Leads, 
  LeadDetail,
  Funnel, 
  UTMAnalysis, 
  Geographic, 
  Events, 
  Temporal,
  VSLEngagement,
  DeviceAnalytics,
  CheckoutHealth,
  Campaigns,
  IntegrationsHub,
  RoiDashboard,
  Login
} from './pages';

const queryClient = new QueryClient();

// Componente para proteger rotas
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0f0f13]"><div className="w-8 h-8 text-indigo-500 animate-spin border-4 border-indigo-500 border-t-transparent rounded-full" /></div>;
  }
  
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FilterProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <PrivateRoute>
                    <Routes>
                      <Route element={<Layout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="leads" element={<Leads />} />
                        <Route path="leads/:id" element={<LeadDetail />} />
                        <Route path="funnel" element={<Funnel />} />
                        <Route path="utm" element={<UTMAnalysis />} />
                        <Route path="temporal" element={<Temporal />} />
                        <Route path="geo" element={<Geographic />} />
                        <Route path="devices" element={<DeviceAnalytics />} />
                        <Route path="vsl" element={<VSLEngagement />} />
                        <Route path="events" element={<Events />} />
                        <Route path="checkout" element={<CheckoutHealth />} />
                        <Route path="roi" element={<RoiDashboard />} />
                        <Route path="integrations" element={<IntegrationsHub />} />
                        <Route path="campaigns" element={<Campaigns />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Route>
                    </Routes>
                  </PrivateRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </FilterProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
