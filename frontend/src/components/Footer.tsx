'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#0B0B0F] text-white border-t border-white/5">
      {/* Main footer */}
      <div className="max-w-[1800px] mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h2 className="text-3xl font-bold mb-4">
              DRIP<span className="text-accent">CHAIN</span>
            </h2>
            <p className="text-white/50 text-sm">
              The decentralized fashion marketplace. 
              Buy, sell, trade with crypto.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-mono text-xs tracking-widest text-white/40 mb-6">MARKETPLACE</h3>
            <ul className="space-y-3">
              {['Shop All', 'Trending'].map((item) => (
                <li key={item}>
                  <Link href={item === 'Shop All' ? '/shop' : '#'} className="text-sm text-white/80 hover:text-accent transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-xs tracking-widest text-white/40 mb-6">SELL</h3>
            <ul className="space-y-3">
              {['List an Item', 'Seller Guide','Verification'].map((item) => (
                <li key={item}>
                  <Link href={item === 'List an Item' ? '/sell' : '#'} className="text-sm text-white/80 hover:text-accent transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-xs tracking-widest text-white/40 mb-6">CONNECT</h3>
            <ul className="space-y-3">
              {[
                { name: 'Twitter', url: 'https://x.com' },
                { name: 'Discord', url: 'https://discord.com/' },
                { name: 'Instagram', url: 'https://www.instagram.com' },
              ].map((item) => (
                <li key={item.name}>
                  <a 
                    href={item.url} 
                    className="text-sm text-white/80 hover:text-accent transition-colors inline-flex items-center gap-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.name}
                    <ArrowUpRight size={12} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-[1800px] mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/50 font-mono">
            © 2026 DRIPCHAIN. BUILT ON SOLANA.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-xs text-white/50 hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="#" className="text-xs text-white/50 hover:text-white transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
