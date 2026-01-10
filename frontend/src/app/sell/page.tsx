'use client';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import { Upload, ImagePlus, X, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';

const categories = ['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories', 'Bags'];
const conditions = ['New with tags', 'Like new', 'Good', 'Fair'];
const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface UploadedImage {
  url: string;
  ipfsHash: string;
  isUploading?: boolean;
}

export default function SellPage() {
  const { publicKey, connected } = useWallet();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: '',
    size: '',
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Check max images limit
    if (images.length + files.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    // Process each file
    for (const file of Array.from(files)) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
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
      setImages(prev => [...prev, { url: localPreview, ipfsHash: tempId, isUploading: true }]);

      try {
        // Upload to IPFS via backend
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          // Replace placeholder with actual IPFS URL
          setImages(prev => prev.map(img => 
            img.ipfsHash === tempId 
              ? { url: result.url, ipfsHash: result.ipfsHash, isUploading: false }
              : img
          ));
          // Revoke the local preview URL
          URL.revokeObjectURL(localPreview);
        } else {
          // Remove failed upload
          setImages(prev => prev.filter(img => img.ipfsHash !== tempId));
          URL.revokeObjectURL(localPreview);
          alert(`Upload failed: ${result.error}`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        setImages(prev => prev.filter(img => img.ipfsHash !== tempId));
        URL.revokeObjectURL(localPreview);
        alert('Failed to upload image. Make sure the backend is running.');
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (ipfsHash: string) => {
    setImages(prev => prev.filter(img => img.ipfsHash !== ipfsHash));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected) {
      alert('Please connect your wallet first');
      return;
    }

    if (images.length === 0) {
      alert('Please add at least one image');
      return;
    }

    if (images.some(img => img.isUploading)) {
      alert('Please wait for images to finish uploading');
      return;
    }

    setIsSubmitting(true);

    try {
      const listingData = {
        ...form,
        price: parseFloat(form.price),
        image: images[0].url, // Primary image
        images: images.map(img => img.url), // All images
        seller: publicKey?.toString(),
      };

      const response = await fetch(`${API_URL}/api/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listingData),
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('Listing created successfully!');
        // Reset form
        setForm({ title: '', description: '', price: '', category: '', condition: '', size: '' });
        setImages([]);
        // Could redirect to listing page: router.push(`/listing/${result.id}`);
      } else {
        alert(`Failed to create listing: ${result.error}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to create listing. Make sure the backend is running.');
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
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">SELL</h1>
          <p className="text-muted text-lg mb-12">
            List your item in under 2 minutes. Get paid instantly in SOL.
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
                <div key={img.ipfsHash} className="relative aspect-square bg-card border border-border overflow-hidden">
                  <img src={img.url} alt="Upload preview" className="w-full h-full object-cover" />
                  {img.isUploading ? (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Loader2 className="animate-spin text-accent" size={24} />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeImage(img.ipfsHash)}
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
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                  <option key={cat} value={cat}>{cat}</option>
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
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                className="w-full p-4 bg-card border border-border focus:border-foreground outline-none transition-colors"
              >
                <option value="">Select</option>
                {conditions.map((cond) => (
                  <option key={cond} value={cond}>{cond}</option>
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
                  <option key={size} value={size}>{size}</option>
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
                <p className="text-muted mb-4">Connect your wallet to list an item</p>
              </div>
            ) : (
              <button
                type="submit"
                className="w-full py-5 bg-foreground text-background font-bold uppercase tracking-wider text-lg hover:bg-accent transition-colors flex items-center justify-center gap-3"
              >
                <Upload size={20} />
                List Item
              </button>
            )}
          </motion.div>
        </form>
      </section>

      <Footer />
    </main>
  );
}
