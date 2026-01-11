'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useState } from 'react';

interface Listing {
  id: string;
  title: string;
  price: number;
  image: string;
  size: string;
  seller: string;
  category: string;
}

export function ListingCard({ listing, index = 0 }: { listing: Listing; index?: number }) {
  const [liked, setLiked] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      <Link href={`/listing/${listing.id}`}>
        <div className="relative aspect-[3/4] overflow-hidden bg-card border border-border stack-card">
          {/* Image */}
          <img 
            src={listing.image} 
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors" />
          
          {/* Size badge */}
          <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-3 py-1">
            <span className="text-xs font-mono tracking-wider">{listing.size}</span>
          </div>

          {/* Like button */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              setLiked(!liked);
            }}
            className="absolute top-3 right-3 p-2 bg-background/90 backdrop-blur-sm hover:bg-accent hover:text-background transition-colors"
          >
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} className={liked ? 'text-accent' : ''} />
          </button>

          {/* Quick info on hover */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-foreground/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform">
            <p className="text-background text-xs font-mono truncate">
              @{listing.seller.slice(0, 8)}...
            </p>
          </div>
        </div>
      </Link>

      {/* Info below card */}
      <div className="mt-3 space-y-1">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-sm font-medium truncate flex-1">{listing.title}</h3>
          <span className="text-sm font-bold whitespace-nowrap">{listing.price} SOL / {(listing.price*135.87).toFixed(2)} USD </span>
        </div>
        <p className="text-xs text-muted uppercase tracking-wider">{listing.category}</p>
      </div>
    </motion.div>
  );
}
