"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

export function SignUpCard() {
  const { connected, publicKey } = useWallet();

  const [open, setOpen] = useState(false);
  const shownRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [walletExists, setWalletExists] = useState<boolean | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });

  const walletAddress = useMemo(() => publicKey?.toBase58() ?? "", [publicKey]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Prevent double-run in React Strict Mode dev + prevent repeat popups.
    if (!mounted) return;
    if (shownRef.current) return;

    if (!connected || !publicKey) return;
    shownRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        setCheckError(null);

        const url = `${API_URL}/api/check-user?walletAddress=${encodeURIComponent(
          walletAddress
        )}`;

        const res = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        const contentType = res.headers.get("content-type") ?? "";
        const bodyText = await res.text();

        if (!res.ok) {
          console.error("check-user failed:", res.status, bodyText);
          throw new Error(
            `Backend returned ${res.status}. Check terminal / route.`
          );
        }

        if (!contentType.includes("application/json")) {
          console.error("Expected JSON but got:", contentType, bodyText);
          throw new Error("Backend did not return JSON.");
        }

        const data = JSON.parse(bodyText) as { exists?: boolean };
        const exists = Boolean(data.exists);

        if (cancelled) return;

        setWalletExists(exists);

        // Only show popup if wallet isn't already in DB
        if (!exists) {
          setOpen(true);
        } else {
          // Already registered: skip popup and notify listeners
          window.dispatchEvent(
            new CustomEvent("wallet:onboardingAccepted", {
              detail: { walletAddress, exists: true },
            })
          );
        }
      } catch (err) {
        if (cancelled) return;
        setCheckError(err instanceof Error ? err.message : "Unknown error");
        // If the check fails, fall back to showing the popup
        setOpen(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mounted, connected, publicKey, API_URL, walletAddress]);

  const handleContinue = async () => {
    // If it's a brand-new wallet, insert user via backend before closing.
    if (walletExists !== true) {
      setSaving(true);
      setSaveError(null);

      try {
        const params = new URLSearchParams({
          walletAddress,
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          streetAddress: form.streetAddress,
          city: form.city,
          state: form.state,
          zip_code: form.zipCode,
          country: form.country,
        });

        const res = await fetch(`${API_URL}/api/user?${params.toString()}`, {
          method: "POST",
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to create user (${res.status}): ${text}`);
        }
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Failed to create user");
        return;
      } finally {
        setSaving(false);
      }
    }

    setOpen(false);

    window.dispatchEvent(
      new CustomEvent("wallet:onboardingAccepted", {
        detail: {
          walletAddress,
          exists: walletExists ?? false,
          profile: {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            streetAddress: form.streetAddress,
            city: form.city,
            state: form.state,
            zipCode: form.zipCode,
            country: form.country,
          },
        },
      })
    );
  };

  const handleCancel = () => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent("wallet:onboardingDismissed"));
  };
  if (!mounted) return null;
  if (!open) return null;

  const showForm = walletExists !== true;
  const canSubmit =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.streetAddress.trim() &&
    form.city.trim() &&
    form.state.trim() &&
    form.zipCode.trim() &&
    form.country.trim();

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-neutral-950 p-6 text-white shadow-2xl">
        <h2 className="text-xl font-semibold">
          {showForm ? "Tell us about you" : "Wallet connected"}
        </h2>

        {checkError && (
          <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {checkError}
          </p>
        )}

        {saveError && (
          <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {saveError}
          </p>
        )}

        <p className="mt-2 text-sm text-white/70">Connected wallet:</p>
        <div className="mt-3 rounded-lg bg-white/5 px-3 py-2 font-mono text-xs text-white/90">
          {walletAddress}
        </div>

        {showForm ? (
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleContinue();
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/70 mb-1">
                  First name
                </label>
                <input
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-white/70 mb-1">
                  Last name
                </label>
                <input
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/30"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/70 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/30"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-white/70 mb-1">
                Street address
              </label>
              <input
                value={form.streetAddress}
                onChange={(e) =>
                  setForm({ ...form, streetAddress: e.target.value })
                }
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/30"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/70 mb-1">City</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-white/70 mb-1">
                  State
                </label>
                <input
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/30"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/70 mb-1">
                  ZIP code
                </label>
                <input
                  value={form.zipCode}
                  onChange={(e) =>
                    setForm({ ...form, zipCode: e.target.value })
                  }
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-white/70 mb-1">
                  Country
                </label>
                <input
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/30"
                  required
                />
              </div>
            </div>

            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 rounded-lg border border-white/15 bg-transparent px-4 py-2 text-sm hover:bg-white/5"
                disabled={saving}
              >
                Not now
              </button>
              <button
                type="submit"
                disabled={!canSubmit || saving}
                className="flex-1 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Continue"}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6">
            <p className="text-sm text-white/80">
              This wallet is already registered.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 rounded-lg border border-white/15 bg-transparent px-4 py-2 text-sm hover:bg-white/5"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
