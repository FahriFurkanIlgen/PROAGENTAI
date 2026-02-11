import axios, { AxiosInstance } from 'axios';
import { JiraConfig, JiraIssue } from '../types';

export class JiraService {
  private client: AxiosInstance;
  private config: JiraConfig;
  private isConfigured: boolean = false;

  constructor() {
    this.config = {
      baseUrl: process.env.JIRA_BASE_URL || '',
      email: process.env.JIRA_EMAIL || '',
      apiToken: process.env.JIRA_API_TOKEN || '',
      projectKey: process.env.JIRA_PROJECT_KEY || 'PROJ'
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
   */
  async getIssues(jql?: string, maxResults: number = 50): Promise<JiraIssue[]> {
    const query = jql || `project = ${this.config.projectKey} ORDER BY created DESC`;
    
    const response = await this.client.get('/search', {
      params: {
        jql: query,
        maxResults,
        fields: 'summary,description,status,priority,assignee,issuetype,labels'
      }
    });

    return response.data.issues;
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
}

export const jiraService = new JiraService();
