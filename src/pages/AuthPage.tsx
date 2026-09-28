import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Nav } from "../components/Nav";

export function AuthPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(
    params.get("mode") === "signup" ? "signup" : "signin",
  );
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const returnTo = params.get("returnTo") || "/studio";

  useEffect(() => {
    if (user) navigate(returnTo, { replace: true });
  }, [user, navigate, returnTo]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") await signUp(email, name, password);
      else await signIn(email, password);
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Что-то пошло не так");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Nav />
      <div className="mx-auto flex max-w-5xl flex-col items-center px-4 pt-32 pb-20">
        <div className="grid w-full items-center gap-10 md:grid-cols-2">
          <div className="hidden md:block">
            <p className="pixel-heading mb-4 text-[10px] uppercase tracking-[0.3em] text-diamond">
              Вход в мир
            </p>
            <h1 className="pixel-heading text-xl text-white sm:text-2xl">
              СОХРАНЯЙТЕ
              <br />
              СТРОЙКИ И
              <br />
              ВОЗВРАЩАЙТЕСЬ
            </h1>
            <p className="mt-6 max-w-sm text-xl text-stone-400">
              Аккаунт хранит все ваши миры: можно начать новый чанк, вернуться к старому и продолжить
              с того места, где остановились.
            </p>
          </div>

          <form onSubmit={submit} className="panel w-full p-8">
            <div className="mb-8 flex gap-2">
              {(["signin", "signup"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setMode(value);
                    setError(null);
                  }}
                  className={`btn flex-1 !py-2 text-[10px] ${
                    mode === value ? "btn-primary" : "btn-ghost"
                  }`}
                >
                  {value === "signin" ? "Войти" : "Регистрация"}
                </button>
              ))}
            </div>

            <label className="label" htmlFor="email">
              Почта
            </label>
            <input
              id="email"
              className="input mb-5"
              type="email"
              autoComplete="email"
              placeholder="player@cubeworld.ru"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {mode === "signup" ? (
              <>
                <label className="label" htmlFor="name">
                  Ник в мире
                </label>
                <input
                  id="name"
                  className="input mb-5"
                  type="text"
                  placeholder="Steve"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </>
            ) : null}

            <label className="label" htmlFor="password">
              Пароль
            </label>
            <input
              id="password"
              className="input mb-6"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder="минимум 6 символов"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error ? (
              <p className="mb-5 border-2 border-red-800/70 bg-red-950/40 px-4 py-3 text-lg text-red-300">
                {error}
              </p>
            ) : null}

            <button type="submit" className="btn btn-primary w-full" disabled={busy}>
              {busy ? "Загружаем чанки..." : mode === "signup" ? "Создать аккаунт" : "Войти в студию"}
            </button>

            <p className="mt-6 text-center text-lg text-stone-500">
              {mode === "signup" ? "Уже есть аккаунт? " : "Нет аккаунта? "}
              <button
                type="button"
                className="text-grass-400 underline"
                onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              >
                {mode === "signup" ? "войти" : "зарегистрироваться"}
              </button>
            </p>

            <Link to="/" className="mt-4 block text-center text-lg text-stone-600 hover:text-stone-400">
              ← на главную
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
