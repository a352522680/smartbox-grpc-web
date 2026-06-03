const express = require("express");
const db = require('./db/sqlserver');
var http=express();
const path=require('path')

//接口跨域
const cors= require('cors')
http.use(cors());
// 设置首页路由
http.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'Login.html'));
});
//静态资源
http.use(express.static('www'));
//导入路由
const loginRoutes = require('./router/loginRoutes');  // 导入登录路由
const sqlSelectMachine = require("./router/sqlSelectMachine");
const routers = require("./router/router") 
const routers2 = require("./router/LocalConfig"); 
const routers3 = require("./router/ChartApi"); 
const routers4 = require("./router/ThreeUtilization"); 
const routers5 = require("./router/ThreeHistory"); 
const routers6 = require("./router/Energy");
const routers7 = require("./router/ReadXLSX");
const routers8 = require("./router/EnergyTarget"); 
const routers9 = require("./router/Engineering"); 

const { start } = require("pm2");

// 导入值守任务路由和服务
 
const dailyDutyService = require('./services/dailyDutyService');

// 注册登录路由
http.use('/api', loginRoutes);  // 登录接口: POST /api/login
http.use('/api',sqlSelectMachine)

http.use('/router',routers)
http.use('/Local',routers2)
http.use('/ChartApi',routers3)
http.use('/ThreeUtilization',routers4)
http.use('/ThreeHistory',routers5)
http.use('/Energy',routers6)
http.use('/ReadXLSX',routers7)
http.use('/EnergyTarget', routers8); 
http.use('/Engineering', routers9); 
 

//本机ip
const host='0.0.0.0'
const port = 60080;

db.initDB()
    .then(() => {
        console.log('数据库连接成功');
        // 启动值守任务
        try {
            dailyDutyService.start();
            console.log('设备数据每日值守任务已启动');
        } catch (error) {
            console.error('启动值守任务失败:', error.message);
        }
        http.listen(port, host, () => {
            console.log(host + ":" + port);
            console.log('服务器已就绪，可以处理请求');
        });
    })
    .catch((error) => {
        console.error('数据库连接失败:', error.message);
        console.error('服务器无法启动');
        process.exit(1); // 退出程序
    });
// http.listen(port,host,()=>{
//     console.log(host+":"+port+"");
// })
