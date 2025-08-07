import { Routes, Route } from 'react-router';
import CalculatorPage from './pages/CalculatorPage';
import GameSimulationPage from './pages/GameSimulationPage';
import MainLayout from './pages/MainLayout';

const App = () => {
    return (
        <Routes>
            <Route path="/" element={<MainLayout />}>
                <Route index element={<CalculatorPage />} />
                <Route path="simulation" element={<GameSimulationPage />} />
            </Route>
        </Routes>
    );
};

export default App;
