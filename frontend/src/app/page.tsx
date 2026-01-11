"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ListingCard } from "@/components/ListingCard";
import { CategoryNav } from "@/components/CategoryNav";
import { StatsBar } from "@/components/StatsBar";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

interface Listing {
  id: string;
  title: string;
  price: number;
  image: string;
  size: string;
  seller: string;
  category: string;
}

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/get-recent-listings"
        );
        const data = await response.json();

        if (data.listings) {
          const mappedListings: Listing[] = data.listings.map(
            (item: {
              id: string;
              product_name: string;
              img_urls: string[];
              price: number;
              size: string;
              category: string;
              wallet_address: string;
            }) => ({
              id: item.id,
              title: item.product_name,
              price: item.price,
              image: Array.isArray(item.img_urls)
                ? item.img_urls[0]
                : item.img_urls,
              size: item.size,
              seller: item.wallet_address,
              category: item.category,
            })
          );
          setListings(mappedListings);
        }
      } catch (error) {
        console.error("Failed to fetch listings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);
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
                  TRADE
                  <br />
                  <span className="text-muted">FASHION</span>
                  <br />
                  ON-CHAIN
                </h1>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-muted text-lg max-w-md"
              >
                The peer-to-peer marketplace for streetwear, vintage, and
                designer fashion. Pay with SOL. No middleman. No crazy fees.
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
                  <ArrowRight
                    size={20}
                    className="group-hover:translate-x-1 transition-transform"
                  />
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
            <p className="text-muted mt-2">
              Just dropped. Grab them before they&apos;re gone.
            </p>
          </div>
          <Link
            href="/shop"
            className="text-sm font-mono uppercase tracking-wider border-b-2 border-foreground pb-1 hover:border-accent hover:text-accent transition-colors"
          >
            View All →
          </Link>
        </div>

        <CategoryNav />

        {loading ? (
          <div className="mt-8 w-full text-center">
            <p className="text-muted text-lg font-mono">Loading listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="mt-8 w-full text-center">
            <p className="text-muted text-lg font-mono">
              No listings available
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-8">
            {listings.map((listing, i) => (
              <ListingCard key={listing.id} listing={listing} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-accent text-foreground">
        <div className="max-w-[1800px] mx-auto px-6 py-24">
          <div className="max-w-3xl">
            <h2 className="text-4xl md:text-6xl font-bold leading-tight">
              Ready to sell your closet?
            </h2>
            <p className="text-foreground/70 text-xl mt-6 mb-8">
              List your items in seconds. Get paid in SOL instantly when they
              sell. No fees, no waiting, no BS.
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
