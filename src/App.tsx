import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Loading from './components/Loading';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const SelectUser = lazy(() => import('./pages/SelectUser'));
const DailyView = lazy(() => import('./pages/DailyView'));
const Quiz = lazy(() => import('./pages/Quiz'));
const Result = lazy(() => import('./pages/Result'));
const ParentDashboard = lazy(() => import('./pages/ParentDashboard'));
const ParentChild = lazy(() => import('./pages/ParentChild'));
const Mistakes = lazy(() => import('./pages/Mistakes'));
const Home = lazy(() => import('./pages/Home'));
const Vocab = lazy(() => import('./pages/Vocab'));
const AddWords = lazy(() => import('./pages/AddWords'));
const WordList = lazy(() => import('./pages/WordList'));
const MemoryMatryoshka = lazy(() => import('./pages/MemoryMatryoshka'));
const MemoryGrid = lazy(() => import('./pages/MemoryGrid'));
const MemorySelect = lazy(() => import('./pages/MemorySelect'));
const GridReasoning = lazy(() => import('./pages/GridReasoning'));
const BalanceSort = lazy(() => import('./pages/BalanceSort'));
const EquivSubstitution = lazy(() => import('./pages/EquivSubstitution'));
const RiverCrossing = lazy(() => import('./pages/RiverCrossing'));
const WaterPouring = lazy(() => import('./pages/WaterPouring'));
const LightsOut = lazy(() => import('./pages/LightsOut'));
const OddBall = lazy(() => import('./pages/OddBall'));
const KenKen = lazy(() => import('./pages/KenKen'));
const Futoshiki = lazy(() => import('./pages/Futoshiki'));
const Skyscrapers = lazy(() => import('./pages/Skyscrapers'));
const Kakuro = lazy(() => import('./pages/Kakuro'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
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
        <Route path="/:userId/brain" element={<MemorySelect />} />
        <Route path="/:userId/brain/matryoshka" element={<MemoryMatryoshka />} />
        <Route path="/:userId/brain/grid" element={<MemoryGrid />} />
        <Route path="/:userId/brain/reasoning" element={<GridReasoning />} />
        <Route path="/:userId/brain/balance" element={<BalanceSort />} />
        <Route path="/:userId/brain/equivalence" element={<EquivSubstitution />} />
        <Route path="/:userId/brain/river" element={<RiverCrossing />} />
        <Route path="/:userId/brain/water" element={<WaterPouring />} />
        <Route path="/:userId/brain/lights" element={<LightsOut />} />
        <Route path="/:userId/brain/odd-ball" element={<OddBall />} />
        <Route path="/:userId/brain/kenken" element={<KenKen />} />
        <Route path="/:userId/brain/futoshiki" element={<Futoshiki />} />
        <Route path="/:userId/brain/skyscrapers" element={<Skyscrapers />} />
        <Route path="/:userId/brain/kakuro" element={<Kakuro />} />
        {/* Legacy /memory redirects */}
        <Route path="/:userId/memory" element={<Navigate to="../brain" replace />} />
        <Route path="/:userId/memory/*" element={<Navigate to="../brain" replace />} />
        {/* Quiz by date + tag slug */}
        <Route path="/:userId/:date/:tag" element={<Quiz />} />
        {/* Date view (same as home but with date anchor) */}
        <Route path="/:userId/:date" element={<DailyView />} />
        <Route path="/:userId/result/:quizId" element={<Result />} />
        {/* Parent dashboard */}
        <Route path="/parent" element={<ParentDashboard />} />
        <Route path="/parent/home" element={<Navigate to="/parent" replace />} />
        <Route path="/parent/:childId" element={<ParentChild />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
