import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report
import joblib

# 1. LOAD & CLEAN
df = pd.read_csv("cleaned_fingerprints.csv")
y_raw = df['label']
X_raw = df.drop('label', axis=1).apply(pd.to_numeric).fillna(-100)

# 2. DATA AUGMENTATION (The Noise Shield)
def augment_rssi(X, y, iterations=2, noise_std=2.5):
    X_list, y_list = [X], [y]
    for _ in range(iterations):
        # Add random Gaussian noise to simulate signal drift
        noise = np.random.normal(0, noise_std, X.shape)
        X_noisy = (X + noise).clip(-100, 0) # Keep signals in valid range
        X_list.append(X_noisy)
        y_list.append(y)
    return pd.concat(X_list), pd.concat(y_list)

X_aug, y_aug = augment_rssi(X_raw, y_raw)

# 3. RELATIVE RSSI & ENCODING
X_rel = X_aug.apply(lambda row: row - row.max(), axis=1).fillna(-100)
X_rel.columns = [str(c) for c in X_rel.columns]

le = LabelEncoder()
y_encoded = le.fit_transform(y_aug)

# 4. TRAIN XGBOOST (The Ensemble Brain)
X_train, X_test, y_train, y_test = train_test_split(X_rel, y_encoded, test_size=0.15, stratify=y_encoded)

print(f"Training on {len(X_train)} augmented samples...")
model = XGBClassifier(n_estimators=150, max_depth=5, learning_rate=0.1, subsample=0.8)
model.fit(X_train, y_train)

# 5. SAVE WITH METADATA
artifacts = {
    'model': model,
    'features': list(X_rel.columns),
    'le': le
}
joblib.dump(artifacts, "ensemble_model.pkl")
print(f"✅ Ensemble Accuracy: {model.score(X_test, y_test)*100:.2f}%")