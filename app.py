import os
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from werkzeug.middleware.proxy_fix import ProxyFix
from flask_login import LoginManager
from flask_cors import CORS

logging.basicConfig(level=logging.DEBUG)


def _load_windows_user_env(var_name):
    """
    Ensure key environment variables are available even when the current
    terminal session was created before `setx` was executed.
    """
    if os.environ.get(var_name):
        return

    try:
        import winreg  # Only available on Windows
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Environment") as key:
            value, _ = winreg.QueryValueEx(key, var_name)
            if value:
                os.environ[var_name] = value
                logging.info("Loaded %s from Windows user environment.", var_name)
    except Exception:
        # Keep startup resilient; absence/failure is handled by endpoint checks.
        logging.debug("Could not load %s from Windows registry environment.", var_name)

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

# create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1) # needed for url_for to generate with https

# Load persisted secrets set via `setx` for terminals spawned before update.
_load_windows_user_env("GEMINI_API_KEY")

# Enable CORS for frontend communication
CORS(app, origins=['http://localhost:3000', 'http://127.0.0.1:3000'])

# configure the database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///cybersec_platform.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.login'
login_manager.login_message = 'Please log in to access this page.'
login_manager.login_message_category = 'info'

# initialize the app with the extension
db.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    from models import User
    return User.query.get(int(user_id))

# Import routes after app creation
import routes  # noqa: F401


def seed_dev_admin():
    """Ensure a deterministic admin account exists for the development environment."""
    env_name = (os.environ.get("FLASK_ENV") or app.config.get("ENV") or "").lower()
    if env_name not in {"development", "dev"}:
        logging.debug("Skipping development admin seeding for environment: %s", env_name or "<unset>")
        return

    from models import User  # imported lazily to avoid circular dependency

    username = os.environ.get("DEV_ADMIN_USERNAME", "admin")
    password = os.environ.get("DEV_ADMIN_PASSWORD", "admin")
    email = os.environ.get("DEV_ADMIN_EMAIL", f"{username}@owasplearn.local")

    user = User.query.filter_by(username=username).first()
    updated = False

    if user:
        if not user.check_password(password):
            user.set_password(password)
            updated = True
        if not user.email:
            user.email = email
            updated = True
        if not user.is_admin:
            user.is_admin = True
            updated = True
        if not user.active:
            user.active = True
            updated = True

        if updated:
            logging.info("Updated development admin user '%s'", username)
        else:
            logging.debug("Development admin user '%s' already up to date", username)
    else:
        user = User(
            username=username,
            email=email,
            is_admin=True,
            active=True,
        )
        user.set_password(password)
        db.session.add(user)
        updated = True
        logging.info("Seeded development admin user '%s'", username)

    if updated:
        db.session.commit()


with app.app_context():
    # Import models to ensure tables are created
    import models  # noqa: F401
    db.create_all()
    logging.info("Database tables created")
    seed_dev_admin()
