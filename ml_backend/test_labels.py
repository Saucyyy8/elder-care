import joblib
art = joblib.load("ensemble_model.pkl")
print("Labels:", art['le'].classes_)
