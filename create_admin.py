"""
Script to create or update admin user with username='admin' and password='admin'
Run this script to ensure admin user exists in the database.
"""
from app import app, db
from models import User

def create_admin_user():
    with app.app_context():
        # Check if admin user exists
        admin_user = User.query.filter_by(username='admin').first()
        
        if admin_user:
            # Update existing admin user
            admin_user.set_password('admin')
            admin_user.is_admin = True
            admin_user.email = 'admin@owasplearn.local' if not admin_user.email else admin_user.email
            admin_user.active = True
            print(f"✓ Updated existing admin user: {admin_user.username}")
        else:
            # Create new admin user
            admin_user = User()
            admin_user.username = 'admin'
            admin_user.email = 'admin@owasplearn.local'
            admin_user.set_password('admin')
            admin_user.is_admin = True
            admin_user.active = True
            db.session.add(admin_user)
            print(f"✓ Created new admin user: {admin_user.username}")
        
        db.session.commit()
        print(f"✓ Admin user ready: username='admin', password='admin'")
        print(f"✓ Admin status: {admin_user.is_admin}")
        return admin_user

if __name__ == '__main__':
    create_admin_user()

