import axios, { AxiosInstance } from 'axios';
import { JiraConfig, JiraIssue } from '../types';

export class JiraService {
  private client: AxiosInstance;
  private agileClient: AxiosInstance;
  private config: JiraConfig;
  private isConfigured: boolean = false;

  constructor() {
    this.config = {
      baseUrl: process.env.JIRA_BASE_URL || '',
      email: process.env.JIRA_EMAIL || '',
      apiToken: process.env.JIRA_API_TOKEN || '',
      projectKey: process.env.JIRA_PROJECT_KEY || 'PROJ',
      boardId: process.env.JIRA_BOARD_ID
    };

    // Check if Jira is properly configured
    if (!this.config.baseUrl || this.config.baseUrl.includes('your-domain') ||
        !this.config.email || this.config.email.includes('your-email') ||
        !this.config.apiToken || this.config.apiToken.includes('your-jira')) {
      console.warn('⚠️  Jira is not configured. Jira features will be disabled.');
      console.warn('   Please set JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN in your .env file.');
      this.isConfigured = false;
    } else {
      this.isConfigured = true;
      console.log('✅ Jira API initialized successfully');
    }

    const auth = Buffer.from(
      `${this.config.email}:${this.config.apiToken}`
    ).toString('base64');

    this.client = axios.create({
      baseURL: `${this.config.baseUrl}/rest/api/3`,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    this.agileClient = axios.create({
      baseURL: `${this.config.baseUrl}/rest/agile/1.0`,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  private checkJira(): void {
    if (!this.isConfigured) {
      throw new Error('Jira is not configured. Please set JIRA credentials in your .env file.');
    }
  }

  /**
   * Jira bağlantısını test eder
   */
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }
    
    try {
      await this.client.get('/myself');
      return true;
    } catch (error) {
      console.error('Jira connection failed:', error);
      return false;
    }
  }

  /**
   * Proje bilgilerini getirir
   */
  async getProject(projectKey?: string): Promise<any> {
    const key = projectKey || this.config.projectKey;
    const response = await this.client.get(`/project/${key}`);
    return response.data;
  }

  /**
   * Tüm issue'ları listeler
   * Not: Team-managed projeler için board API kullanılır
   */
  async getIssues(jql?: string, maxResults: number = 50): Promise<JiraIssue[]> {
    try {
      // Team-managed projeler için board API kullan
      if (this.config.boardId) {
        const response = await this.agileClient.get(`/board/${this.config.boardId}/issue`, {
          params: {
            maxResults,
            jql: jql || undefined
          }
        });
        
        return response.data.issues;
      }
      
      // Klasik projeler için search API
      const query = jql || `project = ${this.config.projectKey}`;
      const response = await this.client.get('/search', {
        params: {
          jql: query,
          maxResults
        }
      });

      return response.data.issues;
    } catch (error: any) {
      console.error('Jira search error:', error.response?.status, error.response?.statusText);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  }

  /**
   * Belirli bir issue'yu getirir
   */
  async getIssue(issueKey: string): Promise<JiraIssue> {
    const response = await this.client.get(`/issue/${issueKey}`);
    return response.data;
  }

  /**
   * Yeni issue oluşturur
   */
  async createIssue(issue: JiraIssue): Promise<JiraIssue> {
    // Proje key'i yoksa varsayılanı kullan
    if (!issue.fields.project.key) {
      issue.fields.project.key = this.config.projectKey;
    }

    const response = await this.client.post('/issue', issue);
    return response.data;
  }

  /**
   * Issue'yu günceller
   */
  async updateIssue(issueKey: string, updates: Partial<JiraIssue>): Promise<void> {
    await this.client.put(`/issue/${issueKey}`, updates);
  }

  /**
   * Issue'yu siler
   */
  async deleteIssue(issueKey: string): Promise<void> {
    await this.client.delete(`/issue/${issueKey}`);
  }

  /**
   * Issue'ya yorum ekler
   */
  async addComment(issueKey: string, comment: string): Promise<void> {
    await this.client.post(`/issue/${issueKey}/comment`, {
      body: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: comment
              }
            ]
          }
        ]
      }
    });
  }

  /**
   * Issue türlerini listeler
   */
  async getIssueTypes(): Promise<any[]> {
    const response = await this.client.get(`/project/${this.config.projectKey}`);
    return response.data.issueTypes;
  }

  /**
   * Sprint oluşturur (Jira Software için)
   */
  async createSprint(boardId: number, sprintName: string, startDate?: Date, endDate?: Date): Promise<any> {
    const sprintData: any = {
      name: sprintName,
      originBoardId: boardId
    };

    if (startDate) sprintData.startDate = startDate.toISOString();
    if (endDate) sprintData.endDate = endDate.toISOString();

    const response = await this.client.post('/sprint', sprintData);
    return response.data;
  }

  /**
   * Issue'yu sprint'e ekler
   */
  async addIssueToSprint(issueKey: string, sprintId: number): Promise<void> {
    await this.client.post(`/sprint/${sprintId}/issue`, {
      issues: [issueKey]
    });
  }

  /**
   * Günlük tamamlanan görevleri getirir
   */
  async getTodayCompletedIssues(): Promise<JiraIssue[]> {
    this.checkJira();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Bugün güncellenmiş ve Done durumuna geçmiş görevleri al
    const jql = `project = ${this.config.projectKey} AND status = Done ORDER BY updated DESC`;
    const allDoneIssues = await this.getIssues(jql, 100);
    
    // JavaScript'te bugün tamamlananları filtrele
    return allDoneIssues.filter(issue => {
      if (!issue.fields.updated) return false;
      const updatedDate = new Date(issue.fields.updated);
      return updatedDate >= today;
    });
  }

  /**
   * Belirli bir tarih aralığındaki tamamlanan görevleri getirir
   */
  async getCompletedIssuesByDateRange(startDate: Date, endDate: Date): Promise<JiraIssue[]> {
    this.checkJira();
    
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    const jql = `project = ${this.config.projectKey} AND status changed to Done DURING (${startStr}, ${endStr}) ORDER BY updated DESC`;
    
    return await this.getIssues(jql, 200);
  }

  /**
   * Aktif sprint'i getirir
   */
  async getActiveSprint(boardId: number): Promise<any> {
    this.checkJira();
    
    const response = await this.agileClient.get(`/board/${boardId}/sprint`, {
      params: { state: 'active' }
    });
    
    return response.data.values[0] || null;
  }

  /**
   * Sprint'teki tüm görevleri getirir
   */
  async getSprintIssues(sprintId: number): Promise<JiraIssue[]> {
    this.checkJira();
    
    const response = await this.agileClient.get(`/sprint/${sprintId}/issue`, {
      params: {
        maxResults: 200
      }
    });
    
    return response.data.issues;
  }

  /**
   * Kullanıcıya atanmış görevleri getirir
   */
  async getIssuesByAssignee(assigneeEmail: string): Promise<JiraIssue[]> {
    this.checkJira();
    
    const jql = `project = ${this.config.projectKey} AND assignee = "${assigneeEmail}" AND status != Done ORDER BY priority DESC`;
    
    return await this.getIssues(jql, 100);
  }
}

export const jiraService = new JiraService();
