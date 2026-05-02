import json
import os
from flask import jsonify, request, render_template_string
import sqlite3
import urllib.parse
from contextlib import closing

class ChallengeManager:
    def __init__(self):
        self.challenges_file = os.path.join('data', 'challenges.json')
        self.challenges = self._load_challenges()
    
    def _load_challenges(self):
        """Load challenges from JSON file"""
        try:
            with open(self.challenges_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return {}
    
    def get_challenge(self, owasp_id):
        """Get challenge by OWASP ID"""
        return self.challenges.get(owasp_id)

    def get_challenge_modules(self, owasp_id):
        """Return ordered modules for a challenge (without exposing answer keys externally)."""
        module_map = {
            'A01': [
                self._quiz_module(
                    'Module 1: Access Control Basics',
                    'Which vulnerability allows changing object identifiers to access other users\' data?',
                    [
                        {'key': 'xss', 'label': 'Cross-Site Scripting (XSS)'},
                        {'key': 'idor', 'label': 'Insecure Direct Object Reference (IDOR)'},
                        {'key': 'csrf', 'label': 'Cross-Site Request Forgery (CSRF)'}
                    ],
                    'idor'
                ),
                self._quiz_module(
                    'Module 2: Exploitation Reasoning',
                    'If user profile IDs are sequential, which test is the best first step?',
                    [
                        {'key': 'change_id', 'label': 'Change user_id and compare returned profile data'},
                        {'key': 'spam_login', 'label': 'Repeat login attempts'},
                        {'key': 'change_agent', 'label': 'Modify browser User-Agent'}
                    ],
                    'change_id'
                )
            ],
            'A02': [
                self._quiz_module(
                    'Module 1: Crypto Weakness Recognition',
                    'Why is ROT13 unsuitable for protecting secrets?',
                    [
                        {'key': 'slow', 'label': 'Because it is too slow'},
                        {'key': 'reversible', 'label': 'Because it is trivially reversible without a key'},
                        {'key': 'binary', 'label': 'Because it only works on binary files'}
                    ],
                    'reversible'
                ),
                self._quiz_module(
                    'Module 2: Practical Validation',
                    'What quick check confirms ROT13 weakness in this lab?',
                    [
                        {'key': 'hash_compare', 'label': 'Compare SHA-256 hashes only'},
                        {'key': 'double_apply', 'label': 'Apply ROT13 twice and recover the original text'},
                        {'key': 'base64', 'label': 'Convert data to Base64'}
                    ],
                    'double_apply'
                )
            ],
            'A03': [
                self._quiz_module(
                    'Module 1: Injection Concepts',
                    'What coding mistake primarily causes SQL injection?',
                    [
                        {'key': 'concat', 'label': 'String concatenation with unsanitized input'},
                        {'key': 'indexing', 'label': 'Missing database indexes'},
                        {'key': 'json', 'label': 'Using JSON responses'}
                    ],
                    'concat'
                ),
                self._quiz_module(
                    'Module 2: Payload Strategy',
                    'Which payload pattern is commonly used to alter query logic?',
                    [
                        {'key': 'always_true', 'label': '\' OR \'1\'=\'1'},
                        {'key': 'html', 'label': '<script>alert(1)</script>'},
                        {'key': 'path', 'label': '../../etc/passwd'}
                    ],
                    'always_true'
                )
            ],
            'A04': [
                self._quiz_module(
                    'Module 1: Design Control Gaps',
                    'Which control is missing in an insecure password reset design?',
                    [
                        {'key': 'captcha', 'label': 'Color theme selection'},
                        {'key': 'verification', 'label': 'Identity verification before reset'},
                        {'key': 'favicon', 'label': 'Favicon hardening'}
                    ],
                    'verification'
                ),
                self._quiz_module(
                    'Module 2: Threat Modeling',
                    'What is the direct risk of resetting admin credentials without verification?',
                    [
                        {'key': 'dos', 'label': 'Temporary network slowdown'},
                        {'key': 'account_takeover', 'label': 'Unauthorized account takeover'},
                        {'key': 'ui_bug', 'label': 'Broken button styles'}
                    ],
                    'account_takeover'
                )
            ],
            'A05': [
                self._quiz_module(
                    'Module 1: Misconfiguration Indicators',
                    'Why is exposed debug mode dangerous in production?',
                    [
                        {'key': 'ux', 'label': 'It changes UI font rendering'},
                        {'key': 'leak', 'label': 'It can leak sensitive config and internals'},
                        {'key': 'cdn', 'label': 'It disables CDN caching only'}
                    ],
                    'leak'
                ),
                self._quiz_module(
                    'Module 2: Validation Step',
                    'Which request is most relevant for this challenge endpoint?',
                    [
                        {'key': 'debug_true', 'label': 'Send debug=true and inspect exposed fields'},
                        {'key': 'post_json', 'label': 'POST XML to the endpoint'},
                        {'key': 'cookie', 'label': 'Set random cookies repeatedly'}
                    ],
                    'debug_true'
                )
            ],
            'A06': [
                self._quiz_module(
                    'Module 1: Component Risk',
                    'Why are outdated libraries a security issue?',
                    [
                        {'key': 'size', 'label': 'They are always larger in file size'},
                        {'key': 'known_cves', 'label': 'They may contain publicly known CVEs'},
                        {'key': 'style', 'label': 'They reduce CSS quality'}
                    ],
                    'known_cves'
                ),
                self._quiz_module(
                    'Module 2: Practical Triage',
                    'What should you do after identifying a vulnerable component version?',
                    [
                        {'key': 'ignore', 'label': 'Ignore if app still works'},
                        {'key': 'upgrade', 'label': 'Upgrade/patch and validate compatibility'},
                        {'key': 'rename', 'label': 'Rename the JS file'}
                    ],
                    'upgrade'
                )
            ],
            'A07': [
                self._quiz_module(
                    'Module 1: Weak Auth Signals',
                    'Which practice increases authentication failure risk the most?',
                    [
                        {'key': 'weak_pass', 'label': 'Allowing common weak passwords'},
                        {'key': 'https', 'label': 'Using HTTPS login pages'},
                        {'key': 'session', 'label': 'Using session timeouts'}
                    ],
                    'weak_pass'
                ),
                self._quiz_module(
                    'Module 2: Defensive Control',
                    'Which control best reduces brute-force login abuse?',
                    [
                        {'key': 'lockout', 'label': 'Rate limiting and lockout policy'},
                        {'key': 'logo', 'label': 'Animated login logo'},
                        {'key': 'faq', 'label': 'Longer FAQ section'}
                    ],
                    'lockout'
                )
            ],
            'A08': [
                self._quiz_module(
                    'Module 1: Integrity Basics',
                    'What is the primary risk of unsafe deserialization?',
                    [
                        {'key': 'rce', 'label': 'Unexpected code/data execution paths'},
                        {'key': 'latency', 'label': 'Slightly slower page load only'},
                        {'key': 'theme', 'label': 'Theme color mismatch'}
                    ],
                    'rce'
                ),
                self._quiz_module(
                    'Module 2: Data Trust',
                    'What should happen before processing untrusted serialized data?',
                    [
                        {'key': 'validate', 'label': 'Validate schema and integrity first'},
                        {'key': 'trust', 'label': 'Trust client-provided metadata'},
                        {'key': 'truncate', 'label': 'Trim whitespace only'}
                    ],
                    'validate'
                )
            ],
            'A09': [
                self._quiz_module(
                    'Module 1: Monitoring Need',
                    'Why must sensitive operations be logged?',
                    [
                        {'key': 'audit', 'label': 'To support detection, forensics, and accountability'},
                        {'key': 'color', 'label': 'To improve dashboard colors'},
                        {'key': 'speed', 'label': 'To increase CPU speed'}
                    ],
                    'audit'
                ),
                self._quiz_module(
                    'Module 2: Minimum Log Context',
                    'Which log fields are most important for security events?',
                    [
                        {'key': 'actor_action_time', 'label': 'Actor, action, and timestamp'},
                        {'key': 'favicon', 'label': 'Favicon and page title'},
                        {'key': 'theme_mode', 'label': 'Theme mode and font size'}
                    ],
                    'actor_action_time'
                )
            ],
            'A10': [
                self._quiz_module(
                    'Module 1: SSRF Recognition',
                    'What makes SSRF dangerous?',
                    [
                        {'key': 'internal_reach', 'label': 'Server can reach internal resources attackers cannot directly access'},
                        {'key': 'typo', 'label': 'It causes URL typos'},
                        {'key': 'cache', 'label': 'It only affects browser cache'}
                    ],
                    'internal_reach'
                ),
                self._quiz_module(
                    'Module 2: Targeting Strategy',
                    'Which target is commonly tested during SSRF validation?',
                    [
                        {'key': 'localhost', 'label': 'localhost / 127.0.0.1 endpoints'},
                        {'key': 'cdn_only', 'label': 'Public CDN assets only'},
                        {'key': 'image', 'label': 'Image resolution metadata'}
                    ],
                    'localhost'
                )
            ]
        }

        modules = module_map.get(owasp_id, [])
        modules.append({
            'index': len(modules) + 1,
            'type': 'flag',
            'title': 'Final Module: Flag Submission',
            'prompt': 'Submit the challenge flag after finishing all quiz modules.'
        })
        return modules

    def _quiz_module(self, title, question, options, answer_key):
        return {
            'type': 'quiz',
            'title': title,
            'question': question,
            'options': options,
            'answer_key': answer_key
        }
    
    def get_challenge_by_id(self, challenge_id):
        """Get challenge by internal ID"""
        for owasp_id, challenge in self.challenges.items():
            if challenge.get('id') == challenge_id:
                return challenge
        return None
    
    def handle_vulnerable_request(self, owasp_id, request):
        """Handle requests to vulnerable endpoints for CTF challenges"""
        
        if owasp_id == 'A01':  # Broken Access Control
            return self._handle_broken_access_control(request)
        elif owasp_id == 'A02':  # Cryptographic Failures
            return self._handle_cryptographic_failures(request)
        elif owasp_id == 'A03':  # Injection
            return self._handle_injection(request)
        elif owasp_id == 'A04':  # Insecure Design
            return self._handle_insecure_design(request)
        elif owasp_id == 'A05':  # Security Misconfiguration
            return self._handle_security_misconfiguration(request)
        elif owasp_id == 'A06':  # Vulnerable Components
            return self._handle_vulnerable_components(request)
        elif owasp_id == 'A07':  # Authentication Failures
            return self._handle_authentication_failures(request)
        elif owasp_id == 'A08':  # Data Integrity Failures
            return self._handle_data_integrity_failures(request)
        elif owasp_id == 'A09':  # Logging Failures
            return self._handle_logging_failures(request)
        elif owasp_id == 'A10':  # SSRF
            return self._handle_ssrf(request)
        else:
            return jsonify({'error': 'Challenge not found'})
    
    def _handle_broken_access_control(self, request):
        """A01: Broken Access Control - Direct object reference vulnerability"""
        user_id = request.args.get('user_id', '1')
        challenge = self.challenges.get('A01', {})
        flag = challenge.get('flag', 'FLAG{br0k3n_4cc3ss_c0ntr0l_2021}')
        
        # Simulate user data
        users = {
            '1': {'name': 'Regular User', 'role': 'user', 'secret': 'public_info'},
            '2': {'name': 'Admin User', 'role': 'admin', 'secret': flag}
        }
        
        user_data = users.get(user_id, {'error': 'User not found'})
        return jsonify(user_data)
    
    def _handle_cryptographic_failures(self, request):
        """A02: Cryptographic Failures - Weak encryption demonstration"""
        data = request.args.get('data', 'test')
        challenge = self.challenges.get('A02', {})
        flag = challenge.get('flag', 'FLAG{crypto_failure_weak_encryption}')
        
        # ROT13 encryption function
        def rot13(text):
            result = []
            for c in text:
                if c.islower():
                    result.append(chr((ord(c) - ord('a') + 13) % 26 + ord('a')))
                elif c.isupper():
                    result.append(chr((ord(c) - ord('A') + 13) % 26 + ord('A')))
                else:
                    result.append(c)
            return ''.join(result)
        
        # Weak "encryption" - simple ROT13
        encrypted = rot13(data)
        
        response = {
            'original': data,
            'encrypted': encrypted,
            'algorithm': 'ROT13 (Weak!)',
            'hint': 'This encryption is easily reversible'
        }
        
        # When encrypting 'secret', reveal the flag directly
        if data == 'secret':
            response['encrypted'] = encrypted
            response['flag'] = flag
            response['message'] = 'You discovered the weak encryption! The flag is revealed.'
        
        return jsonify(response)
    
    def _handle_injection(self, request):
        """A03: Injection - SQL Injection vulnerability"""
        username = request.args.get('username', '')
        
        if not username:
            return jsonify({'error': 'Username required'})
        
        challenge = self.challenges.get('A03', {})
        result = self._run_sqli_sandbox(username, challenge)
        return jsonify(result)

    def _build_sqli_sandbox(self):
        """Create a fresh in-memory SQLite sandbox per request."""
        conn = sqlite3.connect(':memory:')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.executescript("""
            CREATE TABLE users (
                id INTEGER PRIMARY KEY,
                username TEXT NOT NULL,
                password TEXT NOT NULL,
                email TEXT NOT NULL
            );
            INSERT INTO users (id, username, password, email) VALUES
                (1, 'admin', 'hash_admin_123', 'admin@example.com'),
                (2, 'user', 'hash_user_456', 'user@example.com'),
                (3, 'flag_user', 'FLAG{sql_1nj3ct10n_pwn3d}', 'flag@example.com');
        """)
        conn.commit()
        return conn

    def _run_sqli_sandbox(self, username, challenge):
        """
        Execute the intentionally vulnerable query in an isolated SQLite sandbox.
        Success condition: query returns the seeded flag record.
        """
        query = f"SELECT id, username, password, email FROM users WHERE username = '{username}'"
        flag = challenge.get('flag', 'FLAG{sql_1nj3ct10n_pwn3d}')

        response = {
            'sandbox': 'sqlite-memory-per-request',
            'query': query,
            'message': 'Query executed in isolated SQL sandbox',
            'success': False
        }

        try:
            with closing(self._build_sqli_sandbox()) as conn:
                cursor = conn.cursor()
                cursor.execute(query)
                rows = [dict(row) for row in cursor.fetchall()]

            response['result_count'] = len(rows)
            response['result'] = rows
            response['sandbox_error'] = None

            flag_row = next((row for row in rows if row.get('password') == flag), None)
            if flag_row:
                response['success'] = True
                response['flag'] = flag
                response['message'] = 'Sandbox verified SQL injection impact'
            elif len(rows) > 1:
                response['message'] = 'Potential injection behavior detected, but target flag row not extracted yet'
            else:
                response['message'] = 'No exploitable impact observed in sandbox run'

            return response
        except sqlite3.Error as exc:
            response['sandbox_error'] = str(exc)
            response['result_count'] = 0
            response['result'] = []
            response['message'] = 'Sandbox query failed with SQL error'
            return response
    
    def _handle_insecure_design(self, request):
        """A04: Insecure Design - Password reset without proper verification"""
        email = request.args.get('email', '')
        new_password = request.args.get('new_password', '')
        challenge = self.challenges.get('A04', {})
        flag = challenge.get('flag', 'FLAG{1ns3cur3_d3s1gn_n0_v3r1f1c4t10n}')
        
        if email and new_password:
            # Insecure: No verification token or additional authentication
            if email == 'admin@company.com':
                return jsonify({
                    'message': 'Password reset successful!',
                    'warning': 'This is a design flaw - no verification required!',
                    'flag': flag
                })
            else:
                return jsonify({
                    'message': 'Password reset successful!',
                    'warning': 'This design is insecure - anyone can reset any password!'
                })
        
        return jsonify({
            'message': 'Provide email and new_password parameters',
            'hint': 'Try resetting admin@company.com password'
        })
    
    def _handle_security_misconfiguration(self, request):
        """A05: Security Misconfiguration - Debug information exposure"""
        debug_param = request.args.get('debug', '')
        challenge = self.challenges.get('A05', {})
        flag = challenge.get('flag', 'FLAG{s3cur1ty_m1sc0nf1g_d3bug_3xp0s3d}')
        
        if debug_param == 'true':
            return jsonify({
                'debug_info': {
                    'database_url': 'mysql://user:pass@localhost/app',
                    'api_keys': ['sk-test-123', 'pk-live-456'],
                    'server_version': 'Apache/2.4.41',
                    'flag': flag,
                    'internal_paths': ['/admin', '/config', '/backup']
                },
                'message': 'Debug mode should never be enabled in production!'
            })
        
        return jsonify({
            'message': 'Application running normally',
            'hint': 'Try adding ?debug=true parameter'
        })
    
    def _handle_vulnerable_components(self, request):
        """A06: Vulnerable Components - Simulated outdated library"""
        version_check = request.args.get('check_version', '')
        challenge = self.challenges.get('A06', {})
        flag = challenge.get('flag', 'FLAG{vuln3r4bl3_c0mp0n3nts_0utd4t3d}')
        
        if version_check == 'jquery':
            return jsonify({
                'library': 'jQuery',
                'current_version': '1.8.3',
                'latest_version': '3.6.0',
                'vulnerabilities': [
                    'CVE-2020-11022: XSS vulnerability',
                    'CVE-2020-11023: XSS vulnerability'
                ],
                'flag': flag,
                'message': 'This version has known security vulnerabilities!'
            })
        
        return jsonify({
            'message': 'Component version checker',
            'hint': 'Try ?check_version=jquery'
        })
    
    def _handle_authentication_failures(self, request):
        """A07: Authentication Failures - Weak password policy"""
        username = request.args.get('username', '')
        password = request.args.get('password', '')
        challenge = self.challenges.get('A07', {})
        flag = challenge.get('flag', 'FLAG{4uth3nt1c4t10n_f41lur3_w34k_p4ss}')
        
        weak_passwords = ['123456', 'password', 'admin', 'qwerty']
        
        if username == 'admin' and password in weak_passwords:
            return jsonify({
                'message': 'Login successful!',
                'warning': 'Weak password policy allowed this breach!',
                'flag': flag
            })
        elif username and password:
            return jsonify({
                'message': 'Login failed',
                'hint': 'Try username=admin with a common weak password'
            })
        
        return jsonify({
            'message': 'Authentication endpoint',
            'hint': 'Provide username and password parameters'
        })
    
    def _handle_data_integrity_failures(self, request):
        """A08: Data Integrity Failures - Insecure deserialization simulation"""
        data = request.args.get('data', '')
        challenge = self.challenges.get('A08', {})
        flag = challenge.get('flag', 'FLAG{d4t4_1nt3gr1ty_f41lur3_d3s3r14l}')
        
        if data:
            try:
                # Simulate unsafe deserialization
                if 'payload' in data and 'flag' in data:
                    return jsonify({
                        'message': 'Unsafe deserialization executed!',
                        'warning': 'Never deserialize untrusted data!',
                        'flag': flag
                    })
                else:
                    return jsonify({
                        'message': 'Data processed',
                        'hint': 'Try including "payload" and "flag" in your data'
                    })
            except:
                return jsonify({'error': 'Invalid data format'})
        
        return jsonify({
            'message': 'Data processing endpoint',
            'hint': 'Send data parameter with suspicious content'
        })
    
    def _handle_logging_failures(self, request):
        """A09: Logging Failures - Insufficient logging demonstration"""
        action = request.args.get('action', '')
        challenge = self.challenges.get('A09', {})
        flag = challenge.get('flag', 'FLAG{l0gg1ng_f41lur3_n0_4ud1t_tr41l}')
        
        if action == 'sensitive_operation':
            # This would normally be logged, but isn't
            return jsonify({
                'message': 'Sensitive operation performed',
                'warning': 'This sensitive action was not properly logged!',
                'audit': 'No audit trail recorded',
                'flag': flag
            })
        
        return jsonify({
            'message': 'Logging demonstration endpoint',
            'hint': 'Try ?action=sensitive_operation'
        })
    
    def _handle_ssrf(self, request):
        """A10: SSRF - Server-Side Request Forgery"""
        url = request.args.get('url', '')
        challenge = self.challenges.get('A10', {})
        flag = challenge.get('flag', 'FLAG{ssrf_1nt3rn4l_4cc3ss_pwn3d}')
        
        if url:
            # Simulate SSRF vulnerability
            if 'localhost' in url or '127.0.0.1' in url or 'internal' in url:
                return jsonify({
                    'message': 'SSRF successful! Accessed internal resource',
                    'internal_data': {
                        'server_info': 'Internal server response',
                        'sensitive_config': 'database_password=secret123',
                        'flag': flag
                    },
                    'warning': 'SSRF allowed access to internal resources!'
                })
            else:
                return jsonify({
                    'message': f'Fetching external URL: {url}',
                    'hint': 'Try accessing internal resources like localhost or 127.0.0.1'
                })
        
        return jsonify({
            'message': 'URL fetcher service',
            'hint': 'Provide a URL parameter to fetch'
        })
