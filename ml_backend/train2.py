import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib

# 1. LOAD
df = pd.read_csv("cleaned_fingerprints.csv")
y_raw = df['label']
X_raw = df.drop('label', axis=1).apply(pd.to_numeric).fillna(-100)

# 2. AUGMENT (Crucial for the 'Human Shield' effect)
def augment_rssi(X, y, iterations=2, noise_std=2.0):
    X_list, y_list = [X], [y]
    for _ in range(iterations):
        noise = np.random.normal(0, noise_std, X.shape)
        X_noisy = (X + noise).clip(-100, 0)
        X_list.append(X_noisy)
        y_list.append(y)
    return pd.concat(X_list), pd.concat(y_list)

X_aug, y_aug = augment_rssi(X_raw, y_raw)

# 3. RELATIVE RSSI
X_rel = X_aug.apply(lambda row: row - row.max(), axis=1).fillna(-100)
X_rel.columns = [str(c) for c in X_rel.columns]

le = LabelEncoder()
y_encoded = le.fit_transform(y_aug)

# 4. XGBOOST BINARY TRAINING
X_train, X_test, y_train, y_test = train_test_split(X_rel, y_encoded, test_size=0.15, stratify=y_encoded)

model = XGBClassifier(
    n_estimators=100, 
    max_depth=4, 
    learning_rate=0.1, 
    objective='binary:logistic' # Optimized for 2-class
)
model.fit(X_train, y_train)

# 5. SAVE
joblib.dump({'model': model, 'features': list(X_rel.columns), 'le': le}, "ensemble_model.pkl")
print(f"🚀 Binary Model Ready! Accuracy: {model.score(X_test, y_test)*100:.2f}%")