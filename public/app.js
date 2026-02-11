// API Base URL
const API_BASE = '/api';

// UI Elements
const elements = {
    // Status
    statusIndicator: document.getElementById('statusIndicator'),
    statusText: document.getElementById('statusText'),
    
    // Tabs
    tabs: document.querySelectorAll('.tab-button'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Analyze
    projectDescription: document.getElementById('projectDescription'),
    projectContext: document.getElementById('projectContext'),
    analyzeBtn: document.getElementById('analyzeBtn'),
    analyzeAndCreateBtn: document.getElementById('analyzeAndCreateBtn'),
    analysisResult: document.getElementById('analysisResult'),
    analysisContent: document.getElementById('analysisContent'),
    
    // Sprint
    teamCapacity: document.getElementById('teamCapacity'),
    teamMembers: document.getElementById('teamMembers'),
    sprintGoals: document.getElementById('sprintGoals'),
    planSprintBtn: document.getElementById('planSprintBtn'),
    sprintResult: document.getElementById('sprintResult'),
    sprintContent: document.getElementById('sprintContent'),
    
    // Issues
    jqlQuery: document.getElementById('jqlQuery'),
    refreshIssuesBtn: document.getElementById('refreshIssuesBtn'),
    issuesLoading: document.getElementById('issuesLoading'),
    issuesContent: document.getElementById('issuesContent'),
    
    // Create Issue
    issueSummary: document.getElementById('issueSummary'),
    issueDescription: document.getElementById('issueDescription'),
    issueType: document.getElementById('issueType'),
    issuePriority: document.getElementById('issuePriority'),
    createIssueBtn: document.getElementById('createIssueBtn'),
    
    // Report
    generateReportBtn: document.getElementById('generateReportBtn'),
    reportContent: document.getElementById('reportContent'),
    
    // Daily Report
    generateDailyReportBtn: document.getElementById('generateDailyReportBtn'),
    dailyReportContent: document.getElementById('dailyReportContent'),
    
    // Sprint Analysis
    generateSprintAnalysisBtn: document.getElementById('generateSprintAnalysisBtn'),
    analysisSprintId: document.getElementById('analysisSprintId'),
    analysisBoardId: document.getElementById('analysisBoardId'),
    sprintAnalysisContent: document.getElementById('sprintAnalysisContent'),
    
    // Smart Assignment
    assignTaskKey: document.getElementById('assignTaskKey'),
    assignTaskDescription: document.getElementById('assignTaskDescription'),
    suggestAssigneeBtn: document.getElementById('suggestAssigneeBtn'),
    assignmentResult: document.getElementById('assignmentResult'),
    assignmentContent: document.getElementById('assignmentContent'),
    
    // Retrospective
    retroSprintId: document.getElementById('retroSprintId'),
    retroBoardId: document.getElementById('retroBoardId'),
    generateRetroBtn: document.getElementById('generateRetroBtn'),
    retroResult: document.getElementById('retroResult'),
    retroContent: document.getElementById('retroContent'),
    
    // Blocker Detection
    detectBlockersBtn: document.getElementById('detectBlockersBtn'),
    blockersContent: document.getElementById('blockersContent'),
    
    // Risk Analysis
    analyzeRiskBtn: document.getElementById('analyzeRiskBtn'),
    riskBoardId: document.getElementById('riskBoardId'),
    remainingDays: document.getElementById('remainingDays'),
    riskContent: document.getElementById('riskContent'),
    
    // Velocity
    analyzeVelocityBtn: document.getElementById('analyzeVelocityBtn'),
    velocityContent: document.getElementById('velocityContent'),
    
    // Toast
    toast: document.getElementById('toast')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    checkConnection();
    loadIssues();
    setupEventListeners();
});

// Tab Navigation
function initializeTabs() {
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Remove active class from all tabs and contents
            elements.tabs.forEach(t => t.classList.remove('active'));
            elements.tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and its content
            tab.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            // Load data for specific tabs
            if (targetTab === 'issues') {
                loadIssues();
            }
        });
    });
}

