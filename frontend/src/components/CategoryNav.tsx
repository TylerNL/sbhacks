'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const categories = [
  { name: 'ALL', slug: 'all', emoji: '✦' },
  { name: 'TOPS', slug: 'tops', emoji: '👕' },
  { name: 'BOTTOMS', slug: 'bottoms', emoji: '👖' },
  { name: 'OUTERWEAR', slug: 'outerwear', emoji: '🧥' },
  { name: 'SHOES', slug: 'shoes', emoji: '👟' },
  { name: 'ACCESSORIES', slug: 'accessories', emoji: '🧢' },
  { name: 'BAGS', slug: 'bags', emoji: '👜' },
];

export function CategoryNav({ active = 'all' }: { active?: string }) {
  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 min-w-max py-2">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/shop?category=${cat.slug}`}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                px-5 py-3 border transition-all
                ${active === cat.slug 
                  ? 'bg-foreground text-background border-foreground' 
                  : 'bg-transparent border-border hover:border-foreground'
                }
              `}
            >
              <span className="text-sm font-mono tracking-wider">
                {cat.emoji} {cat.name}
              </span>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
