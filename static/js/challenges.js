/**
 * OWASP Top 10 2021 - Challenge Management (Vanilla JS)
 */

/* global bootstrap, confetti */

let currentChallenge = null;
let attemptCount = 0;
let unlockedHints = 0;
let recentPayloadAttempts = [];
let currentModuleState = null;

const interfaceLoadingMarkup = `
    <div class="text-center">
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading challenge...</span>
        </div>
        <p class="mt-2 mb-0">Loading interactive challenge environment...</p>
    </div>
`;

function initializeChallenge(challengeData) {
    currentChallenge = challengeData;
    attemptCount = 0;
    unlockedHints = 0;
    recentPayloadAttempts = [];
    currentModuleState = challengeData.moduleState || null;

    loadChallengeInterface();
    setupProgressiveModules();
    setupFlagSubmission();
    setupProgressiveHints();
    setupAIHints();
}

function loadChallengeInterface() {
    const container = document.getElementById('challenge-interface');
    if (!container || !currentChallenge) return;

    container.innerHTML = interfaceLoadingMarkup;

    window.setTimeout(() => {
        container.innerHTML = getChallengeInterface(currentChallenge.owasp_id);
        initializeChallengeSpecifics(currentChallenge.owasp_id);
    }, 400);
}

function getChallengeInterface(owaspId) {
    const interfaces = {
        A01: getBrokenAccessControlInterface(),
        A02: getCryptographicFailuresInterface(),
        A03: getInjectionInterface(),
        A04: getInsecureDesignInterface(),
        A05: getSecurityMisconfigurationInterface(),
        A06: getVulnerableComponentsInterface(),
        A07: getAuthenticationFailuresInterface(),
        A08: getDataIntegrityFailuresInterface(),
        A09: getLoggingFailuresInterface(),
        A10: getSSRFInterface()
    };

    return interfaces[owaspId] || getDefaultInterface();
}

function getBrokenAccessControlInterface() {
    return `
        <div class="challenge-simulator">
            <h6><i class="fas fa-terminal"></i> User Profile Access Simulator</h6>
            <p class="text-muted">Try to access other users' profiles by manipulating the user_id parameter.</p>
            <div class="api-tester">
                <div class="mb-3">
                    <label class="form-label">API Endpoint:</label>
                    <code>/api/challenge/A01/vulnerable</code>
                </div>
                <div class="mb-3">
                    <label for="user-id-input" class="form-label">User ID:</label>
                    <input type="number" class="form-control" id="user-id-input" value="1" min="1" max="10">
                </div>
                <button class="btn btn-primary" type="button" onclick="testBrokenAccessControl()">
                    <i class="fas fa-play"></i> Test Access
                </button>
            </div>
            <div id="api-response" class="mt-3"></div>
        </div>
    `;
}

function getCryptographicFailuresInterface() {
    return `
        <div class="challenge-simulator">
            <h6><i class="fas fa-lock"></i> Weak Encryption Analyzer</h6>
            <p class="text-muted">Analyze the weak encryption algorithm used to protect sensitive data.</p>
            <div class="api-tester">
                <div class="mb-3">
                    <label class="form-label">API Endpoint:</label>
                    <code>/api/challenge/A02/vulnerable</code>
                </div>
                <div class="mb-3">
                    <label for="data-input" class="form-label">Data to encrypt:</label>
                    <input type="text" class="form-control" id="data-input" placeholder="Enter data to encrypt">
                    <small class="form-text text-muted">Hint: Try encrypting the word "secret"</small>
                </div>
                <button class="btn btn-primary" type="button" onclick="testCryptographicFailures()">
                    <i class="fas fa-shield-alt"></i> Encrypt Data
                </button>
            </div>
            <div id="api-response" class="mt-3"></div>
        </div>
    `;
}

function getInjectionInterface() {
    return `
        <div class="challenge-simulator">
            <h6><i class="fas fa-database"></i> User Lookup System</h6>
            <p class="text-muted">Search for users in the database. The system might be vulnerable to SQL injection.</p>
            <div class="api-tester">
                <div class="mb-3">
                    <label class="form-label">API Endpoint:</label>
                    <code>/api/challenge/A03/vulnerable</code>
                </div>
                <div class="mb-3">
                    <label for="username-input" class="form-label">Username:</label>
                    <input type="text" class="form-control font-monospace" id="username-input" placeholder="Enter username">
                    <small class="form-text text-muted">Hint: Try SQL injection payloads like ' OR '1'='1' UNION SELECT * FROM users--</small>
                </div>
                <button class="btn btn-primary" type="button" onclick="testInjection()">
                    <i class="fas fa-search"></i> Search User
                </button>
            </div>
            <div id="api-response" class="mt-3"></div>
        </div>
    `;
}

