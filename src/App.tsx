import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import SelectUser from './pages/SelectUser';
import DailyView from './pages/DailyView';
import Quiz from './pages/Quiz';
import Result from './pages/Result';
import ParentDashboard from './pages/ParentDashboard';
import ParentChild from './pages/ParentChild';
import Mistakes from './pages/Mistakes';
import Home from './pages/Home';
import Vocab from './pages/Vocab';
import AddWords from './pages/AddWords';
import WordList from './pages/WordList';
import MemoryMatryoshka from './pages/MemoryMatryoshka';
import MemoryGrid from './pages/MemoryGrid';
import MemorySelect from './pages/MemorySelect';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<SelectUser />} />
        <Route path="/cyan" element={<Navigate to="/cyan/home" replace />} />
        <Route path="/ryan" element={<Navigate to="/ryan/home" replace />} />
        {/* Main view: today or specific date */}
        <Route path="/:userId/today" element={<DailyView />} />
        <Route path="/:userId/home" element={<Home />} />
        {/* Cards / vocabulary — daily (with date) */}
        <Route path="/:userId/:date/vocab" element={<Vocab />} />
        <Route path="/:userId/:date/vocab/learn" element={<Vocab />} />
        {/* Cards / vocabulary — global (no date) */}
        <Route path="/:userId/vocab" element={<Vocab />} />
        <Route path="/:userId/vocab/add" element={<AddWords />} />
        <Route path="/:userId/vocab/list" element={<WordList />} />
        {/* Mistakes book */}
        <Route path="/:userId/mistakes" element={<Mistakes />} />
        {/* Memory games */}
        <Route path="/:userId/memory" element={<MemorySelect />} />
        <Route path="/:userId/memory/matryoshka" element={<MemoryMatryoshka />} />
        <Route path="/:userId/memory/grid" element={<MemoryGrid />} />
        {/* Quiz by date + tag slug */}
        <Route path="/:userId/:date/:tag" element={<Quiz />} />
        {/* Date view (same as home but with date anchor) */}
        <Route path="/:userId/:date" element={<DailyView />} />
        <Route path="/:userId/result/:quizId" element={<Result />} />
        {/* Parent dashboard */}
        <Route path="/parent" element={<ParentDashboard />} />
        <Route path="/parent/:childId" element={<ParentChild />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
