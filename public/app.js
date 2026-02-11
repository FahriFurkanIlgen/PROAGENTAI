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
        elements.generateReportBtn.textContent = '📊 Rapor Oluştur';
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
