import json

from flask import Flask, redirect, render_template, request, url_for

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html', todos=todos)

@app.route('/new', methods=['GET', 'POST'])
def new_todo():
    if request.method == 'POST':
        todo = {
            'id': len(todos) + 1,
            'title': request.form['title'],
            'time': request.form['time'],
            'content': request.form['content'],
            'completed': False,
        }
        todos.append(todo)
        save_todos()
        return redirect(url_for('index'))
    else:
        return render_template('new_todo.html')


def save_todos():
    with open('todos.json', 'w') as f:
        json.dump(todos, f)


def load_todos():
    try:
        with open('todos.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []


# 初始化空的待办事项列表
todos = load_todos()

if __name__ == '__main__':
    app.run(debug=True)
