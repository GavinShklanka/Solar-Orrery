"""Step 2 diagnostic: Feature engineering verification."""
import sys, json
sys.path.insert(0, '.')

from ingestion.omni_client import OMNIClient
from modeling.feature_engineering import build_features, run_feature_importance

# Parse OMNI
client = OMNIClient()
df = client.parse_all(1996, 2025)
print(f"Raw OMNI records: {len(df)}")

# Build features
X, y = build_features(df, target_horizon_hours=3)
print(f"Rows after cleaning: {len(X)}")
print(f"Feature count: {len(X.columns)}")
print(f"Features: {list(X.columns)}")
print()

# Feature importance
importance = run_feature_importance(X, y, top_n=15)
print("=== Top 15 Features by LightGBM Importance ===")
print(importance.to_string(index=False))

# Save results
with open("tmp_feat_results.txt", "w") as f:
    f.write(f"Rows after cleaning: {len(X)}\n")
    f.write(f"Feature count: {len(X.columns)}\n")
    f.write(f"\nTop 15 Features:\n")
    f.write(importance.to_string(index=False))
    
print("\nDone.")
