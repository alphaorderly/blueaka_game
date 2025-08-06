import { Routes, Route } from 'react-router';
import CalculatorPage from './pages/CalculatorPage';
import GameSimulationPage from './pages/GameSimulationPage';

const App = () => {
    return (
        <Routes>
            <Route path="/" element={<CalculatorPage />} />
            <Route path="/simulation" element={<GameSimulationPage />} />
        </Routes>
    );
};

export default App;
