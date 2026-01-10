'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Users, Zap, DollarSign } from 'lucide-react';

const stats = [
  { label: 'Total Volume', value: '12,450 SOL', icon: DollarSign, change: '+24%' },
  { label: 'Active Listings', value: '3,892', icon: TrendingUp, change: '+12%' },
  { label: 'Traders', value: '8,421', icon: Users, change: '+48%' },
  { label: 'Avg. Sale Time', value: '< 2hr', icon: Zap, change: null },
];

export function StatsBar() {
  return (
    <section className="border-y border-border bg-card/50">
      <div className="max-w-[1800px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`
                p-6 md:p-8 flex flex-col gap-2
                ${i < stats.length - 1 ? 'border-r border-border' : ''}
              `}
            >
              <div className="flex items-center gap-2 text-muted">
                <stat.icon size={14} />
                <span className="text-xs font-mono uppercase tracking-wider">{stat.label}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-bold">{stat.value}</span>
                {stat.change && (
                  <span className="text-xs text-green-500 font-mono">{stat.change}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
