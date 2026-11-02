#!/usr/bin/env python3
"""
TERRANEXUS 4D — Authentic NASA Data Acquisition via official NASA earthaccess library.
Handles authentic NASA Earthdata token exchange, cookie sessions, and Cumulus cloud downloads.
"""

import os
import sys
import json
import hashlib
import dotenv

dotenv.load_dotenv()

try:
    import earthaccess
except ImportError:
    sys.stderr.write("earthaccess library not found. Run via uv run --with earthaccess,python-dotenv\n")
    sys.exit(2)

RAW_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'raw')
os.makedirs(RAW_DIR, exist_ok=True)

def compute_sha256(filepath: str) -> str:
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

def verify_netcdf_signature(filepath: str) -> dict:
    with open(filepath, 'rb') as f:
        buf = f.read(512)
    
    text_head = buf.decode('utf-8', errors='ignore').lower()
    if '<!doctype html' in text_head or '<html' in text_head or 'earthdata login' in text_head:
        return {'isValid': False, 'signature': 'HTML_LOGIN_PAGE'}
    
    # Check NetCDF-4 / HDF5 signature
    if len(buf) >= 8 and buf[:8] == b'\x89HDF\r\n\x1a\n':
        return {'isValid': True, 'signature': 'NETCDF4_HDF5'}
    
    # Check NetCDF-3 signature
    if len(buf) >= 4 and buf[:3] == b'CDF' and buf[3] in [1, 2, 5]:
        return {'isValid': True, 'signature': f'NETCDF3_v{buf[3]}'}
    
    return {'isValid': False, 'signature': 'INVALID'}

def download_granule(granule_url: str, output_filename: str = None) -> dict:
    auth = earthaccess.login(strategy="environment")
    if not auth.authenticated:
        return {
            'success': False,
            'status': 'AUTHENTICATION_FAILED',
            'error': 'earthaccess could not authenticate with provided environment credentials'
        }

    # Use authenticated earthaccess session to stream file
    session = earthaccess.get_requests_https_session()
    
    target_filename = output_filename or os.path.basename(granule_url)
    dest_path = os.path.join(RAW_DIR, target_filename)

    try:
        resp = session.get(granule_url, stream=True, timeout=60)
        if resp.status_code != 200:
            return {
                'success': False,
                'status': f'HTTP_{resp.status_code}',
                'httpStatus': resp.status_code,
                'error': f'Failed with HTTP {resp.status_code}: {resp.reason}'
            }
        
        # Stream download directly to raw file
        with open(dest_path, 'wb') as f:
            for chunk in resp.iter_content(chunk_size=32768):
                if chunk:
                    f.write(chunk)
        
        file_size = os.path.getsize(dest_path)
        sig = verify_netcdf_signature(dest_path)
        sha256 = compute_sha256(dest_path)

        if not sig['isValid']:
            # Delete corrupted/HTML file
            os.remove(dest_path)
            return {
                'success': False,
                'status': 'INVALID_SIGNATURE',
                'signature': sig['signature'],
                'fileSizeBytes': file_size,
                'error': f'Downloaded file is not a valid NetCDF binary ({sig["signature"]})'
            }

        return {
            'success': True,
            'status': 'SUCCESS',
            'filename': target_filename,
            'filepath': dest_path,
            'fileSizeBytes': file_size,
            'sha256': sha256,
            'signature': sig['signature']
        }
    except Exception as exc:
        if os.path.exists(dest_path):
            os.remove(dest_path)
        return {
            'success': False,
            'status': 'DOWNLOAD_EXCEPTION',
            'error': str(exc)
        }

if __name__ == '__main__':
    url = sys.argv[1] if len(sys.argv) > 1 else "https://archive.podaac.earthdata.nasa.gov/podaac-ops-cumulus-protected/TELLUS_GRAC_L3_JPL_RL06_LND_v04/GRD-3_2017143-2017180_GRAC_JPLEM_BA01_0600_LND_v04.nc"
    fname = sys.argv[2] if len(sys.argv) > 2 else "GRD-3_2017143-2017180_GRAC_JPLEM_BA01_0600_LND_v04.nc"
    res = download_granule(url, fname)
    print(json.dumps(res, indent=2))
