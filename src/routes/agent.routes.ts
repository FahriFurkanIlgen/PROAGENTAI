import { Router, Request, Response } from 'express';
import { aiAgentService } from '../services/ai-agent.service';
import { jiraService } from '../services/jira.service';
import { AIAnalysisRequest, SprintPlanRequest } from '../types';

const router = Router();

/**
 * Proje gereksinimlerini analiz et
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const request: AIAnalysisRequest = req.body;
    
    if (!request.description) {
      return res.status(400).json({
        success: false,
        error: 'Proje açıklaması gerekli'
      });
    }

    const analysis = await aiAgentService.analyzeProjectRequirements(request);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Sprint planla
 */
router.post('/plan-sprint', async (req: Request, res: Response) => {
  try {
    const request: SprintPlanRequest = req.body;
    
    if (!request.teamCapacity || !request.teamMembers?.length) {
      return res.status(400).json({
        success: false,
        error: 'Takım kapasitesi ve üyeleri gerekli'
      });
    }

    // Mevcut issue'ları al
    if (!request.existingIssues) {
      request.existingIssues = await jiraService.getIssues();
    }

    const sprintPlan = await aiAgentService.planSprint(request);
    
    res.json({
      success: true,
      data: sprintPlan
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Görev önceliğini analiz et
 */
router.post('/analyze-priority', async (req: Request, res: Response) => {
  try {
    const { taskDescription, context } = req.body;
    
    if (!taskDescription) {
      return res.status(400).json({
        success: false,
        error: 'Görev açıklaması gerekli'
      });
    }

    const priority = await aiAgentService.analyzePriority(taskDescription, context);
    
    res.json({
      success: true,
      data: { priority }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Görev süresini tahmin et
 */
router.post('/estimate-effort', async (req: Request, res: Response) => {
  try {
    const { taskDescription } = req.body;
    
    if (!taskDescription) {
      return res.status(400).json({
        success: false,
        error: 'Görev açıklaması gerekli'
      });
    }

    const hours = await aiAgentService.estimateEffort(taskDescription);
    
    res.json({
      success: true,
      data: { estimatedHours: hours }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Görev açıklamasını iyileştir
 */
router.post('/improve-description', async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Görev başlığı gerekli'
      });
    }

    const improvedDescription = await aiAgentService.improveTaskDescription(title, description);
    
    res.json({
      success: true,
      data: { description: improvedDescription }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Proje raporu oluştur
 */
router.get('/report', async (req: Request, res: Response) => {
  try {
    const issues = await jiraService.getIssues();
    const report = await aiAgentService.generateReport(issues);
    
    res.json({
      success: true,
      data: { report }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Analiz et ve Jira'da görev oluştur
 */
router.post('/analyze-and-create', async (req: Request, res: Response) => {
  try {
    const request: AIAnalysisRequest = req.body;
    
    if (!request.description) {
      return res.status(400).json({
        success: false,
        error: 'Proje açıklaması gerekli'
      });
    }

    // AI ile analiz yap
    const analysis = await aiAgentService.analyzeProjectRequirements(request);
    
    // Önerilen görevleri Jira'da oluştur
    const createdIssues = [];
    for (const task of analysis.suggestedTasks) {
      const issue = await jiraService.createIssue({
        fields: {
          project: { key: process.env.JIRA_PROJECT_KEY || 'PROJ' },
          summary: task.title,
          description: task.description,
          issuetype: { name: task.type },
          priority: { name: task.priority },
          labels: analysis.tags
        }
      });
      createdIssues.push(issue);
    }
    
    res.json({
      success: true,
      message: `${createdIssues.length} görev oluşturuldu`,
      data: {
        analysis,
        createdIssues
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
