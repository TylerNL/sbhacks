'use client';

import Link from 'next/link';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';   // ✅ Correct

export function Navbar() {
  const { publicKey } = useWallet();
  const pathname = usePathname();
  const router = useRouter();

  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastInitial, setLastInitial] = useState<string | null>(null);
  const [initials, setInitials] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setFirstName(null);
      setLastInitial(null);
      setInitials(null);
      return;
    }

    const fetchProfile = async () => {
      const address = publicKey.toString();

      // Try common table / column names — adjust if your DB uses different names
      let { data, error } = await supabase
        .from('profiles')
        .select('first_name,last_name')
        .eq('id', address)
        .single();

      if (error || !data) {
        // fallback: try 'address' column on profiles
        const res = await supabase
          .from('profiles')
          .select('first_name,last_name')
          .eq('address', address)
          .single();

        if (!res.error && res.data) {
          data = res.data;
        } else {
          // fallback: try 'users' table
          const res2 = await supabase
            .from('users')
            .select('first_name,last_name')
            .eq('wallet_address', address)
            .single();

          if (!res2.error && res2.data) data = res2.data;
        }
      }

      if (data) {
        const f = data.first_name ?? '';
        const l = data.last_name ?? '';
        setFirstName(f);
        setLastInitial(l ? `${l[0].toUpperCase()}.` : '');
        setInitials(`${(f[0] || '').toUpperCase()}${(l[0] || '').toUpperCase()}`);
      }
    };

    fetchProfile();
  }, [publicKey]);

  return (
    <>
      {/* Top ticker (visible only on main page) */}
      {pathname === '/' && (
        <div className="bg-foreground text-background overflow-hidden py-2">
          <div className="animate-marquee whitespace-nowrap flex">
            {[...Array(10)].map((_, i) => (
              <span key={i} className="mx-8 text-xs tracking-[0.3em] uppercase font-mono">
                SOLANA BASED • ZERO FEES • INSTANT PAYMENT • P2P TRADES • 
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="group">
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="group-hover:text-accent transition-colors">DRIP</span>
                <span className="text-muted">CHAIN</span>
              </h1>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-12">
              <Link href="/shop" className="border-reveal text-sm tracking-widest uppercase">
                Shop
              </Link>
              <Link href="/sell" className="border-reveal text-sm tracking-widest uppercase">
                Sell
              </Link>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {publicKey && (
                <div className="hidden sm:flex items-center gap-3 mr-2">
                  <div className="w-8 h-8 rounded-full bg-accent text-background flex items-center justify-center font-bold">
                    {initials || 'U'}
                  </div>
                  {firstName && (
                    <span className="text-sm font-medium">Hi, {firstName} {lastInitial}</span>
                  )}
                </div>
              )}

              <WalletMultiButton className="!bg-black !text-white !border !border-white/20 hover:!bg-neutral-900 !rounded-full !px-4 !py-2 !h-auto" />

              {publicKey && (
                <button
                  onClick={() => router.push('/profile')}
                  aria-label="Profile"
                  title="Profile"
                  className="ml-2 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-accent rounded-full"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-transparent">
                    <Image src="/default-profile.svg" alt="Profile" width={40} height={40} />
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>


    </>
  );
}
