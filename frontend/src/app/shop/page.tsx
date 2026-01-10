'use client';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ListingCard } from '@/components/ListingCard';
import { CategoryNav } from '@/components/CategoryNav';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

const allListings = [
  { id: '1', title: 'Vintage Nike Windbreaker', price: 0.5, image: 'https://picsum.photos/seed/nike1/400/500', size: 'L', seller: 'DemoWallet123abc456', category: 'Outerwear' },
  { id: '2', title: 'Carhartt WIP Beanie', price: 0.15, image: 'https://picsum.photos/seed/carhartt/400/500', size: 'OS', seller: 'DemoWallet789xyz', category: 'Accessories' },
  { id: '3', title: 'Levis 501 Vintage Wash', price: 0.8, image: 'https://picsum.photos/seed/levis501/400/500', size: '32', seller: 'SellerABC123', category: 'Bottoms' },
  { id: '4', title: 'Stüssy Logo Tee', price: 0.25, image: 'https://picsum.photos/seed/stussy/400/500', size: 'M', seller: 'StussyFan99', category: 'Tops' },
  { id: '5', title: 'New Balance 550', price: 1.2, image: 'https://picsum.photos/seed/nb550/400/500', size: '10', seller: 'SneakerHead42', category: 'Shoes' },
  { id: '6', title: 'Chrome Hearts Ring', price: 2.5, image: 'https://picsum.photos/seed/chrome/400/500', size: '9', seller: 'LuxuryVintage', category: 'Accessories' },
  { id: '7', title: 'Kapital Bandana Jacket', price: 3.2, image: 'https://picsum.photos/seed/kapital/400/500', size: 'XL', seller: 'JapanArchive', category: 'Outerwear' },
  { id: '8', title: 'Maison Margiela Tabi', price: 4.0, image: 'https://picsum.photos/seed/margiela/400/500', size: '42', seller: 'DesignerGrails', category: 'Shoes' },
  { id: '9', title: 'Supreme Box Logo Hoodie', price: 2.8, image: 'https://picsum.photos/seed/supreme/400/500', size: 'L', seller: 'HypeCollector', category: 'Tops' },
  { id: '10', title: 'Acne Studios Scarf', price: 0.6, image: 'https://picsum.photos/seed/acne/400/500', size: 'OS', seller: 'ScandinavianStyle', category: 'Accessories' },
  { id: '11', title: 'Vintage Levi Trucker', price: 0.9, image: 'https://picsum.photos/seed/trucker/400/500', size: 'M', seller: 'VintageFinds', category: 'Outerwear' },
  { id: '12', title: 'Nike Dunk Low', price: 1.5, image: 'https://picsum.photos/seed/dunk/400/500', size: '9.5', seller: 'DunkMaster', category: 'Shoes' },
];

export default function ShopPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="max-w-[1800px] mx-auto px-6 py-12">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">SHOP</h1>
          <p className="text-muted mt-4 text-lg">
            {allListings.length} items available
          </p>
        </motion.div>

        {/* Search and filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-card border border-border focus:border-foreground outline-none transition-colors font-mono"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 px-6 py-4 border border-border hover:border-foreground transition-colors"
          >
            <SlidersHorizontal size={20} />
            <span className="font-mono text-sm uppercase tracking-wider">Filters</span>
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8 p-6 bg-card border border-border"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted mb-2 block">Size</label>
                <select className="w-full p-3 bg-background border border-border">
                  <option>All Sizes</option>
                  <option>XS</option>
                  <option>S</option>
                  <option>M</option>
                  <option>L</option>
                  <option>XL</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted mb-2 block">Price</label>
                <select className="w-full p-3 bg-background border border-border">
                  <option>Any Price</option>
                  <option>Under 0.5 SOL</option>
                  <option>0.5 - 1 SOL</option>
                  <option>1 - 2 SOL</option>
                  <option>Over 2 SOL</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted mb-2 block">Condition</label>
                <select className="w-full p-3 bg-background border border-border">
                  <option>Any Condition</option>
                  <option>New with tags</option>
                  <option>Like new</option>
                  <option>Good</option>
                  <option>Fair</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted mb-2 block">Sort By</label>
                <select className="w-full p-3 bg-background border border-border">
                  <option>Newest</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Categories */}
        <CategoryNav />

        {/* Listings grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-8">
          {allListings.map((listing, i) => (
            <ListingCard key={listing.id} listing={listing} index={i} />
          ))}
        </div>

        {/* Load more */}
        <div className="flex justify-center mt-16">
          <button className="px-12 py-4 border-2 border-foreground font-bold uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors">
            Load More
          </button>
        </div>
      </section>

      <Footer />
    </main>
  );
}
