'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';

export function FeaturedDrop() {
  return (
    <section className="relative min-h-[80vh] bg-foreground text-background overflow-hidden">
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600')" }}
      />
      
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="relative z-10 max-w-[1800px] mx-auto px-6 py-24 flex flex-col justify-center min-h-[80vh]">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-accent font-mono text-sm tracking-[0.3em] uppercase mb-4">
                Featured Drop
              </p>
              <h2 className="text-5xl md:text-7xl font-bold leading-[0.9] tracking-tight">
                ARCHIVE<br />
                <span className="text-accent">SELECTION</span><br />
                VOL.01
              </h2>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-background/70 max-w-md text-lg"
            >
              Curated vintage pieces from the 90s and early 2000s. 
              Each item authenticated and verified on-chain.
            </motion.p>

            {/* Countdown */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-6"
            >
              <div className="flex items-center gap-2 text-accent">
                <Clock size={20} />
                <span className="font-mono text-sm">DROPS IN</span>
              </div>
              <div className="flex gap-4 font-mono">
                <div className="text-center">
                  <div className="text-3xl font-bold">02</div>
                  <div className="text-xs text-background/50">DAYS</div>
                </div>
                <span className="text-3xl">:</span>
                <div className="text-center">
                  <div className="text-3xl font-bold">14</div>
                  <div className="text-xs text-background/50">HRS</div>
                </div>
                <span className="text-3xl">:</span>
                <div className="text-center">
                  <div className="text-3xl font-bold">32</div>
                  <div className="text-xs text-background/50">MIN</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <Link 
                href="/drops"
                className="inline-flex items-center gap-3 bg-accent text-foreground px-8 py-4 font-bold uppercase tracking-wider hover:gap-5 transition-all"
              >
                Get Notified
                <ArrowRight size={20} />
              </Link>
            </motion.div>
          </div>

          {/* Right - stacked preview cards */}
          <motion.div
            initial={{ opacity: 0, rotate: 5 }}
            whileInView={{ opacity: 1, rotate: 0 }}
            viewport={{ once: true }}
            className="relative h-[500px] hidden md:block"
          >
            {[
              { rotate: -6, x: -20, img: 'https://picsum.photos/seed/drop1/400/500' },
              { rotate: 3, x: 40, img: 'https://picsum.photos/seed/drop2/400/500' },
              { rotate: -2, x: 100, img: 'https://picsum.photos/seed/drop3/400/500' },
            ].map((card, i) => (
              <div
                key={i}
                className="absolute top-0 w-[300px] h-[400px] bg-card border-4 border-background shadow-2xl overflow-hidden"
                style={{ 
                  transform: `rotate(${card.rotate}deg) translateX(${card.x}px)`,
                  zIndex: 3 - i
                }}
              >
                <img 
                  src={card.img} 
                  alt="Drop preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-foreground">
                  <p className="text-background text-xs font-mono">??? • REVEAL SOON</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