function getInsecureDesignInterface() {
    return `
        <div class="challenge-simulator">
            <h6><i class="fas fa-key"></i> Password Reset System</h6>
            <p class="text-muted">Reset any user's password without proper verification.</p>
            <div class="api-tester">
                <div class="mb-3">
                    <label class="form-label">API Endpoint:</label>
                    <code>/api/challenge/A04/vulnerable</code>
                </div>
                <div class="mb-3">
                    <label for="email-input" class="form-label">Email:</label>
                    <input type="email" class="form-control" id="email-input" placeholder="user@example.com">
                    <small class="form-text text-muted">Hint: Try admin@company.com</small>
                </div>
                <div class="mb-3">
                    <label for="new-password-input" class="form-label">New Password:</label>
                    <input type="password" class="form-control" id="new-password-input" placeholder="New password">
                </div>
                <button class="btn btn-primary" type="button" onclick="testInsecureDesign()">
                    <i class="fas fa-sync"></i> Reset Password
                </button>
            </div>
            <div id="api-response" class="mt-3"></div>
        </div>
    `;
}

function getSecurityMisconfigurationInterface() {
    return `
        <div class="challenge-simulator">
            <h6><i class="fas fa-cog"></i> Application Configuration</h6>
            <p class="text-muted">Check if debug mode exposes sensitive information.</p>
            <div class="api-tester">
                <div class="mb-3">
                    <label class="form-label">API Endpoint:</label>
                    <code>/api/challenge/A05/vulnerable</code>
                </div>
                <div class="form-check mb-3">
                    <input class="form-check-input" type="checkbox" id="debug-checkbox">
                    <label class="form-check-label" for="debug-checkbox">
                        Enable Debug Mode
                    </label>
                    <small class="form-text text-muted d-block">Debug mode might expose sensitive information</small>
                </div>
                <button class="btn btn-primary" type="button" onclick="testSecurityMisconfiguration()">
                    <i class="fas fa-server"></i> Check Configuration
                </button>
            </div>
            <div id="api-response" class="mt-3"></div>
        </div>
    `;
}

function getVulnerableComponentsInterface() {
    return `
        <div class="challenge-simulator">
            <h6><i class="fas fa-box"></i> Component Version Checker</h6>
            <p class="text-muted">Check for outdated components with known vulnerabilities.</p>
            <div class="api-tester">
                <div class="mb-3">
                    <label class="form-label">API Endpoint:</label>
                    <code>/api/challenge/A06/vulnerable</code>
                </div>
                <div class="mb-3">
                    <label for="component-select" class="form-label">Component to check:</label>
                    <select class="form-select" id="component-select">
                        <option value="">Select a component</option>
                        <option value="jquery">jQuery</option>
                        <option value="bootstrap">Bootstrap</option>
                        <option value="react">React</option>
                    </select>
                </div>
                <button class="btn btn-primary" type="button" onclick="testVulnerableComponents()">
                    <i class="fas fa-search"></i> Check Version
                </button>
            </div>
            <div id="api-response" class="mt-3"></div>
        </div>
    `;
}

function getAuthenticationFailuresInterface() {
    return `
        <div class="challenge-simulator">
            <h6><i class="fas fa-sign-in-alt"></i> Login System</h6>
            <p class="text-muted">Try to login with common weak passwords.</p>
            <div class="api-tester">
                <div class="mb-3">
                    <label class="form-label">API Endpoint:</label>
                    <code>/api/challenge/A07/vulnerable</code>
                </div>
                <div class="mb-3">
                    <label for="login-username" class="form-label">Username:</label>
                    <input type="text" class="form-control" id="login-username" placeholder="Username">
                    <small class="form-text text-muted">Hint: Try "admin"</small>
                </div>
                <div class="mb-3">
                    <label for="login-password" class="form-label">Password:</label>
                    <input type="password" class="form-control" id="login-password" placeholder="Password">
                    <small class="form-text text-muted">Hint: Try common weak passwords</small>
                </div>
                <button class="btn btn-primary" type="button" onclick="testAuthenticationFailures()">
                    <i class="fas fa-sign-in-alt"></i> Login
                </button>
            </div>
            <div id="api-response" class="mt-3"></div>
        </div>
    `;
}

