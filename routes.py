import json
import os
import urllib.request
import urllib.error
from functools import lru_cache
from flask import render_template, request, jsonify, session, flash, redirect, url_for, abort
from flask_login import current_user, login_required
from app import app, db
from models import User, Challenge, ChallengeAttempt, CompletedChallenge, ChallengeModuleProgress
from challenges import ChallengeManager
from auth import auth
from admin import admin

challenge_manager = ChallengeManager()


def _get_module_progress_map(user_id, challenge_id):
    rows = ChallengeModuleProgress.query.filter_by(
        user_id=user_id,
        challenge_id=challenge_id
    ).all()
    return {row.module_index: True for row in rows}


def _build_module_view(modules, progress_map, challenge_completed):
    quiz_count = sum(1 for module in modules if module.get('type') == 'quiz')
    completed_quiz_count = sum(
        1 for idx, module in enumerate(modules, start=1)
        if module.get('type') == 'quiz' and progress_map.get(idx)
    )

    module_view = []
    can_unlock_next = True
    for idx, module in enumerate(modules, start=1):
        is_quiz = module.get('type') == 'quiz'
        is_completed = bool(progress_map.get(idx)) if is_quiz else challenge_completed
        is_unlocked = can_unlock_next or is_completed or challenge_completed

        cleaned = {
            'index': idx,
            'type': module.get('type'),
            'title': module.get('title'),
            'prompt': module.get('prompt', '')
        }
        if is_quiz:
            cleaned['question'] = module.get('question', '')
            cleaned['options'] = module.get('options', [])

        cleaned['completed'] = is_completed
        cleaned['unlocked'] = is_unlocked
        module_view.append(cleaned)

        if is_quiz and not is_completed:
            can_unlock_next = False

    return {
        'modules': module_view,
        'quiz_count': quiz_count,
        'completed_quiz_count': completed_quiz_count
    }


def _load_json(path):
    with open(path, 'r', encoding='utf-8') as handle:
        return json.load(handle)


@lru_cache(maxsize=1)
def get_vulnerability_details():
    details_path = os.path.join('data', 'vulnerability_details.json')
    return _load_json(details_path)


def build_tree_data(include_details=False):
    tree_path = os.path.join('data', 'owasp_tree.json')
    tree_data = _load_json(tree_path)

    if not include_details:
        return tree_data

    detail_map = get_vulnerability_details()
    for node in tree_data:
        detail = detail_map.get(node['id'])
        if not detail:
            continue
        node.setdefault('data', {})
        node['data']['summary'] = {
            'title': detail.get('title'),
            'description': detail.get('description'),
            'severity': detail.get('severity'),
            'exploitability': detail.get('exploitability'),
            'incidence_rate': detail.get('incidence_rate'),
            'detection_rate': detail.get('detection_rate'),
        }
    return tree_data


def build_vulnerability_payload(owasp_id):
    detail_map = get_vulnerability_details()
    tree_entry = next((item for item in build_tree_data(include_details=False) if item['id'] == owasp_id), None)
    detail = detail_map.get(owasp_id, {})

    if not tree_entry and not detail:
        return None

    data_defaults = tree_entry.get('data', {}) if tree_entry else {}
    title_text = tree_entry['text'] if tree_entry else f"{owasp_id}:2021 - {detail.get('title', 'OWASP Vulnerability')}"

    def list_or_empty(key):
        value = detail.get(key, [])
        return value if isinstance(value, list) else []

    return {
        'id': owasp_id,
        'text': title_text,
        'title': detail.get('title', title_text),
        'description': detail.get('description', data_defaults.get('description', '')),
        'detailed_description': detail.get('detailed_description', detail.get('description', data_defaults.get('description', ''))),
        'examples': list_or_empty('examples'),
        'technical_impact': list_or_empty('technical_impact'),
        'business_impact': list_or_empty('business_impact'),
        'prevention': list_or_empty('prevention'),
        'detection': list_or_empty('detection'),
        'severity': detail.get('severity', data_defaults.get('severity', 'Medium')),
        'exploitability': detail.get('exploitability', 'Medium'),
        'incidence_rate': detail.get('incidence_rate') or data_defaults.get('incidence_rate'),
        'detection_rate': detail.get('detection_rate') or data_defaults.get('detection_rate'),
        'links': {
            'owasp': data_defaults.get('url', url_for('vulnerability_info', owasp_id=owasp_id)),
            'challenge': url_for('challenge_page', owasp_id=owasp_id)
        }
    }


