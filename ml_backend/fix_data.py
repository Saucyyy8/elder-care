import pandas as pd
import csv

input_file = "wifi_fingerprints.csv"
output_file = "cleaned_fingerprints.csv"
# Focus ONLY on these two
valid_rooms = ["Room 301", "Room 302"]

cleaned_rows = []

with open(input_file, "r") as f:
    reader = csv.reader(f)
    header = next(reader)
    
    for i, row in enumerate(reader):
        if not row: continue
        
        # Hunt only for 301 or 302
        found_room = next((item.strip() for item in row if item.strip() in valid_rooms), None)
        
        if found_room:
            signals = []
            for item in row:
                try:
                    val = float(item)
                    if val < 0: signals.append(val)
                except ValueError: continue
            
            row_dict = {header[j]: signals[j] for j in range(min(len(header)-1, len(signals)))}
            row_dict['label'] = found_room
            cleaned_rows.append(row_dict)

df_clean = pd.DataFrame(cleaned_rows).fillna(-100)
df_clean.to_csv(output_file, index=False)

print("\n--- 🧹 ROOM PURGE COMPLETE ---")
print(f"✅ Cleaned data saved. Total rows: {len(df_clean)}")
print(f"Final Class Distribution:\n{df_clean['label'].value_counts()}")