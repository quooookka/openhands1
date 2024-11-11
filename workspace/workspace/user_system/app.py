import json

from flask import Flask, flash, redirect, render_template, request, session, url_for

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # 请将此密钥替换为更安全的随机字符串


# 加载用户信息
def load_users():
    try:
        with open('users.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


# 合并排序
# 保存用户信息
def save_users(users):
    with open('users.json', 'w') as f:
        json.dump(users, f)


# 首页路由
@app.route('/')
def index():
    return render_template('index.html')


# 登录路由
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        users = load_users()
        if username in users and users[username] == password:
            session['logged_in'] = True
            flash('登录成功！', 'success')
            return redirect(url_for('success'))
        else:
            flash('用户名或密码错误！', 'error')
    return render_template('login.html')


# 注册路由
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        users = load_users()
        if username in users:
            flash('用户名已存在！', 'error')
        else:
            users[username] = password
            save_users(users)
            flash('注册成功！请登录。', 'success')
            return redirect(url_for('login'))
    return render_template('register.html')


# 登录成功页面路由
@app.route('/success')
def success():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    return render_template('success.html')


# 登出路由
@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    flash('您已退出登录。', 'info')
    return redirect(url_for('index'))


if __name__ == '__main__':
    app.run(debug=True)
