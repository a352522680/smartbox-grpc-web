const express = require('express');
const router = express.Router();
const { readJsonConfig } = require("../shared/config");
const { createUtilityClient } = require("../shared/proto2");
const { IOT_STATUS_CODE } = require("../shared/constants2");

// 查询 Utility Monitoring Dashboard 数据的函数
function queryUtilityMonitoringDashboard(smartbox_target) {
    return new Promise((resolve, reject) => {
        try {
            // 创建 gRPC 客户端
            const client = createUtilityClient(smartbox_target);
            
            // 这个 RPC 没有入参，直接传空对象即可
            const request = {};
            
            // console.log("FullQueryForUtilityMonitoringDashboard_0001001 request:");
            // console.log(JSON.stringify({
            //     smartbox_target,
            //     request,
            //     note: "这个 RPC 没有入参，直接传空对象即可"
            // }, null, 2));
            
            // 发送查询
            client.FullQueryForUtilityMonitoringDashboard_0001001(request, (error, response) => {
                if (error) {
                    console.error("gRPC error:");
                    console.error(error);
                    client.close();
                    reject({
                        success: false,
                        message: "gRPC error",
                        error: error.message,
                        code: error.code
                    });
                    return;
                }
                
                if (!response || !response.iot_status || response.iot_status.status_code !== IOT_STATUS_CODE.OK) {
                    console.error("Application error: iot_status is not OK");
                    console.error(JSON.stringify(response ? response.iot_status : null, null, 2));
                    client.close();
                    reject({
                        success: false,
                        message: "Application error: iot_status is not OK",
                        iot_status: response ? response.iot_status : null
                    });
                    return;
                }
                
                // 先打印原始 response，方便同事直接对照 proto 字段结构
                // console.log("FullQueryForUtilityMonitoringDashboard_0001001 raw response:");
                // console.log(JSON.stringify(response, null, 2));
                
                client.close();
                
                // 返回成功响应和数据
                resolve({
                    success: true,
                    data: response,
                    message: "Query successful"
                });
            });
        } catch (error) {
            console.error("查询准备阶段出错:", error);
            reject({
                success: false,
                message: error.message || "查询准备阶段出错"
            });
        }
    });
}

// 处理 Utility Monitoring Dashboard 查询的路由
router.get('/dashboard', (req, res) => {
    try {
        // 读取配置文件
        const clientConfig = readJsonConfig("config/client.config.json");
        const smartbox_target = clientConfig.smartbox_target;
        
        const tabId = req.headers['tab-id'];
        
        // 参数验证
        if (!smartbox_target) {
            return res.status(400).json({
                success: false,
                message: "Missing required parameter: smartbox_target in config file"
            });
        }
        
        // console.log(`\n${"=".repeat(60)}`);
        // console.log(`收到 Utility Monitoring Dashboard 查询请求: ${new Date().toISOString()}`);
        // console.log(`参数: smartbox_target=${smartbox_target} (从配置文件读取)`);
        // console.log(`${"=".repeat(60)}\n`);
        
        req.on('close', () => {
            if (false) {
                // console.log('Client disconnected:', {
                //     ip: req.ip,
                //     url: req.originalUrl,
                //     tabId: tabId
                // });
            }
        });
        
        // 调用查询函数
        queryUtilityMonitoringDashboard(smartbox_target)
            .then(function(result) {
                //console.log("✅ 返回 Utility Monitoring Dashboard 数据给前端");
                res.json(result);
            })
            .catch(function(error) {
                console.error("❌ Utility Monitoring Dashboard 查询失败:", error);
                res.status(500).json(error);
            });
    } catch (error) {
        console.error("读取配置文件失败:", error);
        res.status(500).json({
            success: false,
            message: "Failed to read config file",
            error: error.message
        });
    }
});

module.exports = router;