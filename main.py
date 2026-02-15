import eel

# 初始化游戏文件夹（假设你的 html, css, js 在当前目录下）
eel.init('.') 

# 启动（默认会打开系统 Chrome）
eel.start('index.html', size=(800, 750))