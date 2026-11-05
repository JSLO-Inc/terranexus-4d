import express from 'express';
import { apiRegistryService } from './apiRegistryService';
import { discoveryEngine } from './discoveryEngine';

export const managementRouter = express.Router();

// GET Overview Stats
managementRouter.get('/overview', (req, res) => {
  const apis = apiRegistryService.getAllApis();
  const totalApis = apis.length;
  const activeApis = apis.filter(a => a.status === 'ACTIVE').length;
  const healthyApis = apis.filter(a => a.health === 'HEALTHY').length;
  const noKeyApis = apis.filter(a => a.authType === 'NO_KEY').length;
  const uptimeSeconds = Math.floor(process.uptime());
  const memUsageMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  const candidates = discoveryEngine.getCandidates();

  res.json({
    success: true,
    stats: {
      totalApis,
      activeApis,
      healthyApis,
      noKeyApis,
      candidateCount: candidates.length,
      uptimeSeconds,
      heapUsedMb: memUsageMb,
      nodeVersion: process.version,
      port: process.env.PORT || 3001
    }
  });
});

// GET All APIs
managementRouter.get('/apis', (req, res) => {
  res.json({ success: true, apis: apiRegistryService.getAllApis() });
});

// POST Add New API
managementRouter.post('/apis', (req, res) => {
  try {
    const { name, provider, category, authType, baseUrl, documentationUrl, description, endpoints } = req.body;
    if (!name || !baseUrl) {
      return res.status(400).json({ success: false, error: 'Name and Base URL are required fields.' });
    }

    const created = apiRegistryService.addApi({
      name: String(name).trim(),
      provider: provider ? String(provider).trim() : 'Independent Community',
      category: category || 'DISCOVERY',
      authType: authType || 'NO_KEY',
      status: 'ACTIVE',
      baseUrl: String(baseUrl).trim(),
      documentationUrl: documentationUrl ? String(documentationUrl).trim() : baseUrl,
      description: description ? String(description).trim() : 'Registered data service.',
      health: 'HEALTHY',
      endpoints: Array.isArray(endpoints) ? endpoints : [],
      isAutonomous: false
    });

    res.json({ success: true, api: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT Update API
managementRouter.put('/apis/:id', (req, res) => {
  const updated = apiRegistryService.updateApi(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'API not found' });
  }
  res.json({ success: true, api: updated });
});

// DELETE API
managementRouter.delete('/apis/:id', (req, res) => {
  const deleted = apiRegistryService.deleteApi(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'API not found' });
  }
  res.json({ success: true, message: 'API removed from registry.' });
});

// POST Toggle API Status
managementRouter.post('/apis/:id/toggle', (req, res) => {
  const toggled = apiRegistryService.toggleApiStatus(req.params.id);
  if (!toggled) {
    return res.status(404).json({ success: false, error: 'API not found' });
  }
  res.json({ success: true, api: toggled });
});

// POST Test Specific API Connection
managementRouter.post('/apis/:id/test', async (req, res) => {
  const api = apiRegistryService.getApiById(req.params.id);
  if (!api) {
    return res.status(404).json({ success: false, error: 'API not found' });
  }

  const result = await apiRegistryService.testApiConnection(api.baseUrl, api.headers);
  const health = result.success ? 'HEALTHY' : result.statusCode === 401 || result.statusCode === 403 ? 'DEGRADED' : 'DOWN';
  apiRegistryService.updateApi(api.id, {
    health,
    lastPingMs: result.latencyMs,
    lastCheckedAt: new Date().toISOString()
  });

  res.json({ success: true, result });
});

// GET Candidates
managementRouter.get('/discovery/candidates', (req, res) => {
  res.json({ success: true, candidates: discoveryEngine.getCandidates() });
});

// POST Run Discovery Scan
managementRouter.post('/discovery/scan', async (req, res) => {
  try {
    const report = await discoveryEngine.runAutonomousDiscoveryScan();
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Promote Candidate
managementRouter.post('/discovery/promote', (req, res) => {
  const { candidateId } = req.body;
  if (!candidateId) {
    return res.status(400).json({ success: false, error: 'candidateId is required' });
  }

  const promoted = discoveryEngine.promoteCandidate(candidateId);
  if (!promoted) {
    return res.status(404).json({ success: false, error: 'Candidate not found or could not be promoted' });
  }

  res.json({ success: true, api: promoted });
});

// POST Test Console Probe
managementRouter.post('/console/send', async (req, res) => {
  try {
    const { url, headers } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required.' });
    }

    const result = await apiRegistryService.testApiConnection(url, headers || {});
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Credentials Vault
managementRouter.get('/vault', (req, res) => {
  res.json({ success: true, vault: apiRegistryService.getCredentialsVault() });
});

// GET Request Logs
managementRouter.get('/logs', (req, res) => {
  const status = req.query.status as string | undefined;
  const path = req.query.path as string | undefined;
  res.json({ success: true, logs: apiRegistryService.getRequestLogs(status, path) });
});

// GET Circuit Breakers
managementRouter.get('/circuit-breakers', (req, res) => {
  res.json({ success: true, breakers: apiRegistryService.getCircuitBreakers() });
});

// POST Reset Circuit Breaker
managementRouter.post('/circuit-breakers/:name/reset', (req, res) => {
  const reset = apiRegistryService.resetCircuitBreaker(req.params.name);
  if (!reset) {
    return res.status(404).json({ success: false, error: 'Circuit breaker not found' });
  }
  res.json({ success: true, message: `Circuit breaker ${req.params.name} reset to CLOSED.` });
});

// GET Export Registry
managementRouter.get('/export', (req, res) => {
  const apis = apiRegistryService.getAllApis();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="terranexus-api-registry.json"');
  res.send(JSON.stringify(apis, null, 2));
});