def build_search_index():
    detail_map = get_vulnerability_details()
    index = []
    for owasp_id, detail in detail_map.items():
        challenge = challenge_manager.get_challenge(owasp_id) or {}
        index.append({
            'id': owasp_id,
            'title': detail.get('title'),
            'label': f"{owasp_id}: {detail.get('title')}",
            'description': detail.get('description'),
            'severity': detail.get('severity'),
            'exploitability': detail.get('exploitability'),
            'url': url_for('vulnerability_info', owasp_id=owasp_id),
            'challengeTitle': challenge.get('title'),
            'challengeUrl': url_for('challenge_page', owasp_id=owasp_id)
        })
    return index

# Register blueprints
app.register_blueprint(auth, url_prefix='/auth')
app.register_blueprint(admin)

@app.route('/')
def index():
    """Main page with interactive OWASP tree"""
    # Load tree structure with summaries
    tree_data = build_tree_data(include_details=True)
    search_index = build_search_index()

    # Always provide tree data, but restrict functionality based on authentication
    is_authenticated = current_user.is_authenticated
    return render_template(
        'index.html',
        tree_data=json.dumps(tree_data),
        search_index=json.dumps(search_index),
        is_authenticated=is_authenticated
    )

@app.route('/vulnerability/<owasp_id>')
@login_required
def vulnerability_info(owasp_id):
    """Display information about a specific OWASP vulnerability"""
    vulnerability = build_vulnerability_payload(owasp_id)

    if not vulnerability:
        flash('Vulnerability not found', 'error')
        return redirect(url_for('index'))
    
    return render_template('vulnerability_info.html', vulnerability=vulnerability)

@app.route('/challenge/<owasp_id>')
@login_required
def challenge_page(owasp_id):
    """Display CTF challenge for specific OWASP category"""
    challenge_data = challenge_manager.get_challenge(owasp_id)
    
    if not challenge_data:
        flash('Challenge not found', 'error')
        return redirect(url_for('index'))
    
    # Check if user has completed this challenge
    completed = False
    if current_user.is_authenticated:
        completed_challenge = CompletedChallenge.query.filter_by(
            user_id=current_user.id,
            challenge_id=challenge_data['id']
        ).first()
        completed = completed_challenge is not None
    
    modules = challenge_manager.get_challenge_modules(owasp_id)
    progress_map = {}
    if current_user.is_authenticated:
        progress_map = _get_module_progress_map(current_user.id, challenge_data['id'])
    module_state = _build_module_view(modules, progress_map, completed)

    return render_template(
        'challenge.html',
        challenge=challenge_data,
        completed=completed,
        module_state=module_state
    )


@app.route('/api/challenge/<owasp_id>/modules')
@login_required
def get_challenge_modules(owasp_id):
    challenge_data = challenge_manager.get_challenge(owasp_id)
    if not challenge_data:
        return jsonify({'success': False, 'message': 'Challenge not found'}), 404

    completed = CompletedChallenge.query.filter_by(
        user_id=current_user.id,
        challenge_id=challenge_data['id']
    ).first() is not None

    modules = challenge_manager.get_challenge_modules(owasp_id)
    progress_map = _get_module_progress_map(current_user.id, challenge_data['id'])
    module_state = _build_module_view(modules, progress_map, completed)
    can_submit_flag = completed or module_state['completed_quiz_count'] == module_state['quiz_count']

    return jsonify({
        'success': True,
        'modules': module_state['modules'],
        'quiz_count': module_state['quiz_count'],
        'completed_quiz_count': module_state['completed_quiz_count'],
        'can_submit_flag': can_submit_flag
    })


