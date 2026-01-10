from fastapi import FastAPI, UploadFile, File
from PIL import Image
import torch
import torch.nn as nn
from torchvision import models, transforms
import io
import os
import numpy as np
from sklearn.neighbors import NearestNeighbors

# --- CONFIGURATION ---
MODEL_PATH = "accurate_style_model.pth"  # Your trained model
IMAGE_DB_FOLDER = "test_images"          # Folder with your shop's inventory images
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

app = FastAPI()

# --- 1. LOAD THE MODEL ---
# This runs once when the server starts
def load_engine():
    print("⏳ Loading Model...")
    # Architecture must match training EXACTLY
    model = models.efficientnet_v2_s(weights=None)
    model.classifier = nn.Identity()
    
    # Load weights
    try:
        model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    except:
        print(f"⚠️ Warning: Could not find {MODEL_PATH}. Server starting empty.")
        return None, None
        
    model.to(device)
    model.eval()
    return model

# --- 2. PREPARE THE DATABASE ---
# In a real startup, this would be Pinecone/Milvus. 
# For this MVP, we store vectors in RAM.
print("📦 Indexing Shop Inventory...")
model = load_engine()
db_vectors = []
db_metadata = [] # Stores filenames, prices, etc.

if model:
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # Scan the folder and vectorize everything
    if os.path.exists(IMAGE_DB_FOLDER):
        for fname in os.listdir(IMAGE_DB_FOLDER):
            if fname.lower().endswith(('.png', '.jpg', '.jpeg')):
                path = os.path.join(IMAGE_DB_FOLDER, fname)
                try:
                    img = Image.open(path).convert('RGB')
                    t_img = transform(img).unsqueeze(0).to(device)
                    
                    with torch.no_grad():
                        vec = model(t_img).cpu().numpy().flatten()
                    
                    db_vectors.append(vec)
                    db_metadata.append({"filename": fname, "path": path})
                except:
                    pass

    # Initialize the Search Algorithm
    if len(db_vectors) > 0:
        knn = NearestNeighbors(n_neighbors=5, metric='cosine')
        knn.fit(db_vectors)
        print(f"✅ Indexed {len(db_vectors)} items. Server Ready!")
    else:
        print("⚠️ No images found in 'test_images'. Add some to search!")

# --- 3. THE API ENDPOINT ---
@app.post("/search")
async def search_style(file: UploadFile = File(...)):
    """
    1. Receives an image upload from the App.
    2. Converts it to a style vector.
    3. Returns the top 5 similar items from the shop.
    """
    if not model or len(db_vectors) == 0:
        return {"error": "Server not ready or empty database."}

    # A. Read Image
    image_data = await file.read()
    img = Image.open(io.BytesIO(image_data)).convert("RGB")
    
    # B. Vectorize
    t_img = transform(img).unsqueeze(0).to(device)
    with torch.no_grad():
        query_vector = model(t_img).cpu().numpy().reshape(1, -1)
        
    # C. Search
    # Find top 5 matches
    distances, indices = knn.kneighbors(query_vector)
    
    # D. Format Results
    results = []
    for rank, idx in enumerate(indices[0]):
        item = db_metadata[idx]
        score = 1 - distances[0][rank] # Similarity %
        
        results.append({
            "rank": rank + 1,
            "filename": item['filename'],
            "match_score": float(f"{score:.2f}"), # Convert numpy float to python float
            "image_url": f"http://localhost:8000/images/{item['filename']}" # Mock URL
        })
        
    return {"results": results}

# Helper to verify server is running
@app.get("/")
def home():
    return {"message": "Depop Style Engine is Online 🟢"}