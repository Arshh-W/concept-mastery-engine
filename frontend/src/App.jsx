import { Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import CodeConquer from "./pages/landing.jsx";
import Roadmap from "./pages/Roadmap.jsx";
import SkillTree from "./pages/SkillTree.jsx";
import Os from "./pages/os.jsx";
import Dbms from "./pages/dbms.jsx";
import About from "./pages/about.jsx";
import Signup from "./pages/Signup.jsx";
import Feedback from "./pages/Feedback.jsx";
import Contact from "./pages/Contact.jsx";
import Login from "./pages/Login.jsx";
import GameShell from "./pages/Gameshell";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<CodeConquer />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/skill-tree" element={<SkillTree />} />
        <Route path="/skill-tree/:domain" element={<SkillTree />} />
        <Route path="/os" element={<Os />} />
        <Route path="/dbms" element={<Dbms />} />
        <Route path="/about" element={<About />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/contact" element={<Contact />} />

        {/* Protected routes — require auth */}
        <Route element={<ProtectedRoute />}>
          <Route path="/game/:domain/:module" element={<GameShell />} />
          <Route path="/os/memory" element={<GameShell />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default App;
