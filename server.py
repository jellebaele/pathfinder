from flask import Flask, render_template, request, abort, jsonify, flash, redirect, session, url_for
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required
from flask_marshmallow import Marshmallow
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from wtforms import Form, StringField, PasswordField, validators
from functools import wraps
from configuration import ConfigClass

# Init flask
app = Flask(__name__)
# Init database
app.config.from_object(__name__ + ".ConfigClass")
# app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mydb.db'
# app.config['SECRET_KEY'] = 'thisisasecretkey#1234'

# create database
db = SQLAlchemy(app)

# Serialize objects and models: marshmallow
ma = Marshmallow(app)
# Marshmallow schemas can be used to:
#   - Validate input data.
#   - Deserialize input data to app-level objects.
#   - Serialize app-level objects to primitive Python types.
#     The serialized objects can then be rendered to standard formats such as JSON for use in an HTTP API.

# Create an instance of LoginManager
login_manager = LoginManager(app)
login_manager.init_app(app)
login_manager.login_view = "login"


class User(db.Model, UserMixin):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    mail = db.Column(db.String(50), nullable=False, unique=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    password = db.Column(db.String(255), nullable=False, server_default='')
    active = db.Column(db.Boolean(), nullable=False, server_default='0')

    # Define the relationship to Role via UserRoles
    roles = db.relationship('Role', secondary='user_roles', backref='users', lazy=True)
    layouts = db.relationship('LayoutModel', backref="users")

    def set_password(self, _password):
        self.password = generate_password_hash(_password)

    def check_password(self, _password):
        return check_password_hash(self.password, _password)


# Define the Role data-model
class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(50), unique=True)


# Define the UserRoles association table
class UserRoles(db.Model):
    __tablename__ = 'user_roles'
    id = db.Column(db.Integer(), primary_key=True)
    user_id = db.Column(db.Integer(), db.ForeignKey('users.id', ondelete='CASCADE'))
    role_id = db.Column(db.Integer(), db.ForeignKey('roles.id', ondelete='CASCADE'))


# Create model to store all elements of the layouts
class LayoutModel(db.Model):
    __tablename__ = "layouts"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100))
    content = db.Column(db.PickleType)
    picture = db.Column(db.String)
    date_created = db.Column(db.DateTime, default=datetime.utcnow())

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))

    def __init__(self, title, content, picture, date_created, user_id):
        self.title = title
        self.content = content
        self.picture = picture
        self.date_created = date_created
        self.user_id = user_id


class LayoutSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = LayoutModel


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


@login_manager.unauthorized_handler
def unauthorized():
    flash("You need to login to access this page", "warning")
    return redirect('login')


