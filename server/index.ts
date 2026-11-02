import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateScientificExplanation } from './aiService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health & System Status Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    platform: 'TERRANEXUS 4D Backend API',
    status: 'ONLINE',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5)
  });
});

// Nexus AI Scientific Intelligence Explanation Endpoint
app.post('/api/ai/explain', async (req, res) => {
  try {
    const { query, context } = req.body;
    if (!query || !context) {
      return res.status(400).json({ error: 'Missing query or context payload' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const result = await generateScientificExplanation(query, context, apiKey);

    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error('Error generating scientific explanation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate scientific explanation',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`[TERRANEXUS 4D] Backend Server running on http://localhost:${PORT}`);
  console.log(`[TERRANEXUS 4D] Gemini AI Status: ${process.env.GEMINI_API_KEY ? 'CONFIGURED' : 'OFFLINE MODE (Local Scientific Rules Active)'}`);
});
