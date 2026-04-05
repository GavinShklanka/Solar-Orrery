"""
OMNI2 Hourly Solar Wind Data Client.

Downloads annual ASCII files from NASA SPDF:
  https://spdf.gsfc.nasa.gov/pub/data/omni/low_res_omni/omni2_YYYY.dat

Parses the fixed-width OMNI2 format per the official documentation at:
  https://spdf.gsfc.nasa.gov/pub/data/omni/low_res_omni/omni2.text

Column positions are 1-indexed from OMNI2 spec. Python uses 0-indexed.
"""
import httpx
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

OMNI_BASE_URL = "https://spdf.gsfc.nasa.gov/pub/data/omni/low_res_omni/"
DEFAULT_DATA_DIR = Path(__file__).parent.parent / "data" / "omni"

# OMNI2 column definitions (0-indexed positions in whitespace-split row)
# Mapped from the official OMNI2 format description (omni2.text)
OMNI_COLUMNS = {
    0: ("year", None),           # Col 1: Year
    1: ("doy", None),            # Col 2: Day of year
    2: ("hour", None),           # Col 3: Hour
    8: ("B_scalar", 999.9),      # Col 9: |B| field magnitude average, nT
    12: ("Bx_GSE", 999.9),       # Col 13: Bx GSE/GSM, nT
    13: ("By_GSE", 999.9),       # Col 14: By GSE, nT
    14: ("Bz_GSE", 999.9),       # Col 15: Bz GSE, nT
    15: ("By_GSM", 999.9),       # Col 16: By GSM, nT
    16: ("Bz_GSM", 999.9),       # Col 17: Bz GSM, nT
    22: ("proton_temp", 9999999.0),  # Col 23: Proton temperature, K
    23: ("proton_density", 999.9),   # Col 24: Proton density, N/cm^3
    24: ("flow_speed", 9999.0),      # Col 25: Plasma flow speed, km/s
    28: ("flow_pressure", 99.99),    # Col 29: Flow pressure, nPa
    37: ("alfven_mach", 999.9),      # Col 38: Alfvén Mach number
    38: ("Kp", 99),                  # Col 39: Kp (×10, e.g. 3+=33)
    39: ("sunspot_number", 999),     # Col 40: Sunspot number
    40: ("Dst", 99999),              # Col 41: Dst index, nT
    49: ("ap_index", 999),           # Col 50: ap-index, nT
}


class OMNIClient:
    """Downloads, parses, and serves NASA OMNI2 hourly solar wind data."""

    def __init__(self, data_dir: Optional[str] = None, timeout: float = 120.0):
        self.data_dir = Path(data_dir) if data_dir else DEFAULT_DATA_DIR
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.timeout = timeout
        self._df: Optional[pd.DataFrame] = None

    def _file_path(self, year: int) -> Path:
        return self.data_dir / f"omni2_{year}.dat"

    async def download_year(self, year: int, force: bool = False) -> bool:
        """Download a single annual OMNI2 file if not already cached."""
        fpath = self._file_path(year)
        if fpath.exists() and not force:
            logger.debug(f"OMNI: {fpath.name} already cached.")
            return True

        url = f"{OMNI_BASE_URL}omni2_{year}.dat"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(url, headers={"User-Agent": "Vela/1.0"})
                resp.raise_for_status()
                fpath.write_text(resp.text)
                logger.info(f"OMNI: Downloaded {fpath.name} ({len(resp.text)} bytes)")
                return True
        except Exception as e:
            logger.error(f"OMNI: Failed to download {year}: {e}")
            return False

    async def download_range(self, start_year: int = 1996, end_year: int = 2025) -> int:
        """Download all annual files in range. Returns count of successful downloads."""
        success = 0
        for year in range(start_year, end_year + 1):
            if await self.download_year(year):
                success += 1
        logger.info(f"OMNI: Downloaded {success}/{end_year - start_year + 1} annual files.")
        return success

    def _parse_file(self, fpath: Path) -> pd.DataFrame:
        """Parse a single OMNI2 annual file into a DataFrame."""
        rows = []
        with open(fpath, "r") as f:
            for line in f:
                parts = line.split()
                if len(parts) < 50:
                    continue
                row = {}
                for col_idx, (name, fill) in OMNI_COLUMNS.items():
                    try:
                        val = float(parts[col_idx])
                        row[name] = val
                    except (ValueError, IndexError):
                        row[name] = np.nan
                rows.append(row)
        return pd.DataFrame(rows)

    def parse_all(self, start_year: int = 1996, end_year: int = 2025) -> pd.DataFrame:
        """Parse all cached annual files and build a single DataFrame with UTC datetime index."""
        frames = []
        for year in range(start_year, end_year + 1):
            fpath = self._file_path(year)
            if not fpath.exists():
                logger.warning(f"OMNI: Missing file for {year}, skipping.")
                continue
            df = self._parse_file(fpath)
            frames.append(df)
            logger.debug(f"OMNI: Parsed {fpath.name} — {len(df)} rows")

        if not frames:
            logger.error("OMNI: No data files parsed.")
            return pd.DataFrame()

        df = pd.concat(frames, ignore_index=True)

        # Build UTC datetime index
        df["datetime"] = pd.to_datetime(
            df["year"].astype(int).astype(str) + " " +
            df["doy"].astype(int).astype(str) + " " +
            df["hour"].astype(int).astype(str),
            format="%Y %j %H",
            utc=True
        )
        df = df.set_index("datetime").sort_index()

        # Replace fill values with NaN
        for col_idx, (name, fill) in OMNI_COLUMNS.items():
            if fill is not None and name in df.columns:
                df[name] = df[name].replace(fill, np.nan)
                # Also catch slight float precision issues
                if isinstance(fill, float):
                    df.loc[df[name] >= fill * 0.999, name] = np.nan

        # Convert Kp from ×10 integer to float (e.g. 33 -> 3.3, 40 -> 4.0)
        if "Kp" in df.columns:
            df["Kp"] = df["Kp"] / 10.0

        # Drop helper columns
        df = df.drop(columns=["year", "doy", "hour"], errors="ignore")

        self._df = df
        logger.info(f"OMNI: Parsed {len(df)} total hourly records, "
                     f"{df.index.min()} to {df.index.max()}")
        return df

    def get_dataframe(self) -> Optional[pd.DataFrame]:
        """Return the cached DataFrame, or None if not yet parsed."""
        return self._df

    def get_diagnostics(self) -> dict:
        """Return diagnostic information about the loaded dataset."""
        if self._df is None or self._df.empty:
            return {"status": "not_loaded"}

        df = self._df
        key_cols = ["Bz_GSM", "flow_speed", "proton_density", "Kp"]
        missing = {}
        for col in key_cols:
            if col in df.columns:
                pct = df[col].isna().mean() * 100
                missing[col] = round(pct, 2)

        return {
            "status": "loaded",
            "total_records": len(df),
            "first_record": str(df.index.min()),
            "last_record": str(df.index.max()),
            "missing_pct": missing,
            "columns": list(df.columns),
        }
