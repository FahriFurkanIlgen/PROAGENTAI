import { Router, Request, Response } from 'express';
import { jiraService } from '../services/jira.service';
import { JiraIssue } from '../types';

const router = Router();

/**
 * Jira bağlantısını test et
 */
router.get('/test', async (req: Request, res: Response) => {
  try {
    const isConnected = await jiraService.testConnection();
    res.json({
      success: isConnected,
      message: isConnected ? 'Jira bağlantısı başarılı' : 'Jira bağlantısı başarısız'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Proje bilgilerini getir
 */
router.get('/project/:key?', async (req: Request, res: Response) => {
  try {
    const project = await jiraService.getProject(req.params.key);
    res.json({
      success: true,
      data: project
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Issue'ları listele
 */
router.get('/issues', async (req: Request, res: Response) => {
  try {
    const jql = req.query.jql as string;
    const maxResults = parseInt(req.query.maxResults as string) || 50;
    
    const issues = await jiraService.getIssues(jql, maxResults);
    res.json({
      success: true,
      count: issues.length,
      data: issues
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Belirli bir issue'yu getir
 */
router.get('/issue/:key', async (req: Request, res: Response) => {
  try {
    const issue = await jiraService.getIssue(req.params.key);
    res.json({
      success: true,
      data: issue
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Yeni issue oluştur
 */
router.post('/issue', async (req: Request, res: Response) => {
  try {
    const issueData: JiraIssue = req.body;
    const createdIssue = await jiraService.createIssue(issueData);
    res.status(201).json({
      success: true,
      message: 'Issue başarıyla oluşturuldu',
      data: createdIssue
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Issue güncelle
 */
router.put('/issue/:key', async (req: Request, res: Response) => {
  try {
    await jiraService.updateIssue(req.params.key, req.body);
    res.json({
      success: true,
      message: 'Issue başarıyla güncellendi'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Issue sil
 */
router.delete('/issue/:key', async (req: Request, res: Response) => {
  try {
    await jiraService.deleteIssue(req.params.key);
    res.json({
      success: true,
      message: 'Issue başarıyla silindi'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Issue'ya yorum ekle
 */
router.post('/issue/:key/comment', async (req: Request, res: Response) => {
  try {
    const { comment } = req.body;
    await jiraService.addComment(req.params.key, comment);
    res.json({
      success: true,
      message: 'Yorum başarıyla eklendi'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Issue türlerini listele
 */
router.get('/issue-types', async (req: Request, res: Response) => {
  try {
    const issueTypes = await jiraService.getIssueTypes();
    res.json({
      success: true,
      data: issueTypes
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
