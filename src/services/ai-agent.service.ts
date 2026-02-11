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
   * Günlük tamamlanan görevleri analiz eder ve rapor oluşturur
   */
  async generateDailyReport(completedIssues: JiraIssue[], allIssues: JiraIssue[]): Promise<string> {
    this.checkOpenAI();
    
    // Demo mode - return mock report
    if (this.demoMode) {
      return this.getMockDailyReport(completedIssues, allIssues);
    }

    const systemPrompt = `Sen bir proje yöneticisisin. 
    Günlük tamamlanan görevleri analiz edip detaylı bir günlük rapor hazırla.
    
    Raporda:
    - Bugün tamamlanan görevlerin özeti
    - Takım performansı
    - Kimin ne yaptığı
    - İlerleme hızı
    - Öne çıkan başarılar
    - Dikkat edilmesi gerekenler
    
    Türkçe ve net bir dille yaz.`;

    const userPrompt = `
    Bugün Tamamlanan Görevler:
    ${JSON.stringify(completedIssues, null, 2)}
    
    Tüm Aktif Görevler:
    ${JSON.stringify(allIssues, null, 2)}
    
    Lütfen günlük ilerleme raporu oluştur.
    `;

    const completion = await this.openai!.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.6,
    });

    return completion.choices[0].message.content || 'Günlük rapor oluşturulamadı.';
  }

  /**
   * Sprint ilerleme analizi yapar ve geride kalanları tespit eder
   */
  async analyzeSprintProgress(sprintIssues: JiraIssue[], teamMembers: string[]): Promise<any> {
    this.checkOpenAI();
    
    // Demo mode - return mock analysis
    if (this.demoMode) {
      return this.getMockSprintAnalysis(sprintIssues, teamMembers);
    }

    const systemPrompt = `Sen bir Agile/Scrum uzmanısın. 
    Sprint ilerleme analizi yaparak:
    
    1. Genel sprint durumunu değerlendir
    2. Her takım üyesinin ilerleme durumunu analiz et
    3. Geride kalan üyeleri belirle
    4. Risk ve önerileri sun
    
    JSON formatında döndür:
    {
      "sprintHealth": "string", // "On Track", "At Risk", "Behind"
      "completionRate": number, // 0-100
      "memberProgress": [
        {
          "member": "string",
          "status": "string", // "On Track", "Behind", "Ahead"
          "completedTasks": number,
          "remainingTasks": number,
          "risk": "string"
        }
      ],
      "risks": ["string"],
      "recommendations": ["string"]
    }`;

    const userPrompt = `
    Sprint Görevleri:
    ${JSON.stringify(sprintIssues, null, 2)}
    
    Takım Üyeleri: ${teamMembers.join(', ')}
    
    Lütfen sprint ilerleme analizi yap.
    `;

    const completion = await this.openai!.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('AI response is empty');
    }

    return JSON.parse(responseContent);
  }

  /**
   * Görev için en uygun takım üyesini önerir
   */
  async suggestAssignee(task: JiraIssue, teamMembers: any[]): Promise<any> {
    this.checkOpenAI();
    
    // Demo mode
    if (this.demoMode) {
      return this.getMockAssignmentSuggestion(task, teamMembers);
    }

    const systemPrompt = `Sen bir Agile proje yöneticisisin.
    Verilen görev ve takım üyesi bilgilerine göre en uygun atamayı öner.
    
    Değerlendirme kriterleri:
    - Üyenin mevcut iş yükü
    - Geçmiş performans ve tamamlama hızı
    - Görev tipi ve üyenin uzmanlık alanı
    - Takım dengesi
    
    JSON formatında döndür:
    {
      "recommendedAssignee": "string",
      "confidence": number, // 0-100
      "reasoning": "string",
      "alternatives": [{
        "assignee": "string",
        "reason": "string"
      }]
    }`;

    const userPrompt = `
    Görev: ${JSON.stringify(task, null, 2)}
    
    Takım Üyeleri: ${JSON.stringify(teamMembers, null, 2)}
    
    En uygun atamayı öner.
    `;

    const completion = await this.openai!.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('AI response is empty');
    }

    return JSON.parse(responseContent);
  }

  /**
   * Sprint retrospective analizi yapar
   */
  async generateRetrospective(sprintData: any): Promise<any> {
    this.checkOpenAI();
    
    // Demo mode
    if (this.demoMode) {
      return this.getMockRetrospective(sprintData);
    }

    const systemPrompt = `Sen deneyimli bir Scrum Master'sın.
    Sprint verilerini analiz edip retrospective raporu hazırla.
    
    Rapor içeriği:
    - İyi giden şeyler (What went well)
    - İyileştirilmesi gerekenler (What didn't go well)
    - Aksiyon maddeleri (Action items)
    - Takım performans değerlendirmesi
    - Öneriler
    
    JSON formatında döndür:
    {
      "summary": "string",
      "whatWentWell": ["string"],
      "whatDidntGoWell": ["string"],
      "actionItems": [{
        "title": "string",
        "description": "string",
        "priority": "high|medium|low"
      }],
      "teamPerformance": {
        "score": number, // 0-10
        "analysis": "string"
      },
      "recommendations": ["string"]
    }`;

    const userPrompt = `
    Sprint Verileri:
    ${JSON.stringify(sprintData, null, 2)}
    
    Retrospective raporu hazırla.
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

    return JSON.parse(responseContent);
  }

  /**
   * Blocker detection - uzun süredir devam eden görevleri tespit eder
   */
  async detectBlockers(issues: JiraIssue[]): Promise<any> {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    const inProgressIssues = issues.filter(issue => 
      issue.fields.status?.name === 'In Progress' || 
      issue.fields.status?.name === 'In Review'
    );
    
    const blockedIssues = inProgressIssues.filter(issue => {
      if (!issue.fields.updated) return false;
      const updatedDate = new Date(issue.fields.updated);
      return updatedDate < threeDaysAgo;
    });
    
    // Demo mode veya AI analizi
    if (this.demoMode || !this.openai) {
      return this.getMockBlockerAnalysis(blockedIssues);
    }
    
    if (blockedIssues.length === 0) {
      return {
        blockedCount: 0,
        blockers: [],
        summary: 'Hiçbir bloke olmuş görev tespit edilmedi. İlerleme sağlıklı görünüyor.'
      };
    }

    const systemPrompt = `Sen bir proje yöneticisisin.
    Uzun süredir ilerleme kaydedilmeyen görevleri analiz et ve bloke olduklarını tespit et.
    Her görev için:
    - Muhtemel blokaj nedeni
    - Risk seviyesi
    - Önerilen aksiyonlar
    
    JSON formatında döndür:
    {
      "blockedCount": number,
      "summary": "string",
      "blockers": [{
        "issueKey": "string",
        "title": "string",
        "daysStuck": number,
        "reason": "string",
        "riskLevel": "high|medium|low",
        "recommendations": ["string"]
      }]
    }`;

    const userPrompt = `Bloke olmuş olabilecek görevler:
    ${JSON.stringify(blockedIssues, null, 2)}`;

    const completion = await this.openai!.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('AI response is empty');
    }

    return JSON.parse(responseContent);
  }

  /**
   * Sprint risk skorlaması
   */
  async calculateSprintRisk(sprintData: any): Promise<any> {
    const totalIssues = sprintData.totalIssues || 0;
    const completedIssues = sprintData.completedIssues?.length || 0;
    const inProgressIssues = sprintData.inProgressIssues?.length || 0;
    const todoIssues = sprintData.todoIssues?.length || 0;
    
    console.log('Sprint Risk Calculation:', {
      totalIssues,
      completedIssues,
      inProgressIssues,
      todoIssues,
      calculatedTotal: completedIssues + inProgressIssues + todoIssues
    });
    
    // Eğer toplam issue sayısı verilmemişse hesapla
    const actualTotal = totalIssues || (completedIssues + inProgressIssues + todoIssues);
    
    const completionRate = actualTotal > 0 ? (completedIssues / actualTotal) * 100 : 0;
    const remainingDays = sprintData.remainingDays || 7;
    const daysPerTask = remainingDays / (todoIssues + inProgressIssues) || 0;
    
    let riskScore = 0;
    let riskLevel = 'low';
    let risks: string[] = [];
    
    // Risk faktörleri
    if (completionRate < 30) {
      riskScore += 30;
      risks.push('Tamamlanma oranı çok düşük');
    } else if (completionRate < 50) {
      riskScore += 15;
      risks.push('Tamamlanma oranı hedefin altında');
    }
    
    if (daysPerTask < 1 && (todoIssues + inProgressIssues) > 0) {
      riskScore += 25;
      risks.push('Kalan süre görev sayısına göre yetersiz');
    }
    
    if (inProgressIssues > todoIssues * 2) {
      riskScore += 20;
      risks.push('Paralel çalışılan görev sayısı çok fazla');
    }
    
    // Risk seviyesi belirleme
    if (riskScore >= 50) riskLevel = 'high';
    else if (riskScore >= 25) riskLevel = 'medium';
    
    return {
      riskScore,
      riskLevel,
      risks,
      completionRate: Math.round(completionRate),
      recommendations: this.getSprintRiskRecommendations(riskLevel, risks)
    };
  }

  private getSprintRiskRecommendations(riskLevel: string, risks: string[]): string[] {
    const recommendations: string[] = [];
    
    if (riskLevel === 'high') {
      recommendations.push('Acil durum toplantısı yapılmalı');
      recommendations.push('Sprint kapsamı yeniden gözden geçirilmeli');
      recommendations.push('Kritik olmayan görevler sonraki sprint\'e taşınmalı');
    }
    
    if (risks.some(r => r.includes('paralel'))) {
      recommendations.push('WIP (Work in Progress) limiti konulmalı');
      recommendations.push('Görevler tamamlanana kadar yeni görev alınmamalı');
    }
    
    if (risks.some(r => r.includes('yetersiz'))) {
      recommendations.push('Önceliklendirme yapılmalı, en kritik görevlere odaklanılmalı');
      recommendations.push('Ek kaynak talebi değerlendirilmeli');
    }
    
    return recommendations;
  }

  /**
   * Velocity tracking - sprint hız analizi
   */
  async analyzeVelocity(sprintHistory: any[]): Promise<any> {
    if (!sprintHistory || sprintHistory.length === 0) {
      return this.getMockVelocityAnalysis();
    }
    
    const velocities = sprintHistory.map(sprint => ({
      sprintName: sprint.name || 'Sprint',
      completed: sprint.completedIssues || 0,
      planned: sprint.plannedIssues || 0,
      completionRate: sprint.plannedIssues > 0 
        ? Math.round((sprint.completedIssues / sprint.plannedIssues) * 100) 
        : 0
    }));
    
    const avgVelocity = velocities.reduce((sum, v) => sum + v.completed, 0) / velocities.length;
    const trend = this.calculateTrend(velocities.map(v => v.completed));
    
    return {
      averageVelocity: Math.round(avgVelocity),
      trend, // 'increasing', 'decreasing', 'stable'
      sprints: velocities,
      recommendation: this.getVelocityRecommendation(trend, avgVelocity)
    };
  }

  private calculateTrend(values: number[]): string {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const diff = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (diff > 10) return 'increasing';
    if (diff < -10) return 'decreasing';
    return 'stable';
  }

  private getVelocityRecommendation(trend: string, avgVelocity: number): string {
    if (trend === 'increasing') {
      return 'Takım hızı artmakta. Mevcut çalışma temposunu koruyun.';
    } else if (trend === 'decreasing') {
      return 'Takım hızı düşmekte. Retrospective\'de engelleri tartışın.';
    }
    return 'Takım hızı stabil. Planlama için ortalama ' + Math.round(avgVelocity) + ' görev baz alınabilir.';
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

  /**
   * Demo günlük rapor
   */
  private getMockDailyReport(completedIssues: JiraIssue[], allIssues: JiraIssue[]): string {
    const completedCount = completedIssues.length;
    const totalCount = allIssues.length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return `# 📊 Günlük İlerleme Raporu

## 📅 Tarih: ${new Date().toLocaleDateString('tr-TR')}

### ✅ Bugün Tamamlananlar
- **Toplam:** ${completedCount} görev tamamlandı
- **Tamamlanma Oranı:** %${completionRate}

${completedIssues.map((issue, index) => `${index + 1}. **${issue.fields.summary}** (${issue.key}) - ${issue.fields.assignee?.displayName || 'Atanmamış'}`).join('\n')}

### 📈 Genel Durum
- Aktif görev sayısı: ${totalCount}
- Tamamlanan: ${completedCount}
- Devam eden: ${totalCount - completedCount}

### 🎯 Öne Çıkanlar
- Takım bugün ${completedCount} görevi tamamlayarak güzel bir ilerleme kaydetti
- Sprint hedeflerine doğru düzenli ilerleme sağlanıyor

### 💡 Öneriler
- Tamamlanma hızı korunmalı
- Bloke olan görevler kontrol edilmeli

---
*🟦 Bu bir DEMO raporudur. Gerçek AI analizi için OpenAI API anahtarı gereklidir.*`;
  }

  /**
   * Demo sprint analizi
   */
  private getMockSprintAnalysis(sprintIssues: JiraIssue[], teamMembers: string[]): any {
    const completedIssues = sprintIssues.filter(issue => issue.fields.status?.name === 'Done');
    const completionRate = sprintIssues.length > 0 
      ? Math.round((completedIssues.length / sprintIssues.length) * 100) 
      : 0;

    // Görevleri kişilere göre grupla
    const memberStats = teamMembers.map(member => {
      const memberIssues = sprintIssues.filter(issue => 
        issue.fields.assignee?.emailAddress === member || 
        issue.fields.assignee?.displayName === member
      );
      const memberCompleted = memberIssues.filter(issue => issue.fields.status?.name === 'Done');
      const memberRemaining = memberIssues.length - memberCompleted.length;

      let status = 'On Track';
      if (memberRemaining > memberIssues.length * 0.6) status = 'Behind';
      if (memberRemaining < memberIssues.length * 0.3) status = 'Ahead';

      return {
        member,
        status,
        completedTasks: memberCompleted.length,
        remainingTasks: memberRemaining,
        risk: status === 'Behind' ? 'Görevleri sprint sonuna kadar tamamlamada zorluk yaşayabilir' : 'Yok'
      };
    });

    return {
      sprintHealth: completionRate >= 70 ? 'On Track' : completionRate >= 50 ? 'At Risk' : 'Behind',
      completionRate,
      memberProgress: memberStats,
      risks: [
        completionRate < 50 ? 'Sprint hedefine ulaşmak için tempo artırılmalı' : null,
        memberStats.filter(m => m.status === 'Behind').length > 0 ? 'Bazı takım üyeleri geride kalıyor' : null
      ].filter(Boolean),
      recommendations: [
        'Daily standup toplantılarında blokajlar tespit edilmeli',
        'Geride kalan üyelere destek verilmeli',
        'Sprint hedefleri gözden geçirilmeli'
      ],
      demoMode: true
    };
  }

  /**
   * Demo atama önerisi
   */
  private getMockAssignmentSuggestion(task: JiraIssue, teamMembers: any[]): any {
    const leastBusy = teamMembers.reduce((min, member) => 
      member.currentTasks < min.currentTasks ? member : min
    , teamMembers[0] || { member: 'Takım Üyesi', currentTasks: 0 });

    return {
      recommendedAssignee: leastBusy.member,
      confidence: 85,
      reasoning: `${leastBusy.member} şu anda en az görev yüküne sahip (${leastBusy.currentTasks} aktif görev). Bu görev için uygun deneyime sahip.`,
      alternatives: teamMembers.filter(m => m.member !== leastBusy.member).slice(0, 2).map(m => ({
        assignee: m.member,
        reason: `${m.currentTasks} aktif görevi var, yedek seçenek olabilir`
      })),
      demoMode: true
    };
  }

  /**
   * Demo retrospective
   */
  private getMockRetrospective(sprintData: any): any {
    const totalIssues = sprintData.completedIssues?.length || 0;
    const plannedIssues = sprintData.plannedIssues || 0;
    const completionRate = plannedIssues > 0 ? Math.round((totalIssues / plannedIssues) * 100) : 0;

    return {
      summary: `Sprint ${completionRate >= 80 ? 'başarılı' : 'hedeflerin altında'} tamamlandı. ${totalIssues} görev tamamlandı.`,
      whatWentWell: [
        'Takım iletişimi güçlüydü',
        'Daily standup toplantıları düzenli yapıldı',
        'Teknik borç azaltma çalışmaları başladı',
        completionRate >= 80 ? 'Sprint hedeflerine ulaşıldı' : 'Bazı görevler erken tamamlandı'
      ],
      whatDidntGoWell: [
        completionRate < 80 ? 'Sprint hedeflerine tam olarak ulaşılamadı' : 'Bazı görevler beklenenden uzun sürdü',
        'Scope değişiklikleri oldu',
        'Test süreçleri zaman aldı',
        'Bağımlılık yönetiminde gecikmeler yaşandı'
      ],
      actionItems: [
        {
          title: 'Sprint planlama sürecini iyileştir',
          description: 'Story point tahminlerini daha gerçekçi yap, geçmiş sprint verilerini kullan',
          priority: 'high'
        },
        {
          title: 'Test otomasyonunu artır',
          description: 'Test süreçlerini hızlandırmak için otomasyon kapsamını genişlet',
          priority: 'medium'
        },
        {
          title: 'Bağımlılıkları erken tespit et',
          description: 'Sprint başında tüm bağımlılıkları belirle ve risk planı oluştur',
          priority: 'high'
        }
      ],
      teamPerformance: {
        score: completionRate >= 80 ? 8 : 6,
        analysis: `Takım performansı ${completionRate >= 80 ? 'yüksek' : 'orta'} seviyede. Tamamlama oranı %${completionRate}. İletişim ve koordinasyon güçlü ancak planlama iyileştirilebilir.`
      },
      recommendations: [
        'Gelecek sprint için kapasite planlamasını daha muhafazakar yap',
        'Görev bağımlılıklarını görselleştir',
        'Retrospective aksiyon maddelerini takip et',
        'Takım üyeleri arasında bilgi paylaşımını artır'
      ],
      demoMode: true
    };
  }

  /**
   * Mock blocker analizi
   */
  private getMockBlockerAnalysis(blockedIssues: JiraIssue[]): any {
    if (blockedIssues.length === 0) {
      return {
        blockedCount: 0,
        blockers: [],
        summary: 'Hiçbir bloke olmuş görev tespit edilmedi. İlerleme sağlıklı görünüyor.',
        demoMode: true
      };
    }
    
    return {
      blockedCount: blockedIssues.length,
      summary: `${blockedIssues.length} görev 3 gündür ilerlemiyor ve bloke olmuş olabilir.`,
      blockers: blockedIssues.slice(0, 5).map(issue => {
        const updated = issue.fields.updated ? new Date(issue.fields.updated) : new Date();
        const daysStuck = Math.floor((Date.now() - updated.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          issueKey: issue.key || 'N/A',
          title: issue.fields.summary,
          daysStuck,
          reason: 'Bağımlılık veya teknik zorluk nedeniyle ilerleme sağlanamıyor olabilir',
          riskLevel: daysStuck > 5 ? 'high' : daysStuck > 3 ? 'medium' : 'low',
          recommendations: [
            'Ekip üyesiyle birebir görüşme yap',
            'Teknik yardım gerekip gerekmediğini sor',
            'Bağımlılıkları kontrol et'
          ]
        };
      }),
      demoMode: true
    };
  }

  /**
   * Mock velocity analizi
   */
  private getMockVelocityAnalysis(): any {
    return {
      averageVelocity: 15,
      trend: 'increasing',
      sprints: [
        { sprintName: 'Sprint 1', completed: 12, planned: 15, completionRate: 80 },
        { sprintName: 'Sprint 2', completed: 14, planned: 16, completionRate: 88 },
        { sprintName: 'Sprint 3', completed: 16, planned: 18, completionRate: 89 },
        { sprintName: 'Sprint 4', completed: 18, planned: 20, completionRate: 90 }
      ],
      recommendation: 'Takım hızı artmakta. Mevcut çalışma temposunu koruyun.',
      demoMode: true
    };
  }
}

export const aiAgentService = new AIAgentService();
