import firebase_admin
from firebase_admin import credentials, firestore

# Step 1: Initialize Firebase
cred = credentials.Certificate("firebase_key.json")  # Replace with your downloaded file name if different
firebase_admin.initialize_app(cred)
db = firestore.client()

# Step 2: Add sample farm data
def seed_sample_farm():
    farm_id = "farm001"
    data = {
        "name": "Raj Farm",
        "temperature": 31,
        "moisture": 72,
        "humidity": 60,
        "last_updated": firestore.SERVER_TIMESTAMP,
    }

    db.collection("farms").document(farm_id).set(data)
    print(f"✅ Sample farm data added with ID: {farm_id}")

# Step 3: Add Tamil translations
def seed_translations():
    ta_translations = {
        "temperature": "வெப்பநிலை",
        "moisture": "மண்ணின் ஈரப்பதம்",
        "humidity": "ஈரப்பதம்"
    }

    db.collection("translations").document("ta").set(ta_translations)
    print("✅ Tamil translations added!")

# Run setup
if __name__ == "__main__":
    seed_sample_farm()
    seed_translations()