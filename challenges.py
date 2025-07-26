import json
import os
from flask import jsonify, request, render_template_string
import sqlite3
import urllib.parse

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
        
        # Simulate user data
        users = {
            '1': {'name': 'Regular User', 'role': 'user', 'secret': 'public_info'},
            '2': {'name': 'Admin User', 'role': 'admin', 'secret': 'FLAG{br0k3n_4cc3ss_c0ntr0l_2021}'}
        }
        
        user_data = users.get(user_id, {'error': 'User not found'})
        return jsonify(user_data)
    
    def _handle_cryptographic_failures(self, request):
        """A02: Cryptographic Failures - Weak encryption demonstration"""
        data = request.args.get('data', 'test')
        
        # Weak "encryption" - simple ROT13
        encrypted = ''.join(chr((ord(c) - ord('a') + 13) % 26 + ord('a')) if c.islower() 
                           else chr((ord(c) - ord('A') + 13) % 26 + ord('A')) if c.isupper() 
                           else c for c in data)
        
        # Hidden flag in weak encryption
        if data == 'secret':
            encrypted = 'SYNT{pelcgb_snvyher_jrnx_rapelcgvba}'
        
        return jsonify({
            'original': data,
            'encrypted': encrypted,
            'algorithm': 'ROT13 (Weak!)',
            'hint': 'This encryption is easily reversible'
        })
    
    def _handle_injection(self, request):
        """A03: Injection - SQL Injection vulnerability"""
        username = request.args.get('username', '')
        
        if not username:
            return jsonify({'error': 'Username required'})
        
        # Simulate vulnerable SQL query
        query = f"SELECT * FROM users WHERE username = '{username}'"
        
        # Check for SQL injection attempt
        if "'" in username and ('UNION' in username.upper() or 'OR' in username.upper()):
            # Simulate successful injection
            return jsonify({
                'query': query,
                'result': [
                    {'id': 1, 'username': 'admin', 'password': 'hash123'},
                    {'id': 2, 'username': 'user', 'password': 'hash456'},
                    {'id': 3, 'username': 'flag_user', 'password': 'FLAG{sql_1nj3ct10n_pwn3d}'}
                ],
                'message': 'SQL Injection successful!'
            })
        else:
            return jsonify({
                'query': query,
                'result': [{'id': 1, 'username': username, 'email': f'{username}@example.com'}],
                'message': 'Normal query executed'
            })
    
    def _handle_insecure_design(self, request):
        """A04: Insecure Design - Password reset without proper verification"""
        email = request.args.get('email', '')
        new_password = request.args.get('new_password', '')
        
        if email and new_password:
            # Insecure: No verification token or additional authentication
            if email == 'admin@company.com':
                return jsonify({
                    'message': 'Password reset successful!',
                    'flag': 'FLAG{1ns3cur3_d3s1gn_n0_v3r1f1c4t10n}',
                    'warning': 'This is a design flaw - no verification required!'
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
        
        if debug_param == 'true':
            return jsonify({
                'debug_info': {
                    'database_url': 'mysql://user:pass@localhost/app',
                    'api_keys': ['sk-test-123', 'pk-live-456'],
                    'server_version': 'Apache/2.4.41',
                    'flag': 'FLAG{s3cur1ty_m1sc0nf1g_d3bug_3xp0s3d}',
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
        
        if version_check == 'jquery':
            return jsonify({
                'library': 'jQuery',
                'current_version': '1.8.3',
                'latest_version': '3.6.0',
                'vulnerabilities': [
                    'CVE-2020-11022: XSS vulnerability',
                    'CVE-2020-11023: XSS vulnerability'
                ],
                'flag': 'FLAG{vuln3r4bl3_c0mp0n3nts_0utd4t3d}',
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
        
        weak_passwords = ['123456', 'password', 'admin', 'qwerty']
        
        if username == 'admin' and password in weak_passwords:
            return jsonify({
                'message': 'Login successful!',
                'flag': 'FLAG{4uth3nt1c4t10n_f41lur3_w34k_p4ss}',
                'warning': 'Weak password policy allowed this breach!'
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
        
        if data:
            try:
                # Simulate unsafe deserialization
                if 'payload' in data and 'flag' in data:
                    return jsonify({
                        'message': 'Unsafe deserialization executed!',
                        'flag': 'FLAG{d4t4_1nt3gr1ty_f41lur3_d3s3r14l}',
                        'warning': 'Never deserialize untrusted data!'
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
        
        if action == 'sensitive_operation':
            # This would normally be logged, but isn't
            return jsonify({
                'message': 'Sensitive operation performed',
                'flag': 'FLAG{l0gg1ng_f41lur3_n0_4ud1t_tr41l}',
                'warning': 'This sensitive action was not properly logged!',
                'audit': 'No audit trail recorded'
            })
        
        return jsonify({
            'message': 'Logging demonstration endpoint',
            'hint': 'Try ?action=sensitive_operation'
        })
    
    def _handle_ssrf(self, request):
        """A10: SSRF - Server-Side Request Forgery"""
        url = request.args.get('url', '')
        
        if url:
            # Simulate SSRF vulnerability
            if 'localhost' in url or '127.0.0.1' in url or 'internal' in url:
                return jsonify({
                    'message': 'SSRF successful! Accessed internal resource',
                    'flag': 'FLAG{ssrf_1nt3rn4l_4cc3ss_pwn3d}',
                    'internal_data': {
                        'server_info': 'Internal server response',
                        'sensitive_config': 'database_password=secret123'
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
