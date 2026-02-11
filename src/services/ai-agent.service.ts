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
  private demoMode: boolean = false;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    this.demoMode = process.env.DEMO_MODE === 'true';
    
    if (this.demoMode) {
      console.warn('🔶 DEMO MODE: Using mock AI responses (OpenAI API will not be called)');
      return;
    }
    
    if (!apiKey || apiKey === 'your-openai-api-key') {
      console.warn('⚠️  OpenAI API Key not configured. Enabling DEMO MODE.');
      console.warn('   Set OPENAI_API_KEY in .env or DEMO_MODE=true for mock responses.');
      this.demoMode = true;
    } else {
      try {
        this.openai = new OpenAI({ apiKey });
        console.log('✅ OpenAI API initialized successfully');
      } catch (error) {
        console.error('Failed to initialize OpenAI, falling back to DEMO MODE');
        this.demoMode = true;
      }
    }
  }

  private checkOpenAI(): void {
    if (!this.openai && !this.demoMode) {
      throw new Error('OpenAI API is not configured. Set DEMO_MODE=true in .env for mock data.');
    }
  }

  /**
   * Proje gereksinimlerini analiz eder ve görevler önerir
   */
  async analyzeProjectRequirements(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    this.checkOpenAI();
    
    // Demo mode - return mock data
    if (this.demoMode) {
      return this.getMockAnalysis(request);
    }
    
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
      model: 'gpt-4o-mini',
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
    
    // Demo mode - return mock data
    if (this.demoMode) {
      return this.getMockSprintPlan(request);
    }
    
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
      model: 'gpt-4o-mini',
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
      model: 'gpt-4o-mini',
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
      model: 'gpt-4o-mini',
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
      model: 'gpt-4o-mini',
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
    
    // Demo mode - return mock report
    if (this.demoMode) {
      return this.getMockReport(issues);
    }
    
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
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.6,
    });

    return completion.choices[0].message.content || 'Rapor oluşturulamadı.';
  }

  /**
   * Demo mode için mock proje analizi
   */
  private getMockAnalysis(request: AIAnalysisRequest): AIAnalysisResponse {
    const keywords = request.description.toLowerCase();
    const tasks: SuggestedTask[] = [];

    // Basit keyword bazlı görev önerileri
    if (keywords.includes('web') || keywords.includes('site') || keywords.includes('uygulama')) {
      tasks.push({
        title: 'Proje Mimarisi ve Planlama',
        description: 'Teknik mimari tasarımı, veritabanı şeması ve API endpoint planlaması yapılacak.',
        priority: 'Highest',
        estimatedHours: 16,
        type: 'Epic'
      });

      tasks.push({
        title: 'Backend API Geliştirmesi',
        description: 'RESTful API endpoint\'leri, authentication ve database entegrasyonu geliştirilecek.',
        priority: 'High',
        estimatedHours: 40,
        type: 'Story'
      });

      tasks.push({
        title: 'Frontend UI Geliştirmesi',
        description: 'Kullanıcı arayüzü komponentleri, sayfa tasarımları ve responsive design uygulanacak.',
        priority: 'High',
        estimatedHours: 32,
        type: 'Story'
      });

      tasks.push({
        title: 'Test ve Dokümantasyon',
        description: 'Unit testler, integration testler yazılacak ve API dokümantasyonu hazırlanacak.',
        priority: 'Medium',
        estimatedHours: 16,
        type: 'Task'
      });
    } else {
      // Genel görevler
      tasks.push({
        title: 'Proje Analizi ve Planlama',
        description: 'Gereksinim analizi yapılacak ve proje planı oluşturulacak.',
        priority: 'Highest',
        estimatedHours: 8,
        type: 'Task'
      });

      tasks.push({
        title: 'Ana İşlevsellik Geliştirmesi',
        description: request.description,
        priority: 'High',
        estimatedHours: 24,
        type: 'Story'
      });

      tasks.push({
        title: 'Test ve Optimizasyon',
        description: 'Kapsamlı test senaryoları uygulanacak ve performans optimizasyonu yapılacak.',
        priority: 'Medium',
        estimatedHours: 12,
        type: 'Task'
      });
    }

    return {
      analysis: `[DEMO MODE] Proje analizi tamamlandı. ${tasks.length} adet görev önerisi oluşturuldu. ${request.context ? 'Ek bağlam dikkate alındı.' : ''}`,
      suggestedTasks: tasks,
      priority: 'High',
      estimatedEffort: `${tasks.reduce((sum, t) => sum + t.estimatedHours, 0)} saat`,
      tags: ['demo', 'auto-generated', 'planning']
    };
  }

  /**
   * Demo mode için mock sprint planı
   */
  private getMockSprintPlan(request: SprintPlanRequest): SprintPlanResponse {
    const hoursPerMember = Math.floor(request.teamCapacity / request.teamMembers.length);
    const tasks: any[] = request.teamMembers.map((member, index) => ({
      title: `${member} için Sprint Görevi ${index + 1}`,
      description: `${member} tarafından tamamlanacak görev. Tahmini süre: ${hoursPerMember} saat.`,
      priority: index === 0 ? 'Highest' : index === 1 ? 'High' : 'Medium',
      estimatedHours: hoursPerMember,
      assignee: member,
      sprintDay: Math.floor(index * 2) + 1,
      type: 'Task'
    }));

    return {
      sprintGoal: `[DEMO MODE] Sprint Hedefi: ${request.goals || 'Planlanan görevlerin tamamlanması'}`,
      tasks,
      totalEstimatedHours: request.teamCapacity,
      recommendations: [
        'Daily standupları aksatmayın',
        'Sprint ortasında bir retrospective toplantısı yapın',
        'Görev bağımlılıklarını düzenli kontrol edin',
        '[NOT: Bu demo mode çıktısıdır, gerçek AI analizi için OpenAI API key ekleyin]'
      ]
    };
  }

  /**
   * Demo mode için mock rapor
   */
  private getMockReport(issues: JiraIssue[]): string {
    const totalIssues = issues.length;
    return `
[DEMO MODE] Proje Durum Raporu
================================

📊 Genel Durum
--------------
- Toplam Görev: ${totalIssues}
- Aktif Sprint: Sprint 1
- Takım Üye Sayısı: 5

📈 İlerleme
-----------
- Tamamlanan: ${Math.floor(totalIssues * 0.3)} (${Math.floor(30)}%)
- Devam Eden: ${Math.floor(totalIssues * 0.5)} (${Math.floor(50)}%)
- Bekleyen: ${Math.floor(totalIssues * 0.2)} (${Math.floor(20)}%)

⚠️ Riskler
----------
- Bazı görevlerde gecikme riski var
- Takım kapasitesi doluluk oranı yüksek

💡 Öneriler
-----------
1. Sprint planlamasını gözden geçirin
2. Kritik görevlere öncelik verin
3. Günlük sync toplantılarını aksatmayın

[NOT: Bu demo mode çıktısıdır. Gerçek AI analizi için OpenAI API key ekleyin veya DEMO_MODE=false yapın]
    `.trim();
  }
}

export const aiAgentService = new AIAgentService();
