from flask import Flask, request, jsonify, abort
from flask_cors import CORS
import os
import requests
from dotenv import load_dotenv
from datetime import datetime
import uuid
import psycopg2
import torch
from torchvision import models, transforms
import torch.nn as nn
from io import BytesIO
from PIL import Image
import numpy as np

load_dotenv()

app = Flask(__name__)
CORS(app)

MODEL_PATH = "./recommender/accurate_style_model.pth"  
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

USER = os.getenv("user")
PASSWORD = os.getenv("password")
HOST = os.getenv("host")
PORT = os.getenv("port")
DBNAME = os.getenv("dbname")



PINATA_API_KEY = os.getenv("PINATA_API_KEY")
PINATA_SECRET_KEY = os.getenv("PINATA_SECRET_KEY")

def euclidean(a, b):
    a = np.asarray(a, dtype=np.float32)
    b = np.asarray(b, dtype=np.float32)
    return float(np.linalg.norm(a - b))

def load_engine():
    # Architecture must match training EXACTLY
    model = models.efficientnet_v2_s(weights=None)
    model.classifier = nn.Identity()
    
    # Load weights
    try:
        model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    except:
        return None, None
        
    model.to(device)
    model.eval()
    return model

transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])


model = load_engine()

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

@app.route('/api/user', methods=['POST'])
def sign_up():
    try:
        wallet_address = request.args.get("walletAddress")
        first_name = request.args.get("first_name")
        last_name = request.args.get("last_name")
        email = request.args.get("email")
        streetAddress = request.args.get("streetAddress")
        city = request.args.get("city")
        state = request.args.get("state")
        zip_code = request.args.get("zip_code")
        country = request.args.get("country")

        connection = psycopg2.connect(
                user=USER,
                password=PASSWORD,
                host=HOST,
                port=PORT,
                dbname=DBNAME
        )
        cursor = connection.cursor()
        cursor.execute("""
        INSERT INTO "Userbase"
        (id, first_name, last_name, email, address, city, state, zip, country)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (wallet_address, first_name, last_name, email, streetAddress, city, state, zip_code, country))

        connection.commit()
        return jsonify({"success": True}), 201
    finally:
        cursor.close()
        connection.close()

@app.route('/api/check-user', methods=['GET'])
def check_user():
    try:
        wallet_address = request.args.get("walletAddress")
        connection = psycopg2.connect(
                user=USER,
                password=PASSWORD,
                host=HOST,
                port=PORT,
                dbname=DBNAME
        )
        cursor = connection.cursor()
        cursor.execute("""
        SELECT id
        FROM "Userbase"
        WHERE id = %s
        """, (wallet_address,))

        return jsonify({"exists": cursor.fetchone() is not None})
    finally:
        cursor.close()
        connection.close()




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

@app.route('/api/vectorize', methods=['POST'])
def turn_to_vector():
    img_add = request.args.get("img_address")
    id = request.args.get("id")
    resp = requests.get(img_add, timeout=10)
    resp.raise_for_status()
    img = Image.open(BytesIO(resp.content)).convert("RGB")
    t_img = transform(img).unsqueeze(0).to(device)
                    
    with torch.no_grad():
        vec = model(t_img).cpu().numpy().flatten()
    
    vec = vec.astype(float).tolist()


    connection = psycopg2.connect(
                user=USER,
                password=PASSWORD,
                host=HOST,
                port=PORT,
                dbname=DBNAME
        )
    cursor = connection.cursor()
    cursor.execute("""
    UPDATE "Listings"
    SET vector = %s
    WHERE id = %s
    """, (vec, id))
    connection.commit()
    return jsonify({"vector": vec})



@app.route('/api/get-listings-user', methods=['GET'])
def obtain_shop_listings():
    wallet_id = request.args.get("wallet_id")
    offset = int(request.args.get("offset", 0))
    limit = int(request.args.get("limit", 20))
    
    connection = psycopg2.connect(
                user=USER,
                password=PASSWORD,
                host=HOST,
                port=PORT,
                dbname=DBNAME
        )
    cursor = connection.cursor()
    
    try:
        # Check if user has a taste vector
        user_vector = None
        if wallet_id:
            cursor.execute("""
            SELECT "Taste-vector"
            FROM "Userbase"
            WHERE id = %s
            """, (wallet_id,))
            user_vec = cursor.fetchone()
            if user_vec and user_vec[0]:
                user_vector = user_vec[0]
        
        # Get all unsold listings
        cursor.execute("""
        SELECT id, product_name, img_urls, price, size, category, wallet_address, vector
        FROM "Listings"
        WHERE sold = False
        ORDER BY created_at DESC
        """)
        listing_list = cursor.fetchall()
        
        # If user has a taste vector, sort by similarity
        if user_vector:
            # Filter out listings without vectors and sort by similarity
            listings_with_vectors = [l for l in listing_list if l[7] is not None]
            listings_without_vectors = [l for l in listing_list if l[7] is None]
            
            # Calculate similarities for listings with vectors
            similarities = []
            for listing in listings_with_vectors:
                score = euclidean(user_vector, listing[7])
                similarities.append((listing, score))
            
            # Sort by similarity (lower = more similar)
            similarities.sort(key=lambda x: x[1])
            
            # Combine sorted listings with those without vectors at the end
            sorted_listings = [item[0] for item in similarities] + listings_without_vectors
        else:
            # No taste vector, use recent order (already sorted by created_at DESC)
            sorted_listings = listing_list
        
        # Apply pagination
        paginated_listings = sorted_listings[offset:offset + limit]
        has_more = len(sorted_listings) > offset + limit
        
        # Convert to a more readable format for the frontend
        recommendations = [
            {
                "id": str(listing[0]),
                "product_name": listing[1],
                "img_url": listing[2][0] if isinstance(listing[2], list) and listing[2] else listing[2],
                "price": listing[3],
                "size": listing[4],
                "category": listing[5],
                "seller": listing[6]
            }
            for listing in paginated_listings
        ]
        
        return jsonify({
            "recommendations": recommendations,
            "has_more": has_more,
            "total": len(sorted_listings)
        })
    finally:
        cursor.close()
        connection.close()


@app.route('/api/add-like', methods=['PUT'])
def adjust_taste_with_save():
    listing_id = request.args.get("listing_id")
    wallet_id = request.args.get("wallet_id")

    connection = psycopg2.connect(
        user=USER,
        password=PASSWORD,
        host=HOST,
        port=PORT,
        dbname=DBNAME
    )
    cursor = connection.cursor()

    try:
        cursor.execute("""
        SELECT "Taste-vector"
        FROM "Userbase"
        WHERE id = %s
        """, (wallet_id,))

        og_vec_row = cursor.fetchone()
        og_vec = og_vec_row[0] if og_vec_row else None

        cursor.execute("""
        SELECT vector
        FROM "Listings"
        WHERE id = %s
        """, (listing_id,))
        listing_row = cursor.fetchone()
        if not listing_row:
            return jsonify({"error": "Listing not found"}), 404
        listing_vec = listing_row[0]

        cursor.execute("""
        SELECT saved
        FROM "Userbase"
        WHERE id = %s
        """, (wallet_id,))
        saved_row = cursor.fetchone()
        saved_list = (saved_row[0] if saved_row else None) or []
        total_saved = len(saved_list)

        # Update taste vector by averaging in the newly saved listing.
        # Assumes `saved` already includes this listing id.
        if not og_vec:
            updated_vec = listing_vec
        elif total_saved > 1:
            updated_vec = [float((x * (total_saved - 1) + y) / total_saved) for x, y in zip(og_vec, listing_vec)]
        else:
            updated_vec = listing_vec

        cursor.execute("""
        UPDATE "Userbase"
        SET "Taste-vector" = %s
        WHERE id = %s
        """, (updated_vec, wallet_id))

        connection.commit()
        return jsonify({"vector": updated_vec})
    finally:
        cursor.close()
        connection.close()


@app.route('/api/remove-like', methods=['PUT'])
def adjust_taste_with_unsave():
    listing_id = request.args.get("listing_id")
    wallet_id = request.args.get("wallet_id")

    connection = psycopg2.connect(
        user=USER,
        password=PASSWORD,
        host=HOST,
        port=PORT,
        dbname=DBNAME
    )
    cursor = connection.cursor()

    try:
        cursor.execute("""
        SELECT "Taste-vector"
        FROM "Userbase"
        WHERE id = %s
        """, (wallet_id,))

        og_vec_row = cursor.fetchone()
        og_vec = og_vec_row[0] if og_vec_row else None

        if not og_vec:
            # No taste vector to adjust
            return jsonify({"vector": None})

        cursor.execute("""
        SELECT vector
        FROM "Listings"
        WHERE id = %s
        """, (listing_id,))
        listing_row = cursor.fetchone()
        if not listing_row:
            return jsonify({"error": "Listing not found"}), 404
        listing_vec = listing_row[0]

        cursor.execute("""
        SELECT saved
        FROM "Userbase"
        WHERE id = %s
        """, (wallet_id,))
        saved_row = cursor.fetchone()
        saved_list = (saved_row[0] if saved_row else None) or []
        total_saved = len(saved_list)  # Count AFTER removal

        # Reverse the taste vector averaging.
        # Before removal, count was total_saved + 1
        # og_vec = (prev_vec * total_saved + listing_vec) / (total_saved + 1)
        # So: prev_vec = (og_vec * (total_saved + 1) - listing_vec) / total_saved
        if total_saved == 0:
            # No more saved items, reset taste vector to None or keep as is
            updated_vec = None
        else:
            n_before = total_saved + 1
            updated_vec = [float((x * n_before - y) / total_saved) for x, y in zip(og_vec, listing_vec)]

        cursor.execute("""
        UPDATE "Userbase"
        SET "Taste-vector" = %s
        WHERE id = %s
        """, (updated_vec, wallet_id))

        connection.commit()
        return jsonify({"vector": updated_vec})
    finally:
        cursor.close()
        connection.close()


@app.route('/api/get-recent-listings', methods=['GET'])
def get_recent_listings():
    """Get first 10 unsold listings for landing page"""
    connection = psycopg2.connect(
        user=USER,
        password=PASSWORD,
        host=HOST,
        port=PORT,
        dbname=DBNAME
    )
    cursor = connection.cursor()

    try:
        cursor.execute("""
        SELECT id, product_name, img_urls, price, size, condition, category, wallet_address
        FROM "Listings"
        WHERE sold = False
        ORDER BY created_at DESC
        LIMIT 10
        """)
        listings = cursor.fetchall()

        result = [
            {
                "id": str(listing[0]),
                "product_name": listing[1],
                "img_urls": listing[2],
                "price": listing[3],
                "size": listing[4],
                "condition": listing[5],
                "category": listing[6],
                "wallet_address": listing[7]
            }
            for listing in listings
        ]

        return jsonify({"listings": result})
    finally:
        cursor.close()
        connection.close()


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


"""@app.route("/api/user/<user_id>/listings", methods=["GET"])
def user_listings(user_id):"""
    


if __name__ == "__main__":
    app.run(debug=True, port=5000)