@app.route('/api/challenge/<owasp_id>/module/<int:module_index>/submit', methods=['POST'])
@login_required
def submit_challenge_module(owasp_id, module_index):
    challenge_data = challenge_manager.get_challenge(owasp_id)
    if not challenge_data:
        return jsonify({'success': False, 'message': 'Challenge not found'}), 404

    modules = challenge_manager.get_challenge_modules(owasp_id)
    if module_index < 1 or module_index > len(modules):
        return jsonify({'success': False, 'message': 'Invalid module index'}), 400

    module = modules[module_index - 1]
    if module.get('type') != 'quiz':
        return jsonify({'success': False, 'message': 'This module does not accept quiz answers'}), 400

    progress_map = _get_module_progress_map(current_user.id, challenge_data['id'])
    state = _build_module_view(modules, progress_map, False)
    current_module_view = next((item for item in state['modules'] if item['index'] == module_index), None)
    if not current_module_view or not current_module_view.get('unlocked'):
        return jsonify({'success': False, 'message': 'Solve the previous module first'}), 403

    data = request.get_json(silent=True) or request.form
    selected = (data.get('answer') or '').strip()
    expected = module.get('answer_key')
    is_correct = bool(selected and selected == expected)

    if is_correct and not progress_map.get(module_index):
        db.session.add(ChallengeModuleProgress(
            user_id=current_user.id,
            challenge_id=challenge_data['id'],
            module_index=module_index
        ))
        db.session.commit()

    updated_progress_map = _get_module_progress_map(current_user.id, challenge_data['id'])
    updated_state = _build_module_view(modules, updated_progress_map, False)
    can_submit_flag = updated_state['completed_quiz_count'] == updated_state['quiz_count']

    return jsonify({
        'success': is_correct,
        'message': 'Correct answer! Next module unlocked.' if is_correct else 'Incorrect answer. Try again.',
        'modules': updated_state['modules'],
        'quiz_count': updated_state['quiz_count'],
        'completed_quiz_count': updated_state['completed_quiz_count'],
        'can_submit_flag': can_submit_flag
    })

@app.route('/submit_flag', methods=['POST'])
@login_required
def submit_flag():
    """Handle flag submission for challenges"""
    data = request.get_json() if request.is_json else request.form
    challenge_id = data.get('challenge_id')
    submitted_flag = data.get('flag', '').strip()
    
    if not challenge_id or not submitted_flag:
        return jsonify({'success': False, 'message': 'Missing challenge ID or flag'})
    
    # Convert challenge_id to integer if it's a string
    try:
        challenge_id = int(challenge_id)
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Invalid challenge ID format'})
    
    # Get challenge
    challenge_data = challenge_manager.get_challenge_by_id(challenge_id)
    if not challenge_data:
        return jsonify({'success': False, 'message': 'Challenge not found'})

    modules = challenge_manager.get_challenge_modules(challenge_data['owasp_category'])
    quiz_count = sum(1 for module in modules if module.get('type') == 'quiz')
    solved_quiz_count = ChallengeModuleProgress.query.filter_by(
        user_id=current_user.id,
        challenge_id=challenge_id
    ).count()
    if solved_quiz_count < quiz_count:
        return jsonify({
            'success': False,
            'message': f'Complete all learning modules first ({solved_quiz_count}/{quiz_count}).'
        })
    
    # Check if flag is correct
    is_correct = submitted_flag == challenge_data['flag']
    
    # Get user ID (require login for flag submission)
    user_id = current_user.id if current_user.is_authenticated else None
    if not user_id:
        return jsonify({'success': False, 'message': 'Please log in to submit flags', 'redirect': '/auth/login'})

    # Enforce FLAG format
    import re
    if not re.fullmatch(r"FLAG\{[^\n\r{}]+\}", submitted_flag):
        return jsonify({'success': False, 'message': 'Invalid flag format. Use FLAG{...}'})
    
    # Record attempt
    attempt = ChallengeAttempt()
    attempt.user_id = user_id
    attempt.challenge_id = challenge_id
    attempt.submitted_flag = submitted_flag
    attempt.is_correct = is_correct
    attempt.ip_address = request.remote_addr
    db.session.add(attempt)
    
    if is_correct:
        # Check if already completed
        existing_completion = CompletedChallenge.query.filter_by(
            user_id=user_id,
            challenge_id=challenge_id
        ).first()
        
        if not existing_completion:
            completion = CompletedChallenge()
            completion.user_id = user_id
            completion.challenge_id = challenge_id
            completion.points_earned = challenge_data['points']
            db.session.add(completion)
        
        db.session.commit()
        return jsonify({
            'success': True, 
            'message': f'Congratulations! Flag is correct. You earned {challenge_data["points"]} points!',
            'points': challenge_data['points']
        })
    else:
        db.session.commit()
        return jsonify({
            'success': False, 
            'message': 'Incorrect flag. Try again!'
        })

@app.route('/api/challenge/<owasp_id>/vulnerable')
@login_required
def vulnerable_endpoint(owasp_id):
    """Vulnerable endpoints for CTF challenges - each implements specific OWASP vulnerability"""
    return challenge_manager.handle_vulnerable_request(owasp_id, request)

@app.route('/guide')
@login_required
def challenge_guide():
    """Display comprehensive challenge solving guide"""
    return render_template('challenge_guide.html')

