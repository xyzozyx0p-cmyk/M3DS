import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./lib/auth";
import { Landing } from "./pages/Landing";
import { AuthPage } from "./pages/AuthPage";
import { Studio } from "./pages/Studio";

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const location = useLocation();

  if (token && user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="panel pixel-heading animate-pulse px-6 py-4 text-xs text-grass-400">
          Загружаем мир...
        </div>
      </div>
    );
  }

  if (!user) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?returnTo=${returnTo}`} replace />;
  }

  return <>{children}</>;
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 text-center">
      <p className="pixel-heading text-4xl text-grass-400">404</p>
      <p className="max-w-md text-xl text-stone-400">
        Такого чанка не существует. Кажется, вы копнули слишком глубоко.
      </p>
      <a href="/" className="btn btn-primary">
        На главную
      </a>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/studio"
        element={
          <RequireAuth>
            <Studio />
          </RequireAuth>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
