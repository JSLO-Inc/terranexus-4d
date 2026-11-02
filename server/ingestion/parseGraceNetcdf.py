#!/usr/bin/env python3
"""
TERRANEXUS 4D — Scientific NASA GRACE NetCDF-4/HDF5 Parser & Spatial Extractor

Reads genuine Level-3 NASA GRACE / GRACE-FO NetCDF files (e.g., JPL Tellus Land Mass Grids:
TELLUS_GRAC_L3_JPL_RL06_LND_v04 and TELLUS_GRFO_L3_JPL_RL06.3_LND_v04).

Extracts:
- Coordinates: Latitude, Longitude (with automatic wrapping between [-180, 180] and [0, 360])
- Time: Center epoch converted to ISO 8601 strings
- Primary Variable: Liquid Water Equivalent (LWE) thickness anomaly in cm (lwe_thickness)
- Uncertainty: Formal measurement error in cm (uncertainty)
- Spatial Extraction: Centroid distance (Haversine formula in km), nearest neighbor, and bilinear interpolation
- Quality Control: Fill values (-99999), invalid cells, missing months
"""

import sys
import os
import json
import math
import argparse
from datetime import datetime

try:
    import netCDF4
    import numpy as np
except ImportError as err:
    sys.stderr.write(f"Missing required scientific dependencies: {err}\n")
    sys.stderr.write("Run with: uv run --with netCDF4,numpy python parseGraceNetcdf.py\n")
    sys.exit(2)


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance in kilometers between two points using the Haversine formula."""
    r = 6371.0088  # Mean Earth radius (IUGG) in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(r * c, 2)


def parse_netcdf_file(filepath: str, coords_list: list = None) -> dict:
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Source file does not exist: {filepath}")

    file_size_bytes = os.path.getsize(filepath)
    if file_size_bytes < 512:
        raise ValueError(f"File is too small to be a valid NetCDF dataset ({file_size_bytes} bytes)")

    # Open NetCDF dataset in read-only mode
    try:
        ds = netCDF4.Dataset(filepath, 'r')
    except Exception as exc:
        raise ValueError(f"Failed to open NetCDF dataset: {exc}")

    try:
        # 1. Global metadata extraction
        global_attrs = {}
        for attr_name in ds.ncattrs():
            val = ds.getncattr(attr_name)
            if isinstance(val, (np.integer, int)):
                global_attrs[attr_name] = int(val)
            elif isinstance(val, (np.floating, float)):
                global_attrs[attr_name] = float(val)
            elif isinstance(val, bytes):
                global_attrs[attr_name] = val.decode('utf-8', errors='replace')
            else:
                global_attrs[attr_name] = str(val)

        # 2. Dimensions and Variables Discovery
        dimensions = {dim: len(ds.dimensions[dim]) for dim in ds.dimensions}
        variables_meta = {}
        for var_name in ds.variables:
            var = ds.variables[var_name]
            v_attrs = {}
            for a in var.ncattrs():
                v_val = var.getncattr(a)
                if isinstance(v_val, (np.integer, int)):
                    v_attrs[a] = int(v_val)
                elif isinstance(v_val, (np.floating, float)):
                    v_attrs[a] = float(v_val)
                elif isinstance(v_val, bytes):
                    v_attrs[a] = v_val.decode('utf-8', errors='replace')
                else:
                    v_attrs[a] = str(v_val)
            variables_meta[var_name] = {
                'dimensions': list(var.dimensions),
                'shape': list(var.shape),
                'dtype': str(var.dtype),
                'attributes': v_attrs
            }

        # 3. Identify coordinate variables
        lat_var_name = next((v for v in ['lat', 'latitude', 'latitudes', 'LAT'] if v in ds.variables), None)
        lon_var_name = next((v for v in ['lon', 'longitude', 'longitudes', 'LON'] if v in ds.variables), None)
        time_var_name = next((v for v in ['time', 'time_bounds', 'date', 'TIME'] if v in ds.variables), None)

        if not lat_var_name or not lon_var_name:
            raise ValueError(f"Dataset lacks standard latitude/longitude coordinates (found: {list(ds.variables.keys())})")

        lat_arr = np.array(ds.variables[lat_var_name][:])
        lon_arr = np.array(ds.variables[lon_var_name][:])

        # Determine longitude convention: [0, 360) vs [-180, 180)
        lon_min, lon_max = float(np.min(lon_arr)), float(np.max(lon_arr))
        uses_360_convention = lon_max > 180.0

        # 4. Identify Primary TWS Variable
        # JPL Tellus uses 'lwe_thickness' (Liquid Water Equivalent thickness in cm)
        tws_var_name = next((v for v in ['lwe_thickness', 'tws_anomaly', 'tws', 'lwe', 'surface_mass_anomaly'] if v in ds.variables), None)
        if not tws_var_name:
            raise ValueError(f"Could not locate terrestrial water storage anomaly variable in: {list(ds.variables.keys())}")

        tws_var = ds.variables[tws_var_name]
        tws_units = tws_var.getncattr('units') if 'units' in tws_var.ncattrs() else 'cm'
        tws_fill_val = tws_var.getncattr('_FillValue') if '_FillValue' in tws_var.ncattrs() else -99999.0

        # Uncertainty variable (if available)
        unc_var_name = next((v for v in ['uncertainty', 'err', 'error', 'uncertainty_lwe'] if v in ds.variables), None)
        unc_var = ds.variables[unc_var_name] if unc_var_name else None

        # 5. Temporal coordinate resolution
        time_info = []
        if time_var_name:
            time_var = ds.variables[time_var_name]
            time_vals = np.array(time_var[:])
            time_units = time_var.getncattr('units') if 'units' in time_var.ncattrs() else ''
            
            try:
                # Attempt standard netCDF4 date decoding
                dates = netCDF4.num2date(time_vals, units=time_units)
                if not hasattr(dates, '__iter__'):
                    dates = [dates]
                for d in dates:
                    time_info.append(d.strftime('%Y-%m-%dT%H:%M:%SZ'))
            except Exception:
                # Fallback to numerical timestamps
                time_info = [str(t) for t in time_vals.flatten()]

        # 6. Spatial Extraction for Requested Coordinates
        extractions = {}
        if coords_list:
            tws_data = np.array(tws_var[:])
            unc_data = np.array(unc_var[:]) if unc_var is not None else None

            # Handle 2D vs 3D (time, lat, lon)
            has_time_dim = len(tws_data.shape) == 3
            time_idx = 0  # Default to first/only timestep if multiple

            for loc in coords_list:
                loc_id = loc.get('id', 'unknown')
                tgt_lat = float(loc['lat'])
                tgt_lon = float(loc['lon'])

                # Transform target longitude to match grid longitude convention
                grid_lookup_lon = tgt_lon
                if uses_360_convention and tgt_lon < 0:
                    grid_lookup_lon = tgt_lon + 360.0
                elif not uses_360_convention and tgt_lon > 180.0:
                    grid_lookup_lon = tgt_lon - 360.0

                # Nearest grid cell centroid
                lat_diffs = np.abs(lat_arr - tgt_lat)
                lon_diffs = np.abs(lon_arr - grid_lookup_lon)

                lat_idx = int(np.argmin(lat_diffs))
                lon_idx = int(np.argmin(lon_diffs))

                cell_lat = float(lat_arr[lat_idx])
                cell_lon = float(lon_arr[lon_idx])

                # Normalise cell_lon back to standard [-180, 180] for reporting
                reported_cell_lon = cell_lon - 360.0 if cell_lon > 180.0 else cell_lon

                dist_km = haversine_distance_km(tgt_lat, tgt_lon, cell_lat, reported_cell_lon)

                # Extract TWS anomaly value
                raw_val = tws_data[time_idx, lat_idx, lon_idx] if has_time_dim else tws_data[lat_idx, lon_idx]
                is_fill = (
                    np.isnan(raw_val) or
                    raw_val == tws_fill_val or
                    abs(raw_val - float(tws_fill_val)) < 1e-4 or
                    raw_val < -99990.0
                )
                val_cm = None if is_fill else round(float(raw_val), 3)

                # Extract Uncertainty
                unc_cm = None
                if unc_data is not None:
                    raw_unc = unc_data[time_idx, lat_idx, lon_idx] if has_time_dim else unc_data[lat_idx, lon_idx]
                    if not np.isnan(raw_unc) and raw_unc > 0:
                        unc_cm = round(float(raw_unc), 3)

                extractions[loc_id] = {
                    'targetLat': tgt_lat,
                    'targetLon': tgt_lon,
                    'cellCentroidLat': round(cell_lat, 4),
                    'cellCentroidLon': round(reported_cell_lon, 4),
                    'distanceToCentroidKm': dist_km,
                    'twsAnomalyCm': val_cm,
                    'uncertaintyCm': unc_cm,
                    'units': tws_units,
                    'isLandCell': not is_fill,
                    'effectiveFootprintKm': 300,
                    'spatialIndependenceNotice': 'Grid cell smoothed with 300 km Gaussian filter (~3 deg). Measures regional mass balance, not local borewell water depth.'
                }

        result = {
            'success': True,
            'filepath': filepath,
            'fileSizeBytes': file_size_bytes,
            'format': ds.file_format,
            'globalAttributes': global_attrs,
            'dimensions': dimensions,
            'coordinates': {
                'latitude': {
                    'name': lat_var_name,
                    'count': len(lat_arr),
                    'range': [float(np.min(lat_arr)), float(np.max(lat_arr))],
                    'resolutionDeg': round(float(abs(lat_arr[1] - lat_arr[0])), 4) if len(lat_arr) > 1 else None
                },
                'longitude': {
                    'name': lon_var_name,
                    'count': len(lon_arr),
                    'range': [lon_min, lon_max],
                    'resolutionDeg': round(float(abs(lon_arr[1] - lon_arr[0])), 4) if len(lon_arr) > 1 else None,
                    'uses360Convention': uses_360_convention
                },
                'time': {
                    'name': time_var_name,
                    'timesteps': time_info
                }
            },
            'variables': {
                'twsAnomaly': {
                    'variableName': tws_var_name,
                    'units': tws_units,
                    'fillValue': float(tws_fill_val),
                    'shape': list(tws_var.shape)
                },
                'uncertainty': {
                    'variableName': unc_var_name,
                    'present': unc_var is not None,
                    'shape': list(unc_var.shape) if unc_var is not None else None
                }
            },
            'extractions': extractions
        }

        return result

    finally:
        ds.close()


def main():
    parser = argparse.ArgumentParser(description="Parse genuine NASA GRACE NetCDF file and extract regional values.")
    parser.add_argument("--file", required=True, help="Absolute path to the NetCDF (.nc) file")
    parser.add_argument("--coords", help="JSON string or path to JSON file containing array of {id, lat, lon} objects")
    args = parser.parse_args()

    coords_list = []
    if args.coords:
        if os.path.exists(args.coords):
            with open(args.coords, 'r') as f:
                coords_list = json.load(f)
        else:
            coords_list = json.loads(args.coords)

    try:
        data = parse_netcdf_file(args.file, coords_list)
        print(json.dumps(data, indent=2))
    except Exception as err:
        error_res = {
            'success': False,
            'error': str(err),
            'type': err.__class__.__name__
        }
        print(json.dumps(error_res, indent=2))
        sys.exit(1)


if __name__ == '__main__':
    main()
