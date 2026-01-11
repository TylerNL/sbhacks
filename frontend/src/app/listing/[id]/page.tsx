"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Heart,
  Share2,
  Shield,
  Truck,
  ArrowLeft,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  createTransferTransaction,
  sendAndConfirmTransaction,
  getExplorerUrl,
} from "@/lib/solana";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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
  created_at: string;
}

export default function ListingPage() {
  const params = useParams();
  const { publicKey, connected, signTransaction } = useWallet();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [liked, setLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [buying, setBuying] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  // Fetch listing from Supabase
  useEffect(() => {
    const fetchListing = async () => {
      const id = params.id as string;
      if (!id) {
        setError("No listing ID provided");
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("Listings")
          .select("*")
          .eq("id", id)
          .single();

        if (fetchError) {
          console.error("Error fetching listing:", fetchError);
          setError("Listing not found");
        } else {
          setListing(data);
        }
      } catch (err) {
        console.error("Error:", err);
        setError("Failed to load listing");
      } finally {
        setIsLoading(false);
      }
    };

    fetchListing();
  }, [params.id]);

  // Check if listing is already saved by user
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!publicKey || !params.id) return;

      try {
        const { data, error } = await supabase
          .from("Userbase")
          .select("saved")
          .eq("id", publicKey.toString())
          .single();

        if (!error && data?.saved) {
          const listingId = params.id as string;
          const currentSaved: (string | number)[] = data.saved ?? [];
          // Compare as strings to handle both number and string IDs
          setIsSaved(
            currentSaved.some((id) => String(id) === String(listingId))
          );
        }
      } catch (err) {
        console.error("Error checking saved status:", err);
      }
    };

    checkIfSaved();
  }, [publicKey, params.id]);

  const handleSave = async () => {
    if (!publicKey) {
      alert("Please connect your wallet to save items");
      return;
    }

    if (!listing) return;

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
        // PGRST116 = no rows returned, which means user doesn't exist yet
        console.error("Error fetching user:", fetchError);
        alert("Error saving item");
        return;
      }

      // Handle null saved array - keep original types from DB
      const currentSaved: (string | number)[] = userData?.saved ?? [];
      // Normalize listingId for comparison (check both string and number forms)
      const isCurrentlySaved = currentSaved.some(
        (id) => String(id) === String(listingId)
      );

      let newSaved: (string | number)[];
      let nowSaved: boolean;

      if (isCurrentlySaved) {
        // Remove from saved - filter out matching ID (compare as strings)
        newSaved = currentSaved.filter(
          (id) => String(id) !== String(listingId)
        );
        nowSaved = false;
      } else {
        // Add to saved - try to preserve type, but use string for new entries
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
        alert("Error saving item");
        return;
      }

      setIsSaved(nowSaved);

      // Update the user's taste vector in the backend
      try {
        if (nowSaved) {
          // Adding a like - call add-like endpoint
          await fetch(
            `http://localhost:5000/api/add-like?listing_id=${encodeURIComponent(
              listingId
            )}&wallet_id=${encodeURIComponent(publicKey.toString())}`,
            { method: "PUT" }
          );
        } else {
          // Removing a like - call remove-like endpoint
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
      alert("Error saving item");
    } finally {
      setSavingItem(false);
    }
  };

  const handleBuy = async () => {
    if (!listing) return;

    if (!connected || !publicKey || !signTransaction) {
      alert("Please connect your wallet first");
      return;
    }

    // Prevent buying your own listing
    if (publicKey.toString() === listing.wallet_address) {
      alert("You can't buy your own listing!");
      return;
    }

    setBuying(true);
    setTxSignature(null);

    try {
      // Create the transfer transaction
      const sellerPubkey = new PublicKey(listing.wallet_address);
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

      // Mark listing as sold in Supabase and record the buyer
      await supabase
        .from("Listings")
        .update({ sold: true, purchased_from: publicKey.toString() })
        .eq("id", listing.id);

      // Update local state
      setListing({ ...listing, sold: true });

      alert(`Purchase successful! Transaction: ${signature.slice(0, 8)}...`);
    } catch (error: any) {
      console.error("Purchase error:", error);
      if (error.message?.includes("User rejected")) {
        alert("Transaction cancelled");
      } else if (error.message?.includes("insufficient")) {
        alert("Insufficient SOL balance. Get devnet SOL from a faucet!");
      } else {
        alert(`Purchase failed: ${error.message || "Unknown error"}`);
      }
    } finally {
      setBuying(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted" />
        </div>
        <Footer />
      </main>
    );
  }

  // Error state
  if (error || !listing) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-xl text-muted">{error || "Listing not found"}</p>
          <Link
            href="/shop"
            className="text-sm font-mono uppercase tracking-wider border-b border-foreground hover:border-accent hover:text-accent transition-colors"
          >
            Back to Shop
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

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
          <span className="text-sm font-mono uppercase tracking-wider">
            Back to Shop
          </span>
        </Link>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {/* Main image */}
            <div className="aspect-[4/5] bg-card border border-border overflow-hidden mb-4">
              {listing.img_urls && listing.img_urls.length > 0 ? (
                <img
                  src={listing.img_urls[selectedImage]}
                  alt={listing.product_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted">
                  No image available
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {listing.img_urls && listing.img_urls.length > 1 && (
              <div className="flex gap-4">
                {listing.img_urls.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-20 h-24 border-2 overflow-hidden transition-colors ${
                      selectedImage === i
                        ? "border-foreground"
                        : "border-border"
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            {/* Sold badge */}
            {listing.sold && (
              <div className="inline-block px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 font-bold uppercase tracking-wider text-sm">
                Sold
              </div>
            )}

            {/* Header */}
            <div>
              <p className="text-sm font-mono uppercase tracking-wider text-muted mb-2">
                {listing.category || "Uncategorized"}
              </p>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                {listing.product_name}
              </h1>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-4">
              <span className="text-5xl font-bold">{listing.price}</span>
              <span className="text-2xl text-muted">SOL</span>
            </div>

            {/* Quick info */}
            <div className="flex gap-6 py-6 border-y border-border">
              {listing.size && (
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-muted">
                    Size
                  </p>
                  <p className="text-lg font-bold">{listing.size}</p>
                </div>
              )}
              {listing.condition && (
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-muted">
                    Condition
                  </p>
                  <p className="text-lg font-bold">{listing.condition}</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-mono uppercase tracking-wider text-muted mb-3">
                Description
              </h3>
              <p className="text-foreground/80 leading-relaxed">
                {listing.description || "No description provided"}
              </p>
            </div>

            {/* Seller */}
            <div className="p-4 bg-card border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-muted mb-1">
                    Seller
                  </p>
                  <p className="font-bold font-mono text-sm">
                    {listing.wallet_address.slice(0, 4)}...
                    {listing.wallet_address.slice(-4)}
                  </p>
                </div>
                <a
                  href={`https://explorer.solana.com/address/${listing.wallet_address}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-mono uppercase tracking-wider border-b border-foreground hover:border-accent hover:text-accent transition-colors flex items-center gap-1"
                >
                  View on Explorer <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              {listing.sold ? (
                <div className="w-full py-5 bg-muted/20 text-muted font-bold uppercase tracking-wider text-lg text-center border border-border">
                  This item has been sold
                </div>
              ) : txSignature ? (
                <div className="p-4 bg-green-500/10 border border-green-500/30">
                  <p className="text-green-400 font-bold mb-2">
                    ✓ Purchase Complete!
                  </p>
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
                  {buying
                    ? "Processing..."
                    : connected
                    ? `Buy Now • ${listing.price} SOL`
                    : "Connect Wallet to Buy"}
                </button>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleSave}
                  disabled={savingItem}
                  className={`flex-1 py-4 border-2 font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
                    isSaved
                      ? "border-accent text-accent"
                      : "border-border hover:border-foreground"
                  } disabled:opacity-50`}
                >
                  <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
                  {savingItem ? "Saving..." : isSaved ? "Saved" : "Save"}
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
