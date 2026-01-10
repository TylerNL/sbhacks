from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
import requests
from dotenv import load_dotenv
from datetime import datetime
import uuid

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Gemini API
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")
else:
    model = None

PINATA_API_KEY = os.getenv("PINATA_API_KEY")
PINATA_SECRET_KEY = os.getenv("PINATA_SECRET_KEY")

# ============================================
# MARKETPLACE LISTINGS (In-Memory Storage)
# ============================================

listings = [
    {
        "id": "1",
        "title": "Vintage Nike Windbreaker",
        "description": "90s vintage Nike windbreaker in excellent condition",
        "price": 0.5,
        "size": "L",
        "category": "Outerwear",
        "condition": "Good",
        "image": "https://picsum.photos/seed/nike1/400/500",
        "seller": "DemoWallet123abc456def789",
        "status": "active",
        "created_at": datetime.now().isoformat()
    },
    {
        "id": "2",
        "title": "Carhartt WIP Beanie",
        "description": "Brand new with tags Carhartt beanie",
        "price": 0.15,
        "size": "One Size",
        "category": "Accessories",
        "condition": "New with tags",
        "image": "https://picsum.photos/seed/carhartt/400/500",
        "seller": "DemoWallet789xyz",
        "status": "active",
        "created_at": datetime.now().isoformat()
    },
    {
        "id": "3",
        "title": "Levis 501 Vintage Wash",
        "description": "Classic fit 501s with beautiful vintage fade",
        "price": 0.8,
        "size": "32",
        "category": "Bottoms",
        "condition": "Good",
        "image": "https://picsum.photos/seed/levis501/400/500",
        "seller": "SellerABC123",
        "status": "active",
        "created_at": datetime.now().isoformat()
    },
]


@app.route('/api/listings', methods=['GET'])
def get_listings():
    """Get all active listings"""
    active = [l for l in listings if l['status'] == 'active']
    return jsonify(active)


@app.route('/api/listings/<listing_id>', methods=['GET'])
def get_listing(listing_id):
    """Get single listing by ID"""
    listing = next((l for l in listings if l['id'] == listing_id), None)
    if not listing:
        return jsonify({"error": "Not found"}), 404
    return jsonify(listing)


@app.route('/api/listings', methods=['POST'])
def create_listing():
    """Create a new listing"""
    data = request.json
    listing = {
        "id": str(uuid.uuid4()),
        "title": data['title'],
        "description": data.get('description', ''),
        "price": float(data['price']),
        "size": data.get('size', ''),
        "category": data.get('category', 'Other'),
        "condition": data.get('condition', 'Good'),
        "image": data.get('image', 'https://picsum.photos/400/500'),
        "seller": data['seller'],
        "status": "active",
        "created_at": datetime.now().isoformat()
    }
    listings.append(listing)
    return jsonify(listing), 201


@app.route('/api/listings/<listing_id>/sold', methods=['POST'])
def mark_sold(listing_id):
    """Mark listing as sold"""
    data = request.json
    listing = next((l for l in listings if l['id'] == listing_id), None)
    if listing:
        listing['status'] = 'sold'
        listing['buyer'] = data.get('buyer')
        listing['tx_signature'] = data.get('tx_signature')
    return jsonify(listing)


# ============================================
# IPFS IMAGE UPLOAD (Pinata)
# ============================================

@app.route('/api/upload', methods=['POST'])
def upload_to_ipfs():
    """
    Upload image to IPFS via Pinata.
    Accepts multipart/form-data with 'file' field.
    Returns the IPFS URL (gateway URL for easy access).
    """
    if not PINATA_API_KEY or not PINATA_SECRET_KEY:
        return jsonify({"error": "Pinata API keys not configured"}), 500
    
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    # Allowed image types
    allowed_types = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    file_ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if file_ext not in allowed_types:
        return jsonify({"error": f"File type not allowed. Use: {', '.join(allowed_types)}"}), 400
    
    try:
        # Upload to Pinata
        url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
        headers = {
            "pinata_api_key": PINATA_API_KEY,
            "pinata_secret_api_key": PINATA_SECRET_KEY
        }
        
        # Prepare the file for upload
        files = {
            'file': (file.filename, file.stream, file.content_type)
        }
        
        response = requests.post(url, files=files, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            ipfs_hash = result['IpfsHash']
            # Return both the hash and a gateway URL for easy display
            return jsonify({
                "success": True,
                "ipfsHash": ipfs_hash,
                "url": f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}",
                "gatewayUrl": f"https://ipfs.io/ipfs/{ipfs_hash}"
            })
        else:
            return jsonify({"error": "Failed to upload to IPFS", "details": response.text}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/upload/json', methods=['POST'])
def upload_metadata_to_ipfs():
    """
    Upload JSON metadata to IPFS (useful for NFT metadata).
    Accepts JSON body with metadata.
    """
    if not PINATA_API_KEY or not PINATA_SECRET_KEY:
        return jsonify({"error": "Pinata API keys not configured"}), 500
    
    try:
        metadata = request.json
        
        url = "https://api.pinata.cloud/pinning/pinJSONToIPFS"
        headers = {
            "Content-Type": "application/json",
            "pinata_api_key": PINATA_API_KEY,
            "pinata_secret_api_key": PINATA_SECRET_KEY
        }
        
        response = requests.post(url, json=metadata, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            ipfs_hash = result['IpfsHash']
            return jsonify({
                "success": True,
                "ipfsHash": ipfs_hash,
                "url": f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}"
            })
        else:
            return jsonify({"error": "Failed to upload metadata", "details": response.text}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/users", methods=["GET"])
def list_users():
    """List all available demo users."""
    users = get_all_users()
    return jsonify({
        "users": [{"id": u["id"], "name": u["name"], "credit_score": u["credit_score"]} for u in users]
    })


@app.route("/api/user/<user_id>", methods=["GET"])
def get_user(user_id):
    """Get detailed info for a specific user."""
    user_data = get_user_data(user_id)
    if not user_data:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user_data)


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "service": "financial-coach-api"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
