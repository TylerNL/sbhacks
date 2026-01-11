"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

import { useState, useEffect, type FormEvent } from "react";
import { createClient, type Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY"
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setAuthError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    // On success, Supabase will redirect away; this only runs if it fails.
    if (error) {
      setAuthError(error.message);
      setLoading(false);
    }
  };
  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        router.push("/");
      }
    });
    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        router.push("/");
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setAuthError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const status =
          (error as { status?: number; statusCode?: number }).status ??
          (error as { statusCode?: number }).statusCode;

        // If backend says "bad request" for login, fall back to sign-up.
        if (status === 400) {
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
          });

          if (signUpError) {
            setAuthError(signUpError.message);
            return;
          }

          router.push("/");
          return;
        }

        setAuthError(error.message);
        return;
      }

      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="max-w-[1800px] mx-auto px-6 py-12">
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="w-full max-w-xl">
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                LOGIN
              </h1>
              <p className="text-muted mt-4 text-lg">
                Sign in to manage listings and purchases.
              </p>
            </div>

            <div className="mt-10 bg-card border border-border">
              <div className="p-6 md:p-8">
                <form onSubmit={handleLogin} className="space-y-6">
                  <button
                    type="button"
                    className="w-full inline-flex items-center justify-center gap-3 border-2 border-foreground px-8 py-4 font-bold uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                  >
                    <span className="inline-flex items-center justify-center w-7 h-7 bg-foreground text-background font-bold">
                      G
                    </span>
                    Log in with Google
                  </button>

                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs font-mono uppercase tracking-wider text-muted">
                      or
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="text-xs font-mono uppercase tracking-wider text-muted mb-2 block"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-4 bg-background border border-border focus:border-foreground outline-none transition-colors font-mono"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="text-xs font-mono uppercase tracking-wider text-muted mb-2 block"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-4 bg-background border border-border focus:border-foreground outline-none transition-colors font-mono"
                    />
                  </div>

                  {authError && (
                    <p className="text-sm text-accent font-mono">{authError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !email || !password}
                    className="w-full inline-flex items-center justify-center gap-3 bg-foreground text-background px-8 py-4 font-bold uppercase tracking-wider hover:opacity-95 transition-opacity disabled:opacity-50"
                  >
                    {loading ? "Signing In…" : "Sign In"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
