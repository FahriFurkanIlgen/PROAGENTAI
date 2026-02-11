import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST, before any other imports
const envPath = path.join(process.cwd(), '.env');
console.log('Loading .env from:', envPath);
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('Error loading .env:', result.error);
} else {
  console.log('✅ .env loaded successfully');
  console.log('OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
  console.log('JIRA_BASE_URL present:', !!process.env.JIRA_BASE_URL);
}

// Now import other modules AFTER dotenv is loaded
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jiraRoutes from './routes/jira.routes';
import agentRoutes from './routes/agent.routes';

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (public klasörü)
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/jira', jiraRoutes);
app.use('/api/agent', agentRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'ProAgentAI',
    version: '1.0.0'
  });
});

// Ana sayfa
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ProAgentAI Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
