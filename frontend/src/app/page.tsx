'use client';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ListingCard } from '@/components/ListingCard';
import { CategoryNav } from '@/components/CategoryNav';
import { StatsBar } from '@/components/StatsBar';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

// Dummy listings data
const dummyListings = [
  {
    id: '1',
    title: 'Vintage Nike Windbreaker',
    price: 0.5,
    image: 'https://picsum.photos/seed/nike1/400/500',
    size: 'L',
    seller: 'DemoWallet123abc456',
    category: 'Outerwear'
  },
  {
    id: '2',
    title: 'Carhartt WIP Beanie',
    price: 0.15,
    image: 'https://picsum.photos/seed/carhartt/400/500',
    size: 'OS',
    seller: 'DemoWallet789xyz',
    category: 'Accessories'
  },
  {
    id: '3',
    title: 'Levis 501 Vintage Wash',
    price: 0.8,
    image: 'https://picsum.photos/seed/levis501/400/500',
    size: '32',
    seller: 'SellerABC123',
    category: 'Bottoms'
  },
  {
    id: '4',
    title: 'Stüssy Logo Tee',
    price: 0.25,
    image: 'https://picsum.photos/seed/stussy/400/500',
    size: 'M',
    seller: 'StussyFan99',
    category: 'Tops'
  },
  {
    id: '5',
    title: 'New Balance 550',
    price: 1.2,
    image: 'https://picsum.photos/seed/nb550/400/500',
    size: '10',
    seller: 'SneakerHead42',
    category: 'Shoes'
  },
  {
    id: '6',
    title: 'Chrome Hearts Ring',
    price: 2.5,
    image: 'https://picsum.photos/seed/chrome/400/500',
    size: '9',
    seller: 'LuxuryVintage',
    category: 'Accessories'
  },
  {
    id: '7',
    title: 'Kapital Bandana Jacket',
    price: 3.2,
    image: 'https://picsum.photos/seed/kapital/400/500',
    size: 'XL',
    seller: 'JapanArchive',
    category: 'Outerwear'
  },
  {
    id: '8',
    title: 'Maison Margiela Tabi',
    price: 4.0,
    image: 'https://picsum.photos/seed/margiela/400/500',
    size: '42',
    seller: 'DesignerGrails',
    category: 'Shoes'
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      
      {/* Hero Section - Editorial style */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        {/* Asymmetric layout */}
        <div className="max-w-[1800px] mx-auto px-6 py-24 w-full">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* Left content */}
            <div className="lg:col-span-5 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <p className="text-accent font-mono text-sm tracking-[0.3em] uppercase mb-4 flex items-center gap-2">
                  <Sparkles size={14} />
                  Now Live on Devnet
                </p>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.9] tracking-tight">
                  TRADE<br />
                  <span className="text-muted">FASHION</span><br />
                  ON-CHAIN
                </h1>
              </motion.div>

              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-muted text-lg max-w-md"
              >
                The peer-to-peer marketplace for streetwear, vintage, and designer fashion. 
                Pay with SOL. No middleman. No crazy fees.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link 
                  href="/shop"
                  className="group inline-flex items-center justify-center gap-3 bg-foreground text-background px-8 py-4 font-bold uppercase tracking-wider hover:gap-5 transition-all"
                >
                  Start Shopping
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href="/sell"
                  className="inline-flex items-center justify-center gap-3 border-2 border-foreground px-8 py-4 font-bold uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors"
                >
                  List an Item
                </Link>
              </motion.div>
            </div>

            {/* Right - floating cards */}
            <div className="lg:col-span-7 relative h-[500px] hidden lg:block">
              <motion.div
                initial={{ opacity: 0, rotate: 12, x: 100 }}
                animate={{ opacity: 1, rotate: 6, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="absolute top-0 right-0 w-[280px] h-[380px] bg-card border border-border shadow-2xl overflow-hidden stack-card"
              >
                <img 
                  src="https://picsum.photos/seed/hero1/400/500" 
                  alt="Featured item"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-foreground to-transparent">
                  <p className="text-background font-bold">0.8 SOL</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, rotate: -8, x: -100 }}
                animate={{ opacity: 1, rotate: -3, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="absolute top-20 right-60 w-[240px] h-[320px] bg-card border border-border shadow-2xl overflow-hidden stack-card"
              >
                <img 
                  src="https://picsum.photos/seed/hero2/400/500" 
                  alt="Featured item"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-foreground to-transparent">
                  <p className="text-background font-bold">1.2 SOL</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="absolute bottom-0 right-32 w-[200px] h-[260px] bg-card border border-border shadow-2xl overflow-hidden stack-card"
              >
                <img 
                  src="https://picsum.photos/seed/hero3/400/500" 
                  alt="Featured item"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-foreground to-transparent">
                  <p className="text-background font-bold">0.5 SOL</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Background accent */}
        <div className="absolute top-1/2 right-0 w-1/3 h-[600px] bg-accent/5 -skew-x-12 -z-10" />
      </section>

      {/* Stats */}
      <StatsBar />

      {/* Listings Grid */}
      <section className="max-w-[1800px] mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold">Fresh Listings</h2>
            <p className="text-muted mt-2">Just dropped. Grab them before they&apos;re gone.</p>
          </div>
          <Link 
            href="/shop"
            className="text-sm font-mono uppercase tracking-wider border-b-2 border-foreground pb-1 hover:border-accent hover:text-accent transition-colors"
          >
            View All →
          </Link>
        </div>

        <CategoryNav />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-8">
          {dummyListings.map((listing, i) => (
            <ListingCard key={listing.id} listing={listing} index={i} />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-accent text-foreground">
        <div className="max-w-[1800px] mx-auto px-6 py-24">
          <div className="max-w-3xl">
            <h2 className="text-4xl md:text-6xl font-bold leading-tight">
              Ready to sell your closet?
            </h2>
            <p className="text-foreground/70 text-xl mt-6 mb-8">
              List your items in seconds. Get paid in SOL instantly when they sell. 
              No fees, no waiting, no BS.
            </p>
            <Link 
              href="/sell"
              className="inline-flex items-center gap-3 bg-foreground text-background px-8 py-4 font-bold uppercase tracking-wider hover:gap-5 transition-all"
            >
              Start Selling
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
