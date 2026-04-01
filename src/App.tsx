import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import SelectUser from './pages/SelectUser';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import DailyQuiz from './pages/DailyQuiz';
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
        <Route path="/:userId/home" element={<Home />} />
        {/* 日期+标签的答题链接 */}
        <Route path="/:userId/:date/:tag" element={<Quiz />} />
        {/* 日期永久链接（列出当天所有作业） */}
        <Route path="/:userId/:date" element={<DailyQuiz />} />
        <Route path="/:userId/result/:quizId" element={<Result />} />
        {/* 家长仪表盘 */}
        <Route path="/parent" element={<ParentDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