# Progressive hint endpoint
@app.route('/api/hint/<owasp_id>/<int:step>')
@login_required
def get_hint(owasp_id, step):
    challenge = challenge_manager.get_challenge(owasp_id)
    if not challenge:
        return jsonify({'success': False, 'message': 'Challenge not found'}), 404
    hints = challenge.get('hints', [])
    if step < 1 or step > len(hints):
        return jsonify({'success': False, 'message': 'No more hints'}), 400
    return jsonify({'success': True, 'hint': hints[step-1], 'step': step, 'remaining': max(0, len(hints)-step)})


@app.route('/api/ai/hint', methods=['POST'])
@login_required
def get_ai_hint():
    """Generate contextual, non-spoiler hints using Gemini."""
    payload = request.get_json(silent=True) or {}
    owasp_id = (payload.get('owasp_id') or '').strip()
    user_question = (payload.get('question') or '').strip()
    attempts = payload.get('attempts') or []

    if not owasp_id:
        return jsonify({'success': False, 'message': 'Missing owasp_id'}), 400

    if not isinstance(attempts, list):
        return jsonify({'success': False, 'message': 'attempts must be an array'}), 400

    challenge = challenge_manager.get_challenge(owasp_id)
    if not challenge:
        return jsonify({'success': False, 'message': 'Challenge not found'}), 404

    api_key = os.environ.get('GEMINI_API_KEY', '').strip()
    if not api_key:
        return jsonify({
            'success': False,
            'message': 'AI hint service is not configured. Set GEMINI_API_KEY.'
        }), 503

    safe_attempts = [str(item)[:500] for item in attempts[:10]]
    challenge_brief = {
        'owasp_id': challenge.get('owasp_category'),
        'title': challenge.get('title'),
        'description': challenge.get('description', ''),
        'difficulty': challenge.get('difficulty')
    }

    system_prompt = (
        "You are a CTF mentor for OWASP challenges. "
        "You must provide conceptual guidance only. "
        "Never provide exact payloads, exact exploit strings, or any flag content. "
        "Never reveal hidden solutions. "
        "Give 2-4 concise coaching bullets with next debugging direction."
    )

    user_prompt = json.dumps({
        'challenge': challenge_brief,
        'recent_attempts': safe_attempts,
        'question': user_question
    })

    model_name = 'gemini-2.5-flash'
    endpoint = (
        f'https://generativelanguage.googleapis.com/v1beta/models/'
        f'{model_name}:generateContent?key={api_key}'
    )

    request_payload = {
        'system_instruction': {
            'parts': [{'text': system_prompt}]
        },
        'contents': [
            {
                'role': 'user',
                'parts': [{'text': user_prompt}]
            }
        ],
        'generationConfig': {
            'temperature': 0.4,
            'maxOutputTokens': 2048
        },
       'safetySettings': [
            {
                'category': 'HARM_CATEGORY_DANGEROUS_CONTENT',
                'threshold': 'BLOCK_NONE'
            },
            {
                'category': 'HARM_CATEGORY_HARASSMENT',
                'threshold': 'BLOCK_NONE'
            },
            {
                'category': 'HARM_CATEGORY_HATE_SPEECH',
                'threshold': 'BLOCK_NONE'
            },
            {
                'category': 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                'threshold': 'BLOCK_NONE'
            }
        ]
    }

    try:
        req = urllib.request.Request(
            endpoint,
            data=json.dumps(request_payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            response_data = json.loads(resp.read().decode('utf-8'))

        candidates = response_data.get('candidates', [])
        parts = (
            candidates[0]
            .get('content', {})
            .get('parts', [])
            if candidates else []
        )
        hint_text = ''.join(part.get('text', '') for part in parts).strip()
        if not hint_text:
            return jsonify({'success': False, 'message': 'AI returned an empty hint'}), 502

        return jsonify({
            'success': True,
            'hint': hint_text,
            'source': 'ai',
            'model': model_name
        })
    except urllib.error.HTTPError as exc:
        body = ''
        try:
            body = exc.read().decode('utf-8')
        except Exception:
            body = str(exc)
        app.logger.error("Gemini API HTTP error for challenge %s: %s", owasp_id, body)
        debug_mode = bool(app.debug or app.config.get('DEBUG'))
        error_message = 'AI hint generation failed. Please try again.'
        if debug_mode:
            error_message = f'{error_message} (Gemini HTTP {exc.code}: {body})'
        return jsonify({
            'success': False,
            'message': error_message
        }), 502
    except Exception as exc:
        app.logger.exception("AI hint generation failed for challenge %s", owasp_id)
        debug_mode = bool(app.debug or app.config.get('DEBUG'))
        error_message = 'AI hint generation failed. Please try again.'
        if debug_mode:
            error_message = f'{error_message} ({exc.__class__.__name__}: {str(exc)})'
        return jsonify({
            'success': False,
            'message': error_message
        }), 502


@app.route('/api/chat', methods=['POST'])
def chat_with_ai():
    """Handle floating chat assistant requests via Gemini 1.5 Flash."""
    payload = request.get_json(silent=True) or {}
    message = (payload.get('message') or '').strip()

    if not message:
        return jsonify({'success': False, 'message': 'Message is required'}), 400

    api_key = os.getenv('GEMINI_API_KEY', '').strip()
    if not api_key:
        return jsonify({
            'success': False,
            'message': 'Chat assistant is not configured. Set GEMINI_API_KEY.'
        }), 503

    system_prompt = (
        "You are a cybersecurity mentor for a college CTF platform. "
        "Help the student understand OWASP Top 10 vulnerabilities (like SQLi, XSS, etc.). "
        "Give clear, technical explanations, but NEVER reveal the actual flag for any challenge. "
        "Keep responses concise and safe."
    )

    endpoint = (
        'https://generativelanguage.googleapis.com/v1beta/models/'
        f'gemini-2.5-flash:generateContent?key={api_key}'
    )
    request_payload = {
        'system_instruction': {
            'parts': [{'text': system_prompt}]
        },
        'contents': [
            {
                'role': 'user',
                'parts': [{'text': message}]
            }
        ],
        'generationConfig': {
            'temperature': 0.4,
            'maxOutputTokens': 400
        }
    }

    try:
        req = urllib.request.Request(
            endpoint,
            data=json.dumps(request_payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            response_data = json.loads(resp.read().decode('utf-8'))

        candidates = response_data.get('candidates', [])
        parts = (
            candidates[0]
            .get('content', {})
            .get('parts', [])
            if candidates else []
        )
        ai_text = ''.join(part.get('text', '') for part in parts).strip()
        if not ai_text:
            return jsonify({'success': False, 'message': 'AI returned an empty response'}), 502

        return jsonify({'success': True, 'response': ai_text})
    except urllib.error.HTTPError as exc:
        body = ''
        try:
            body = exc.read().decode('utf-8')
        except Exception:
            body = str(exc)
        app.logger.error("Gemini chat HTTP error: %s", body)
        debug_mode = bool(app.debug or app.config.get('DEBUG'))
        error_message = 'Chat assistant request failed. Please try again.'
        if debug_mode:
            error_message = f'{error_message} (Gemini HTTP {exc.code}: {body})'
        return jsonify({'success': False, 'message': error_message}), 502
    except Exception as exc:
        app.logger.exception("Gemini chat request failed")
        debug_mode = bool(app.debug or app.config.get('DEBUG'))
        error_message = 'Chat assistant request failed. Please try again.'
        if debug_mode:
            error_message = f'{error_message} ({exc.__class__.__name__}: {str(exc)})'
        return jsonify({'success': False, 'message': error_message}), 502

@app.route('/api/owasp-data')
def api_owasp_data():
    """API endpoint to serve OWASP data for the frontend"""
    try:
        tree_file = os.path.join('data', 'owasp_tree.json')
        with open(tree_file, 'r') as f:
            tree_data = json.load(f)
        return jsonify({
            'success': True,
            'data': tree_data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/leaderboard')
def leaderboard():
    """Display user leaderboard - includes all non-admin users"""
    # Get all non-admin users with their scores (including users with 0 points)
    users_with_scores = db.session.query(
        User,
        db.func.coalesce(db.func.sum(CompletedChallenge.points_earned), 0).label('total_points'),
        db.func.count(CompletedChallenge.id).label('challenges_completed')
    ).filter(User.is_admin == False).outerjoin(CompletedChallenge).group_by(User.id).order_by(
        db.text('total_points DESC'),
        User.created_at.asc()  # Secondary sort by join date for users with same points
    ).all()
    
    # Calculate statistics
    total_challenges_completed = sum(score[2] for score in users_with_scores)
    total_points_earned = sum(score[1] for score in users_with_scores)
    
    return render_template('leaderboard.html', 
                         users_with_scores=users_with_scores,
                         total_challenges_completed=total_challenges_completed,
                         total_points_earned=total_points_earned)

@app.errorhandler(404)
def not_found(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return render_template('500.html'), 500
