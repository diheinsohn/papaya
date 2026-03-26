import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div className="min-h-screen flex items-center justify-center bg-gray-50"><h1 className="text-4xl font-bold text-papaya-500">Papaya</h1></div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
