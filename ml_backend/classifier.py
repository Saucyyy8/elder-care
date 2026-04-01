import pandas as pd
import csv
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib

# 1. Manual Load
data_rows = []
try:
    with open("wifi_fingerprints.csv", "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            data_rows.append(row)
except FileNotFoundError:
    print("Error: wifi_fingerprints.csv not found!")
    exit()

df = pd.DataFrame(data_rows)

# 2. SEPARATE AND CLEAN
y = df['label']
X = df.drop('label', axis=1)

# Force signal values to numeric
X = X.apply(lambda x: pd.to_numeric(x, errors='coerce')).fillna(-100)

# --- THE FIX: NUCLEAR OPTION FOR COLUMN NAMES ---
# This forces every single BSSID header to be a string, no exceptions.
X.columns = [str(col) for col in X.columns]

# Debug Check: This should only print {<class 'str'>}
print(f"Column name types found: {set([type(c) for c in X.columns])}")
print(f"Data shape: {X.shape} (Rows, BSSIDs)")

# 3. RANDOMIZE & SPLIT
# 'shuffle=True' is default, but we'll be explicit for your hackathon requirement
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, shuffle=True
)

# 4. TRAIN
print("Training the Random Forest...")
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 5. RESULTS
accuracy = model.score(X_test, y_test)
print(f"✅ Accuracy: {accuracy * 100:.2f}%")

# 6. SAVE
joblib.dump((model, list(X.columns)), "room_model.pkl")
print("🚀 Model saved to room_model.pkl")