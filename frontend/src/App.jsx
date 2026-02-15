import { Routes, Route } from 'react-router-dom';
import Navbar from './components/navbar';
import { AnimatePresence } from 'framer-motion';  
import CodeConquer from './pages/landing.jsx';
import Roadmap from './pages/Roadmap.jsx';

function App() {
  return (
    <>
      <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<CodeConquer />} />
        <Route path="/roadmap" element={<Roadmap />} />
      </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;