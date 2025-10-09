import { Routes, Route, Navigate } from 'react-router';
import AppShell from './app/layout/AppShell';
import InventoryDashboard from './app/routes/inventory-management/inventory/InventoryDashboard';
import SimulationDashboard from './app/routes/inventory-management/simulation/SimulationDashboard';
import { InventoryStateProvider } from '@/hooks/inventory';
import { ThemeProvider } from '@/hooks/theme';

const App = () => {
    return (
        <ThemeProvider>
            <InventoryStateProvider>
                <Routes>
                    <Route path="/inventory" element={<AppShell />}>
                        <Route
                            index
                            element={<Navigate to="predict" replace />}
                        />
                        <Route
                            path="predict"
                            element={<InventoryDashboard />}
                        />
                        <Route
                            path="simulate"
                            element={<SimulationDashboard />}
                        />
                    </Route>
                    <Route
                        path="/"
                        element={<Navigate to="/inventory/predict" replace />}
                    />
                    <Route
                        path="*"
                        element={<Navigate to="/inventory/predict" replace />}
                    />
                </Routes>
            </InventoryStateProvider>
        </ThemeProvider>
    );
};

export default App;
