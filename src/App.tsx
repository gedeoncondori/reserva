import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

// Pages
import { BookingPage } from './features/booking/pages/BookingPage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { DashboardLayout } from './features/dashboard/components/DashboardLayout';
import { AgendaPage } from './features/dashboard/pages/AgendaPage';
import { AuditPage } from './features/dashboard/pages/AuditPage';
import { BarberosPage } from './features/dashboard/pages/BarberosPage';
import { ServiciosPage } from './features/dashboard/pages/ServiciosPage';
import { ConfiguracionPage } from './features/dashboard/pages/ConfiguracionPage';

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Toaster position="top-right" richColors theme="dark" />
            <BrowserRouter>
                <Routes>
                    {/* Cliente: Reserva */}
                    <Route path="/" element={<BookingPage />} />

                    {/* Staff Auth */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* Dashboard Protegido */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<AgendaPage />} />
                        <Route path="auditoria" element={<AuditPage />} />
                        <Route path="servicios" element={<ServiciosPage />} />
                        <Route path="staff" element={<BarberosPage />} />
                        <Route path="configuracion" element={<ConfiguracionPage />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;