// Event Listeners
function setupEventListeners() {
    elements.analyzeBtn.addEventListener('click', analyzeProject);
    elements.analyzeAndCreateBtn.addEventListener('click', analyzeAndCreate);
    elements.planSprintBtn.addEventListener('click', planSprint);
    elements.refreshIssuesBtn.addEventListener('click', loadIssues);
    elements.createIssueBtn.addEventListener('click', createIssue);
    elements.generateReportBtn.addEventListener('click', generateReport);
    elements.generateDailyReportBtn.addEventListener('click', generateDailyReport);
    elements.generateSprintAnalysisBtn.addEventListener('click', generateSprintAnalysis);
    elements.suggestAssigneeBtn.addEventListener('click', suggestAssignee);
    elements.generateRetroBtn.addEventListener('click', generateRetrospective);
    elements.detectBlockersBtn.addEventListener('click', detectBlockers);
    elements.analyzeRiskBtn.addEventListener('click', analyzeRisk);
    elements.analyzeVelocityBtn.addEventListener('click', analyzeVelocity);
}

// Check Jira Connection
async function checkConnection() {
    try {
        const response = await fetch(`${API_BASE}/jira/test`);
        const data = await response.json();
        
        if (data.success) {
            elements.statusIndicator.classList.add('connected');
            elements.statusText.textContent = 'Jira bağlantısı başarılı';
        } else {
            elements.statusIndicator.classList.add('disconnected');
            elements.statusText.textContent = 'Jira bağlantısı başarısız';
        }
    } catch (error) {
        elements.statusIndicator.classList.add('disconnected');
        elements.statusText.textContent = 'Bağlantı hatası';
    }
}

// Analyze Project
async function analyzeProject() {
    const description = elements.projectDescription.value.trim();
    
    if (!description) {
        showToast('Lütfen proje açıklaması girin', 'error');
        return;
    }
    
    elements.analyzeBtn.disabled = true;
    elements.analyzeBtn.textContent = '⏳ Analiz ediliyor...';
    
    try {
        const response = await fetch(`${API_BASE}/agent/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                description,
                context: elements.projectContext.value.trim()
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayAnalysisResult(result.data);
            showToast('Analiz başarıyla tamamlandı', 'success');
        } else {
            showToast(result.error || 'Analiz başarısız', 'error');
        }
    } catch (error) {
        showToast('Bağlantı hatası: ' + error.message, 'error');
    } finally {
        elements.analyzeBtn.disabled = false;
        elements.analyzeBtn.textContent = '🔍 Analiz Et';
    }
}

// Analyze and Create Issues
async function analyzeAndCreate() {
    const description = elements.projectDescription.value.trim();
    
    if (!description) {
        showToast('Lütfen proje açıklaması girin', 'error');
        return;
    }
    
    if (!confirm('Analiz sonucu görevler Jira\'da oluşturulacak. Devam etmek istiyor musunuz?')) {
        return;
    }
    
    elements.analyzeAndCreateBtn.disabled = true;
    elements.analyzeAndCreateBtn.textContent = '⏳ İşleniyor...';
    
    try {
        const response = await fetch(`${API_BASE}/agent/analyze-and-create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                description,
                context: elements.projectContext.value.trim()
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayAnalysisResult(result.data.analysis);
            showToast(result.message, 'success');
        } else {
            showToast(result.error || 'İşlem başarısız', 'error');
        }
    } catch (error) {
        showToast('Bağlantı hatası: ' + error.message, 'error');
    } finally {
        elements.analyzeAndCreateBtn.disabled = false;
        elements.analyzeAndCreateBtn.textContent = '✨ Analiz Et ve Jira\'da Oluştur';
    }
}

