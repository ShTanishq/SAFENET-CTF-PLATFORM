from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app
from flask_login import login_user, logout_user, current_user, login_required
from app import db
from models import User
from forms import LoginForm, RegistrationForm
from datetime import datetime
from urllib.parse import urlparse

auth = Blueprint('auth', __name__)

@auth.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    form = LoginForm()
    if form.validate_on_submit():
        submitted_username = (form.username.data or '').strip()
        user = User.query.filter_by(username=submitted_username).first()

        if user and user.active and user.check_password(form.password.data):
            user.last_login = datetime.utcnow()
            db.session.commit()
            login_user(user, remember=form.remember_me.data)
            current_app.logger.info("User '%s' authenticated successfully from %s", user.username, request.remote_addr)
            next_page = request.args.get('next')
            if not next_page or not is_safe_redirect(next_page):
                next_page = url_for('admin.dashboard' if user.is_admin else 'auth.profile')
            return redirect(next_page)

        current_app.logger.warning(
            "Failed login attempt for username='%s' from %s",
            submitted_username or '<blank>',
            request.remote_addr
        )
        flash('Invalid username or password', 'error')
    
    return render_template('auth/login.html', form=form)

@auth.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User()
        user.username = form.username.data
        user.email = form.email.data
        user.first_name = form.first_name.data or None
        user.last_name = form.last_name.data or None
        user.set_password(form.password.data)
        
        # Make the first user an admin
        if User.query.count() == 0:
            user.is_admin = True
            
        db.session.add(user)
        db.session.commit()
        flash('Congratulations, you are now registered!', 'success')
        return redirect(url_for('auth.login'))
    
    return render_template('auth/register.html', form=form)

@auth.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@auth.route('/profile')
@login_required
def profile():
    return render_template('auth/profile.html', user=current_user)


def is_safe_redirect(target):
    """
    Ensure the redirect target is safe and relative to this application.
    """
    if not target:
        return False

    parsed = urlparse(target)
    # Allow relative URLs (no netloc) and root-based paths
    return parsed.scheme == '' and parsed.netloc == ''