function getDataIntegrityFailuresInterface() {
    return `
        <div class="challenge-simulator">
            <h6><i class="fas fa-file-code"></i> Data Processing System</h6>
            <p class="text-muted">Send data to be processed by the system.</p>
            <div class="api-tester">
                <div class="mb-3">
                    <label class="form-label">API Endpoint:</label>
                    <code>/api/challenge/A08/vulnerable</code>
                </div>
                <div class="mb-3">
                    <label for="data-payload" class="form-label">Data Payload:</label>
                    <textarea class="form-control font-monospace" id="data-payload" rows="3" placeholder="Enter data to process"></textarea>
                    <small class="form-text text-muted">Hint: Try including "payload" and "flag" in your data</small>
                </div>
                <button class="btn btn-primary" type="button" onclick="testDataIntegrityFailures()">
                    <i class="fas fa-upload"></i> Process Data
                </button>
            </div>
            <div id="api-response" class="mt-3"></div>
        </div>
    `;
}

function getLoggingFailuresInterface() {
    return `
        <div class="challenge-simulator">
            <h6><i class="fas fa-clipboard-list"></i> System Operations</h6>
            <p class="text-muted">Perform operations that should be logged for security audit.</p>
            <div class="api-tester">
                <div class="mb-3">
                    <label class="form-label">API Endpoint:</label>
                    <code>/api/challenge/A09/vulnerable</code>
                </div>
                <div class="mb-3">
                    <label for="action-select" class="form-label">Action to perform:</label>
                    <select class="form-select" id="action-select">
                        <option value="">Select an action</option>
                        <option value="normal_operation">Normal Operation</option>
                        <option value="sensitive_operation">Sensitive Operation</option>
                        <option value="admin_operation">Admin Operation</option>
                    </select>
                </div>
                <button class="btn btn-primary" type="button" onclick="testLoggingFailures()">
                    <i class="fas fa-play"></i> Execute Action
                </button>
            </div>
            <div id="api-response" class="mt-3"></div>
        </div>
    `;
}

function getSSRFInterface() {
    return `
        <div class="challenge-simulator">
            <h6><i class="fas fa-globe"></i> URL Fetcher Service</h6>
            <p class="text-muted">Fetch content from external URLs. Try accessing internal resources.</p>
            <div class="api-tester">
                <div class="mb-3">
                    <label class="form-label">API Endpoint:</label>
                    <code>/api/challenge/A10/vulnerable</code>
                </div>
                <div class="mb-3">
                    <label for="url-input" class="form-label">URL to fetch:</label>
                    <input type="url" class="form-control" id="url-input" placeholder="https://example.com">
                    <small class="form-text text-muted">Hint: Try internal URLs like http://localhost or http://127.0.0.1</small>
                </div>
                <button class="btn btn-primary" type="button" onclick="testSSRF()">
                    <i class="fas fa-download"></i> Fetch URL
                </button>
            </div>
            <div id="api-response" class="mt-3"></div>
        </div>
    `;
}

function getDefaultInterface() {
    return `
        <div class="alert alert-info">
            <i class="fas fa-info-circle"></i>
            <strong>Challenge Loading...</strong>
            This challenge is being prepared. Please check back soon.
        </div>
    `;
}

function testBrokenAccessControl() {
    const userId = document.getElementById('user-id-input')?.value || '';
    trackPayloadAttempt(`user_id=${userId}`);
    makeAPICall(`/api/challenge/A01/vulnerable?user_id=${encodeURIComponent(userId)}`);
}

function testCryptographicFailures() {
    const data = document.getElementById('data-input')?.value || '';
    trackPayloadAttempt(`data=${data}`);
    makeAPICall(`/api/challenge/A02/vulnerable?data=${encodeURIComponent(data)}`);
}

function testInjection() {
    const username = document.getElementById('username-input')?.value || '';
    trackPayloadAttempt(`username=${username}`);
    makeAPICall(`/api/challenge/A03/vulnerable?username=${encodeURIComponent(username)}`);
}

