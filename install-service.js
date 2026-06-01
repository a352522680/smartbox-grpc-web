// install-service.js
var Service = require('node-windows').Service;
var path = require('path');

var svc = new Service({
    name: 'SmartBox-GRPC-Web',  // 去掉空格，避免编码问题
    description: 'SmartBox GRPC Web 服务',
    script: path.join(__dirname, 'index.js'),
    workingdirectory: __dirname,
    nodeOptions: ['--harmony'],
    
    // 添加这些配置
    env: {
        name: "NODE_ENV",
        value: "production"
    },
    
    // 设置启动类型
    startType: "automatic",  // 自动启动
});

// 先检查是否存在
svc.on('install', () => {
    console.log('安装成功，正在启动...');
    svc.start();
});

svc.on('alreadyinstalled', () => {
    console.log('服务已存在，尝试重新安装...');
    svc.uninstall();
    
    setTimeout(() => {
        svc.install();
    }, 1000);
});

svc.on('start', () => {
    console.log('服务已启动');
});

svc.on('error', (err) => {
    console.error('错误:', err);
});

svc.install();