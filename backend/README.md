# Financial Coach Backend API

A Flask-based backend that connects to Google's Gemini API to provide personalized financial coaching advice based on user transaction history and credit scores.

## Features

- **Gemini AI Integration**: Uses Google's Gemini 1.5 Flash model for intelligent financial advice
- **Personalized Coaching**: Analyzes user transaction history, credit scores, and payment patterns
- **Dummy Data**: Includes 5 sample users with varying financial profiles for testing
- **RESTful API**: Ready to connect to any frontend application

## Datasets
 - Kaggle sample data w/ dummy data of users' ids, transactions history, credit score.

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your Gemini API key
# Get your API key from: https://makersuite.google.com/app/apikey
```

### 3. Run the Server

```bash
python app.py
```

The server will start at `http://localhost:5000`

## API Endpoints

### Chat with Financial Coach
```
POST /api/chat
Content-Type: application/json

{
  "message": "How can I improve my credit score?",
  "user_id": "user_001"  // optional, defaults to user_001
}
```

### Get Financial Analysis
```
POST /api/analyze
Content-Type: application/json

{
  "user_id": "user_002"
}
```

### List All Users
```
GET /api/users
```

### Get User Details
```
GET /api/user/<user_id>
```

### Health Check
```
GET /api/health
```

## Sample Users

| User ID | Name | Credit Score | Profile |
|---------|------|--------------|---------|
| user_001 | Alex Johnson | 720 | Good credit, balanced spending |
| user_002 | Maria Garcia | 580 | Poor credit, high spending |
| user_003 | James Chen | 810 | Excellent credit, disciplined saver |
| user_004 | Sarah Williams | 650 | Fair credit, impulsive spending |
| user_005 | David Kim | 695 | Good credit, managing debt |

## Frontend Integration Example

```javascript
// Chat with the financial coach
const response = await fetch('http://localhost:5000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "What are my spending habits like?",
    user_id: "user_001"
  })
});
const data = await response.json();
console.log(data.response);
```

---

# 🛍️ DripChain - Decentralized Fashion Marketplace (12-Hour Hackathon Build)

A Solana-based peer-to-peer fashion/clothing trading platform (similar to Depop). This is a **MVP-focused plan** designed to be built in a 12-hour hackathon.

## 🎯 MVP Scope (What We're Building)

**IN SCOPE (Must Have):**
- ✅ Connect Phantom wallet
- ✅ Create/view clothing listings (stored off-chain for speed)
- ✅ Simple SOL payments (direct transfer, no escrow)
- ✅ Basic listing feed with images
- ✅ Mobile-responsive UI

**OUT OF SCOPE (Post-Hackathon):**
- ❌ On-chain escrow (complex, skip for MVP)
- ❌ NFT authenticity certificates
- ❌ Reputation/rating system
- ❌ Messaging between users
- ❌ Search/filters

---

## ⏰ 12-Hour Timeline

| Hour | Task | Deliverable |
|------|------|-------------|
| **0-1** | Setup & Planning | Project scaffold, dependencies installed |
| **1-3** | Backend API | Flask API with listings CRUD + dummy data |
| **3-5** | Frontend Shell | Next.js + TailwindCSS + Wallet connection |
| **5-7** | Listing UI | Create listing form + listing grid display |
| **7-9** | Payments | SOL transfer on "Buy Now" button |
| **9-11** | Polish & Integration | Connect all pieces, fix bugs, style |
| **11-12** | Demo Prep | Test full flow, prepare pitch |

---

## 🏗️ Simplified Architecture

```
┌────────────────────────────────────────┐
│            FRONTEND (Next.js)          │
│  - Wallet Connect (Phantom)            │
│  - Listing Grid                        │
│  - Create Listing Form                 │
│  - Buy Button (SOL Transfer)           │
└────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────┐
│            BACKEND (Flask)             │
│  - GET /api/listings                   │
│  - POST /api/listings                  │
│  - GET /api/listings/:id               │
│  - In-memory or SQLite storage         │
└────────────────────────────────────────┘
```

**No on-chain smart contracts for MVP** - Just direct wallet-to-wallet SOL transfers!

---

## 🚀 Hour-by-Hour Build Guide

### Hour 0-1: Project Setup

```bash
# Create project structure
mkdir -p dripchain/{frontend,backend}
cd dripchain

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate
pip install flask flask-cors

# Frontend setup
cd ../frontend
npx create-next-app@latest . --typescript --tailwind --app
npm install @solana/web3.js @solana/wallet-adapter-react @solana/wallet-adapter-wallets @solana/wallet-adapter-react-ui
```

---

### Hour 1-3: Backend API

Create a simple Flask backend:

