from functools import wraps

from config import Config
from flask import Flask, redirect, render_template, request, session, url_for
from models import User, db

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)


# 登录装饰器
def login_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if 'user_id' in session:
            return func(*args, **kwargs)
        else:
            return redirect(url_for('login'))

    return wrapper


@app.route('/')
@login_required
def index():
    user = User.query.get(session['user_id'])
    return render_template('game.html', mines=10, score=user.score)


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        if user:
            error = '用户名已存在'
            return render_template('register.html', error=error)
        else:
            new_user = User(username=username, password=password)
            db.session.add(new_user)
            db.session.commit()
            return redirect(url_for('login'))
    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            session['user_id'] = user.id
            return redirect(url_for('index'))
        else:
            error = '用户名或密码错误'
            return render_template('login.html', error=error)
    return render_template('login.html')


@app.route('/logout')
@login_required
def logout():
    session.pop('user_id', None)
    return redirect(url_for('login'))


@app.route('/profile')
@login_required
def profile():
    user = User.query.get(session['user_id'])
    return render_template('profile.html', username=user.username, score=user.score)


if __name__ == '__main__':
    app.run(debug=True)