// Display Analysis Result
function displayAnalysisResult(data) {
    let html = `
        <div class="analysis-summary">
            <h4>📊 Analiz Özeti</h4>
            <p>${data.analysis}</p>
            <div class="meta-info">
                <span><strong>Öncelik:</strong> ${data.priority}</span>
                <span><strong>Tahmini Süre:</strong> ${data.estimatedEffort}</span>
            </div>
            ${data.tags && data.tags.length > 0 ? `
                <div class="tags">
                    <strong>Etiketler:</strong> ${data.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')}
                </div>
            ` : ''}
        </div>
        
        <h4>✅ Önerilen Görevler (${data.suggestedTasks.length})</h4>
    `;
    
    data.suggestedTasks.forEach((task, index) => {
        html += `
            <div class="task-item">
                <div class="task-title">${index + 1}. ${task.title}</div>
                <div class="task-description">${task.description}</div>
                <div class="task-meta">
                    <span class="meta-badge">📋 ${task.type}</span>
                    <span class="meta-badge">⚡ ${task.priority}</span>
                    <span class="meta-badge">⏱️ ${task.estimatedHours}h</span>
                    ${task.assignee ? `<span class="meta-badge">👤 ${task.assignee}</span>` : ''}
                </div>
            </div>
        `;
    });
    
    elements.analysisContent.innerHTML = html;
    elements.analysisResult.style.display = 'block';
}

// Plan Sprint
async function planSprint() {
    const capacity = parseInt(elements.teamCapacity.value);
    const members = elements.teamMembers.value.trim().split(',').map(m => m.trim()).filter(m => m);
    
    if (!capacity || capacity <= 0) {
        showToast('Lütfen geçerli bir takım kapasitesi girin', 'error');
        return;
    }
    
    if (members.length === 0) {
        showToast('Lütfen takım üyelerini girin', 'error');
        return;
    }
    
    elements.planSprintBtn.disabled = true;
    elements.planSprintBtn.textContent = '⏳ Planlanıyor...';
    
    try {
        const response = await fetch(`${API_BASE}/agent/plan-sprint`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                teamCapacity: capacity,
                teamMembers: members,
                goals: elements.sprintGoals.value.trim()
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            displaySprintPlan(result.data);
            showToast('Sprint planı oluşturuldu', 'success');
        } else {
            showToast(result.error || 'Planlama başarısız', 'error');
        }
    } catch (error) {
        showToast('Bağlantı hatası: ' + error.message, 'error');
    } finally {
        elements.planSprintBtn.disabled = false;
        elements.planSprintBtn.textContent = '🎯 Sprint Planla';
    }
}

// Display Sprint Plan
function displaySprintPlan(data) {
    let html = `
        <div class="sprint-summary">
            <h4>🎯 Sprint Hedefi</h4>
            <p>${data.sprintGoal}</p>
            <div class="meta-info">
                <span><strong>Toplam Tahmini Süre:</strong> ${data.totalEstimatedHours} saat</span>
                <span><strong>Görev Sayısı:</strong> ${data.tasks.length}</span>
            </div>
        </div>
        
        <h4>📋 Sprint Görevleri</h4>
    `;
    
    data.tasks.forEach((task, index) => {
        html += `
            <div class="task-item">
                <div class="task-title">${index + 1}. ${task.title}</div>
                <div class="task-description">${task.description}</div>
                <div class="task-meta">
                    <span class="meta-badge">📋 ${task.type}</span>
                    <span class="meta-badge">⚡ ${task.priority}</span>
                    <span class="meta-badge">⏱️ ${task.estimatedHours}h</span>
                    <span class="meta-badge">📅 Gün ${task.sprintDay || '?'}</span>
                    ${task.assignee ? `<span class="meta-badge">👤 ${task.assignee}</span>` : ''}
                </div>
            </div>
        `;
    });
    
    if (data.recommendations && data.recommendations.length > 0) {
        html += `
            <div class="recommendations">
                <h4>💡 Öneriler</h4>
                <ul>
                    ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    elements.sprintContent.innerHTML = html;
    elements.sprintResult.style.display = 'block';
}

// Load Issues
async function loadIssues() {
    elements.issuesLoading.style.display = 'block';
    elements.issuesContent.innerHTML = '';
    
    try {
        const jql = elements.jqlQuery.value.trim();
        const url = jql ? `${API_BASE}/jira/issues?jql=${encodeURIComponent(jql)}` : `${API_BASE}/jira/issues`;
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            displayIssues(result.data);
        } else {
            elements.issuesContent.innerHTML = `<p class="error">Hata: ${result.error}</p>`;
        }
    } catch (error) {
        elements.issuesContent.innerHTML = `<p class="error">Bağlantı hatası: ${error.message}</p>`;
    } finally {
        elements.issuesLoading.style.display = 'none';
    }
}

// Display Issues
function displayIssues(issues) {
    if (issues.length === 0) {
        elements.issuesContent.innerHTML = '<p class="placeholder-text">Görev bulunamadı</p>';
        return;
    }
    
    let html = '';
    issues.forEach(issue => {
        const priority = issue.fields.priority?.name || 'Medium';
        const status = issue.fields.status?.name || 'Unknown';
        const type = issue.fields.issuetype?.name || 'Task';
        
        html += `
            <div class="issue-item">
                <div class="issue-header">
                    <span class="issue-key">${issue.key}</span>
                    <span class="issue-priority priority-${priority.toLowerCase()}">${priority}</span>
                </div>
                <div class="issue-summary">${issue.fields.summary}</div>
                <div class="issue-meta">
                    <span>📋 ${type}</span>
                    <span>📊 ${status}</span>
                    ${issue.fields.assignee ? `<span>👤 ${issue.fields.assignee.displayName || issue.fields.assignee.emailAddress}</span>` : ''}
                </div>
            </div>
        `;
    });
    
    elements.issuesContent.innerHTML = html;
}

// Create Issue
async function createIssue() {
    const summary = elements.issueSummary.value.trim();
    const description = elements.issueDescription.value.trim();
    const type = elements.issueType.value;
    const priority = elements.issuePriority.value;
    
    if (!summary) {
        showToast('Lütfen görev başlığı girin', 'error');
        return;
    }
    
    elements.createIssueBtn.disabled = true;
    elements.createIssueBtn.textContent = '⏳ Oluşturuluyor...';
    
    try {
        const response = await fetch(`${API_BASE}/jira/issue`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fields: {
                    project: { key: 'PROJ' }, // .env'den gelecek
                    summary,
                    description,
                    issuetype: { name: type },
                    priority: { name: priority }
                }
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Görev başarıyla oluşturuldu: ' + result.data.key, 'success');
            
            // Form temizle
            elements.issueSummary.value = '';
            elements.issueDescription.value = '';
            
            // Issue listesini yenile
            loadIssues();
        } else {
            showToast(result.error || 'Görev oluşturulamadı', 'error');
        }
    } catch (error) {
        showToast('Bağlantı hatası: ' + error.message, 'error');
    } finally {
        elements.createIssueBtn.disabled = false;
        elements.createIssueBtn.textContent = '➕ Görev Oluştur';
    }
}

// Generate Report
async function generateReport() {
    elements.generateReportBtn.disabled = true;
    elements.generateReportBtn.textContent = '⏳ Oluşturuluyor...';
    elements.reportContent.innerHTML = '<p class="loading">Rapor oluşturuluyor...</p>';
    
    try {
        const response = await fetch(`${API_BASE}/agent/report`);
        const result = await response.json();
        
        if (result.success) {
            elements.reportContent.innerHTML = `<pre>${result.data.report}</pre>`;
            showToast('Rapor oluşturuldu', 'success');
        } else {
            elements.reportContent.innerHTML = `<p class="error">Hata: ${result.error}</p>`;
            showToast(result.error || 'Rapor oluşturulamadı', 'error');
        }
    } catch (error) {
        elements.reportContent.innerHTML = `<p class="error">Bağlantı hatası: ${error.message}</p>`;
        showToast('Bağlantı hatası: ' + error.message, 'error');
    } finally {
        elements.generateReportBtn.disabled = false;
        elements.generateReportBtn.textContent = '📊 Proje Raporu Oluştur';
    }
}

// Generate Daily Report
async function generateDailyReport() {
    elements.generateDailyReportBtn.disabled = true;
    elements.generateDailyReportBtn.textContent = '⏳ Oluşturuluyor...';
    elements.dailyReportContent.innerHTML = '<p class="loading">Günlük rapor oluşturuluyor...</p>';
    
    try {
        const response = await fetch(`${API_BASE}/agent/daily-report`);
        const result = await response.json();
        
        if (result.success) {
            const { report, completedCount, totalCount } = result.data;
            
            elements.dailyReportContent.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${completedCount}</div>
                        <div class="stat-label">Bugün Tamamlanan</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${totalCount}</div>
                        <div class="stat-label">Aktif Görevler</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%</div>
                        <div class="stat-label">Tamamlanma Oranı</div>
                    </div>
                </div>
                <div class="report-content">
                    <pre>${report}</pre>
                </div>
            `;
            showToast('Günlük rapor oluşturuldu', 'success');
        } else {
            elements.dailyReportContent.innerHTML = `<p class="error">Hata: ${result.error}</p>`;
            showToast(result.error || 'Günlük rapor oluşturulamadı', 'error');
        }
    } catch (error) {
        elements.dailyReportContent.innerHTML = `<p class="error">Bağlantı hatası: ${error.message}</p>`;
        showToast('Bağlantı hatası: ' + error.message, 'error');
    } finally {
        elements.generateDailyReportBtn.disabled = false;
        elements.generateDailyReportBtn.textContent = '📊 Günlük Rapor Oluştur';
    }
}