def required_roles(*roles):
    def wrapper(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            if not is_current_user_role(roles):
                flash("Unauthorized!", "danger")
                return redirect(url_for('index'))
            return f(*args, **kwargs)

        return wrapped

    return wrapper


def is_current_user_role(roles):
    if 'logged_in' in session:
        user = get_current_user()
        if user is None:
            return False

        for role in roles:
            role = db.session.query(Role).filter(Role.name == role).first()
            if role is not None and user in role.users:
                return True
    return False


def get_current_user():
    if 'logged_in' in session:
        return db.session.query(User).filter(User.mail == session['mail']).first()
    return None


class RegisterForm(Form):
    first_name = StringField('First name', [validators.DataRequired(), validators.Length(min=1, max=50)])
    last_name = StringField('Last name', [validators.DataRequired(), validators.Length(min=1, max=50)])
    email = StringField('E-mail', [validators.Email()])
    password = PasswordField('Password', [
        validators.DataRequired(),
        validators.EqualTo('confirm', message="Passwords do no match."),
        validators.Length(min=6, max=50),
        validators.Regexp(regex='(?=.*[A-Z])(?=.*[a-z])(?=.*[@#$%^&+!=])',
                          message="Your password must be a combination of at least 6 characters including "
                                  "at least one uppercase and one special case. Please try again")
    ])
    confirm = PasswordField('Confirm password')


# create database
db.create_all()
single_layout_schema = LayoutSchema()
all_layouts_schema = LayoutSchema(many=True)


# Use the route() decorator to bind a function to a URL.
# By default, a route only answers to GET requests
@app.route('/', methods=['POST', 'GET'])
@app.route('/home', methods=['POST', 'GET'])
def index():
    if request.method == 'POST' and 'logged_in' in session:
        if not request.json or not 'title' in request.json:
            print("Error")
            abort(404)

        title = request.json['title']
        content = request.json['content']
        picture = request.json['picture']
        user_id = db.session.query(User).filter(User.mail == session['mail']).first().id
        new_layout = LayoutModel(title=title, content=content, picture=picture,
                                 date_created=datetime.utcnow(), user_id=user_id)

        try:
            db.session.add(new_layout)
            db.session.commit()
            return jsonify({'id': new_layout.id,
                            'title': title,
                            'content': content,
                            'user_id': user_id}), 201

        except:
            print("error")
            return jsonify({'Test': 'Failed'}), 404
    else:
        return render_template("index.html")


@app.route('/stored')
@login_required
def stored():
    return render_template("stored.html")


@app.route('/stored/get')
@login_required
# Get all layouts stored
def get_layouts():
    if request.method == 'GET':
        curr_user = get_current_user()
        layouts = LayoutModel.query.filter(LayoutModel.user_id == curr_user.id)
        return jsonify(all_layouts_schema.dump(layouts)), 200


@app.route('/stored/<int:id>', methods=['GET', 'DELETE', 'PUT'])
@login_required
def get_layout(id):
    # Get specific layout
    if request.method == 'GET':
        layout = LayoutModel.query.get_or_404(id)
        return single_layout_schema.jsonify(layout)

    # Delete specific layout
    elif request.method == 'DELETE':
        layout_to_delete = LayoutModel.query.get_or_404(id)
        try:
            db.session.delete(layout_to_delete)
            db.session.commit()
            return jsonify({'Test': 'Successful'}), 200
        except:
            return jsonify({'Test': 'Failed'}), 404

    # Update specific layout
    elif request.method == 'PUT':
        layout = LayoutModel.query.get_or_404(id)

        layout.title = request.json['title']
        try:
            db.session.commit()
            return jsonify({'Test': 'Successful'}), 200
        except:
            return jsonify({'Test': 'Failed'}), 404


@app.route('/stored/delete', methods=['DELETE'])
@required_roles('admin')
# Deletes the entire database
def delete_db():
    db.drop_all()
    db.create_all()

    return jsonify({'Test': 'Successful'}), 200


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        mail = request.form['mail']
        password = request.form['password']
        user = db.session.query(User).filter(User.mail == mail).first()

        if user is not None:
            if user.check_password(password):
                session['logged_in'] = True
                session['mail'] = mail
                session['name'] = user.first_name

                login_user(user)

                flash('You are now logged in', "success")
                return redirect(url_for('index'))
            else:
                error = "Invalid login"
                return render_template("login.html", error=error)
        else:
            error = "Username not found"
            return render_template("login.html", error=error)

    return render_template("login.html")


@app.route('/logout')
def logout():
    session.clear()
    logout_user()

    return redirect(url_for('index'))


@app.route('/register', methods=['GET', 'POST'])
def register():
    form = RegisterForm(request.form)
    if request.method == 'POST' and form.validate():
        first_name = form.first_name.data
        last_name = form.last_name.data
        email = form.email.data
        password = form.password.data

        user = User(mail=email, first_name=first_name, last_name=last_name)
        user.set_password(password)
        role = db.session.query(Role).filter(Role.name == 'member').first()

        if role is not None:
            user.roles.append(role)
            try:
                db.session.add(user)
                db.session.commit()
                flash("You are now registered and can log in", "success")
                return redirect(url_for('login'))
            except:
                flash("E-mail address is already in use.", "warning")
                return redirect(url_for('register'))

        return redirect(redirect(url_for('register')))

    return render_template('register.html', form=form)


@app.route('/admin')
@required_roles('admin')
def admin():
    return "This is the admin page"


@app.route('/profile')
@login_required
def profile():
    user = get_current_user()
    amount = LayoutModel.query.filter(LayoutModel.user_id == user.id).count()
    return render_template('profile.html', user=user, amount=amount)


if __name__ == '__main__':
    app.run(debug=True)
