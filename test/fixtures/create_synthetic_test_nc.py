#!/usr/bin/env python3
"""
TERRANEXUS 4D — Synthetic NetCDF Test Fixture Generator
STRICTLY FOR ISOLATED UNIT TESTING OF NETCDF PARSING MECHANICS.
NOT A GENUINE NASA DATASET.

Models the exact grid dimensions and variable structures of official
NASA JPL Tellus Level-3 monthly mass grids:
- Resolution: 0.5 degree x 0.5 degree
- Dimensions: lat=360 (-89.75 to +89.75), lon=720 (0.25 to 359.75), time=1
- Variables: lwe_thickness (cm), uncertainty (cm)
"""

import os
import netCDF4
import numpy as np

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'synthetic_grace_unit_test.nc')

def generate_fixture():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Create NetCDF-4 file
    ds = netCDF4.Dataset(OUTPUT_FILE, 'w', format='NETCDF4')
    
    # Global attributes (explicitly labeled SYNTHETIC TEST FIXTURE)
    ds.title = "TERRANEXUS 4D Synthetic Test Grid (Unit Test Fixture Only)"
    ds.institution = "Terranexus Test Framework"
    ds.source = "Synthetic Test Fixture - Not NASA Measurements"
    ds.comment = "Unit test fixture for validating NetCDF-4 parser dimensions and spatial extraction mechanics."
    ds.Conventions = "CF-1.6"
    
    # Dimensions: 360 latitudes (0.5 deg), 720 longitudes (0.5 deg), 1 time step
    ds.createDimension('lat', 360)
    ds.createDimension('lon', 720)
    ds.createDimension('time', 1)
    
    # Coordinate variables
    lat_var = ds.createVariable('lat', 'f4', ('lat',))
    lat_var.units = 'degrees_north'
    lat_var.long_name = 'latitude'
    lat_var[:] = np.linspace(-89.75, 89.75, 360)
    
    lon_var = ds.createVariable('lon', 'f4', ('lon',))
    lon_var.units = 'degrees_east'
    lon_var.long_name = 'longitude'
    lon_var[:] = np.linspace(0.25, 359.75, 720) # 0 to 360 convention
    
    time_var = ds.createVariable('time', 'f8', ('time',))
    time_var.units = 'days since 2002-01-01 00:00:00'
    time_var.calendar = 'standard'
    time_var[:] = [5620.0] # ~ 2017-05-23
    
    # Primary TWS Anomaly variable (cm LWE)
    tws_var = ds.createVariable('lwe_thickness', 'f4', ('time', 'lat', 'lon'), fill_value=-99999.0)
    tws_var.units = 'cm'
    tws_var.long_name = 'Liquid Water Equivalent Thickness (Synthetic)'
    
    # Uncertainty variable
    unc_var = ds.createVariable('uncertainty', 'f4', ('time', 'lat', 'lon'), fill_value=-99999.0)
    unc_var.units = 'cm'
    unc_var.long_name = 'Measurement Uncertainty (Synthetic)'
    
    # Fill array with default fill_values
    data = np.full((1, 360, 720), -99999.0, dtype=np.float32)
    unc_data = np.full((1, 360, 720), -99999.0, dtype=np.float32)
    
    # Set known test values for all 7 regional Indian loci
    test_loci = [
        ('locus-indogangetic-ludhiana', 30.9010, 75.8573, -21.45, 1.95),
        ('locus-khetri-rajasthan', 28.0039, 75.7878, -14.20, 2.10),
        ('locus-deccan-pune', 18.5204, 73.8567, +3.80, 2.05),
        ('locus-zawar-udaipur', 24.3564, 73.7161, -8.60, 1.88),
        ('locus-dharwar-kolar', 12.9602, 78.2712, -4.15, 2.30),
        ('locus-singhbhum-jharkhand', 22.5804, 86.4800, +1.25, 2.15),
        ('locus-godavari-kothagudem', 17.5511, 80.6178, +0.90, 1.98),
    ]
    
    for locus_id, lat, lon, val, unc in test_loci:
        lat_idx = int(np.argmin(np.abs(lat_var[:] - lat)))
        lon_idx = int(np.argmin(np.abs(lon_var[:] - lon)))
        data[0, lat_idx, lon_idx] = val
        unc_data[0, lat_idx, lon_idx] = unc
    
    tws_var[:] = data
    unc_var[:] = unc_data
    
    ds.close()
    print(f"Created synthetic test fixture at {OUTPUT_FILE} (360x720 0.5-deg grid)")

if __name__ == '__main__':
    generate_fixture()
