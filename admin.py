from flask import Blueprint, render_template, redirect, url_for, flash, request, abort
from flask_login import login_required, current_user
from functools import wraps
from app import db
from models import User, Challenge, ChallengeAttempt, CompletedChallenge
from forms import AdminChallengeForm, AdminUserForm
from challenges import ChallengeManager
import json

admin = Blueprint('admin', __name__, url_prefix='/admin')

def admin_required(f):
    @wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        if not current_user.is_admin:
            abort(403)
        return f(*args, **kwargs)
    return decorated_function

@admin.route('/')
@admin_required
def dashboard():
    # Get statistics
    total_users = User.query.count()
    total_challenges = Challenge.query.count()
    total_attempts = ChallengeAttempt.query.count()
    total_completions = CompletedChallenge.query.count()
    
    # Recent users
    recent_users = User.query.order_by(User.created_at.desc()).limit(5).all()
    
    # Recent attempts
    recent_attempts = ChallengeAttempt.query.order_by(
        ChallengeAttempt.created_at.desc()
    ).limit(10).all()
    
    stats = {
        'total_users': total_users,
        'total_challenges': total_challenges,
        'total_attempts': total_attempts,
        'total_completions': total_completions,
        'success_rate': round((total_completions / total_attempts * 100) if total_attempts > 0 else 0, 2)
    }
    
    return render_template('admin/dashboard.html', 
                         stats=stats, 
                         recent_users=recent_users,
                         recent_attempts=recent_attempts)

@admin.route('/users')
@admin_required
def users():
    page = request.args.get('page', 1, type=int)
    users = User.query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=20, error_out=False
    )
    return render_template('admin/users.html', users=users)

@admin.route('/users/<int:user_id>')
@admin_required
def user_detail(user_id):
    user = User.query.get_or_404(user_id)
    challenges_completed = CompletedChallenge.query.filter_by(user_id=user_id).all()
    recent_attempts = ChallengeAttempt.query.filter_by(user_id=user_id).order_by(
        ChallengeAttempt.created_at.desc()
    ).limit(10).all()
    
    return render_template('admin/user_detail.html', 
                         user=user,
                         challenges_completed=challenges_completed,
                         recent_attempts=recent_attempts)

@admin.route('/users/<int:user_id>/edit', methods=['GET', 'POST'])
@admin_required
def edit_user(user_id):
    user = User.query.get_or_404(user_id)
    form = AdminUserForm(obj=user)
    
    if form.validate_on_submit():
        user.username = form.username.data
        user.email = form.email.data
        user.first_name = form.first_name.data or None
        user.last_name = form.last_name.data or None
        user.is_admin = form.is_admin.data
        user.active = form.active.data
        
        if form.password.data:
            user.set_password(form.password.data)
            
        db.session.commit()
        flash('User updated successfully!', 'success')
        return redirect(url_for('admin.user_detail', user_id=user.id))
    
    return render_template('admin/edit_user.html', form=form, user=user)

@admin.route('/challenges')
@admin_required
def challenges():
    """Display all challenges with answers - admin only"""
    challenge_manager = ChallengeManager()
    
    # Get challenges from database
    db_challenges = Challenge.query.order_by(Challenge.owasp_category, Challenge.created_at).all()
    
    # Get challenges from JSON file (for challenges that might not be in DB yet)
    json_challenges = []
    for owasp_id in ['A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08', 'A09', 'A10']:
        json_challenge = challenge_manager.get_challenge(owasp_id)
        if json_challenge:
            # Check if this challenge exists in DB
            db_challenge = Challenge.query.filter_by(owasp_category=owasp_id).first()
            if not db_challenge:
                # Create a temporary challenge object from JSON for display
                class TempChallenge:
                    def __init__(self, data):
                        self.id = data.get('id')
                        self.owasp_category = data.get('owasp_category')
                        self.title = data.get('title')
                        self.description = data.get('description', '')
                        self.difficulty = data.get('difficulty', 'Medium')
                        self.flag = data.get('flag', 'N/A')
                        self.hints = '\n'.join(data.get('hints', []))
                        self.points = data.get('points', 100)
                        self.created_at = None
                        self.attempts = []
                        self.completions = []
                
                json_challenges.append(TempChallenge(json_challenge))
    
    # Combine both lists
    all_challenges = list(db_challenges) + json_challenges
    
    return render_template('admin/challenges.html', challenges=all_challenges)

