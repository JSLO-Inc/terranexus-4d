/**
 * TERRANEXUS 4D — Scientific NetCDF Parser & Signature Validator
 * 
 * Provides TypeScript interfaces and execution harness for NetCDF-4/HDF5 parsing
 * and binary validation of genuine NASA GRACE datasets.
 */

import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface NetcdfCoordinates {
  latitude: {
    name: string;
    count: number;
    range: [number, number];
    resolutionDeg: number | null;
  };
  longitude: {
    name: string;
    count: number;
    range: [number, number];
    resolutionDeg: number | null;
    uses360Convention: boolean;
  };
  time: {
    name: string | null;
    timesteps: string[];
  };
}

export interface SpatialExtractionRecord {
  targetLat: number;
  targetLon: number;
  cellCentroidLat: number;
  cellCentroidLon: number;
  distanceToCentroidKm: number;
  twsAnomalyCm: number | null;
  uncertaintyCm: number | null;
  units: string;
  isLandCell: boolean;
  effectiveFootprintKm: number;
  spatialIndependenceNotice: string;
}

export interface NetcdfParseResult {
  success: boolean;
  filepath: string;
  fileSizeBytes: number;
  format: string;
  globalAttributes: Record<string, string | number>;
  dimensions: Record<string, number>;
  coordinates: NetcdfCoordinates;
  variables: {
    twsAnomaly: {
      variableName: string;
      units: string;
      fillValue: number;
      shape: number[];
    };
    uncertainty: {
      variableName: string | null;
      present: boolean;
      shape: number[] | null;
    };
  };
  extractions: Record<string, SpatialExtractionRecord>;
  error?: string;
}

export type NetcdfFormatSignature = 'NETCDF3' | 'NETCDF4_HDF5' | 'HTML_LOGIN_PAGE' | 'INVALID';

/**
 * Validates the binary file signature (magic bytes) to reject HTML or corrupt files.
 */
export function verifyNetcdfSignature(filepathOrBuffer: string | Buffer): {
  isValid: boolean;
  signature: NetcdfFormatSignature;
  description: string;
} {
  let buf: Buffer;
  if (typeof filepathOrBuffer === 'string') {
    if (!fs.existsSync(filepathOrBuffer)) {
      return { isValid: false, signature: 'INVALID', description: 'File does not exist on disk' };
    }
    const fd = fs.openSync(filepathOrBuffer, 'r');
    buf = Buffer.alloc(512);
    fs.readSync(fd, buf, 0, 512, 0);
    fs.closeSync(fd);
  } else {
    buf = filepathOrBuffer.subarray(0, 512);
  }

  // Check for HTML login page
  const textHead = buf.toString('utf-8', 0, Math.min(buf.length, 512)).toLowerCase();
  if (
    textHead.includes('<!doctype html') ||
    textHead.includes('<html') ||
    textHead.includes('oauth/authorize') ||
    textHead.includes('earthdata login')
  ) {
    return {
      isValid: false,
      signature: 'HTML_LOGIN_PAGE',
      description: 'Payload is an HTML login/redirect page, not a binary NetCDF file'
    };
  }

  // Check NetCDF-4 / HDF5 signature: [0x89, 0x48, 0x44, 0x46, 0x0D, 0x0A, 0x1A, 0x0A]
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x48 && // 'H'
    buf[2] === 0x44 && // 'D'
    buf[3] === 0x46 && // 'F'
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return {
      isValid: true,
      signature: 'NETCDF4_HDF5',
      description: 'Valid NetCDF-4 / HDF5 binary signature detected'
    };
  }

  // Check NetCDF classic signature: "CDF\x01" or "CDF\x02" or "CDF\x05"
  if (
    buf.length >= 4 &&
    buf[0] === 0x43 && // 'C'
    buf[1] === 0x44 && // 'D'
    buf[2] === 0x46 && // 'F'
    (buf[3] === 0x01 || buf[3] === 0x02 || buf[3] === 0x05)
  ) {
    return {
      isValid: true,
      signature: 'NETCDF3',
      description: `Valid NetCDF-3 classic binary signature detected (version ${buf[3]})`
    };
  }

  return {
    isValid: false,
    signature: 'INVALID',
    description: `Unknown or malformed file signature (first 8 bytes: ${buf.subarray(0, 8).toString('hex')})`
  };
}

function getUvPath(): string {
  if (process.env.UV_PATH && fs.existsSync(process.env.UV_PATH)) return process.env.UV_PATH;
  const localBin = path.join(process.env.USERPROFILE || 'C:\\Users\\joysa', '.local', 'bin', 'uv.exe');
  if (fs.existsSync(localBin)) return localBin;
  return 'uv';
}

/**
 * Executes the scientific Python NetCDF parsing engine via `uv run`.
 */
export async function parseGraceNetcdf(
  filepath: string,
  coordsList?: Array<{ id: string; lat: number; lon: number }>
): Promise<NetcdfParseResult> {
  const resolvedPath = path.resolve(filepath);

  // 1. Signature validation
  const sig = verifyNetcdfSignature(resolvedPath);
  if (!sig.isValid) {
    throw new Error(`Invalid file format: ${sig.description}`);
  }

  const scriptPath = path.join(__dirname, 'parseGraceNetcdf.py');
  const uvBinary = getUvPath();
  const args = ['run', '--with', 'netCDF4,numpy', 'python', scriptPath, '--file', resolvedPath];

  if (coordsList && coordsList.length > 0) {
    args.push('--coords', JSON.stringify(coordsList));
  }

  try {
    const { stdout, stderr } = await execFileAsync(uvBinary, args, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000
    });

    if (stderr && stderr.includes('Error')) {
      console.warn('[NetCDF Parser Stderr]:', stderr);
    }

    const result = JSON.parse(stdout) as NetcdfParseResult;
    if (!result.success) {
      throw new Error(result.error || 'Failed to parse NetCDF file');
    }

    return result;
  } catch (err: any) {
    throw new Error(`NetCDF scientific parser failed: ${err.message}`);
  }
}
