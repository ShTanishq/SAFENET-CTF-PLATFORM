/**
 * OWASP Top 10 2021 - Challenge Management
 */

let currentChallenge = null;
let attemptCount = 0;

function initializeChallenge(challengeData) {
    currentChallenge = challengeData;
    
    // Load challenge interface
    loadChallengeInterface();
    
    // Setup flag submission
    setupFlagSubmission();
    
    // Load attempt count
    loadAttemptCount();
}

function loadChallengeInterface() {
    const $interface = $('#challenge-interface');
    const owaspId = currentChallenge.owasp_id;
    
    // Show loading state
    $interface.html(`
        <div class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading challenge...</span>
            </div>
            <p class="mt-2">Loading interactive challenge environment...</p>
        </div>
    `);
    
    // Load challenge-specific interface
    setTimeout(() => {
        const interfaceContent = getChallengeInterface(owaspId);
        $interface.html(interfaceContent);
        
        // Initialize challenge-specific functionality
        initializeChallengeSpecifics(owaspId);
    }, 1000);
}

function getChallengeInterface(owaspId) {
    const interfaces = {
        'A01': getBrokenAccessControlInterface(),
        'A02': getCryptographicFailuresInterface(),
        'A03': getInjectionInterface(),
        'A04': getInsecureDesignInterface(),
        'A05': getSecurityMisconfigurationInterface(),
        'A06': getVulnerableComponentsInterface(),
        'A07': getAuthenticationFailuresInterface(),
        'A08': getDataIntegrityFailuresInterface(),
        'A09': getLoggingFailuresInterface(),
        'A10': getSSRFInterface()
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
                
                <button class="btn btn-primary" onclick="testBrokenAccessControl()">
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
                
                <button class="btn btn-primary" onclick="testCryptographicFailures()">
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
                
                <button class="btn btn-primary" onclick="testInjection()">
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
                
                <button class="btn btn-primary" onclick="testInsecureDesign()">
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
                
                <button class="btn btn-primary" onclick="testSecurityMisconfiguration()">
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
                
                <button class="btn btn-primary" onclick="testVulnerableComponents()">
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
                
                <button class="btn btn-primary" onclick="testAuthenticationFailures()">
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
                
                <button class="btn btn-primary" onclick="testDataIntegrityFailures()">
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
                
                <button class="btn btn-primary" onclick="testLoggingFailures()">
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
                
                <button class="btn btn-primary" onclick="testSSRF()">
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

// Challenge-specific test functions
function testBrokenAccessControl() {
    const userId = $('#user-id-input').val();
    makeAPICall(`/api/challenge/A01/vulnerable?user_id=${userId}`);
}

function testCryptographicFailures() {
    const data = $('#data-input').val();
    makeAPICall(`/api/challenge/A02/vulnerable?data=${encodeURIComponent(data)}`);
}

function testInjection() {
    const username = $('#username-input').val();
    makeAPICall(`/api/challenge/A03/vulnerable?username=${encodeURIComponent(username)}`);
}

function testInsecureDesign() {
    const email = $('#email-input').val();
    const newPassword = $('#new-password-input').val();
    makeAPICall(`/api/challenge/A04/vulnerable?email=${encodeURIComponent(email)}&new_password=${encodeURIComponent(newPassword)}`);
}

function testSecurityMisconfiguration() {
    const debug = $('#debug-checkbox').is(':checked') ? 'true' : 'false';
    makeAPICall(`/api/challenge/A05/vulnerable?debug=${debug}`);
}

function testVulnerableComponents() {
    const component = $('#component-select').val();
    makeAPICall(`/api/challenge/A06/vulnerable?check_version=${component}`);
}

function testAuthenticationFailures() {
    const username = $('#login-username').val();
    const password = $('#login-password').val();
    makeAPICall(`/api/challenge/A07/vulnerable?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
}

function testDataIntegrityFailures() {
    const data = $('#data-payload').val();
    makeAPICall(`/api/challenge/A08/vulnerable?data=${encodeURIComponent(data)}`);
}

function testLoggingFailures() {
    const action = $('#action-select').val();
    makeAPICall(`/api/challenge/A09/vulnerable?action=${action}`);
}

function testSSRF() {
    const url = $('#url-input').val();
    makeAPICall(`/api/challenge/A10/vulnerable?url=${encodeURIComponent(url)}`);
}

function makeAPICall(url) {
    const $response = $('#api-response');
    
    // Show loading
    $response.html(`
        <div class="alert alert-info">
            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
            Making API call...
        </div>
    `);
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            displayAPIResponse(data);
        })
        .catch(error => {
            displayAPIResponse({
                error: 'Request failed',
                message: error.message
            });
        });
}

function displayAPIResponse(data) {
    const $response = $('#api-response');
    
    let alertClass = 'alert-info';
    if (data.flag) {
        alertClass = 'alert-success';
    } else if (data.error) {
        alertClass = 'alert-danger';
    } else if (data.warning) {
        alertClass = 'alert-warning';
    }
    
    const formattedData = JSON.stringify(data, null, 2);
    
    $response.html(`
        <div class="alert ${alertClass}">
            <h6><i class="fas fa-code"></i> API Response:</h6>
            <pre class="mb-0"><code>${formattedData}</code></pre>
        </div>
    `);
    
    // If response contains a flag, highlight it
    if (data.flag) {
        $response.find('pre').append(`
            <div class="mt-3 p-2 bg-success text-white rounded">
                <i class="fas fa-flag"></i> <strong>Flag found:</strong> ${data.flag}
            </div>
        `);
    }
}

function setupFlagSubmission() {
    $('#flag-form').on('submit', function(e) {
        e.preventDefault();
        
        const flag = $('#flag-input').val().trim();
        const challengeId = $('#challenge-id').val();
        
        if (!flag) {
            showSubmissionResult('Please enter a flag', 'danger');
            return;
        }
        
        // Show loading
        showSubmissionResult('Validating flag...', 'info', true);
        
        // Submit flag
        fetch('/submit_flag', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                challenge_id: challengeId,
                flag: flag
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSubmissionResult(data.message, 'success');
                updateProgress(true);
                incrementAttemptCount();
                
                // Confetti effect for correct flag
                if (typeof confetti !== 'undefined') {
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
        .catch(error => {
            showSubmissionResult('Error submitting flag. Please try again.', 'danger');
        });
    });
}

function showSubmissionResult(message, type, loading = false) {
    const $result = $('#submission-result');
    const icon = loading ? '<div class="spinner-border spinner-border-sm me-2" role="status"></div>' :
                  type === 'success' ? '<i class="fas fa-check-circle me-2"></i>' :
                  type === 'danger' ? '<i class="fas fa-times-circle me-2"></i>' :
                  '<i class="fas fa-info-circle me-2"></i>';
    
    $result.html(`
        <div class="alert alert-${type}">
            ${icon}${message}
        </div>
    `);
}

function updateProgress(completed) {
    $('.progress-bar').css('width', completed ? '100%' : '0%').text(completed ? '100%' : '0%');
    
    if (completed) {
        $('#flag-input, #flag-form button').prop('disabled', true);
    }
}

function incrementAttemptCount() {
    attemptCount++;
    $('#attempt-count').text(attemptCount);
}

function loadAttemptCount() {
    // This would typically load from the server
    $('#attempt-count').text(attemptCount);
}

function initializeChallengeSpecifics(owaspId) {
    // Add any challenge-specific initialization here
    console.log(`Initialized challenge for ${owaspId}`);
}

// Utility functions
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    });
}

function showToast(message, type = 'info') {
    // Simple toast notification
    const toast = $(`
        <div class="toast align-items-center text-white bg-${type} border-0 position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999;">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `);
    
    $('body').append(toast);
    const bsToast = new bootstrap.Toast(toast[0]);
    bsToast.show();
    
    // Remove after hiding
    toast.on('hidden.bs.toast', function() {
        $(this).remove();
    });
}
