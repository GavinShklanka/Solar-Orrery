import sys, json
sys.path.insert(0, '.')
from ingestion.omni_client import OMNIClient

client = OMNIClient()
df = client.parse_all(1996, 2025)
diag = client.get_diagnostics()

with open("tmp_omni_diag.json", "w") as f:
    json.dump(diag, f, indent=2)

key_cols = ['B_scalar', 'Bx_GSE', 'By_GSM', 'Bz_GSM', 'flow_speed', 'proton_density', 'flow_pressure', 'alfven_mach', 'Kp', 'ap_index']
head5 = df[key_cols].head(5).to_string()
with open("tmp_omni_head5.txt", "w") as f:
    f.write(head5)

stats = df[['Bz_GSM', 'flow_speed', 'proton_density', 'Kp']].describe().to_string()
with open("tmp_omni_stats.txt", "w") as f:
    f.write(stats)

print("Done")
