import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useUserProfile } from './hooks/useUserProfile';
import HomePage from './pages/HomePage';
import FoodDetailPage from './pages/FoodDetailPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  const userProfile = useUserProfile();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage userProfile={userProfile} />} />
        <Route path="/food/:id" element={<FoodDetailPage userProfile={userProfile} />} />
        <Route path="/profile" element={<ProfilePage userProfile={userProfile} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
