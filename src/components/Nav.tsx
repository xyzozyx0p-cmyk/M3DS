import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function Nav() {
  const { user, signOut } = useAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b-2 border-stone-700/70 bg-stone-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="pixel-heading flex items-center gap-3 text-sm">
          <span
            className="block h-5 w-5"
            style={{
              background: "linear-gradient(135deg,#7cc44f 0 50%,#4f8f2c 50% 100%)",
              boxShadow: "0 0 0 2px #0a0c10, 0 0 18px rgba(124,196,79,0.5)",
            }}
          />
          <span className="text-grass-400 text-glow">CUBEWORLD</span>
        </Link>

        <nav className="hidden items-center gap-6 text-lg text-stone-300 md:flex">
          <a href="/#biomes" className="transition-colors hover:text-grass-400">
            Биомы
          </a>
          <a href="/#models" className="transition-colors hover:text-grass-400">
            Модели
          </a>
          <a href="/#how" className="transition-colors hover:text-grass-400">
            Как это работает
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/studio" className="btn btn-primary !px-4 !py-2 text-[10px]">
                Мой мир
              </Link>
              <button
                onClick={() => void signOut()}
                className="btn btn-ghost !px-3 !py-2 text-[10px]"
                type="button"
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" className="btn btn-ghost !px-4 !py-2 text-[10px]">
                Войти
              </Link>
              <Link to="/auth?mode=signup" className="btn btn-primary !px-4 !py-2 text-[10px]">
                Начать строить
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
