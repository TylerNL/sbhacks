'use client';

import Link from 'next/link';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
  const { publicKey } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Top ticker */}
      <div className="bg-foreground text-background overflow-hidden py-2">
        <div className="animate-marquee whitespace-nowrap flex">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="mx-8 text-xs tracking-[0.3em] uppercase font-mono">
              SOLANA FASHION • ZERO FEES • INSTANT PAYMENT • P2P TRADES • 
            </span>
          ))}
        </div>
      </div>

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
                <Link 
                  href="/profile" 
                  className="hidden md:block text-xs font-mono bg-card border border-border px-4 py-2 hover:border-foreground transition-colors"
                >
                  {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
                </Link>
              )}
              <WalletMultiButton />
              
              {/* Mobile menu */}
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2"
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-[105px] bg-background z-40 md:hidden"
          >
            <div className="flex flex-col items-center justify-center h-full gap-12">
              <Link 
                href="/shop" 
                onClick={() => setMenuOpen(false)}
                className="text-4xl font-bold hover:text-accent transition-colors"
              >
                SHOP
              </Link>
              <Link 
                href="/sell" 
                onClick={() => setMenuOpen(false)}
                className="text-4xl font-bold hover:text-accent transition-colors"
              >
                SELL
              </Link>
              <Link 
                href="/drops" 
                onClick={() => setMenuOpen(false)}
                className="text-4xl font-bold hover:text-accent transition-colors"
              >
                DROPS
              </Link>
              
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
