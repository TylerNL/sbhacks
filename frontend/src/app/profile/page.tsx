'use client';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import { Settings, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from "@supabase/supabase-js";
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY"
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface Listing {
  id: string;
  product_name: string;
  description: string | null;
  img_urls: string[];
  price: number;
  size: string | null;
  category: string | null;
  condition: string | null;
  sold: boolean;
  wallet_address: string;
  purchased_from: string | null;
  created_at: string;
}

export default function ProfilePage() {
  const { publicKey, connected } = useWallet();
  const [activeTab, setActiveTab] = useState<'listings' | 'purchases' | 'saved'>('listings');
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [userPurchases, setUserPurchases] = useState<Listing[]>([]);
  const [userSaves, setUserSaves] = useState<Listing[]>([]);
  const [isLoadingSaves, setIsLoadingSaves] = useState(true);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(true);
  
    // Fetch user's Saves from Supabase
  useEffect(() => {
    const fetchUserSaves = async () => {
      if (!publicKey) {
        setUserSaves([]);
        setIsLoadingSaves(false);
        return;
      }

      setIsLoadingSaves(true);
      try {
        // First, get the favorited listing IDs from Userbase
        const { data: userData, error: userError } = await supabase
          .from('Userbase')
          .select('saved')
          .eq('id', publicKey.toString())
          .single();

        if (userError) {
          console.error('Error fetching user favorites:', userError);
          setUserSaves([]);
          setIsLoadingSaves(false);
          return;
        }

        const savedIds = userData?.saved || [];
        
        if (savedIds.length === 0) {
          setUserSaves([]);
          setIsLoadingSaves(false);
          return;
        }

        // Then fetch the actual listings using those IDs
        const { data: listingsData, error: listingsError } = await supabase
          .from('Listings')
          .select('*')
          .in('id', savedIds);

        if (listingsError) {
          console.error('Error fetching saved listings:', listingsError);
          setUserSaves([]);
        } else {
          setUserSaves(listingsData || []);
        }
      } catch (error) {
        console.error('Error:', error);
        setUserSaves([]);
      } finally {
        setIsLoadingSaves(false);
      }
    };

    fetchUserSaves();
  }, [publicKey]);

  // Fetch user's listings from Supabase
  useEffect(() => {
    const fetchUserListings = async () => {
      if (!publicKey) {
        setUserListings([]);
        setIsLoadingListings(false);
        return;
      }

      setIsLoadingListings(true);
      try {
        const { data, error } = await supabase
          .from('Listings')
          .select('*')
          .eq('wallet_address', publicKey.toString())
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching listings:', error);
          setUserListings([]);
        } else {
          setUserListings(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
        setUserListings([]);
      } finally {
        setIsLoadingListings(false);
      }
    };

    fetchUserListings();
  }, [publicKey]);

  // Fetch user's purchases from Supabase
  useEffect(() => {
    const fetchUserPurchases = async () => {
      if (!publicKey) {
        setUserPurchases([]);
        setIsLoadingPurchases(false);
        return;
      }

      setIsLoadingPurchases(true);
      try {
        const { data, error } = await supabase
          .from('Listings')
          .select('*')
          .eq('purchased_from', publicKey.toString())
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching purchases:', error);
          setUserPurchases([]);
        } else {
          setUserPurchases(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
        setUserPurchases([]);
      } finally {
        setIsLoadingPurchases(false);
      }
    };

    fetchUserPurchases();
  }, [publicKey]);

  const truncatedAddress = publicKey 
    ? `${publicKey.toString().slice(0, 6)}...${publicKey.toString().slice(-4)}`
    : '';

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
    }
  };

  // Truncate description to a certain length
  const truncateDescription = (desc: string | null, maxLength: number = 80) => {
    if (!desc) return 'No description';
    return desc.length > maxLength ? `${desc.slice(0, maxLength)}...` : desc;
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
                <span><strong className="text-foreground">{userPurchases.length}</strong> purchases</span>
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
            { key: 'purchases', label: 'Purchases', count: userPurchases.length },
            { key: 'saved', label: 'Saved', count: userSaves.length },
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
            {isLoadingListings ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-muted" />
              </div>
            ) : userListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {userListings.map((listing, i) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={`/listing/${listing.id}`}>
                      <div className="group bg-card border border-border hover:border-foreground transition-colors overflow-hidden">
                        {/* Image */}
                        <div className="aspect-[5/5] overflow-hidden bg-background">
                          {listing.img_urls && listing.img_urls.length > 0 ? (
                            <img 
                              src={listing.img_urls[0]} 
                              alt={listing.product_name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted">
                              No Image
                            </div>
                          )}
                        </div>
                        
                        {/* Info */}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-lg leading-tight line-clamp-1">
                              {listing.product_name}
                            </h3>
                            {listing.sold && (
                              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 uppercase font-mono">
                                Sold
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted mb-3 line-clamp-2">
                            {truncateDescription(listing.description)}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-lg">{listing.price} SOL</span>
                            <div className="flex gap-2 text-xs text-muted">
                              {listing.size && <span>{listing.size}</span>}
                              {listing.category && <span>• {listing.category}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24">
                <p className="text-muted mb-4">You haven&apos;t listed anything yet</p>
                <Link href="/sell" className="text-accent font-bold uppercase tracking-wider">
                  List your first item →
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'purchases' && (
          <div>
            {isLoadingPurchases ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-muted" />
              </div>
            ) : userPurchases.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {userPurchases.map((listing, i) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={`/listing/${listing.id}`}>
                      <div className="group bg-card border border-border hover:border-foreground transition-colors overflow-hidden">
                        {/* Image */}
                        <div className="aspect-[5/5] overflow-hidden bg-background">
                          {listing.img_urls && listing.img_urls.length > 0 ? (
                            <img 
                              src={listing.img_urls[0]} 
                              alt={listing.product_name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted">
                              No Image
                            </div>
                          )}
                        </div>
                        
                        {/* Info */}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-lg leading-tight line-clamp-1">
                              {listing.product_name}
                            </h3>
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 uppercase font-mono">
                              Purchased
                            </span>
                          </div>
                          
                          <p className="text-sm text-muted mb-3 line-clamp-2">
                            {truncateDescription(listing.description)}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-lg">{listing.price} SOL</span>
                            <div className="flex gap-2 text-xs text-muted">
                              {listing.size && <span>{listing.size}</span>}
                              {listing.category && <span>• {listing.category}</span>}
                            </div>
                          </div>
                          
                          <p className="text-xs text-muted mt-2">
                            From: {listing.wallet_address.slice(0, 4)}...{listing.wallet_address.slice(-4)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24">
                <p className="text-muted mb-4">No purchases yet</p>
                <Link href="/shop" className="text-accent font-bold uppercase tracking-wider">
                  Browse the shop →
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div>
            {isLoadingSaves ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-muted" />
              </div>
            ) : userSaves.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {userSaves.map((listing, i) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={`/listing/${listing.id}`}>
                      <div className="group bg-card border border-border hover:border-foreground transition-colors overflow-hidden">
                        {/* Image */}
                        <div className="aspect-[5/5] overflow-hidden bg-background">
                          {listing.img_urls && listing.img_urls.length > 0 ? (
                            <img 
                              src={listing.img_urls[0]} 
                              alt={listing.product_name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted">
                              No Image
                            </div>
                          )}
                        </div>
                        
                        {/* Info */}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-lg leading-tight line-clamp-1">
                              {listing.product_name}
                            </h3>
                            {listing.sold && (
                              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 uppercase font-mono">
                                Sold
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted mb-3 line-clamp-2">
                            {truncateDescription(listing.description)}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-lg">{listing.price} SOL</span>
                            <div className="flex gap-2 text-xs text-muted">
                              {listing.size && <span>{listing.size}</span>}
                              {listing.category && <span>• {listing.category}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24">
                <p className="text-muted mb-4">No saved items yet</p>
                <Link href="/shop" className="text-accent font-bold uppercase tracking-wider">
                  Browse the shop →
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