```python
# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app)

# In-memory storage (use SQLite for persistence if time permits)
listings = []

# Seed with dummy data
listings = [
    {
        "id": "1",
        "title": "Vintage Nike Windbreaker",
        "description": "90s vintage, great condition",
        "price": 0.5,  # SOL
        "size": "L",
        "category": "Outerwear",
        "image": "https://picsum.photos/seed/nike/400/400",
        "seller": "DemoWallet123...",
        "status": "active",
        "created_at": datetime.now().isoformat()
    },
    {
        "id": "2", 
        "title": "Carhartt Beanie",
        "description": "Brand new with tags",
        "price": 0.2,
        "size": "One Size",
        "category": "Accessories",
        "image": "https://picsum.photos/seed/beanie/400/400",
        "seller": "DemoWallet456...",
        "status": "active",
        "created_at": datetime.now().isoformat()
    },
    {
        "id": "3",
        "title": "Levi's 501 Jeans",
        "description": "Classic fit, light wash",
        "price": 0.8,
        "size": "32x32",
        "category": "Bottoms",
        "image": "https://picsum.photos/seed/levis/400/400",
        "seller": "DemoWallet789...",
        "status": "active",
        "created_at": datetime.now().isoformat()
    }
]

@app.route('/api/listings', methods=['GET'])
def get_listings():
    active = [l for l in listings if l['status'] == 'active']
    return jsonify(active)

@app.route('/api/listings/<listing_id>', methods=['GET'])
def get_listing(listing_id):
    listing = next((l for l in listings if l['id'] == listing_id), None)
    if not listing:
        return jsonify({"error": "Not found"}), 404
    return jsonify(listing)

@app.route('/api/listings', methods=['POST'])
def create_listing():
    data = request.json
    listing = {
        "id": str(uuid.uuid4()),
        "title": data['title'],
        "description": data.get('description', ''),
        "price": float(data['price']),
        "size": data.get('size', ''),
        "category": data.get('category', 'Other'),
        "image": data.get('image', 'https://picsum.photos/400/400'),
        "seller": data['seller'],  # Wallet address
        "status": "active",
        "created_at": datetime.now().isoformat()
    }
    listings.append(listing)
    return jsonify(listing), 201

@app.route('/api/listings/<listing_id>/sold', methods=['POST'])
def mark_sold(listing_id):
    """Mark listing as sold after payment confirmed"""
    data = request.json
    listing = next((l for l in listings if l['id'] == listing_id), None)
    if listing:
        listing['status'] = 'sold'
        listing['buyer'] = data.get('buyer')
        listing['tx_signature'] = data.get('tx_signature')
    return jsonify(listing)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

---

### Hour 3-5: Frontend Shell + Wallet

**Key files to create:**

```typescript
// frontend/src/app/providers.tsx
'use client';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';
import '@solana/wallet-adapter-react-ui/styles.css';

