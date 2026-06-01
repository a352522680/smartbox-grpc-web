const express = require('express');
const router = express.Router();
const { createCncPlcClient } = require("../shared/proto");
const { toTimestamp } = require("../shared/time");
const { IOT_STATUS_CODE } = require("../shared/constants");

// 修复时间格式的函数
function fixTimeFormat(timeStr) {
    if (!timeStr) return timeStr;
    
    console.log(`原始时间字符串: "${timeStr}"`);
    
    // 1. 将空格替换回加号（处理 URL 解码导致的问题）
    let fixed = timeStr.replace(/ /g, '+');
    
    // 2. 如果时区部分格式不正确，进行修正
    // 匹配类似 "2026-03-26T08:00:00+08:00" 或 "2026-03-26T08:00:00+0800"
    const timezonePattern = /([+-]\d{2}):(\d{2})$/;
    const timezonePatternNoColon = /([+-]\d{4})$/;
    
    if (timezonePattern.test(fixed)) {
        // 已经是正确格式，保持不变
        console.log(`时间格式正确: "${fixed}"`);
    } else if (timezonePatternNoColon.test(fixed)) {
        // 时区没有冒号，添加冒号，如 +0800 -> +08:00
        fixed = fixed.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
        console.log(`添加时区冒号: "${fixed}"`);
    } else if (fixed.includes('+') || fixed.includes('-')) {
        // 有时区但不标准，尝试修复
        const match = fixed.match(/([+-]\d{2})(\d{2})?/);
        if (match) {
            const sign = match[1];
            const hours = match[1].substring(1);
            const minutes = match[2] || '00';
            fixed = fixed.replace(/([+-]\d{2})(\d{2})?/, `${sign}${hours}:${minutes}`);
            console.log(`修复时区格式: "${fixed}"`);
        }
    } else {
        // 没有时区信息，添加默认时区 +08:00
        fixed = fixed + '+08:00';
        console.log(`添加默认时区: "${fixed}"`);
    }
    
    // 3. 验证修复后的时间是否有效
    const testDate = new Date(fixed);
    if (isNaN(testDate.getTime())) {
        console.error(`时间修复后仍然无效: "${fixed}"`);
        throw new Error(`无法解析的时间格式: ${timeStr}`);
    }
    
    console.log(`最终时间字符串: "${fixed}"`);
    return fixed;
}

// 将查询逻辑封装成 Promise 函数
function queryUtilization(ip, port, start, end, cnc_uid) {
    return new Promise((resolve, reject) => {
        try {
            // 修复时间格式
            const fixedStart = fixTimeFormat(start);
            const fixedEnd = fixTimeFormat(end);
            
            // 构建 smartbox_target
            const smartbox_target = `http://${ip}:${port}`;
            
            
            // 创建 gRPC 客户端
            const client = createCncPlcClient(smartbox_target);
            
            // 构建请求
            const request = {
                cnc_uid,
                start_time: toTimestamp(fixedStart),
                end_time: toTimestamp(fixedEnd)
            };
            
            
            // 发送查询
            client.QuerySingleCncUtilization(request, (error, response) => {
                if (error) {
                    //console.error("gRPC error:", error);
                    client.close();
                    reject({
                        success: false,
                        message: "gRPC error",
                        error: error.message,
                        code: error.code
                    });
                    return;
                }
                
                if (!response.iot_status || Number(response.iot_status.status_code) !== IOT_STATUS_CODE.OK) {
                    // console.error("IotStatus error:");
                    // console.error(JSON.stringify(response.iot_status || {}, null, 2));
                    client.close();
                    reject({
                        success: false,
                        message: "IotStatus error",
                        iot_status: response.iot_status || {}
                    });
                    return;
                }
                
                //console.log("QuerySingleCncUtilization response received successfully");
                client.close();
                
                // 返回成功响应
                resolve({
                    success: true,
                    data: response
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

// 处理利用率查询的路由
router.get('/use', (req, res) => {
    let ip = req.query.ip;
    let port = req.query.port;
    let start = req.query.start;
    let end = req.query.end;
    let type = req.query.type;
    let cnc_uid = req.query.cnc_uid;
    
    const tabId = req.headers['tab-id'];
    
    // 参数验证
    if (!ip || !port || !start || !end) {
        return res.status(400).json({
            success: false,
            message: "Missing required parameters: ip, port, start, end"
        });
    }
    
    // console.log(`\n${"=".repeat(60)}`);
    // console.log(`收到请求: ${new Date().toISOString()}`);
    // console.log(`参数: ip=${ip}, port=${port}, start=${start}, end=${end}, type=${type}, cnc_uid=${cnc_uid}`);
    // console.log(`${"=".repeat(60)}\n`);
    
    req.on('close', () => {
        if (false) {
            console.log('Client disconnected:', {
                ip: req.ip,
                url: req.originalUrl,
                tabId: tabId
            });
        }
    });
    
    // 调用查询函数
    queryUtilization(ip, port, start, end, cnc_uid)
        .then(function(internalJsonData) {
            console.log("✅ 返回数据给前端");
            res.json(internalJsonData);
        })
        .catch(function(error) {
            console.error("❌ 查询失败:", error);
            res.status(500).json(error);
        });
});

module.exports = router;