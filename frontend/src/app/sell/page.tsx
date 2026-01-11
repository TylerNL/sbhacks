"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  ImagePlus,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useState, useRef } from "react";
import { createClient, type Session } from "@supabase/supabase-js";

const categories = [
  "Tops",
  "Bottoms",
  "Outerwear",
  "Shoes",
  "Accessories",
  "Bags",
];
const conditions = ["New with tags", "Like new", "Good", "Fair"];
const sizes = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface UploadedImage {
  url: string;
  id: string; // Pinata file ID (for deletion)
  cid: string; // IPFS CID
  isUploading?: boolean;
}

interface ModalState {
  isOpen: boolean;
  type: "success" | "error";
  title: string;
  message: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY"
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default function SellPage() {
  const { publicKey, connected } = useWallet();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    condition: "",
    size: "",
  });

  const showModal = (
    type: "success" | "error",
    title: string,
    message: string
  ) => {
    setModal({ isOpen: true, type, title, message });
  };

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check max images limit
    if (images.length + files.length > 5) {
      alert("Maximum 5 images allowed");
      return;
    }

    // Process each file
    for (const file of Array.from(files)) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} is not an image`);
        continue;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large (max 10MB)`);
        continue;
      }

      // Add placeholder while uploading
      const tempId = Date.now().toString();
      const localPreview = URL.createObjectURL(file);
      setImages((prev) => [
        ...prev,
        { url: localPreview, id: tempId, cid: "", isUploading: true },
      ]);

      try {
        // Upload via our API route (server-side) to avoid CORS issues
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          // Replace placeholder with actual IPFS URL
          setImages((prev) =>
            prev.map((img) =>
              img.id === tempId
                ? {
                    url: result.url,
                    id: result.id,
                    cid: result.cid,
                    isUploading: false,
                  }
                : img
            )
          );
        } else {
          throw new Error(result.error);
        }
        // Revoke the local preview URL
        URL.revokeObjectURL(localPreview);
      } catch (error) {
        console.error("Upload error:", error);
        setImages((prev) => prev.filter((img) => img.id !== tempId));
        URL.revokeObjectURL(localPreview);
        alert("Failed to upload image to IPFS. Check your Pinata credentials.");
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = async (fileId: string) => {
    // Remove from UI immediately
    setImages((prev) => prev.filter((img) => img.id !== fileId));

    // Delete from Pinata (fire and forget - don't block UI)
    try {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: fileId }),
      });
      console.log("Deleted from Pinata:", fileId);
    } catch (error) {
      // Don't alert user - the image is already removed from UI
      console.error("Failed to delete from Pinata:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected || !publicKey) {
      showModal("error", "Wallet Required", "Please connect your wallet first");
      return;
    }

    if (images.length === 0) {
      showModal("error", "Images Required", "Please add at least one image");
      return;
    }

    if (images.some((img) => img.isUploading)) {
      showModal(
        "error",
        "Please Wait",
        "Please wait for images to finish uploading"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert listing into Supabase
      const { data, error } = await supabase
        .from("Listings")
        .insert({
          product_name: form.title,
          wallet_address: publicKey.toString(),
          description: form.description,
          img_urls: images.map((img) => img.url), // Array of IPFS URLs
          sold: false,
          category: form.category,
          condition: form.condition,
          size: form.size,
          price: parseFloat(form.price), //IN SOL,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log("Listing created:", data);

      // Trigger backend vectorization for the first image (fire-and-forget)
      try {
        const firstImageUrl = images[0]?.url;
        const listingId = data?.id;

        if (firstImageUrl && listingId) {
          void fetch(
            `${API_URL}/api/vectorize?img_address=${encodeURIComponent(
              firstImageUrl
            )}&id=${encodeURIComponent(listingId)}`,
            { method: "POST" }
          );
        }
      } catch (e) {
        console.error("Vectorize call failed:", e);
      }

      showModal(
        "success",
        "Listing Created!",
        "Your item has been listed successfully."
      );

      // Reset form
      setForm({
        title: "",
        description: "",
        price: "",
        category: "",
        condition: "",
        size: "",
      });
      setImages([]);

      // Optionally redirect to the listing page
      // router.push(`/listing/${data.id}`);
    } catch (error: any) {
      console.error("Submit error:", error);
      showModal(
        "error",
        "Failed to Create Listing",
        error.message || "An unknown error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
            SELL
          </h1>
          <p className="text-muted text-lg mb-12">
            List your item in under 2 minutes.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Image upload */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="text-sm font-mono uppercase tracking-wider text-muted mb-4 block">
              Photos (up to 5) — Stored on IPFS
            </label>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="relative aspect-square bg-card border border-border overflow-hidden"
                >
                  <img
                    src={img.url}
                    alt="Upload preview"
                    className="w-full h-full object-cover"
                  />
                  {img.isUploading ? (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Loader2 className="animate-spin text-accent" size={24} />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="absolute top-2 right-2 p-1 bg-foreground text-background hover:bg-accent transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              {images.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-border hover:border-foreground transition-colors flex flex-col items-center justify-center gap-2"
                >
                  <ImagePlus size={24} className="text-muted" />
                  <span className="text-xs text-muted">Add Photo</span>
                </button>
              )}
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="text-sm font-mono uppercase tracking-wider text-muted mb-2 block">
              Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Vintage Nike Windbreaker"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full p-4 bg-card border border-border focus:border-foreground outline-none transition-colors"
            />
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <label className="text-sm font-mono uppercase tracking-wider text-muted mb-2 block">
              Description
            </label>
            <textarea
              rows={4}
              placeholder="Describe your item - brand, condition, measurements, etc."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full p-4 bg-card border border-border focus:border-foreground outline-none transition-colors resize-none"
            />
          </motion.div>

          {/* Price, Category, Condition, Size */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <div>
              <label className="text-sm font-mono uppercase tracking-wider text-muted mb-2 block">
                Price (SOL) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full p-4 bg-card border border-border focus:border-foreground outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-sm font-mono uppercase tracking-wider text-muted mb-2 block">
                Category *
              </label>
              <select
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full p-4 bg-card border border-border focus:border-foreground outline-none transition-colors"
              >
                <option value="">Select</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-mono uppercase tracking-wider text-muted mb-2 block">
                Condition *
              </label>
              <select
                required
                value={form.condition}
                onChange={(e) =>
                  setForm({ ...form, condition: e.target.value })
                }
                className="w-full p-4 bg-card border border-border focus:border-foreground outline-none transition-colors"
              >
                <option value="">Select</option>
                {conditions.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-mono uppercase tracking-wider text-muted mb-2 block">
                Size *
              </label>
              <select
                required
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
                className="w-full p-4 bg-card border border-border focus:border-foreground outline-none transition-colors"
              >
                <option value="">Select</option>
                {sizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="pt-8 border-t border-border"
          >
            {!connected ? (
              <div className="text-center py-8 bg-card border border-border">
                <p className="text-muted mb-4">
                  Connect your wallet to list an item
                </p>
              </div>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 bg-foreground text-background font-bold uppercase tracking-wider text-lg hover:bg-accent transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Creating Listing...
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    List Item
                  </>
                )}
              </button>
            )}
          </motion.div>
        </form>
      </section>

      <Footer />

      {/* Success/Error Modal */}
      <AnimatePresence>
        {modal.isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            >
              <div className="bg-background border border-border p-8 mx-4">
                {/* Icon */}
                <div
                  className={`w-16 h-16 mx-auto mb-6 flex items-center justify-center ${
                    modal.type === "success"
                      ? "bg-green-500/10"
                      : "bg-red-500/10"
                  }`}
                >
                  {modal.type === "success" ? (
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  )}
                </div>

                {/* Title */}
                <h3
                  className={`text-2xl font-bold text-center mb-3 ${
                    modal.type === "success" ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {modal.title}
                </h3>

                {/* Message */}
                <p className="text-muted text-center mb-8">{modal.message}</p>

                {/* Button */}
                <button
                  onClick={closeModal}
                  className={`w-full py-4 font-bold uppercase tracking-wider transition-colors ${
                    modal.type === "success"
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-foreground text-background hover:bg-accent"
                  }`}
                >
                  {modal.type === "success" ? "Done" : "Try Again"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
