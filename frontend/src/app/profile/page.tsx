'use client';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ListingCard } from '@/components/ListingCard';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import { Settings, Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';

const userListings = [
  { id: '1', title: 'Vintage Nike Windbreaker', price: 0.5, image: 'https://picsum.photos/seed/user1/400/500', size: 'L', seller: 'You', category: 'Outerwear' },
  { id: '2', title: 'Carhartt WIP Beanie', price: 0.15, image: 'https://picsum.photos/seed/user2/400/500', size: 'OS', seller: 'You', category: 'Accessories' },
];

const purchaseHistory = [
  { id: '3', title: 'Stüssy Logo Tee', price: 0.25, image: 'https://picsum.photos/seed/bought1/400/500', size: 'M', seller: 'VintageFinds', category: 'Tops', status: 'Delivered' },
];

export default function ProfilePage() {
  const { publicKey, connected } = useWallet();
  const [activeTab, setActiveTab] = useState<'listings' | 'purchases' | 'saved'>('listings');

  const truncatedAddress = publicKey 
    ? `${publicKey.toString().slice(0, 6)}...${publicKey.toString().slice(-4)}`
    : '';

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
    }
  };

  if (!connected) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="max-w-[1800px] mx-auto px-6 py-24 text-center">
          <h1 className="text-4xl font-bold mb-4">Connect Wallet</h1>
          <p className="text-muted">Please connect your wallet to view your profile</p>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="max-w-[1800px] mx-auto px-6 py-12">
        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12 pb-12 border-b border-border"
        >
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-accent flex items-center justify-center text-4xl font-bold text-foreground">
              {truncatedAddress.slice(0, 2).toUpperCase()}
            </div>
            
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{truncatedAddress}</h1>
                <button 
                  onClick={copyAddress}
                  className="p-2 hover:bg-card transition-colors"
                  title="Copy address"
                >
                  <Copy size={16} />
                </button>
                <a 
                  href={`https://explorer.solana.com/address/${publicKey?.toString()}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-card transition-colors"
                  title="View on Explorer"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
              <div className="flex gap-6 text-sm text-muted">
                <span><strong className="text-foreground">{userListings.length}</strong> listings</span>
                <span><strong className="text-foreground">{purchaseHistory.length}</strong> purchases</span>
                <span><strong className="text-foreground">4.9</strong> ⭐ rating</span>
              </div>
            </div>
          </div>

          <button className="flex items-center gap-2 px-6 py-3 border border-border hover:border-foreground transition-colors">
            <Settings size={18} />
            <span className="font-mono text-sm uppercase tracking-wider">Settings</span>
          </button>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-8 mb-8 border-b border-border">
          {[
            { key: 'listings', label: 'My Listings', count: userListings.length },
            { key: 'purchases', label: 'Purchases', count: purchaseHistory.length },
            { key: 'saved', label: 'Saved', count: 0 },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`pb-4 font-mono text-sm uppercase tracking-wider transition-colors relative ${
                activeTab === tab.key ? 'text-foreground' : 'text-muted hover:text-foreground'
              }`}
            >
              {tab.label} ({tab.count})
              {activeTab === tab.key && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'listings' && (
          <div>
            {userListings.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {userListings.map((listing, i) => (
                  <ListingCard key={listing.id} listing={listing} index={i} />
                ))}
              </div>
            ) : (
              <div className="text-center py-24">
                <p className="text-muted mb-4">You haven&apos;t listed anything yet</p>
                <a href="/sell" className="text-accent font-bold uppercase tracking-wider">
                  List your first item →
                </a>
              </div>
            )}
          </div>
        )}

        {activeTab === 'purchases' && (
          <div>
            {purchaseHistory.length > 0 ? (
              <div className="space-y-4">
                {purchaseHistory.map((item) => (
                  <div key={item.id} className="flex items-center gap-6 p-4 bg-card border border-border">
                    <img src={item.image} alt={item.title} className="w-20 h-24 object-cover" />
                    <div className="flex-1">
                      <h3 className="font-bold">{item.title}</h3>
                      <p className="text-sm text-muted">From @{item.seller}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{item.price} SOL</p>
                      <p className="text-sm text-green-500">{item.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24">
                <p className="text-muted">No purchases yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="text-center py-24">
            <p className="text-muted">No saved items yet</p>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
