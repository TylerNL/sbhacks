'use client';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ListingCard } from '@/components/ListingCard';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Copy, ExternalLink, X, Save, User, MapPin, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
  
  // UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'personal' | 'shipping'>('personal');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: ''
  });

  const truncatedAddress = publicKey 
    ? `${publicKey.toString().slice(0, 6)}...${publicKey.toString().slice(-4)}`
    : '';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- 1. FETCH DATA ---
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
          // Fallback logic: If first_name is missing but 'Full Name' exists (legacy data), try to split it
          let legacyFirst = '';
          let legacyLast = '';

          setFormData({
            firstName: data.first_name || legacyFirst || '', // Maps to 'first_name' column
            lastName: data.last_name || legacyLast || '',    // Maps to 'last_name' column
            email: data.email || '',
            address: data.address || '',
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

    if (connected && publicKey) {
      loadProfile();
    }
  }, [publicKey, connected]);

  // --- 2. SAVE DATA ---
  const handleSaveSettings = async () => {
    if (!publicKey) return;
    setIsSaving(true);

    // Combine for legacy support or display purposes if needed
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();

    try {
      const { error } = await supabase
        .from('Userbase')
        .upsert(
          {
            id: publicKey.toString(),
            
            // SAVE TO NEW COLUMNS
            first_name: formData.firstName,
            last_name: formData.lastName,

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

  // --- 3. HELPER: Avatar Initials ---
  const getAvatarInitials = () => {
    if (formData.firstName && formData.firstName.trim().length > 0) {
      return formData.firstName.charAt(0).toUpperCase();
    }
    return truncatedAddress.slice(0, 2).toUpperCase();
  };

  // Helper to display full name
  const getDisplayName = () => {
    const full = `${formData.firstName} ${formData.lastName}`.trim();
    return full.length > 0 ? full : truncatedAddress;
  };

  const copyAddress = () => {
    if (publicKey) navigator.clipboard.writeText(publicKey.toString());
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
            {/* Avatar */}
            <div className="w-24 h-24 bg-accent flex items-center justify-center text-4xl font-bold text-foreground">
              {getAvatarInitials()}
            </div>
            
            <div>
              <div className="flex items-center gap-3 mb-2">
                {/* NAME OR ADDRESS DISPLAY */}
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
                <span><strong className="text-foreground">{purchaseHistory.length}</strong> purchases</span>
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
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
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
                <a href="/sell" className="text-accent font-bold uppercase tracking-wider">List your first item →</a>
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
                        
                        {/* UPDATED: Split Input Fields */}
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