function testInsecureDesign() {
    const email = document.getElementById('email-input')?.value || '';
    const newPassword = document.getElementById('new-password-input')?.value || '';
    trackPayloadAttempt(`email=${email}&new_password=${newPassword}`);
    makeAPICall(`/api/challenge/A04/vulnerable?email=${encodeURIComponent(email)}&new_password=${encodeURIComponent(newPassword)}`);
}

function testSecurityMisconfiguration() {
    const debugEnabled = document.getElementById('debug-checkbox')?.checked ? 'true' : 'false';
    trackPayloadAttempt(`debug=${debugEnabled}`);
    makeAPICall(`/api/challenge/A05/vulnerable?debug=${debugEnabled}`);
}

function testVulnerableComponents() {
    const component = document.getElementById('component-select')?.value || '';
    trackPayloadAttempt(`check_version=${component}`);
    makeAPICall(`/api/challenge/A06/vulnerable?check_version=${encodeURIComponent(component)}`);
}

function testAuthenticationFailures() {
    const username = document.getElementById('login-username')?.value || '';
    const password = document.getElementById('login-password')?.value || '';
    trackPayloadAttempt(`username=${username}&password=${password}`);
    makeAPICall(`/api/challenge/A07/vulnerable?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
}

function testDataIntegrityFailures() {
    const data = document.getElementById('data-payload')?.value || '';
    trackPayloadAttempt(`data=${data}`);
    makeAPICall(`/api/challenge/A08/vulnerable?data=${encodeURIComponent(data)}`);
}

function testLoggingFailures() {
    const action = document.getElementById('action-select')?.value || '';
    trackPayloadAttempt(`action=${action}`);
    makeAPICall(`/api/challenge/A09/vulnerable?action=${encodeURIComponent(action)}`);
}

function testSSRF() {
    const url = document.getElementById('url-input')?.value || '';
    trackPayloadAttempt(`url=${url}`);
    makeAPICall(`/api/challenge/A10/vulnerable?url=${encodeURIComponent(url)}`);
}

function trackPayloadAttempt(payload) {
    const value = String(payload || '').trim();
    if (!value) return;
    recentPayloadAttempts.unshift(value.slice(0, 500));
    if (recentPayloadAttempts.length > 10) {
        recentPayloadAttempts = recentPayloadAttempts.slice(0, 10);
    }
}

function makeAPICall(url) {
    const responseContainer = document.getElementById('api-response');
    if (!responseContainer) return;

    responseContainer.innerHTML = `
        <div class="alert alert-info d-flex align-items-center gap-2">
            <div class="spinner-border spinner-border-sm" role="status"></div>
            <span>Making API call...</span>
        </div>
    `;

    fetch(url, { credentials: 'same-origin' })
        .then(async (resp) => {
            const data = await resp.json();
            if (!resp.ok) {
                data.error = data.error || `HTTP ${resp.status}`;
            }
            return data;
        })
        .then((data) => displayAPIResponse(data))
        .catch((error) => displayAPIResponse({ error: 'Request failed', message: error.message }));
}

function displayAPIResponse(data) {
    const responseContainer = document.getElementById('api-response');
    if (!responseContainer) return;

    let alertClass = 'alert-info';
    if (data.flag || data.success) {
        alertClass = 'alert-success';
    } else if (data.error) {
        alertClass = 'alert-danger';
    } else if (data.warning) {
        alertClass = 'alert-warning';
    }

    const formattedData = escapeHtml(JSON.stringify(data, null, 2));

    const sandboxErrorHtml = data.sandbox_error
        ? `<div class="alert alert-warning mb-2"><strong>Sandbox SQL Error:</strong> ${escapeHtml(data.sandbox_error)}</div>`
        : '';

    responseContainer.innerHTML = `
        <div class="alert ${alertClass}">
            <h6 class="d-flex align-items-center gap-2">
                <i class="fas fa-code"></i> API Response
            </h6>
            ${sandboxErrorHtml}
            <pre class="mb-0"><code>${formattedData}</code></pre>
        </div>
    `;
}

function setupFlagSubmission() {
    const flagForm = document.getElementById('flag-form');
    if (!flagForm) return;

    flagForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const flagInput = document.getElementById('flag-input');
        const challengeIdInput = document.getElementById('challenge-id');
        const flagValue = flagInput?.value.trim();
        if (!isFlagSubmissionUnlocked()) {
            showSubmissionResult('Complete all quiz modules first to unlock flag submission.', 'warning');
            return;
        }

        if (!flagValue) {
            showSubmissionResult('Please enter a flag', 'danger');
            return;
        }

        showSubmissionResult('Validating flag...', 'info', true);

        fetch('/submit_flag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                challenge_id: challengeIdInput?.value,
                flag: flagValue
            })
        })
            .then((resp) => resp.json())
            .then((data) => {
                if (data.success) {
                    currentChallenge.completed = true;
                    showSubmissionResult(data.message, 'success');
                    updateProgress(true);
                    incrementAttemptCount();
                    refreshModuleState();
                    updateFlagStatusMessage();

                    if (typeof confetti === 'function') {
                        confetti({
                            particleCount: 100,
                            spread: 70,
                            origin: { y: 0.6 }
                        });
                    }
                } else {
                    showSubmissionResult(data.message, 'danger');
                    incrementAttemptCount();
                }
            })
            .catch(() => {
                showSubmissionResult('Error submitting flag. Please try again.', 'danger');
            });
    });
}

function setupProgressiveModules() {
    if (!currentChallenge) return;
    if (currentModuleState) {
        renderModules(currentModuleState.modules || []);
    } else {
        refreshModuleState();
    }
}

function refreshModuleState() {
    if (!currentChallenge) return;
    fetch(`/api/challenge/${currentChallenge.owasp_id}/modules`, { credentials: 'same-origin' })
        .then(async (resp) => {
            const data = await resp.json();
            if (!resp.ok || !data.success) {
                throw new Error(data.message || 'Failed to load challenge modules');
            }
            return data;
        })
        .then((data) => {
            currentModuleState = {
                modules: data.modules || [],
                quiz_count: data.quiz_count || 0,
                completed_quiz_count: data.completed_quiz_count || 0,
                can_submit_flag: !!data.can_submit_flag
            };
            renderModules(currentModuleState.modules);
            setFlagSubmissionLock(!currentModuleState.can_submit_flag && !currentChallenge.completed);
            updateProgress(currentChallenge.completed);
            updateFlagStatusMessage();
        })
        .catch((error) => {
            const modulesContainer = document.getElementById('modules-interface');
            if (modulesContainer) {
                modulesContainer.innerHTML = `<div class="alert alert-danger mb-0">${escapeHtml(error.message)}</div>`;
            }
        });
}

function renderModules(modules) {
    const modulesContainer = document.getElementById('modules-interface');
    if (!modulesContainer) return;

    if (!Array.isArray(modules) || modules.length === 0) {
        modulesContainer.innerHTML = '<div class="alert alert-warning mb-0">No modules configured for this challenge.</div>';
        return;
    }

    modulesContainer.innerHTML = modules.map((module) => {
        const locked = !module.unlocked;
        const completed = !!module.completed;
        const lockIcon = completed ? 'fa-check-circle text-success' : (locked ? 'fa-lock text-muted' : 'fa-unlock text-primary');
        const headerBadge = completed
            ? '<span class="badge bg-success">Completed</span>'
            : (locked ? '<span class="badge bg-secondary">Locked</span>' : '<span class="badge bg-primary">Open</span>');

        if (module.type === 'flag') {
            return `
                <div class="card border-0 module-stage-card mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="mb-0"><i class="fas ${lockIcon} me-2"></i>${escapeHtml(module.title || 'Final Module')}</h6>
                            ${headerBadge}
                        </div>
                        <p class="mb-0 text-muted">${escapeHtml(module.prompt || 'Submit the flag once unlocked.')}</p>
                    </div>
                </div>
            `;
        }

        const options = Array.isArray(module.options) ? module.options : [];
        const optionsMarkup = options.map((option) => `
            <div class="form-check mb-2">
                <input class="form-check-input" type="radio" name="module-${module.index}-answer" id="module-${module.index}-${escapeHtml(option.key)}" value="${escapeHtml(option.key)}" ${locked || completed ? 'disabled' : ''}>
                <label class="form-check-label" for="module-${module.index}-${escapeHtml(option.key)}">${escapeHtml(option.label)}</label>
            </div>
        `).join('');

        return `
            <div class="card border-0 module-stage-card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="mb-0"><i class="fas ${lockIcon} me-2"></i>${escapeHtml(module.title || `Module ${module.index}`)}</h6>
                        ${headerBadge}
                    </div>
                    <p class="mb-3">${escapeHtml(module.question || module.prompt || '')}</p>
                    <div>${optionsMarkup}</div>
                    <button class="btn btn-sm btn-outline-primary mt-2" type="button" onclick="submitModuleAnswer(${module.index})" ${locked || completed ? 'disabled' : ''}>
                        Submit Module Answer
                    </button>
                    <div id="module-result-${module.index}" class="mt-2"></div>
                </div>
            </div>
        `;
    }).join('');
}

function submitModuleAnswer(moduleIndex) {
    if (!currentChallenge) return;
    const selected = document.querySelector(`input[name="module-${moduleIndex}-answer"]:checked`);
    const resultBox = document.getElementById(`module-result-${moduleIndex}`);

    if (!selected) {
        if (resultBox) {
            resultBox.innerHTML = '<div class="alert alert-warning py-2 mb-0">Select an option first.</div>';
        }
        return;
    }

    fetch(`/api/challenge/${currentChallenge.owasp_id}/module/${moduleIndex}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ answer: selected.value })
    })
        .then(async (resp) => {
            const data = await resp.json();
            if (!resp.ok) {
                throw new Error(data.message || 'Failed to submit module answer');
            }
            return data;
        })
        .then((data) => {
            const type = data.success ? 'success' : 'danger';
            if (resultBox) {
                resultBox.innerHTML = `<div class="alert alert-${type} py-2 mb-0">${escapeHtml(data.message || '')}</div>`;
            }

            currentModuleState = {
                modules: data.modules || [],
                quiz_count: data.quiz_count || 0,
                completed_quiz_count: data.completed_quiz_count || 0,
                can_submit_flag: !!data.can_submit_flag
            };
            renderModules(currentModuleState.modules);
            setFlagSubmissionLock(!currentModuleState.can_submit_flag && !currentChallenge.completed);
            updateProgress(currentChallenge.completed);
            updateFlagStatusMessage();
        })
        .catch((error) => {
            if (resultBox) {
                resultBox.innerHTML = `<div class="alert alert-danger py-2 mb-0">${escapeHtml(error.message)}</div>`;
            }
        });
}

