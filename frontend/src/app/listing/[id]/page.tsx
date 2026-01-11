'use client';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, Share2, Shield, Truck, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { createTransferTransaction, sendAndConfirmTransaction, getExplorerUrl } from '@/lib/solana';

// Dummy data - in real app this would come from API/backend
const listing = {
  id: '1',
  title: 'Vintage Nike Windbreaker',
  description: 'Authentic 90s Nike windbreaker in excellent vintage condition. Features classic colorblock design with embroidered swoosh logo. Minor signs of wear consistent with age. Perfect for layering.',
  price: 0.01, // Small amount for devnet testing
  images: [
    'https://picsum.photos/seed/nike1/800/1000',
    'https://picsum.photos/seed/nike2/800/1000',
    'https://picsum.photos/seed/nike3/800/1000',
  ],
  size: 'L',
  category: 'Outerwear',
  condition: 'Good',
  seller: {
    // Replace with a real devnet wallet address for testing
    address: 'Ei9QNRNo5hVmnrHCaXevpJCqrrTWyp1sFt15pxihqA3M', // Kent Wallet
    name: 'VintageFinds',
    rating: 4.8,
    sales: 47,
  }
};

export default function ListingPage() {
  const params = useParams();
  const { publicKey, connected, signTransaction } = useWallet();
  const [selectedImage, setSelectedImage] = useState(0);
  const [liked, setLiked] = useState(false);
  const [buying, setBuying] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const handleBuy = async () => {
    if (!connected || !publicKey || !signTransaction) {
      alert('Please connect your wallet first');
      return;
    }

    // Prevent buying your own listing
    if (publicKey.toString() === listing.seller.address) {
      alert("You can't buy your own listing!");
      return;
    }

    setBuying(true);
    setTxSignature(null);

    try {
      // Create the transfer transaction
      const sellerPubkey = new PublicKey(listing.seller.address);
      const transaction = await createTransferTransaction(
        publicKey,
        sellerPubkey,
        listing.price
      );

      // Request wallet to sign the transaction
      const signedTx = await signTransaction(transaction);

      // Send and confirm the transaction
      const signature = await sendAndConfirmTransaction(signedTx);
      
      setTxSignature(signature);
      alert(`Purchase successful! Transaction: ${signature.slice(0, 8)}...`);
      
      // TODO: Call backend to mark listing as sold
      // await fetch(`/api/listings/${listing.id}/sold`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ buyer: publicKey.toString(), tx_signature: signature }),
      // });

    } catch (error: any) {
      console.error('Purchase error:', error);
      if (error.message?.includes('User rejected')) {
        alert('Transaction cancelled');
      } else if (error.message?.includes('insufficient')) {
        alert('Insufficient SOL balance. Get devnet SOL from a faucet!');
      } else {
        alert(`Purchase failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setBuying(false);
    }
  };

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="max-w-[1800px] mx-auto px-6 py-8">
        {/* Back button */}
        <Link 
          href="/shop"
          className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          <span className="text-sm font-mono uppercase tracking-wider">Back to Shop</span>
        </Link>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {/* Main image */}
            <div className="aspect-[4/5] bg-card border border-border overflow-hidden mb-4">
              <img 
                src={listing.images[selectedImage]} 
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Thumbnails */}
            <div className="flex gap-4">
              {listing.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-24 border-2 overflow-hidden transition-colors ${
                    selectedImage === i ? 'border-foreground' : 'border-border'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            {/* Header */}
            <div>
              <p className="text-sm font-mono uppercase tracking-wider text-muted mb-2">
                {listing.category}
              </p>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                {listing.title}
              </h1>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-4">
              <span className="text-5xl font-bold">{listing.price}</span>
              <span className="text-2xl text-muted">SOL</span>
            </div>

            {/* Quick info */}
            <div className="flex gap-6 py-6 border-y border-border">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-muted">Size</p>
                <p className="text-lg font-bold">{listing.size}</p>
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-muted">Condition</p>
                <p className="text-lg font-bold">{listing.condition}</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-mono uppercase tracking-wider text-muted mb-3">Description</h3>
              <p className="text-foreground/80 leading-relaxed">{listing.description}</p>
            </div>

            {/* Seller */}
            <div className="p-4 bg-card border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-muted mb-1">Seller</p>
                  <p className="font-bold">@{listing.seller.name}</p>
                  <p className="text-sm text-muted mt-1">
                    ⭐ {listing.seller.rating} • {listing.seller.sales} sales
                  </p>
                </div>
                <Link 
                  href={`/profile/${listing.seller.address}`}
                  className="text-sm font-mono uppercase tracking-wider border-b border-foreground hover:border-accent hover:text-accent transition-colors"
                >
                  View Profile
                </Link>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              {txSignature ? (
                <div className="p-4 bg-green-500/10 border border-green-500/30">
                  <p className="text-green-400 font-bold mb-2">✓ Purchase Complete!</p>
                  <a
                    href={getExplorerUrl(txSignature)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono text-green-400 hover:text-green-300 flex items-center gap-2"
                  >
                    View Transaction <ExternalLink size={14} />
                  </a>
                </div>
              ) : (
                <button
                  onClick={handleBuy}
                  disabled={buying}
                  className="w-full py-5 bg-foreground text-background font-bold uppercase tracking-wider text-lg hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {buying ? 'Processing...' : connected ? `Buy Now • ${listing.price} SOL` : 'Connect Wallet to Buy'}
                </button>
              )}
              
              <div className="flex gap-4">
                <button
                  onClick={() => setLiked(!liked)}
                  className={`flex-1 py-4 border-2 font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
                    liked ? 'border-accent text-accent' : 'border-border hover:border-foreground'
                  }`}
                >
                  <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
                  Save
                </button>
                <button className="flex-1 py-4 border-2 border-border font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:border-foreground transition-colors">
                  <Share2 size={18} />
                  Share
                </button>
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-4 pt-6">
              <div className="flex items-center gap-3 text-muted">
                <Shield size={20} />
                <span className="text-sm">Buyer Protection</span>
              </div>
              <div className="flex items-center gap-3 text-muted">
                <Truck size={20} />
                <span className="text-sm">Ships in 2-3 days</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
