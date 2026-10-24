import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DesignSystemShowcase } from './components/DesignSystemShowcase';
import { Input, Button } from './components/ui';

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-background px-4">
      <div className="bg-neutral-surface p-8 rounded-lg shadow-sm border border-neutral-border w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <div className="w-10 h-10 mx-auto rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-xl mb-3">
            M
          </div>
          <h1 className="text-h2 font-bold text-neutral-900">Sign in to Masar</h1>
          <p className="text-b2 text-neutral-600">Enter your university credentials to continue</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <Input
            label="University Email"
            type="email"
            placeholder="student@suez.edu.eg"
            helperText="Use your official Suez Canal University student email."
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            required
          />
          <Button type="submit" variant="primary" className="w-full">
            Sign In
          </Button>
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
          <Route path="/dashboard" element={<DesignSystemShowcase />} />
          <Route path="/profile" element={<div className="text-neutral-600">Profile Page (Slice 1)</div>} />
          <Route path="/gap-analysis" element={<div className="text-neutral-600">Gap Analysis Page (Slice 2)</div>} />
          <Route path="/roadmap" element={<div className="text-neutral-600">Roadmap Page (Slice 3)</div>} />
          <Route path="/mentor" element={<div className="text-neutral-600">AI Mentor Page (Slice 7)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}