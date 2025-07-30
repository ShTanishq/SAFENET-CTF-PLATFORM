from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, BooleanField, TextAreaField, SelectField, IntegerField
from wtforms.validators import DataRequired, Email, EqualTo, Length, ValidationError
from models import User

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember_me = BooleanField('Remember Me')
    submit = SubmitField('Sign In')

class RegistrationForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=3, max=64)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    first_name = StringField('First Name', validators=[Length(max=64)])
    last_name = StringField('Last Name', validators=[Length(max=64)])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6)])
    password2 = PasswordField(
        'Repeat Password', validators=[DataRequired(), EqualTo('password')]
    )
    submit = SubmitField('Register')

    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user is not None:
            raise ValidationError('Please use a different username.')

    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user is not None:
            raise ValidationError('Please use a different email address.')

class AdminChallengeForm(FlaskForm):
    owasp_category = SelectField('OWASP Category', 
                                choices=[('A01', 'A01 - Broken Access Control'),
                                        ('A02', 'A02 - Cryptographic Failures'),
                                        ('A03', 'A03 - Injection'),
                                        ('A04', 'A04 - Insecure Design'),
                                        ('A05', 'A05 - Security Misconfiguration'),
                                        ('A06', 'A06 - Vulnerable Components'),
                                        ('A07', 'A07 - Authentication Failures'),
                                        ('A08', 'A08 - Data Integrity Failures'),
                                        ('A09', 'A09 - Logging Failures'),
                                        ('A10', 'A10 - Server-Side Request Forgery')],
                                validators=[DataRequired()])
    title = StringField('Title', validators=[DataRequired(), Length(max=200)])
    description = TextAreaField('Description', validators=[DataRequired()])
    difficulty = SelectField('Difficulty', 
                            choices=[('Easy', 'Easy'), ('Medium', 'Medium'), ('Hard', 'Hard')],
                            validators=[DataRequired()])
    flag = StringField('Flag', validators=[DataRequired(), Length(max=200)])
    hints = TextAreaField('Hints (one per line)')
    points = IntegerField('Points', validators=[DataRequired()], default=100)
    submit = SubmitField('Save Challenge')

class AdminUserForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=3, max=64)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    first_name = StringField('First Name', validators=[Length(max=64)])
    last_name = StringField('Last Name', validators=[Length(max=64)])
    is_admin = BooleanField('Admin User')
    active = BooleanField('Active User', default=True)
    password = PasswordField('New Password (leave blank to keep current)')
    submit = SubmitField('Update User')