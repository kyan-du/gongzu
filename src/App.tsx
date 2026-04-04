import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import SelectUser from './pages/SelectUser';
import DailyView from './pages/DailyView';
import Quiz from './pages/Quiz';
import Result from './pages/Result';
import ParentDashboard from './pages/ParentDashboard';
import Mistakes from './pages/Mistakes';
import Home from './pages/Home';
import Cards from './pages/Cards';
import AddWords from './pages/AddWords';
import WordList from './pages/WordList';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login/select" element={<SelectUser />} />
        <Route path="/cyan" element={<Navigate to="/cyan/home" replace />} />
        <Route path="/ryan" element={<Navigate to="/ryan/home" replace />} />
        {/* Main view: today or specific date */}
        <Route path="/:userId/today" element={<DailyView />} />
        <Route path="/:userId/home" element={<Home />} />
        {/* Cards / vocabulary — daily (with date) */}
        <Route path="/:userId/:date/cards" element={<Cards />} />
        <Route path="/:userId/:date/cards/learn" element={<Cards />} />
        {/* Cards / vocabulary — global (no date) */}
        <Route path="/:userId/cards" element={<Cards />} />
        <Route path="/:userId/cards/add" element={<AddWords />} />
        <Route path="/:userId/cards/list" element={<WordList />} />
        {/* Mistakes book */}
        <Route path="/:userId/mistakes" element={<Mistakes />} />
        {/* Quiz by date + tag slug */}
        <Route path="/:userId/:date/:tag" element={<Quiz />} />
        {/* Date view (same as home but with date anchor) */}
        <Route path="/:userId/:date" element={<DailyView />} />
        <Route path="/:userId/result/:quizId" element={<Result />} />
        {/* Parent dashboard */}
        <Route path="/parent" element={<ParentDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
