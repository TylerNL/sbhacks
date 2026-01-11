"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ListingCard } from "@/components/ListingCard";
import { CategoryNav } from "@/components/CategoryNav";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";

interface Listing {
  id: string;
  title: string;
  price: number;
  image: string;
  size: string;
  seller: string;
  category: string;
}

export default function ShopPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const { publicKey } = useWallet();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const categories = Array.from(
    new Set(allListings.map((l) => l.category))
  ).sort();
  const searchParams = useSearchParams();

  // Fetch listings from backend
  useEffect(() => {
    const fetchListings = async () => {
      if (!publicKey) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5000/api/get-listings-user?wallet_id=${publicKey.toBase58()}`
        );
        const data = await response.json();

        if (data.recommendations) {
          // Map API response to listing format
          const listings: Listing[] = data.recommendations.map(
            (item: {
              id: string;
              product_name: string;
              img_url: string;
              price: number;
              category: string;
              similarity_score: number;
            }) => ({
              id: item.id,
              title: item.product_name,
              price: item.price,
              image: item.img_url,
              size: "OS", // Default size since API doesn't return it
              seller: "Unknown", // Default seller since API doesn't return it
              category: item.category,
            })
          );
          setAllListings(listings);
        }
      } catch (error) {
        console.error("Failed to fetch listings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [publicKey]);

  useEffect(() => {
    const catParam = searchParams?.get("category");
    if (!catParam) return;
    if (catParam === "all") {
      setSelectedCategories([]);
      return;
    }

    // Try to find a matching category by name (case-insensitive)
    const match = categories.find(
      (c) => c.toLowerCase() === catParam.toLowerCase()
    );
    if (match) {
      setSelectedCategories([match]);
    } else {
      // If there's no matching category in our listings, set the param as the selected
      // category so the filter yields no results (shows nothing) which is the desired behavior.
      setSelectedCategories([catParam]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.toString()]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const filteredListings = allListings.filter((listing) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      listing.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(listing.category);
    return matchesSearch && matchesCategory;
  });

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
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            SHOP
          </h1>
          <p className="text-muted mt-4 text-lg">
            {filteredListings.length} of {allListings.length} items available
          </p>
        </motion.div>

        {/* Search and filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              size={20}
            />
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
            <span className="font-mono text-sm uppercase tracking-wider">
              Filters
            </span>
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-8 p-6 bg-card border border-border"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted mb-2 block">
                  Size
                </label>
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
                <label className="text-xs font-mono uppercase tracking-wider text-muted mb-2 block">
                  Price
                </label>
                <select className="w-full p-3 bg-background border border-border">
                  <option>Any Price</option>
                  <option>Under 0.5 SOL</option>
                  <option>0.5 - 1 SOL</option>
                  <option>1 - 2 SOL</option>
                  <option>Over 2 SOL</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted mb-2 block">
                  Condition
                </label>
                <select className="w-full p-3 bg-background border border-border">
                  <option>Any Condition</option>
                  <option>New with tags</option>
                  <option>Like new</option>
                  <option>Good</option>
                  <option>Fair</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted mb-2 block">
                  Sort By
                </label>
                <select className="w-full p-3 bg-background border border-border">
                  <option>Newest</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Category multi-select */}
            <div className="mt-6">
              <label className="text-xs font-mono uppercase tracking-wider text-muted mb-2 block">
                Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <label
                    key={cat}
                    className={`inline-flex items-center px-3 py-2 border transition-colors duration-150 ${
                      selectedCategories.includes(cat)
                        ? "bg-black text-white border-black"
                        : "bg-transparent border-border hover:border-foreground"
                    } rounded cursor-pointer`}
                  >
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                    />
                    <span className="text-sm font-mono">{cat}</span>
                  </label>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Categories */}
        <CategoryNav />

        {/* Listings grid */}
        {loading ? (
          <div className="mt-8 w-full text-center">
            <p className="text-muted text-lg font-mono">
              Loading recommendations...
            </p>
          </div>
        ) : !publicKey ? (
          <div className="mt-8 w-full text-center">
            <p className="text-muted text-lg font-mono">
              Connect your wallet to see personalized recommendations
            </p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="mt-8 w-full text-center">
            <p className="text-muted text-lg font-mono">No Items Found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-8">
            {filteredListings.map((listing, i) => (
              <ListingCard key={listing.id} listing={listing} index={i} />
            ))}
          </div>
        )}

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
