export interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
  boardId?: string;
}

export interface JiraIssue {
  id?: string;
  key?: string;
  fields: {
    project: {
      key: string;
    };
    summary: string;
    description?: string;
    issuetype: {
      name: string;
    };
    priority?: {
      name: string;
    };
    assignee?: {
      accountId?: string;
      emailAddress?: string;
      displayName?: string;
    } | null;
    status?: {
      name: string;
    };
    labels?: string[];
    updated?: string;
    created?: string;
  };
}

export interface AIAnalysisRequest {
  description: string;
  context?: string;
  existingIssues?: JiraIssue[];
}

export interface AIAnalysisResponse {
  analysis: string;
  suggestedTasks: SuggestedTask[];
  priority: string;
  estimatedEffort: string;
  tags: string[];
}

export interface SuggestedTask {
  title: string;
  description: string;
  priority: 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';
  estimatedHours: number;
  assignee?: string;
  dependencies?: string[];
  type: 'Story' | 'Task' | 'Bug' | 'Epic';
}

export interface SprintPlanRequest {
  teamCapacity: number; // hours per sprint
  teamMembers: string[];
  existingIssues?: JiraIssue[];
  goals?: string;
}

export interface SprintPlanResponse {
  sprintGoal: string;
  tasks: SprintTask[];
  totalEstimatedHours: number;
  recommendations: string[];
}

export interface SprintTask extends SuggestedTask {
  issueKey?: string;
  sprintDay: number;
}
