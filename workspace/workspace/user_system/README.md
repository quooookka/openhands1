# 用户注册登录系统

## 项目介绍

这是一个使用 Flask 框架构建的简单用户注册登录系统。用户可以通过注册页面创建账户，然后使用用户名和密码登录系统。

## 项目结构

```
user_system/
├── app.py          # 主程序文件
├── templates/      # HTML 模板文件夹
│   ├── index.html     # 首页
│   ├── login.html     # 登录页面
│   ├── register.html  # 注册页面
│   └── success.html   # 登录成功页面
└── users.json       # 用于存储用户信息的 JSON 文件
└── README.md        # 项目说明文件
```

## 依赖安装

1. 确保你已经安装了 Python 3。
2. 使用 pip 安装 Flask：

   ```bash
   pip install Flask
   ```

## 如何运行

1. 进入项目目录：

   ```bash
   cd /workspace/workspace/user_system
   ```

2. 运行 `app.py` 文件：

   ```bash
   python app.py
   ```

3. 在浏览器中访问 `http://127.0.0.1:5000/` 即可。

## 说明

* 在 `app.py` 文件中，请将 `app.secret_key` 替换为更安全的随机字符串。
* 用户信息存储在 `users.json` 文件中，初始状态下该文件为空。
