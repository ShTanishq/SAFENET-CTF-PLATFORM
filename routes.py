import json
import os
from flask import render_template, request, jsonify, session, flash, redirect, url_for
from app import app, db
from models import Challenge, ChallengeAttempt, CompletedChallenge
from challenges import ChallengeManager

challenge_manager = ChallengeManager()

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
    if 'user_id' in session:
        completed_challenge = CompletedChallenge.query.filter_by(
            user_id=session['user_id'],
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
    
    # Get challenge
    challenge_data = challenge_manager.get_challenge_by_id(challenge_id)
    if not challenge_data:
        return jsonify({'success': False, 'message': 'Challenge not found'})
    
    # Check if flag is correct
    is_correct = submitted_flag == challenge_data['flag']
    
    # Record attempt
    attempt = ChallengeAttempt(
        user_id=session.get('user_id'),
        challenge_id=challenge_id,
        submitted_flag=submitted_flag,
        is_correct=is_correct,
        ip_address=request.remote_addr
    )
    db.session.add(attempt)
    
    if is_correct:
        # Check if already completed
        if session.get('user_id'):
            existing_completion = CompletedChallenge.query.filter_by(
                user_id=session['user_id'],
                challenge_id=challenge_id
            ).first()
            
            if not existing_completion:
                completion = CompletedChallenge(
                    user_id=session['user_id'],
                    challenge_id=challenge_id,
                    points_earned=challenge_data['points']
                )
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

@app.route('/leaderboard')
def leaderboard():
    """Display user leaderboard"""
    # Calculate user scores
    user_scores = db.session.query(
        CompletedChallenge.user_id,
        db.func.sum(CompletedChallenge.points_earned).label('total_points'),
        db.func.count(CompletedChallenge.id).label('challenges_completed')
    ).group_by(CompletedChallenge.user_id).order_by(
        db.func.sum(CompletedChallenge.points_earned).desc()
    ).all()
    
    return render_template('leaderboard.html', scores=user_scores)

@app.errorhandler(404)
def not_found(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return render_template('500.html'), 500
