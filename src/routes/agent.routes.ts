import { Router, Request, Response } from 'express';
import { aiAgentService } from '../services/ai-agent.service';
import { jiraService } from '../services/jira.service';
import { AIAnalysisRequest, SprintPlanRequest, JiraIssue } from '../types';

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

/**
 * Günlük tamamlanan görevler raporu
 */
router.get('/daily-report', async (req: Request, res: Response) => {
  try {
    let completedToday: JiraIssue[] = [];
    let allIssues: JiraIssue[] = [];
    
    try {
      // Bugün tamamlanan görevleri al
      completedToday = await jiraService.getTodayCompletedIssues();
      
      // Tüm aktif görevleri al
      allIssues = await jiraService.getIssues('status != Done', 100);
    } catch (jiraError: any) {
      console.log('Jira verisi alınamadı, demo verilerle devam ediliyor:', jiraError.message);
      // Jira hatası varsa boş veri ile devam et, AI servisi demo verisi üretecek
    }
    
    // AI ile günlük rapor oluştur (demo mode'da mock veri üretir)
    const report = await aiAgentService.generateDailyReport(completedToday, allIssues);
    
    res.json({
      success: true,
      data: {
        report,
        completedCount: completedToday.length,
        totalCount: allIssues.length,
        completedIssues: completedToday
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Sprint ilerleme analizi
 */
router.post('/sprint-analysis', async (req: Request, res: Response) => {
  try {
    const { sprintId, boardId, teamMembers } = req.body;
    
    let sprintIssues: JiraIssue[] = [];
    
    try {
      if (sprintId) {
        // Sprint ID verilmişse o sprint'in görevlerini al
        sprintIssues = await jiraService.getSprintIssues(sprintId);
      } else if (boardId) {
        // Board ID verilmişse aktif sprint'i bul ve görevlerini al
        const activeSprint = await jiraService.getActiveSprint(boardId);
        if (!activeSprint) {
          return res.status(404).json({
            success: false,
            error: 'Aktif sprint bulunamadı'
          });
        }
        sprintIssues = await jiraService.getSprintIssues(activeSprint.id);
      } else {
        // Hiçbiri verilmemişse tüm aktif görevleri al
        sprintIssues = await jiraService.getIssues('status != Done', 100);
      }
    } catch (jiraError: any) {
      console.log('Jira verisi alınamadı, demo verilerle devam ediliyor:', jiraError.message);
      // Jira hatası varsa boş veri ile devam et
    }

    // Takım üyeleri listesi verilmemişse görevlerden çıkar
    let members = teamMembers;
    if (!members || members.length === 0) {
      const assignees = new Set<string>();
      sprintIssues.forEach(issue => {
        if (issue.fields.assignee?.emailAddress) {
          assignees.add(issue.fields.assignee.emailAddress);
        }
      });
      members = Array.from(assignees);
    }

    // AI ile sprint analizi yap
    const analysis = await aiAgentService.analyzeSprintProgress(sprintIssues, members);
    
    res.json({
      success: true,
      data: {
        ...analysis,
        totalIssues: sprintIssues.length,
        issues: sprintIssues
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Takım üyesi performans raporu
 */
router.get('/member-report/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    
    // Üyenin tüm görevlerini al
    const memberIssues = await jiraService.getIssuesByAssignee(email);
    
    // Bugün tamamlananları filtrele
    const today = new Date().toISOString().split('T')[0];
    const completedToday = memberIssues.filter(issue => 
      issue.fields.status?.name === 'Done' &&
      issue.fields.updated?.startsWith(today)
    );

    res.json({
      success: true,
      data: {
        member: email,
        totalTasks: memberIssues.length,
        completedToday: completedToday.length,
        inProgress: memberIssues.filter(issue => issue.fields.status?.name === 'In Progress').length,
        todo: memberIssues.filter(issue => issue.fields.status?.name === 'To Do').length,
        issues: memberIssues
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
