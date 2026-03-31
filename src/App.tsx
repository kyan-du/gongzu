import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import Result from './pages/Result';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 首页 - 视频背景，点电脑屏幕进入登录 */}
        <Route path="/" element={<Landing />} />

        {/* 登录页 */}
        <Route path="/login" element={<Login />} />

        {/* 专属入口 - 直接到登录 */}
        <Route path="/cyan" element={<Login />} />
        <Route path="/ryan" element={<Login />} />

        {/* 用户首页 */}
        <Route path="/:userId/home" element={<Home />} />

        {/* 答题页 */}
        <Route path="/:userId/quiz/:quizId" element={<Quiz />} />

        {/* 结果页 */}
        <Route path="/:userId/result/:quizId" element={<Result />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
