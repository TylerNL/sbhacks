"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

interface Listing {
  id: string;
  title: string;
  price: number;
  image: string;
  size: string;
  seller: string;
  category: string;
}

export function ListingCard({
  listing,
  index = 0,
}: {
  listing: Listing;
  index?: number;
}) {
  const [isSaved, setIsSaved] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const { publicKey } = useWallet();

  // Check if listing is already saved by user
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!publicKey || !supabase) return;

      try {
        const { data, error } = await supabase
          .from("Userbase")
          .select("saved")
          .eq("id", publicKey.toString())
          .single();

        if (!error && data?.saved) {
          const currentSaved: (string | number)[] = data.saved ?? [];
          setIsSaved(
            currentSaved.some((id) => String(id) === String(listing.id))
          );
        }
      } catch (err) {
        console.error("Error checking saved status:", err);
      }
    };

    checkIfSaved();
  }, [publicKey, listing.id]);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!publicKey) {
      alert("Please connect your wallet to save items");
      return;
    }

    if (!supabase) {
      console.error("Supabase not initialized");
      return;
    }

    setSavingItem(true);
    const listingId = listing.id;

    try {
      // First, get current saved array
      const { data: userData, error: fetchError } = await supabase
        .from("Userbase")
        .select("saved")
        .eq("id", publicKey.toString())
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error fetching user:", fetchError);
        return;
      }

      // Handle null saved array - keep original types from DB
      const currentSaved: (string | number)[] = userData?.saved ?? [];
      const isCurrentlySaved = currentSaved.some(
        (id) => String(id) === String(listingId)
      );

      let newSaved: (string | number)[];
      let nowSaved: boolean;

      if (isCurrentlySaved) {
        newSaved = currentSaved.filter(
          (id) => String(id) !== String(listingId)
        );
        nowSaved = false;
      } else {
        newSaved = [...currentSaved, listingId];
        nowSaved = true;
      }

      // Update the user row with the new saved array
      const { error: updateError } = await supabase
        .from("Userbase")
        .update({ saved: newSaved })
        .eq("id", publicKey.toString());

      if (updateError) {
        console.error("Error updating saved:", updateError);
        return;
      }

      setIsSaved(nowSaved);

      // Update the user's taste vector in the backend
      try {
        if (nowSaved) {
          await fetch(
            `http://localhost:5000/api/add-like?listing_id=${encodeURIComponent(
              listingId
            )}&wallet_id=${encodeURIComponent(publicKey.toString())}`,
            { method: "PUT" }
          );
        } else {
          await fetch(
            `http://localhost:5000/api/remove-like?listing_id=${encodeURIComponent(
              listingId
            )}&wallet_id=${encodeURIComponent(publicKey.toString())}`,
            { method: "PUT" }
          );
        }
      } catch (e) {
        console.error("Failed to update taste vector:", e);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setSavingItem(false);
    }
  };

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
            <span className="text-xs font-mono tracking-wider">
              {listing.size}
            </span>
          </div>

          {/* Like button */}
          <button
            onClick={handleSave}
            disabled={savingItem}
            className={`absolute top-3 right-3 p-2 bg-background/90 backdrop-blur-sm hover:bg-accent hover:text-background transition-colors disabled:opacity-50 ${
              isSaved ? "text-accent" : ""
            }`}
          >
            <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
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
          <h3 className="text-sm font-medium truncate flex-1">
            {listing.title}
          </h3>
          <span className="text-sm font-bold whitespace-nowrap">
            {listing.price} SOL
          </span>
        </div>
        <p className="text-xs text-muted uppercase tracking-wider">
          {listing.category}
        </p>
      </div>
    </motion.div>
  );
}