@admin.route('/challenges/new', methods=['GET', 'POST'])
@admin_required
def new_challenge():
    form = AdminChallengeForm()
    
    if form.validate_on_submit():
        challenge = Challenge()
        challenge.owasp_category = form.owasp_category.data
        challenge.title = form.title.data
        challenge.description = form.description.data
        challenge.difficulty = form.difficulty.data
        challenge.flag = form.flag.data
        challenge.hints = '\n'.join([hint.strip() for hint in form.hints.data.split('\n') if hint.strip()]) if form.hints.data else ''
        challenge.points = form.points.data
        
        db.session.add(challenge)
        db.session.commit()
        flash('Challenge created successfully!', 'success')
        return redirect(url_for('admin.challenges'))
    
    return render_template('admin/edit_challenge.html', form=form, challenge=None)

@admin.route('/challenges/<int:challenge_id>/edit', methods=['GET', 'POST'])
@admin_required
def edit_challenge(challenge_id):
    challenge = Challenge.query.get_or_404(challenge_id)
    form = AdminChallengeForm(obj=challenge)
    
    if form.validate_on_submit():
        challenge.owasp_category = form.owasp_category.data
        challenge.title = form.title.data
        challenge.description = form.description.data
        challenge.difficulty = form.difficulty.data
        challenge.flag = form.flag.data
        challenge.hints = '\n'.join([hint.strip() for hint in form.hints.data.split('\n') if hint.strip()]) if form.hints.data else ''
        challenge.points = form.points.data
        
        db.session.commit()
        flash('Challenge updated successfully!', 'success')
        return redirect(url_for('admin.challenges'))
    
    return render_template('admin/edit_challenge.html', form=form, challenge=challenge)

@admin.route('/challenges/<int:challenge_id>/delete', methods=['POST'])
@admin_required
def delete_challenge(challenge_id):
    challenge = Challenge.query.get_or_404(challenge_id)
    
    # Delete related attempts and completions first
    ChallengeAttempt.query.filter_by(challenge_id=challenge_id).delete()
    CompletedChallenge.query.filter_by(challenge_id=challenge_id).delete()
    
    db.session.delete(challenge)
    db.session.commit()
    flash('Challenge deleted successfully!', 'success')
    return redirect(url_for('admin.challenges'))

@admin.route('/attempts')
@admin_required
def attempts():
    page = request.args.get('page', 1, type=int)
    attempts = ChallengeAttempt.query.order_by(
        ChallengeAttempt.created_at.desc()
    ).paginate(page=page, per_page=50, error_out=False)
    
    return render_template('admin/attempts.html', attempts=attempts)

@admin.route('/leaderboard')
@admin_required
def admin_leaderboard():
    # Get all users with their scores
    users_with_scores = db.session.query(
        User,
        db.func.coalesce(db.func.sum(CompletedChallenge.points_earned), 0).label('total_points'),
        db.func.count(CompletedChallenge.id).label('challenges_completed')
    ).outerjoin(CompletedChallenge).group_by(User.id).order_by(
        db.text('total_points DESC')
    ).all()
    
    return render_template('admin/leaderboard.html', users_with_scores=users_with_scores)

@admin.route('/user-progress')
@admin_required
def user_progress():
    """Track all users and their progress"""
    # Get all users with their progress details
    users_progress = []
    
    all_users = User.query.order_by(User.created_at.desc()).all()
    
    for user in all_users:
        # Get completed challenges
        completed_challenges = CompletedChallenge.query.filter_by(user_id=user.id).all()
        
        # Get all attempts
        all_attempts = ChallengeAttempt.query.filter_by(user_id=user.id).order_by(
            ChallengeAttempt.created_at.desc()
        ).all()
        
        # Calculate statistics
        total_points = user.get_total_points()
        challenges_completed = user.get_challenges_completed()
        total_attempts = len(all_attempts)
        success_rate = round((challenges_completed / total_attempts * 100) if total_attempts > 0 else 0, 2)
        
        # Get recent activity
        recent_attempts = all_attempts[:5] if len(all_attempts) > 5 else all_attempts
        
        users_progress.append({
            'user': user,
            'total_points': total_points,
            'challenges_completed': challenges_completed,
            'total_attempts': total_attempts,
            'success_rate': success_rate,
            'completed_challenges': completed_challenges,
            'recent_attempts': recent_attempts,
            'last_activity': all_attempts[0].created_at if all_attempts else user.created_at
        })
    
    # Sort by total points descending
    users_progress.sort(key=lambda x: x['total_points'], reverse=True)
    
    return render_template('admin/user_progress.html', users_progress=users_progress)