'use client';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Copy, ExternalLink, X, Save, User, MapPin, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
// Use the centralized client we created earlier
import { supabase } from '@/lib/supabase';

// Interface for your teammate's Listing data
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
  
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState<'listings' | 'purchases' | 'saved'>('listings');
  
  // Teammate's Data State (Real Data)
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [userPurchases, setUserPurchases] = useState<Listing[]>([]);
  const [userSaves, setUserSaves] = useState<Listing[]>([]);
  
  // Loading States
  const [isLoadingSaves, setIsLoadingSaves] = useState(false); // Default false until we try to fetch
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Settings Drawer State (These were missing in your snippet!)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'personal' | 'shipping'>('personal');
  const [isSaving, setIsSaving] = useState(false);

  // Form Data (Split Name)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  });

  // --- 1. FETCH LISTINGS (Teammate's Feature) ---
  useEffect(() => {
    const fetchUserListings = async () => {
      if (!publicKey) return;
      setIsLoadingListings(true);
      try {
        const { data, error } = await supabase
          .from('Listings')
          .select('*')
          .eq('wallet_address', publicKey.toString())
          .order('created_at', { ascending: false });

        if (error) throw error;
        setUserListings(data || []);
      } catch (error) {
        console.error('Error fetching listings:', error);
      } finally {
        setIsLoadingListings(false);
      }
    };

    if (connected) fetchUserListings();
  }, [publicKey, connected]);

  // --- 2. FETCH PURCHASES (Teammate's Feature) ---
  useEffect(() => {
    const fetchUserPurchases = async () => {
      if (!publicKey) return;
      setIsLoadingPurchases(true);
      try {
        const { data, error } = await supabase
          .from('Listings')
          .select('*')
          .eq('purchased_from', publicKey.toString())
          .order('created_at', { ascending: false });

        if (error) throw error;
        setUserPurchases(data || []);
      } catch (error) {
        console.error('Error fetching purchases:', error);
      } finally {
        setIsLoadingPurchases(false);
      }
    };

    if (connected) fetchUserPurchases();
  }, [publicKey, connected]);

  // --- 3. FETCH SAVED ITEMS (Teammate's Feature) ---
  useEffect(() => {
    const fetchUserSaves = async () => {
      if (!publicKey) return;
      setIsLoadingSaves(true);
      try {
        // 1. Get the array of saved IDs from Userbase
        const { data: userData, error: userError } = await supabase
          .from('Userbase')
          .select('saved')
          .eq('id', publicKey.toString())
          .single();

        if (userError) throw userError;

        const savedIds = userData?.saved || [];
        
        if (savedIds.length === 0) {
          setUserSaves([]);
          return;
        }

        // 2. Fetch the actual listing details
        const { data: listingsData, error: listingsError } = await supabase
          .from('Listings')
          .select('*')
          .in('id', savedIds);

        if (listingsError) throw listingsError;
        setUserSaves(listingsData || []);
        
      } catch (error) {
        console.error('Error fetching saves:', error);
      } finally {
        setIsLoadingSaves(false);
      }
    };

    if (connected) fetchUserSaves();
  }, [publicKey, connected]);

  // --- 4. FETCH PROFILE SETTINGS (Our Feature) ---
  useEffect(() => {
    async function loadProfile() {
      if (!publicKey) return;
      setIsLoadingProfile(true);

      try {
        const { data, error } = await supabase
          .from('Userbase') 
          .select('*')
          .eq('id', publicKey.toString())
          .single();

        if (data) {
          // Logic to handle legacy "Full Name" or new "first_name/last_name"
          let legacyFirst = '';
          let legacyLast = '';
          
          if (!data.first_name && data['Full Name']) {
             const parts = data['Full Name'].split(' ');
             legacyFirst = parts[0] || '';
             legacyLast = parts.slice(1).join(' ') || '';
          }

          setFormData({
            firstName: data.first_name || legacyFirst || '',
            lastName: data.last_name || legacyLast || '',
            email: data.email || '',
            address: data.address || '', // using lowercase 'address' column
            city: data.city || '',
            state: data.state || '',
            zip: data.zip || '',
            country: data.country || ''
          });
        }
      } catch (error) {
        console.log('Profile fetch log:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    }

    if (connected) loadProfile();
  }, [publicKey, connected]);

  // --- HANDLERS ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = async () => {
    if (!publicKey) return;
    setIsSaving(true);

    const fullName = `${formData.firstName} ${formData.lastName}`.trim();

    try {
      const { error } = await supabase
        .from('Userbase')
        .upsert(
          {
            id: publicKey.toString(),
            username: formData.firstName || 'User',
            
            // New Columns
            first_name: formData.firstName,
            last_name: formData.lastName,
            'Full Name': fullName, // Keep for backward compatibility

            address: formData.address,
            email: formData.email,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
            country: formData.country
          },
          { onConflict: 'id' }
        );

      if (error) throw error;
      setIsSettingsOpen(false);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      alert(`Failed to save: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // --- HELPERS ---
  const truncatedAddress = publicKey 
    ? `${publicKey.toString().slice(0, 6)}...${publicKey.toString().slice(-4)}`
    : '';

  const getAvatarInitials = () => {
    if (formData.firstName && formData.firstName.trim().length > 0) {
      return formData.firstName.charAt(0).toUpperCase();
    }
    return truncatedAddress.slice(0, 2).toUpperCase();
  };

  const getDisplayName = () => {
    const full = `${formData.firstName} ${formData.lastName}`.trim();
    return full.length > 0 ? full : truncatedAddress;
  };

  const copyAddress = () => {
    if (publicKey) navigator.clipboard.writeText(publicKey.toString());
  };

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
    <main className="min-h-screen relative overflow-x-hidden">
      <Navbar />

      <section className="max-w-[1800px] mx-auto px-6 py-12">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12 pb-12 border-b border-border"
        >
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-accent flex items-center justify-center text-4xl font-bold text-foreground">
              {getAvatarInitials()}
            </div>
            
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">
                  {getDisplayName()}
                </h1>
                <button onClick={copyAddress} className="p-2 hover:bg-card transition-colors">
                  <Copy size={16} />
                </button>
                <a href={`https://explorer.solana.com/address/${publicKey?.toString()}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-card transition-colors">
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

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-6 py-3 border border-border hover:border-foreground transition-colors"
          >
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
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
              )}
            </button>
          ))}
        </div>

        {/* --- DYNAMIC CONTENT (Teammate's Logic) --- */}
        
        {/* LISTINGS TAB */}
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
                        <div className="aspect-[5/5] overflow-hidden bg-background">
                          {listing.img_urls && listing.img_urls.length > 0 ? (
                            <img src={listing.img_urls[0]} alt={listing.product_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted">No Image</div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-lg leading-tight line-clamp-1">{listing.product_name}</h3>
                            {listing.sold && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 uppercase font-mono">Sold</span>}
                          </div>
                          <p className="text-sm text-muted mb-3 line-clamp-2">{truncateDescription(listing.description)}</p>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-lg">{listing.price} SOL</span>
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
                <Link href="/sell" className="text-accent font-bold uppercase tracking-wider">List your first item →</Link>
              </div>
            )}
          </div>
        )}

        {/* PURCHASES TAB */}
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
                        <div className="aspect-[5/5] overflow-hidden bg-background">
                          {listing.img_urls && listing.img_urls.length > 0 ? (
                            <img src={listing.img_urls[0]} alt={listing.product_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted">No Image</div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-lg leading-tight line-clamp-1">{listing.product_name}</h3>
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 uppercase font-mono">Purchased</span>
                          </div>
                          <span className="font-bold text-lg">{listing.price} SOL</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24">
                <p className="text-muted mb-4">No purchases yet</p>
                <Link href="/shop" className="text-accent font-bold uppercase tracking-wider">Browse the shop →</Link>
              </div>
            )}
          </div>
        )}

        {/* SAVED TAB */}
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
                        <div className="aspect-[5/5] overflow-hidden bg-background">
                          {listing.img_urls && listing.img_urls.length > 0 ? (
                            <img src={listing.img_urls[0]} alt={listing.product_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted">No Image</div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-lg leading-tight line-clamp-1 mb-2">{listing.product_name}</h3>
                          <span className="font-bold text-lg">{listing.price} SOL</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24">
                <p className="text-muted mb-4">No saved items yet</p>
                <Link href="/shop" className="text-accent font-bold uppercase tracking-wider">Browse the shop →</Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* --- SETTINGS DRAWER --- */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-background border-l border-border z-50 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Settings</h2>
                  <p className="text-sm text-muted">
                    {isLoadingProfile ? 'Loading...' : 'Manage your profile details'}
                  </p>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-card transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-border px-6">
                {[
                  { key: 'personal', label: 'Personal Info', icon: User },
                  { key: 'shipping', label: 'Shipping', icon: MapPin },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSettingsTab(tab.key as typeof settingsTab)}
                    className={`pb-4 pt-4 mr-6 font-mono text-sm uppercase tracking-wider transition-colors relative flex items-center gap-2 ${
                      settingsTab === tab.key ? 'text-foreground' : 'text-muted hover:text-foreground'
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                    {settingsTab === tab.key && (
                      <motion.div layoutId="settingsTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                    )}
                  </button>
                ))}
              </div>

              {/* Drawer Form */}
              <div className="flex-1 overflow-y-auto p-6">
                {isLoadingProfile ? (
                  <div className="flex items-center justify-center h-48 text-muted">
                    <Loader2 className="animate-spin mr-2" /> Loading...
                  </div>
                ) : (
                  <>
                    {settingsTab === 'personal' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="font-mono text-xs uppercase tracking-wider text-muted">First Name</label>
                            <input
                              type="text"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              placeholder="Alex"
                              className="w-full bg-card border border-border p-4 focus:outline-none focus:border-accent transition-colors"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="font-mono text-xs uppercase tracking-wider text-muted">Last Name</label>
                            <input
                              type="text"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              placeholder="Rivera"
                              className="w-full bg-card border border-border p-4 focus:outline-none focus:border-accent transition-colors"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="font-mono text-xs uppercase tracking-wider text-muted">Email</label>
                          <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="e.g. alex@example.com" className="w-full bg-card border border-border p-4 focus:outline-none focus:border-accent transition-colors" />
                        </div>
                        <div className="space-y-2">
                          <label className="font-mono text-xs uppercase tracking-wider text-muted">Wallet</label>
                          <div className="w-full bg-secondary/20 border border-border p-4 text-muted font-mono text-sm truncate">{publicKey?.toString()}</div>
                        </div>
                      </motion.div>
                    )}

                    {settingsTab === 'shipping' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="space-y-2">
                          <label className="font-mono text-xs uppercase tracking-wider text-muted">Street Address</label>
                          <input type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder="e.g. 123 Market St" className="w-full bg-card border border-border p-4 focus:outline-none focus:border-accent transition-colors" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="font-mono text-xs uppercase tracking-wider text-muted">City</label>
                            <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full bg-card border border-border p-4 focus:outline-none focus:border-accent transition-colors" />
                          </div>
                          <div className="space-y-2">
                            <label className="font-mono text-xs uppercase tracking-wider text-muted">State</label>
                            <input type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full bg-card border border-border p-4 focus:outline-none focus:border-accent transition-colors" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="font-mono text-xs uppercase tracking-wider text-muted">Zip Code</label>
                            <input type="text" name="zip" value={formData.zip} onChange={handleInputChange} className="w-full bg-card border border-border p-4 focus:outline-none focus:border-accent transition-colors" />
                          </div>
                           <div className="space-y-2">
                            <label className="font-mono text-xs uppercase tracking-wider text-muted">Country</label>
                            <input type="text" name="country" value={formData.country} onChange={handleInputChange} className="w-full bg-card border border-border p-4 focus:outline-none focus:border-accent transition-colors" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-border bg-background">
                <button onClick={handleSaveSettings} disabled={isSaving || isLoadingProfile} className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-foreground text-background font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  <span className="font-mono text-sm uppercase tracking-wider">{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}