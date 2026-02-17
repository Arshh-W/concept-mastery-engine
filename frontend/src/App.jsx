import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';  
import CodeConquer from './pages/landing.jsx';
import Roadmap from './pages/Roadmap.jsx';
import Os from './pages/os.jsx';
import About from './pages/About.jsx';
import Signup from './pages/Signup.jsx';
import Feedback from './pages/Feedback.jsx';
import Contact from './pages/Contact.jsx';
import Login from './pages/Login.jsx';
import Hamburger from './components/Hamburger.jsx';


function App() {
  return (
    <>
      <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<CodeConquer />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/os" element={<Os/>}/>
        <Route path="/about" element={<About/>}/>
        <Route path="/signup" element={<Signup/>}/>
        <Route path="/login" element={<Login/>} />
        <Route path="/hamburger" element={<Hamburger/>} />
        <Route path="/feedback" element={<Feedback/>}/>
        <Route path="/contact" element={<Contact/>}/>
      </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;