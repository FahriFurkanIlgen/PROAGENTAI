import OpenAI from 'openai';
import {
  AIAnalysisRequest,
  AIAnalysisResponse,
  SprintPlanRequest,
  SprintPlanResponse,
  SuggestedTask,
  JiraIssue
} from '../types';

export class AIAgentService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey || apiKey === 'your-openai-api-key') {
      console.warn('⚠️  OpenAI API Key not configured. AI features will be disabled.');
      console.warn('   Please set OPENAI_API_KEY in your .env file.');
    } else {
      this.openai = new OpenAI({ apiKey });
      console.log('✅ OpenAI API initialized successfully');
    }
  }

  private checkOpenAI(): void {
    if (!this.openai) {
      throw new Error('OpenAI API is not configured. Please set OPENAI_API_KEY in your .env file.');
    }
  }

  /**
   * Proje gereksinimlerini analiz eder ve görevler önerir
   */
  async analyzeProjectRequirements(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    this.checkOpenAI();
    
    const systemPrompt = `Sen deneyimli bir proje yöneticisi ve yazılım mimarısın. 
    Verilen proje gereksinimlerini analiz edip, yapılması gereken görevleri belirle.
    Her görev için:
    - Net bir başlık
    - Detaylı açıklama
    - Öncelik seviyesi (Highest, High, Medium, Low, Lowest)
    - Tahmini süre (saat)
    - Görev tipi (Story, Task, Bug, Epic)
    - Bağımlılıklar (varsa)
    
    Cevabını JSON formatında ver.`;

    const userPrompt = `
    Proje Açıklaması: ${request.description}
    ${request.context ? `\nEk Bağlam: ${request.context}` : ''}
    ${request.existingIssues ? `\nMevcut Görevler: ${JSON.stringify(request.existingIssues, null, 2)}` : ''}
    
    Lütfen bu projeyi analiz et ve önerilen görevleri JSON formatında döndür.
    `;

    const completion = await this.openai!.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('AI response is empty');
    }

    const parsed = JSON.parse(responseContent);

    return {
      analysis: parsed.analysis || 'Proje analizi tamamlandı.',
      suggestedTasks: parsed.suggestedTasks || parsed.tasks || [],
      priority: parsed.priority || 'Medium',
      estimatedEffort: parsed.estimatedEffort || 'Unknown',
      tags: parsed.tags || []
    };
  }

  /**
   * Sprint planlaması yapar
   */
  async planSprint(request: SprintPlanRequest): Promise<SprintPlanResponse> {
    this.checkOpenAI();
    
    const systemPrompt = `Sen bir Agile/Scrum uzmanısın. 
    Takım kapasitesine göre sprint planı oluştur.
    Sprint genellikle 2 haftalık (10 iş günü) bir dönemdir.
    Her takım üyesinin günlük 6 saat kod yazma kapasitesi olduğunu varsay.
    
    Görevleri:
    - Önceliklendir
    - Takım üyelerine dağıt
    - Sprint günlerine yerleştir
    - Sprint hedefi belirle
    - Öneriler sun
    
    Cevabını JSON formatında ver.`;

    const userPrompt = `
    Takım Kapasitesi: ${request.teamCapacity} saat/sprint
    Takım Üyeleri: ${request.teamMembers.join(', ')}
    ${request.goals ? `Sprint Hedefleri: ${request.goals}` : ''}
    ${request.existingIssues ? `\nMevcut Görevler: ${JSON.stringify(request.existingIssues, null, 2)}` : ''}
    
    Lütfen bu bilgilere göre bir sprint planı oluştur.
    `;

    const completion = await this.openai!.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('AI response is empty');
    }

    const parsed = JSON.parse(responseContent);

    return {
      sprintGoal: parsed.sprintGoal || 'Sprint hedefi belirlenmedi.',
      tasks: parsed.tasks || [],
      totalEstimatedHours: parsed.totalEstimatedHours || 0,
      recommendations: parsed.recommendations || []
    };
  }

  /**
   * Görev önceliğini analiz eder
   */
  async analyzePriority(taskDescription: string, context?: string): Promise<string> {
    this.checkOpenAI();
    
    const systemPrompt = `Sen bir proje yöneticisisin. Görevin önem derecesini belirle.
    Seçenekler: Highest, High, Medium, Low, Lowest
    Sadece öncelik seviyesini döndür, başka bir şey yazma.`;

    const userPrompt = `Görev: ${taskDescription}
    ${context ? `Bağlam: ${context}` : ''}`;

    const completion = await this.openai!.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 20
    });

    return completion.choices[0].message.content?.trim() || 'Medium';
  }

  /**
   * Görev için tahmini süre hesaplar
   */
  async estimateEffort(taskDescription: string): Promise<number> {
    this.checkOpenAI();
    
    const systemPrompt = `Sen deneyimli bir yazılım geliştiricisin. 
    Verilen görevin tahmini süresini saat cinsinden hesapla.
    Sadece sayı döndür, başka bir şey yazma.`;

    const completion = await this.openai!.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Görev: ${taskDescription}` }
      ],
      temperature: 0.3,
      max_tokens: 10
    });

    const hours = parseInt(completion.choices[0].message.content?.trim() || '0');
    return isNaN(hours) ? 8 : hours;
  }

  /**
   * Görev açıklamasını iyileştirir
   */
  async improveTaskDescription(title: string, description?: string): Promise<string> {
    this.checkOpenAI();
    
    const systemPrompt = `Sen teknik bir yazarsın. 
    Görev açıklamalarını net, anlaşılır ve detaylı hale getir.
    Acceptance criteria ekle.`;

    const userPrompt = `Başlık: ${title}
    ${description ? `Açıklama: ${description}` : ''}
    
    Bu görev açıklamasını iyileştir.`;

    const completion = await this.openai!.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5,
    });

    return completion.choices[0].message.content || description || '';
  }

  /**
   * Proje raporlaması yapar
   */
  async generateReport(issues: JiraIssue[]): Promise<string> {
    this.checkOpenAI();
    
    const systemPrompt = `Sen bir proje yöneticisisin. 
    Verilen görevleri analiz edip detaylı bir proje durum raporu hazırla.
    Raporda:
    - Genel durum özeti
    - Tamamlanan görevler
    - Devam eden görevler
    - Riskler ve öneriler
    - İstatistikler
    İçin bilgi ver.`;

    const userPrompt = `Proje Görevleri:
    ${JSON.stringify(issues, null, 2)}
    
    Lütfen bir proje durum raporu oluştur.`;

    const completion = await this.openai!.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.6,
    });

    return completion.choices[0].message.content || 'Rapor oluşturulamadı.';
  }
}

export const aiAgentService = new AIAgentService();
