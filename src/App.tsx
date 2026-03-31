import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import SelectUser from './pages/SelectUser';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import DailyQuiz from './pages/DailyQuiz';
import Result from './pages/Result';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login/select" element={<SelectUser />} />
        <Route path="/cyan" element={<Login />} />
        <Route path="/ryan" element={<Login />} />
        <Route path="/:userId/home" element={<Home />} />
        <Route path="/:userId/quiz/:quizId" element={<Quiz />} />
        <Route path="/:userId/result/:quizId" element={<Result />} />
        {/* 永久链接：/cyan/2026-04-01 */}
        <Route path="/:userId/:date" element={<DailyQuiz />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
