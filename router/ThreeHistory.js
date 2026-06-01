const express = require('express');
const router = express.Router();
const { createCncPlcClient } = require("../shared/proto");
const { toTimestamp } = require("../shared/time");
const { CNC_STATUS_LABEL, IOT_STATUS_CODE } = require("../shared/constants");

// 将时间戳转换为年月日小时分钟秒格式
function formatDateTime(timestamp) {
    if (!timestamp || typeof timestamp.seconds === "undefined") {
        return "";
    }
    
    const seconds = Number(timestamp.seconds);
    const nanos = Number(timestamp.nanos || 0);
    const milliseconds = (seconds * 1000) + Math.floor(nanos / 1000000);
    
    const date = new Date(milliseconds);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds_display = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds_display}`;
}

// 格式化状态历史数据
function formatStatusHistory(response) {
    const statusHistory = response.cnc_status_history || {};
    const events = statusHistory.status_history || [];

    return events.map((event) => {
        const cncStatus = Number(event.cnc_status);
        return {
            start_time: formatDateTime(event.start_time),
            end_time: formatDateTime(event.end_time),
            cnc_status: cncStatus,
            cnc_status_name: CNC_STATUS_LABEL[cncStatus] || "UNKNOWN"
        };
    });
}

// 修复时间格式的函数
function fixTimeFormat(timeStr) {
    if (!timeStr) return timeStr;
    
    // 将空格替换回加号（处理 URL 解码导致的问题）
    let fixed = timeStr.replace(/ /g, '+');
    
    // 如果没有时区信息，添加默认时区 +08:00
    if (!fixed.includes('+') && !fixed.includes('-') && !fixed.includes('Z')) {
        fixed = fixed + '+08:00';
    }
    
    // 修复时区格式（如 +0800 -> +08:00）
    const timezonePattern = /([+-]\d{2})(\d{2})$/;
    if (timezonePattern.test(fixed) && !fixed.includes(':')) {
        fixed = fixed.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
    }
    
    return fixed;
}

// 查询状态历史的函数
function queryStatusHistory(ip, port, start, end, cnc_uid) {
    return new Promise((resolve, reject) => {
        try {
            // 修复时间格式
            const fixedStart = fixTimeFormat(start);
            const fixedEnd = fixTimeFormat(end);
            
            // 构建 smartbox_target
            const smartbox_target = `http://${ip}:${port}`;
            
            // console.log("查询状态历史参数:", {
            //     ip, port, cnc_uid,
            //     original_start: start,
            //     fixed_start: fixedStart,
            //     original_end: end,
            //     fixed_end: fixedEnd
            // });
            
            // 创建 gRPC 客户端
            const client = createCncPlcClient(smartbox_target);
            
            // 构建请求
            const request = {
                cnc_uid,
                start_time: toTimestamp(fixedStart),
                end_time: toTimestamp(fixedEnd)
            };
            
            // console.log("QuerySingleCncStatusHistory request:");
            // console.log(JSON.stringify({
            //     smartbox_target,
            //     cnc_uid,
            //     request
            // }, null, 2));
            
            // 发送查询
            client.QuerySingleCncStatusHistory(request, (error, response) => {
                if (error) {
                    console.error("gRPC error:", error);
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
                    console.error("IotStatus error:");
                    console.error(JSON.stringify(response.iot_status || {}, null, 2));
                    client.close();
                    reject({
                        success: false,
                        message: "IotStatus error",
                        iot_status: response.iot_status || {}
                    });
                    return;
                }
                
                //console.log("QuerySingleCncStatusHistory response received successfully");
                
                // 格式化状态历史数据
                const formattedEvents = formatStatusHistory(response);
                
                //console.log(`共获取到 ${formattedEvents.length} 条状态记录`);
                
                client.close();
                
                // 只返回 events
                resolve({
                    success: true,
                    events: formattedEvents,
                    total_count: formattedEvents.length
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

// 处理状态历史查询的路由
router.get('/history', (req, res) => {
    let ip = req.query.ip;
    let port = req.query.port;
    let start = req.query.start;
    let end = req.query.end;
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
    // console.log(`收到状态历史查询请求: ${new Date().toISOString()}`);
    // console.log(`参数: ip=${ip}, port=${port}, start=${start}, end=${end}, cnc_uid=${cnc_uid}`);
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
    queryStatusHistory(ip, port, start, end, cnc_uid)
        .then(function(result) {
            console.log("✅ 返回状态历史数据给前端");
            res.json(result);
        })
        .catch(function(error) {
            console.error("❌ 状态历史查询失败:", error);
            res.status(500).json(error);
        });
});

module.exports = router;