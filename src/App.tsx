import { Routes, Route } from 'react-router';
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
                    <Route path="/" element={<AppShell />}>
                        <Route index element={<InventoryDashboard />} />
                        <Route
                            path="simulation"
                            element={<SimulationDashboard />}
                        />
                    </Route>
                </Routes>
            </InventoryStateProvider>
        </ThemeProvider>
    );
};

export default App;
