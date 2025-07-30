import json
import os
from flask import render_template, request, jsonify, session, flash, redirect, url_for
from flask_login import current_user, login_required
from app import app, db
from models import User, Challenge, ChallengeAttempt, CompletedChallenge
from challenges import ChallengeManager
from auth import auth
from admin import admin

challenge_manager = ChallengeManager()

# Register blueprints
app.register_blueprint(auth, url_prefix='/auth')
app.register_blueprint(admin)

@app.route('/')
def index():
    """Main page with interactive OWASP tree"""
    # Load tree structure
    tree_file = os.path.join('data', 'owasp_tree.json')
    with open(tree_file, 'r') as f:
        tree_data = json.load(f)
    
    return render_template('index.html', tree_data=json.dumps(tree_data))

@app.route('/vulnerability/<owasp_id>')
def vulnerability_info(owasp_id):
    """Display information about a specific OWASP vulnerability"""
    # Load vulnerability information
    tree_file = os.path.join('data', 'owasp_tree.json')
    with open(tree_file, 'r') as f:
        tree_data = json.load(f)
    
    # Find the vulnerability info
    vuln_info = None
    for category in tree_data:
        if category['id'] == owasp_id:
            vuln_info = category
            break
    
    if not vuln_info:
        flash('Vulnerability not found', 'error')
        return redirect(url_for('index'))
    
    return render_template('vulnerability_info.html', vulnerability=vuln_info)

@app.route('/challenge/<owasp_id>')
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
    
    return render_template('challenge.html', 
                         challenge=challenge_data, 
                         completed=completed)

@app.route('/submit_flag', methods=['POST'])
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
    
    # Check if flag is correct
    is_correct = submitted_flag == challenge_data['flag']
    
    # Get user ID (require login for flag submission)
    user_id = current_user.id if current_user.is_authenticated else None
    if not user_id:
        return jsonify({'success': False, 'message': 'Please log in to submit flags', 'redirect': '/auth/login'})
    
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
def vulnerable_endpoint(owasp_id):
    """Vulnerable endpoints for CTF challenges - each implements specific OWASP vulnerability"""
    return challenge_manager.handle_vulnerable_request(owasp_id, request)

@app.route('/guide')
def challenge_guide():
    """Display comprehensive challenge solving guide"""
    return render_template('challenge_guide.html')

@app.route('/leaderboard')
def leaderboard():
    """Display user leaderboard"""
    # Get all users with their scores
    users_with_scores = db.session.query(
        User,
        db.func.coalesce(db.func.sum(CompletedChallenge.points_earned), 0).label('total_points'),
        db.func.count(CompletedChallenge.id).label('challenges_completed')
    ).outerjoin(CompletedChallenge).group_by(User.id).order_by(
        db.text('total_points DESC')
    ).all()
    
    return render_template('leaderboard.html', users_with_scores=users_with_scores)

@app.errorhandler(404)
def not_found(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return render_template('500.html'), 500