// Generate Sprint Analysis
async function generateSprintAnalysis() {
    elements.generateSprintAnalysisBtn.disabled = true;
    elements.generateSprintAnalysisBtn.textContent = '⏳ Analiz Ediliyor...';
    elements.sprintAnalysisContent.innerHTML = '<p class="loading">Sprint analizi yapılıyor...</p>';
    
    try {
        const sprintId = elements.analysisSprintId.value;
        const boardId = elements.analysisBoardId.value;
        
        const requestBody = {};
        if (sprintId) requestBody.sprintId = parseInt(sprintId);
        if (boardId) requestBody.boardId = parseInt(boardId);
        
        const response = await fetch(`${API_BASE}/agent/sprint-analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        const result = await response.json();
        
        if (result.success) {
            const { sprintHealth, completionRate, memberProgress, risks, recommendations, totalIssues } = result.data;
            
            // Health status emoji
            const healthEmoji = sprintHealth === 'On Track' ? '✅' : sprintHealth === 'At Risk' ? '⚠️' : '❌';
            
            let html = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${healthEmoji} ${sprintHealth}</div>
                        <div class="stat-label">Sprint Durumu</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${completionRate}%</div>
                        <div class="stat-label">Tamamlanma Oranı</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${totalIssues}</div>
                        <div class="stat-label">Toplam Görev</div>
                    </div>
                </div>
                
                <div class="section">
                    <h3>👥 Takım Üyesi Durumları</h3>
                    <div class="member-list">
            `;
            
            memberProgress.forEach(member => {
                const statusEmoji = member.status === 'On Track' ? '✅' : member.status === 'Behind' ? '⚠️' : '🚀';
                const statusClass = member.status === 'On Track' ? 'success' : member.status === 'Behind' ? 'warning' : 'info';
                
                html += `
                    <div class="member-card ${statusClass}">
                        <div class="member-header">
                            <strong>${statusEmoji} ${member.member}</strong>
                            <span class="badge ${statusClass}">${member.status}</span>
                        </div>
                        <div class="member-stats">
                            <span>✅ Tamamlanan: ${member.completedTasks}</span>
                            <span>📋 Kalan: ${member.remainingTasks}</span>
                        </div>
                        ${member.risk && member.risk !== 'Yok' ? `<div class="member-risk">⚠️ ${member.risk}</div>` : ''}
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
            
            if (risks && risks.length > 0) {
                html += `
                    <div class="section">
                        <h3>⚠️ Riskler</h3>
                        <ul class="risk-list">
                            ${risks.map(risk => `<li>${risk}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            
            if (recommendations && recommendations.length > 0) {
                html += `
                    <div class="section">
                        <h3>💡 Öneriler</h3>
                        <ul class="recommendation-list">
                            ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            
            elements.sprintAnalysisContent.innerHTML = html;
            showToast('Sprint analizi tamamlandı', 'success');
        } else {
            elements.sprintAnalysisContent.innerHTML = `<p class="error">Hata: ${result.error}</p>`;
            showToast(result.error || 'Sprint analizi yapılamadı', 'error');
        }
    } catch (error) {
        elements.sprintAnalysisContent.innerHTML = `<p class="error">Bağlantı hatası: ${error.message}</p>`;
        showToast('Bağlantı hatası: ' + error.message, 'error');
    } finally {
        elements.generateSprintAnalysisBtn.disabled = false;
        elements.generateSprintAnalysisBtn.textContent = '📈 Sprint Analizi Yap';
    }
}

// Suggest Assignee
async function suggestAssignee() {
    const taskKey = elements.assignTaskKey.value.trim();
    const taskDescription = elements.assignTaskDescription.value.trim();
    
    if (!taskKey && !taskDescription) {
        showToast('Görev anahtarı veya açıklama girin', 'error');
        return;
    }
    
    elements.suggestAssigneeBtn.disabled = true;
    elements.suggestAssigneeBtn.textContent = '⏳ Analiz ediliyor...';
    elements.assignmentResult.style.display = 'block';
    elements.assignmentContent.innerHTML = '<p class="loading">AI atama önerisi hazırlıyor...</p>';
    
    try {
        let task;
        
        if (taskKey) {
            // Jira'dan görev bilgisini al
            try {
                const response = await fetch(`${API_BASE}/jira/issue/${taskKey}`);
                const result = await response.json();
                if (result.success) {
                    task = result.data;
                }
            } catch (error) {
                console.log('Jira\'dan görev alınamadı, açıklama kullanılacak');
            }
        }
        
        if (!task) {
            task = {
                fields: {
                    summary: taskDescription,
                    description: taskDescription,
                    issuetype: { name: 'Task' }
                }
            };
        }
        
        const response = await fetch(`${API_BASE}/agent/suggest-assignee`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task })
        });
        
        const result = await response.json();
        
        if (result.success) {
            const { recommendedAssignee, confidence, reasoning, alternatives, demoMode } = result.data;
            
            let html = `
                <div class="assignment-suggestion">
                    <div class="recommended-assignee">
                        <h4>✅ Önerilen Kişi</h4>
                        <div class="assignee-card primary">
                            <div class="assignee-name">${recommendedAssignee}</div>
                            <div class="confidence-badge">Güven: ${confidence}%</div>
                        </div>
                        <p class="reasoning">${reasoning}</p>
                    </div>
            `;
            
            if (alternatives && alternatives.length > 0) {
                html += `
                    <div class="alternative-assignees">
                        <h4>🔄 Alternatif Seçenekler</h4>
                        ${alternatives.map(alt => `
                            <div class="assignee-card">
                                <div class="assignee-name">${alt.assignee}</div>
                                <p class="alt-reason">${alt.reason}</p>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            if (demoMode) {
                html += '<p class="demo-note">🟦 Demo modunda çalışıyor</p>';
            }
            
            html += '</div>';
            
            elements.assignmentContent.innerHTML = html;
            showToast('Atama önerisi hazırlandı', 'success');
        } else {
            elements.assignmentContent.innerHTML = `<p class="error">Hata: ${result.error}</p>`;
            showToast(result.error || 'Atama önerisi oluşturulamadı', 'error');
        }
    } catch (error) {
        elements.assignmentContent.innerHTML = `<p class="error">Bağlantı hatası: ${error.message}</p>`;
        showToast('Bağlantı hatası: ' + error.message, 'error');
    } finally {
        elements.suggestAssigneeBtn.disabled = false;
        elements.suggestAssigneeBtn.textContent = '🤖 Atama Öner';
    }
}

// Generate Retrospective
async function generateRetrospective() {
    elements.generateRetroBtn.disabled = true;
    elements.generateRetroBtn.textContent = '⏳ Analiz ediliyor...';
    elements.retroResult.style.display = 'block';
    elements.retroContent.innerHTML = '<p class="loading">Sprint retrospective hazırlanıyor...</p>';
    
    try {
        const sprintId = elements.retroSprintId.value;
        const boardId = elements.retroBoardId.value;
        
        const requestBody = {};
        if (sprintId) requestBody.sprintId = parseInt(sprintId);
        if (boardId) requestBody.boardId = parseInt(boardId);
        
        const response = await fetch(`${API_BASE}/agent/retrospective`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        const result = await response.json();
        
        if (result.success) {
            const { summary, whatWentWell, whatDidntGoWell, actionItems, teamPerformance, recommendations, demoMode } = result.data;
            
            let html = `
                <div class="retrospective-report">
                    <div class="retro-summary">
                        <h4>📝 Özet</h4>
                        <p>${summary}</p>
                    </div>
                    
                    <div class="retro-section success">
                        <h4>✅ İyi Giden Şeyler</h4>
                        <ul>
                            ${whatWentWell.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="retro-section warning">
                        <h4>⚠️ İyileştirilebilecekler</h4>
                        <ul>
                            ${whatDidntGoWell.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="retro-section action">
                        <h4>🎯 Aksiyon Maddeleri</h4>
                        ${actionItems.map(item => `
                            <div class="action-item priority-${item.priority}">
                                <strong>${item.title}</strong>
                                <p>${item.description}</p>
                                <span class="priority-badge ${item.priority}">${item.priority === 'high' ? 'Yüksek' : item.priority === 'medium' ? 'Orta' : 'Düşük'} Öncelik</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="retro-section performance">
                        <h4>📊 Takım Performansı</h4>
                        <div class="performance-score">
                            <div class="score">${teamPerformance.score}/10</div>
                            <p>${teamPerformance.analysis}</p>
                        </div>
                    </div>
                    
                    <div class="retro-section recommendations">
                        <h4>💡 Öneriler</h4>
                        <ul>
                            ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                    
                    ${demoMode ? '<p class="demo-note">🟦 Demo modunda çalışıyor</p>' : ''}
                </div>
            `;
            
            elements.retroContent.innerHTML = html;
            showToast('Retrospective hazırlandı', 'success');
        } else {
            elements.retroContent.innerHTML = `<p class="error">Hata: ${result.error}</p>`;
            showToast(result.error || 'Retrospective oluşturulamadı', 'error');
        }
    } catch (error) {
        elements.retroContent.innerHTML = `<p class="error">Bağlantı hatası: ${error.message}</p>`;
        showToast('Bağlantı hatası: ' + error.message, 'error');
    } finally {
        elements.generateRetroBtn.disabled = false;
        elements.generateRetroBtn.textContent = '📊 Retrospective Oluştur';
    }
}

// Detect Blockers
async function detectBlockers() {
    elements.detectBlockersBtn.disabled = true;
    elements.detectBlockersBtn.textContent = '⏳ Analiz ediliyor...';
    elements.blockersContent.innerHTML = '<p class="loading">Bloke görevler tespit ediliyor...</p>';
    
    try {
        const response = await fetch(`${API_BASE}/agent/detect-blockers`);
        const result = await response.json();
        
        if (result.success) {
            const { blockedCount, summary, blockers, demoMode } = result.data;
            
            let html = `
                <div class="blockers-report">
                    <div class="summary-box ${blockedCount > 0 ? 'warning' : 'success'}">
                        <h3>${blockedCount > 0 ? '⚠️' : '✅'} ${summary}</h3>
                    </div>
            `;
            
            if (blockers && blockers.length > 0) {
                html += '<div class="blockers-list">';
                blockers.forEach(blocker => {
                    html += `
                        <div class="blocker-card risk-${blocker.riskLevel}">
                            <div class="blocker-header">
                                <span class="issue-key">${blocker.issueKey}</span>
                                <span class="days-stuck">${blocker.daysStuck} gün</span>
                                <span class="risk-badge ${blocker.riskLevel}">${blocker.riskLevel === 'high' ? 'Yüksek Risk' : blocker.riskLevel === 'medium' ? 'Orta Risk' : 'Düşük Risk'}</span>
                            </div>
                            <h4>${blocker.title}</h4>
                            <p class="reason"><strong>Muhtemel Neden:</strong> ${blocker.reason}</p>
                            <div class="recommendations">
                                <strong>Öneriler:</strong>
                                <ul>
                                    ${blocker.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
            }
            
            if (demoMode) {
                html += '<p class="demo-note">🟦 Demo modunda çalışıyor</p>';
            }
            
            html += '</div>';
            
            elements.blockersContent.innerHTML = html;
            showToast('Bloker tespiti tamamlandı', 'success');
        } else {
            elements.blockersContent.innerHTML = `<p class="error">Hata: ${result.error}</p>`;
            showToast(result.error || 'Bloker tespiti yapılamadı', 'error');
        }
    } catch (error) {
        elements.blockersContent.innerHTML = `<p class="error">Bağlantı hatası: ${error.message}</p>`;
        showToast('Bağlantı hatası: ' + error.message, 'error');
    } finally {
        elements.detectBlockersBtn.disabled = false;
        elements.detectBlockersBtn.textContent = '🔍 Bloke Görevleri Tespit Et';
    }
}

// Analyze Risk
async function analyzeRisk() {
    elements.analyzeRiskBtn.disabled = true;
    elements.analyzeRiskBtn.textContent = '⏳ Analiz ediliyor...';
    elements.riskContent.innerHTML = '<p class="loading">Sprint riski hesaplanıyor...</p>';
    
    try {
        const boardId = elements.riskBoardId.value;
        const remainingDays = elements.remainingDays.value;
        
        const response = await fetch(`${API_BASE}/agent/sprint-risk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                boardId: boardId ? parseInt(boardId) : undefined,
                remainingDays: remainingDays ? parseInt(remainingDays) : 7
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            const { riskScore, riskLevel, risks, completionRate, recommendations } = result.data;
            
            const riskColor = riskLevel === 'high' ? '#ef4444' : riskLevel === 'medium' ? '#f59e0b' : '#10b981';
            const riskEmoji = riskLevel === 'high' ? '🔴' : riskLevel === 'medium' ? '🟡' : '🟢';
            
            let html = `
                <div class="risk-analysis">
                    <div class="risk-score-card" style="border-left: 5px solid ${riskColor}">
                        <div class="risk-header">
                            <h3>${riskEmoji} Risk Seviyesi: ${riskLevel === 'high' ? 'Yüksek' : riskLevel === 'medium' ? 'Orta' : 'Düşük'}</h3>
                            <div class="risk-score">${riskScore}/100</div>
                        </div>
                        <div class="risk-bar">
                            <div class="risk-fill" style="width: ${riskScore}%; background: ${riskColor}"></div>
                        </div>
                        <p class="completion-info">Sprint Tamamlanma: ${completionRate}%</p>
                    </div>
                    
                    ${risks && risks.length > 0 ? `
                        <div class="risk-factors">
                            <h4>⚠️ Risk Faktörleri</h4>
                            <ul>
                                ${risks.map(risk => `<li>${risk}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${recommendations && recommendations.length > 0 ? `
                        <div class="risk-recommendations">
                            <h4>💡 Öneriler</h4>
                            <ul>
                                ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            `;
            
            elements.riskContent.innerHTML = html;
            showToast('Risk analizi tamamlandı', 'success');
        } else {
            elements.riskContent.innerHTML = `<p class="error">Hata: ${result.error}</p>`;
            showToast(result.error || 'Risk analizi yapılamadı', 'error');
        }
    } catch (error) {
        elements.riskContent.innerHTML = `<p class="error">Bağlantı hatası: ${error.message}</p>`;
        showToast('Bağlantı hatası: ' + error.message, 'error');
    } finally {
        elements.analyzeRiskBtn.disabled = false;
        elements.analyzeRiskBtn.textContent = '📊 Risk Analizi Yap';
    }
}

// Analyze Velocity
async function analyzeVelocity() {
    elements.analyzeVelocityBtn.disabled = true;
    elements.analyzeVelocityBtn.textContent = '⏳ Analiz ediliyor...';
    elements.velocityContent.innerHTML = '<p class="loading">Velocity analizi yapılıyor...</p>';
    
    try {
        const response = await fetch(`${API_BASE}/agent/velocity-analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        
        const result = await response.json();
        
        if (result.success) {
            const { averageVelocity, trend, sprints, recommendation, demoMode } = result.data;
            
            const trendEmoji = trend === 'increasing' ? '📈' : trend === 'decreasing' ? '📉' : '➡️';
            const trendText = trend === 'increasing' ? 'Artıyor' : trend === 'decreasing' ? 'Azalıyor' : 'Stabil';
            const trendColor = trend === 'increasing' ? '#10b981' : trend === 'decreasing' ? '#ef4444' : '#6b7280';
            
            let html = `
                <div class="velocity-analysis">
                    <div class="velocity-summary">
                        <div class="velocity-stat">
                            <div class="stat-label">Ortalama Velocity</div>
                            <div class="stat-value">${averageVelocity}</div>
                            <div class="stat-unit">görev/sprint</div>
                        </div>
                        <div class="velocity-stat" style="border-left: 4px solid ${trendColor}">
                            <div class="stat-label">Trend</div>
                            <div class="stat-value">${trendEmoji} ${trendText}</div>
                        </div>
                    </div>
                    
                    <div class="recommendation-box">
                        <h4>💡 Öneri</h4>
                        <p>${recommendation}</p>
                    </div>
                    
                    <div class="velocity-chart">
                        <h4>Sprint Geçmişi</h4>
                        ${sprints.map(sprint => `
                            <div class="sprint-bar">
                                <div class="sprint-label">${sprint.sprintName}</div>
                                <div class="sprint-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${sprint.completionRate}%"></div>
                                    </div>
                                    <span class="sprint-stats">${sprint.completed}/${sprint.planned} (${sprint.completionRate}%)</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    ${demoMode ? '<p class="demo-note">🟦 Demo modunda çalışıyor</p>' : ''}
                </div>
            `;
            
            elements.velocityContent.innerHTML = html;
            showToast('Velocity analizi tamamlandı', 'success');
        } else {
            elements.velocityContent.innerHTML = `<p class="error">Hata: ${result.error}</p>`;
            showToast(result.error || 'Velocity analizi yapılamadı', 'error');
        }
    } catch (error) {
        elements.velocityContent.innerHTML = `<p class="error">Bağlantı hatası: ${error.message}</p>`;
        showToast('Bağlantı hatası: ' + error.message, 'error');
    } finally {
        elements.analyzeVelocityBtn.disabled = false;
        elements.analyzeVelocityBtn.textContent = '🚀 Hız Analizi Yap';
    }
}

// Show Toast Notification
function showToast(message, type = 'info') {
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.classList.add('show');
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}
