import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';

// Placeholder Pages for Slice 0
function DashboardPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to Masar</h2>
      <p className="text-slate-600">Your career guidance journey begins here. Complete your onboarding to unlock your gap analysis.</p>
    </div>
  );
}

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 w-full max-w-md">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Sign in to Masar</h2>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">University Email</label>
            <input type="email" placeholder="student@suez.edu.eg" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input type="password" placeholder="••••••••" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
          </div>
          <button type="button" className="w-full bg-brand-600 text-white py-2 rounded-lg font-medium hover:bg-brand-700">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Authenticated Routes wrapped in AppLayout */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<div className="text-slate-600">Profile Page (Slice 1)</div>} />
          <Route path="/gap-analysis" element={<div className="text-slate-600">Gap Analysis Page (Slice 2)</div>} />
          <Route path="/roadmap" element={<div className="text-slate-600">Roadmap Page (Slice 3)</div>} />
          <Route path="/mentor" element={<div className="text-slate-600">AI Mentor Page (Slice 7)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}