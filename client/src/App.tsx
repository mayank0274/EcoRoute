import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Map from './pages/Map'
import BottomNav from './components/layout/BottomNav'
import GlobalSidebar from './components/layout/GlobalSidebar'
import ShareLocation from './pages/ShareLocation'

function App() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <main className="h-screen w-full relative">
        <BrowserRouter>
          <GlobalSidebar />
          <Routes>
            <Route path="/" element={<Map />} />
            <Route path="/share-location" element={<ShareLocation />} />
          </Routes>
          <BottomNav />
        </BrowserRouter>
      </main>
    </div>
  )
}

export default App