function isFlagSubmissionUnlocked() {
    if (!currentModuleState) return currentChallenge?.completed;
    return !!currentChallenge?.completed || !!currentModuleState.can_submit_flag;
}

function setFlagSubmissionLock(locked) {
    const flagInput = document.getElementById('flag-input');
    const submitButton = document.querySelector('#flag-form button[type="submit"]');
    if (currentChallenge?.completed) return;
    if (flagInput) flagInput.disabled = locked;
    if (submitButton) submitButton.disabled = locked;
}

function updateFlagStatusMessage() {
    const container = document.getElementById('flag-status-message');
    if (!container) return;

    if (currentChallenge?.completed) {
        container.innerHTML = `
            <div class="alert alert-success">
                <i class="fas fa-check-circle"></i>
                <strong>Challenge Completed!</strong> You have already solved this challenge.
            </div>
        `;
        return;
    }

    const quizCount = Number(currentModuleState?.quiz_count || 0);
    const completedQuiz = Number(currentModuleState?.completed_quiz_count || 0);
    if (completedQuiz < quizCount) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-lock"></i>
                <strong>Flag submission locked.</strong>
                Complete all quiz modules first (${completedQuiz}/${quizCount}).
            </div>
        `;
        return;
    }

    container.innerHTML = '';
}

function setupProgressiveHints() {
    const button = document.getElementById('unlock-hint-btn');
    const list = document.getElementById('hintsList');
    const remaining = document.getElementById('hint-remaining');
    if (!button || !list) return;

    const totalHints = Number(button.dataset.total || 0);
    updateHintRemaining(remaining, totalHints);

    button.addEventListener('click', () => {
        const nextHint = unlockedHints + 1;
        fetch(`/api/hint/${currentChallenge.owasp_id}/${nextHint}`, { credentials: 'same-origin' })
            .then((resp) => resp.json())
            .then((data) => {
                if (!data.success) {
                    button.disabled = true;
                    showToast(data.message || 'No more hints available', 'warning');
                    updateHintRemaining(remaining, 0);
                    return;
                }

                unlockedHints = nextHint;
                const hintElement = document.createElement('p');
                hintElement.className = 'alert alert-info';
                hintElement.textContent = `${unlockedHints}. ${data.hint}`;
                list.appendChild(hintElement);

                updateHintRemaining(remaining, data.remaining);
                if (data.remaining === 0) {
                    button.disabled = true;
                }
            })
            .catch(() => {
                showToast('Error fetching hint', 'danger');
            });
    });
}

function updateHintRemaining(container, remaining) {
    if (!container) return;
    container.textContent = remaining > 0 ? `${remaining} hint(s) remaining` : 'No hints remaining';
}

function setupAIHints() {
    const button = document.getElementById('request-ai-hint-btn');
    const input = document.getElementById('ai-hint-question');
    const result = document.getElementById('ai-hint-result');
    if (!button || !result || !currentChallenge) return;

    button.addEventListener('click', () => {
        button.disabled = true;
        result.innerHTML = `
            <div class="alert alert-info d-flex align-items-center gap-2 mb-0">
                <div class="spinner-border spinner-border-sm" role="status"></div>
                <span>Generating conceptual hint...</span>
            </div>
        `;

        fetch('/api/ai/hint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                owasp_id: currentChallenge.owasp_id,
                question: input?.value || '',
                attempts: recentPayloadAttempts
            })
        })
            .then(async (resp) => {
                let data = null;
                try {
                    data = await resp.json();
                } catch (err) {
                    throw new Error('AI hint endpoint returned a non-JSON response');
                }

                if (!resp.ok || !data.success) {
                    throw new Error(data.message || 'AI hint request failed');
                }
                return data;
            })
            .then((data) => {
                const lines = escapeHtml(data.hint || '').replace(/\n/g, '<br>');
                result.innerHTML = `
                    <div class="alert alert-info mb-0">
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <i class="fas fa-robot"></i>
                            <strong>CTF Mentor Hint</strong>
                        </div>
                        <div>${lines}</div>
                    </div>
                `;
            })
            .catch((err) => {
                result.innerHTML = `
                    <div class="alert alert-danger mb-0">
                        <i class="fas fa-triangle-exclamation me-2"></i>${escapeHtml(err.message)}
                    </div>
                `;
            })
            .finally(() => {
                button.disabled = false;
            });
    });
}

function showSubmissionResult(message, type, loading = false) {
    const resultContainer = document.getElementById('submission-result');
    if (!resultContainer) return;

    const icon = loading
        ? '<div class="spinner-border spinner-border-sm me-2" role="status"></div>'
        : type === 'success'
        ? '<i class="fas fa-check-circle me-2"></i>'
        : type === 'danger'
        ? '<i class="fas fa-times-circle me-2"></i>'
        : '<i class="fas fa-info-circle me-2"></i>';

    resultContainer.innerHTML = `
        <div class="alert alert-${type} d-flex align-items-center mb-0">
            ${icon}<span>${message}</span>
        </div>
    `;
}

function updateProgress(completed) {
    const progressBar = document.querySelector('.progress-bar');
    const quizCount = currentModuleState?.quiz_count || 0;
    const completedQuiz = currentModuleState?.completed_quiz_count || 0;
    const totalSteps = quizCount + 1;
    const completedSteps = completed ? totalSteps : completedQuiz;
    const percent = totalSteps > 0 ? Math.floor((completedSteps * 100) / totalSteps) : (completed ? 100 : 0);

    if (progressBar) {
        progressBar.style.width = `${percent}%`;
        progressBar.textContent = `${percent}%`;
    }

    setFlagSubmissionLock(!isFlagSubmissionUnlocked());
}

function incrementAttemptCount() {
    attemptCount += 1;
    const attemptDisplay = document.getElementById('attempt-count');
    if (attemptDisplay) {
        attemptDisplay.textContent = attemptCount;
    }
}

function initializeChallengeSpecifics(owaspId) {
    console.debug(`Challenge interface initialised for ${owaspId}`);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard!', 'success'));
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0 position-fixed challenge-toast`;
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    document.body.appendChild(toast);
    const bootstrapToast = new bootstrap.Toast(toast);
    bootstrapToast.show();

    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
