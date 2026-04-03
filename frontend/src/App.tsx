import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Home from './pages/Home';
import Throne from './pages/Throne';
import Tasks from './pages/Tasks';
import Login from './pages/Login';
import JoinCourt from './pages/JoinCourt';
import Court from './pages/Court';
import SelectGender from './pages/SelectGender';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/join/:courtId" element={<JoinCourt />} />
        <Route
          path="/select-gender"
          element={isAuthenticated ? <SelectGender /> : <Navigate to="/login" />}
        />
        <Route
          path="/"
          element={isAuthenticated ? <Home /> : <Navigate to="/login" />}
        />
        <Route
          path="/court"
          element={isAuthenticated ? <Court /> : <Navigate to="/login" />}
        />
        <Route
          path="/throne"
          element={isAuthenticated ? <Throne /> : <Navigate to="/login" />}
        />
        <Route
          path="/tasks"
          element={isAuthenticated ? <Tasks /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
