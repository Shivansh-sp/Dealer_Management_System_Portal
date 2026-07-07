import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';

// Layout & Modals
import { DashboardLayout } from './layouts/DashboardLayout';
import { GlobalSearchModal } from './components/GlobalSearchModal';

// Pages
import { Login } from './pages/Login';
import { DashboardHome } from './pages/DashboardHome';
import { PreSalesModule } from './pages/PreSalesModule';
import { SalesModule } from './pages/SalesModule';
import { AfterSalesModule } from './pages/AfterSalesModule';
import { PurchaseModule } from './pages/PurchaseModule';
import { ServiceModule } from './pages/ServiceModule';
import { InventoryModule } from './pages/InventoryModule';
import { DocumentDmsModule } from './pages/DocumentDmsModule';
import { AnalyticsModule } from './pages/AnalyticsModule';
import { ProfileModule } from './pages/ProfileModule';
import { SettingsModule } from './pages/SettingsModule';

const queryClient = new QueryClient();

// Route guard for authenticated route
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, fetchProfile } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated, fetchProfile]);

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function DashboardWrapper() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user } = useAuthStore();

  // Guard access based on roles
  useEffect(() => {
    if (!user) return;

    const isAllowed = (tab: string): boolean => {
      switch (tab) {
        case 'dashboard':
        case 'documents':
        case 'profile':
          return true;
        case 'leads':
          return ['Master Admin', 'Pre Sales Manager'].includes(user.role);
        case 'sales':
          return ['Master Admin', 'Sales Manager', 'Finance Manager'].includes(user.role);
        case 'aftersales':
          return ['Master Admin', 'After Sales Manager'].includes(user.role);
        case 'purchase':
          return ['Master Admin', 'Purchase Manager'].includes(user.role);
        case 'inventory':
          return ['Master Admin', 'Purchase Manager', 'Spare House Officer', 'Sales Manager'].includes(user.role);
        case 'service':
          return ['Master Admin', 'Service Technician Officer', 'Spare House Officer'].includes(user.role);
        case 'warranty':
          return ['Master Admin', 'After Sales Manager', 'Legal Manager'].includes(user.role);
        case 'analytics':
          return ['Master Admin', 'Pre Sales Manager', 'Sales Manager', 'Finance Manager'].includes(user.role);
        case 'settings':
          return ['Master Admin'].includes(user.role);
        default:
          return false;
      }
    };

    if (!isAllowed(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [activeTab, user]);

  return (
    <DashboardLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onSearchOpen={() => setIsSearchOpen(true)}
    >
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {activeTab === 'dashboard' && <DashboardHome />}
      {activeTab === 'leads' && <PreSalesModule />}
      {activeTab === 'sales' && <SalesModule />}
      {activeTab === 'aftersales' && <AfterSalesModule defaultSubTab="hsrp" />}
      {activeTab === 'purchase' && <PurchaseModule />}
      {activeTab === 'inventory' && <InventoryModule />}
      {activeTab === 'service' && <ServiceModule />}
      {activeTab === 'warranty' && <AfterSalesModule defaultSubTab="warranty" />}
      {activeTab === 'documents' && <DocumentDmsModule />}
      {activeTab === 'analytics' && <AnalyticsModule />}
      {activeTab === 'profile' && <ProfileModule />}
      {activeTab === 'settings' && <SettingsModule />}
    </DashboardLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DashboardWrapper />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
