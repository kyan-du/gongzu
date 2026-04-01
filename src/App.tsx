import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import SelectUser from './pages/SelectUser';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import Result from './pages/Result';
import ParentDashboard from './pages/ParentDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login/select" element={<SelectUser />} />
        <Route path="/cyan" element={<Login />} />
        <Route path="/ryan" element={<Login />} />
        {/* Main view: today or specific date */}
        <Route path="/:userId/today" element={<Home />} />
        <Route path="/:userId/home" element={<Home />} />
        {/* Quiz by date + tag */}
        <Route path="/:userId/:date/:tag" element={<Quiz />} />
        {/* Date view (same as home but with date anchor) */}
        <Route path="/:userId/:date" element={<Home />} />
        <Route path="/:userId/result/:quizId" element={<Result />} />
        {/* Parent dashboard */}
        <Route path="/parent" element={<ParentDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
