import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import Result from './pages/Result';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 通用登录页 */}
        <Route path="/login" element={<Login />} />

        {/* 专属入口 */}
        <Route path="/cyan" element={<Navigate to="/cyan/login" replace />} />
        <Route path="/ryan" element={<Navigate to="/ryan/login" replace />} />
        <Route path="/:userId/login" element={<Login />} />

        {/* 用户首页 */}
        <Route path="/:userId" element={<Home />} />

        {/* 答题页 */}
        <Route path="/:userId/quiz/:quizId" element={<Quiz />} />

        {/* 结果页 */}
        <Route path="/:userId/result/:quizId" element={<Result />} />

        {/* 默认重定向 */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