export function Providers({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
```

```typescript
// frontend/src/app/layout.tsx
import { Providers } from './providers';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

```typescript
// frontend/src/components/Navbar.tsx
'use client';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="flex justify-between items-center p-4 border-b">
      <Link href="/" className="text-2xl font-bold">🛍️ DripChain</Link>
      <div className="flex gap-4 items-center">
        <Link href="/sell" className="px-4 py-2 bg-black text-white rounded-lg">
          Sell
        </Link>
        <WalletMultiButton />
      </div>
    </nav>
  );
}
```

---

### Hour 5-7: Listing UI

```typescript
// frontend/src/components/ListingCard.tsx
'use client';
import Link from 'next/link';

interface Listing {
  id: string;
  title: string;
  price: number;
  image: string;
  size: string;
}

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link href={`/listing/${listing.id}`}>
      <div className="border rounded-lg overflow-hidden hover:shadow-lg transition">
        <img src={listing.image} alt={listing.title} className="w-full h-64 object-cover" />
        <div className="p-3">
          <h3 className="font-medium truncate">{listing.title}</h3>
          <p className="text-lg font-bold">{listing.price} SOL</p>
          <p className="text-sm text-gray-500">Size: {listing.size}</p>
        </div>
      </div>
    </Link>
  );
}
```

```typescript
// frontend/src/app/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { ListingCard } from '@/components/ListingCard';

export default function Home() {
  const [listings, setListings] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/listings')
      .then(res => res.json())
      .then(setListings);
  }, []);

  return (
    <main>
      <Navbar />
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Shop Streetwear</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {listings.map((listing: any) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    </main>
  );
}
```

---

### Hour 7-9: SOL Payment Integration

```typescript
// frontend/src/app/listing/[id]/page.tsx
'use client';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';

export default function ListingPage({ params }: { params: { id: string } }) {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [listing, setListing] = useState<any>(null);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:5000/api/listings/${params.id}`)
      .then(res => res.json())
      .then(setListing);
  }, [params.id]);

  const handleBuy = async () => {
    if (!publicKey || !listing) return;
    
    setBuying(true);
    try {
      // Create transaction to send SOL to seller
      const sellerPubkey = new PublicKey(listing.seller);
      const lamports = listing.price * LAMPORTS_PER_SOL;
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: sellerPubkey,
          lamports,
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      
      // Mark as sold in backend
      await fetch(`http://localhost:5000/api/listings/${listing.id}/sold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer: publicKey.toString(),
          tx_signature: signature
        })
      });

      alert(`Purchase successful! TX: ${signature}`);
    } catch (err) {
      console.error(err);
      alert('Purchase failed');
    }
    setBuying(false);
  };

  if (!listing) return <div>Loading...</div>;

  return (
    <main>
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        <div className="grid md:grid-cols-2 gap-8">
          <img src={listing.image} alt={listing.title} className="w-full rounded-lg" />
          <div>
            <h1 className="text-3xl font-bold">{listing.title}</h1>
            <p className="text-4xl font-bold my-4">{listing.price} SOL</p>
            <p className="text-gray-600 mb-2">Size: {listing.size}</p>
            <p className="text-gray-600 mb-4">{listing.description}</p>
            <button
              onClick={handleBuy}
              disabled={!publicKey || buying}
              className="w-full py-3 bg-black text-white rounded-lg font-bold disabled:opacity-50"
            >
              {buying ? 'Processing...' : publicKey ? 'Buy Now' : 'Connect Wallet to Buy'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
```

---

### Hour 9-11: Create Listing Form

```typescript
// frontend/src/app/sell/page.tsx
'use client';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';

export default function SellPage() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    size: '',
    category: 'Tops',
    image: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return alert('Connect wallet first');

    const res = await fetch('http://localhost:5000/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        price: parseFloat(form.price),
        seller: publicKey.toString()
      })
    });

    if (res.ok) {
      router.push('/');
    }
  };

  return (
    <main>
      <Navbar />
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">List an Item</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={e => setForm({...form, title: e.target.value})}
            className="w-full p-3 border rounded-lg"
            required
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={e => setForm({...form, description: e.target.value})}
            className="w-full p-3 border rounded-lg"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              step="0.01"
              placeholder="Price (SOL)"
              value={form.price}
              onChange={e => setForm({...form, price: e.target.value})}
              className="p-3 border rounded-lg"
              required
            />
            <input
              type="text"
              placeholder="Size"
              value={form.size}
              onChange={e => setForm({...form, size: e.target.value})}
              className="p-3 border rounded-lg"
            />
          </div>
          <select
            value={form.category}
            onChange={e => setForm({...form, category: e.target.value})}
            className="w-full p-3 border rounded-lg"
          >
            <option>Tops</option>
            <option>Bottoms</option>
            <option>Outerwear</option>
            <option>Shoes</option>
            <option>Accessories</option>
          </select>
          <input
            type="url"
            placeholder="Image URL"
            value={form.image}
            onChange={e => setForm({...form, image: e.target.value})}
            className="w-full p-3 border rounded-lg"
          />
          <button
            type="submit"
            disabled={!publicKey}
            className="w-full py-3 bg-black text-white rounded-lg font-bold disabled:opacity-50"
          >
            {publicKey ? 'List Item' : 'Connect Wallet to Sell'}
          </button>
        </form>
      </div>
    </main>
  );
}
```

---

## ✅ 12-Hour Deliverables Checklist

- [ ] Flask backend running with listings API
- [ ] Next.js frontend with TailwindCSS
- [ ] Phantom wallet connection working
- [ ] Homepage displays listing grid
- [ ] Individual listing page with details
- [ ] "Buy Now" sends SOL to seller wallet
- [ ] "Sell" page creates new listings
- [ ] Demo video recorded

---

## 🎤 Demo Script (2 min)

1. **Problem** (15s): "Depop takes 10% fees and payments take days to clear"
2. **Solution** (15s): "DripChain - buy & sell fashion with instant crypto payments, <1% fees"
3. **Demo** (60s):
   - Connect Phantom wallet
   - Browse listings
   - Buy an item (show SOL transfer)
   - Create a new listing
4. **Future** (15s): "Escrow, NFT authenticity, reputation system"
5. **Ask** (15s): "Looking for: beta testers, fashion brand partnerships"

---

## 🔧 Quick Fixes If Running Low on Time

| Problem | Quick Fix |
|---------|-----------|
| No time for images | Use placeholder URLs from picsum.photos |
| Backend too slow | Keep listings in memory, skip DB |
| Wallet issues | Test on Devnet with airdropped SOL |
| Styling takes too long | Use default Tailwind, skip custom design |

---

## 📚 Resources

- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [Wallet Adapter Docs](https://github.com/solana-labs/wallet-adapter)
- [Get Devnet SOL](https://faucet.solana.com/)
- [Phantom Wallet](https://phantom.app/)