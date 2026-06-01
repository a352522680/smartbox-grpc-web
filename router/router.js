var Express = require('express');
//创建路由
var router = Express.Router();

const grpc = require('@grpc/grpc-js');
const { Timestamp } = require('google-protobuf/google/protobuf/timestamp_pb.js');
var ChartArr = [];

// 华兴 更改加开始
const { getGrpcClient } = require('./grpcClient');
const activeCalls = {};  // Dictionary to store active calls
const debugPrint = true;
const logger = require('./logger');
const maxRetries = 1;  // Set a limit for retries
const retryDelay = 10000;  // Delay in milliseconds (10 seconds)

const { createCncPlcClient } = require("../shared/proto");
const { toTimestamp } = require("../shared/time");
const { IOT_STATUS_CODE } = require("../shared/constants");


// ========== 新增开始：修复时间格式的函数 ==========
function fixTimeFormat(timeStr) {
    if (!timeStr) return timeStr;
    
    //logger.debug(`原始时间字符串: "${timeStr}"`);
    
    // 处理 URL 编码问题：将空格替换为加号或T
    let fixed = timeStr.replace(/ /g, 'T');
    
    // 如果时间字符串已经有效，直接返回
    const testDate = new Date(fixed);
    if (!isNaN(testDate.getTime())) {
        //logger.debug(`时间格式有效，直接使用: "${fixed}"`);
        return fixed;
    }
    
    // 尝试添加默认时区
    if (!fixed.includes('+') && !fixed.includes('-') && !fixed.includes('Z')) {
        fixed = fixed + '+08:00';
        const testDate2 = new Date(fixed);
        if (!isNaN(testDate2.getTime())) {
            //logger.debug(`添加默认时区后有效: "${fixed}"`);
            return fixed;
        }
    }
    
    // 如果还是无效，记录错误
    //logger.error(`时间格式无效: "${fixed}", 原始字符串: "${timeStr}"`);
    throw new Error(`无法解析的时间格式: ${timeStr}`);
}
// ========== 新增结束 ==========

// ========== 修改开始：利用率查询函数（添加详细日志） ==========
function queryUtilization(ip, port, start, end, cnc_uid, activeGrpcClients) {
    return new Promise((resolve, reject) => {
        try {
            const fixedStart = fixTimeFormat(start);
            const fixedEnd = fixTimeFormat(end);
            const smartbox_target = `http://${ip}:${port}`;
            const client = createCncPlcClient(smartbox_target);
            const request = {
                cnc_uid,
                start_time: toTimestamp(fixedStart),
                end_time: toTimestamp(fixedEnd)
            };
            
            // 👈 用对象结构保存
            const grpcEntry = { client, call: null };
            if (activeGrpcClients && Array.isArray(activeGrpcClients)) {
                activeGrpcClients.push(grpcEntry);
            }
            
            // 发送查询，保存返回的 call 对象
            const call = client.QuerySingleCncUtilization(request, (error, response) => {
                // 完成后从数组中移除
                if (activeGrpcClients && Array.isArray(activeGrpcClients)) {
                    const idx = activeGrpcClients.indexOf(grpcEntry);
                    if (idx > -1) activeGrpcClients.splice(idx, 1);
                }
                
                if (error) {
                    logger.error("gRPC error:", error);
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
                    client.close();
                    reject({
                        success: false,
                        message: "IotStatus error",
                        iot_status: response.iot_status || {}
                    });
                    return;
                }
                
                client.close();
                resolve({
                    success: true,
                    data: response
                });
            });
            
            // 👈 保存 call 对象引用
            grpcEntry.call = call;
            
        } catch (error) {
            logger.error("查询准备阶段出错:", error);
            reject({
                success: false,
                message: error.message || "查询准备阶段出错"
            });
        }
    });
}
// ========== 修改结束 ==========


function Gmain(tabId, ip, port, Start, End, type, retryCount = 0) {
  ChartArr = [];
  const dictKey = tabId + type;

  if (activeCalls[dictKey] && debugPrint) {
    // logger.debug(`开始尝试取消之前 (${activeCalls[dictKey].ts}) 可能未完成 ${type} 对象 IP: ${activeCalls[dictKey].ip}, args: start=${activeCalls[dictKey].start}, end=${activeCalls[dictKey].end}`);
    activeCalls[dictKey].call.cancel();
  }

  return new Promise((resolve, reject) => {
    let target = `${ip}:${port}`;
    const client = getGrpcClient(target);
    let startTime = getStart(Start);
    let endTime = getEnd(End);
    const now = new Date();

    const grpcCallHandler = (err, res) => {
        client.close();
      if (err == null) {
        try {
          let endTimestamp = Date.now();
          const localJsonData = JSON.parse(res.jsonData);
        //   logger.info(`${type} ${(endTimestamp - now.getTime()) / 1000} secs (args:  start=${Start}, end=${End}), target = ${target}`)
          resolve(localJsonData);
        } catch (parseError) {
          logger.error(`Error parsing response for ${type}: ${parseError.message}`);
          resolve('0');
        }
      } else if (err.code === grpc.status.UNAVAILABLE && retryCount < maxRetries) {
        // Retry logic for UNAVAILABLE error
        logger.warn(`gRPC call ${type} unavailable, retrying... (Attempt ${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          Gmain(tabId, ip, port, Start, End, type, retryCount + 1)
            .then(resolve)
            .catch(reject);
        }, retryDelay);
      } else {
        if (err.code !== grpc.status.CANCELLED) {
          logger.error(`gRPC ${type} call error: ${err.message} (Code: ${err.code})`);
        }
        resolve('2');
      }
    };

    const requestParams = {
      start: startTime.toObject(),
      end: endTime.toObject(),
      segments: 1,
    };

    switch (type) {
      case "QueryEfficiency":
        requestParams.mask = 45;
        activeCalls[dictKey] = { ip, ts: now, start: Start, end: End, call: client.QueryEfficiency(requestParams, grpcCallHandler) };
        break;
      case "QueryHistoricalEvent":
        requestParams.mask = 63;
        activeCalls[dictKey] = { ip, ts: now, start: Start, end: End, call: client.QueryHistoricalEvent(requestParams, grpcCallHandler) };
        break;
      case "QueryHistoricalBar":
        requestParams.mask = 29;
        activeCalls[dictKey] = { ip, ts: now, start: Start, end: End, call: client.QueryHistoricalBar(requestParams, grpcCallHandler) };
        break;
      case "QueryHistoricalGraph":
        requestParams.mask = 1;
        activeCalls[dictKey] = { ip, ts: now, start: Start, end: End, call: client.QueryHistoricalGraph(requestParams, grpcCallHandler) };
        break;
      case "QueryChangeRecord":
        requestParams.mask = 7;
        activeCalls[dictKey] = { ip, ts: now, start: Start, end: End, call: client.QueryChangeRecord(requestParams, grpcCallHandler) };
        break;
      case "QueryUsagePeriod":
        requestParams.mask = 7;
        activeCalls[dictKey] = { ip, ts: now, start: Start, end: End, call: client.QueryUsagePeriod(requestParams, grpcCallHandler) };
        break;
      default:
        logger.error(`Unknown gRPC type: ${type}`);
        resolve('2');
    }
  });
}
// 华兴 更改完毕

function getStart(Start) {
    var currentTime=Start
    var date = new Date(currentTime);
    var t = new Timestamp();
    t.setSeconds(Math.floor(date.getTime() / 1000));
    t.setNanos((date.getTime() % 1000) * 1e6);
    return t;
}
function getEnd(End) {
    var currentTime=End;
    var date = new Date(currentTime);
    var t = new Timestamp();
    t.setSeconds(Math.floor(date.getTime() / 1000));
    t.setNanos((date.getTime() % 1000) * 1e6);
    return t;
}
router.get('/use',(req,res)=>{
    let ip=req.query.ip;
    let port=req.query.port;
    let start=req.query.start;
    let end=req.query.end;
    let type = req.query.type;

    const tabId = req.headers['tab-id'];

    req.on('close', () => {
      // Print client information
      // console.log('Client disconnected from router:');
      if (false) {
        console.log('Client IP:', req.ip);               // Client IP address
        console.log('Request URL:', req.originalUrl);    // The requested URL
        console.log('Headers:', req.headers);            // Client headers for more details
        console.log('Client User-Agent:', req.get('User-Agent'));  // Browser info
      }
    });

  Gmain(tabId, ip,port,start,end,type)
        .then(function(internalJsonData){
            logger.debug("返回数据给前端")
            res.send(internalJsonData);
        })
})
router.get('/useBatch', async (req, res) => {
    let start = req.query.start;
    let end = req.query.end;
    let type = req.query.type;
    const tabId = req.headers['tab-id'];

    let isCancelled = false;
    const activeGrpcClients = [];
    // 监听客户端断开连接
    req.on('close', () => {
        isCancelled = true;
        console.log(`客户端 ${tabId} 断开连接，取消批量查询`);
                // 取消所有活跃的 gRPC 调用
        activeGrpcClients.forEach(entry => {
            try {
                if (entry.call) {
                    entry.call.cancel();  // 先 cancel 调用
                }
            } catch(e) {}
            try {
                if (entry.client) {
                    entry.client.close();  // 再 close 客户端
                }
            } catch(e) {}
        });
    });

    try {
        const config = require('../www/MachineConfig.json');
        const options = config.options;

        // logger.info(`批量查询开始: type=${type}, 设备数量=${options.length}`);

        // 分批并发控制，避免同时发起过多请求导致服务端压力过大
        const batchSize = 10; // 每批10个
        const results = [];

        for (let i = 0; i < options.length; i += batchSize) {
            // 检查是否已取消
            if (isCancelled) {
                console.log('查询已被取消，停止处理');
                return; // 不发送响应，因为连接已关闭
            }
            const batch = options.slice(i, i + batchSize);
            
            const batchPromises = batch.map(option => {
                const uniqueTabId = `${tabId}_${option.label}_${option.ip}_${option.port}`;
                
                // 根据 ShowType 选择不同的查询方法
                if (option.ShowType === '2') {
                    // ShowType == 2 使用利用率查询
                    return queryUtilization(option.ip, option.port, start, end, option.Mid,activeGrpcClients)
                        .then(result => {
                            // result 格式: { success: true, data: { iot_status, cnc_utilization: { connected_percent, running_percent, error_percent, cnc_uid } } }
                            logger.debug(`利用率查询成功: ${option.label}`);
                            
                            // 提取 running_percent 数据
                            const runningPercent = result.data?.cnc_utilization?.running_percent || [];
                            
                            return {
                                label: option.label,
                                ip: option.ip,
                                port: option.port,
                                mid: option.Mid,
                                showType: option.ShowType || '0',
                                deviceType: option.type,
                                success: true,
                                data: runningPercent  // 直接返回 running_percent 数组
                            };
                        })
                        .catch(err => ({
                            label: option.label,
                            ip: option.ip,
                            port: option.port,
                            mid: option.Mid,
                            showType: option.ShowType || '0',
                            deviceType: option.type,
                            success: false,
                            error: err.message || String(err)
                        }));
                } else {
                    // ShowType != 2 使用原有的 Gmain 查询
                    return Gmain(uniqueTabId, option.ip, option.port, start, end, type)
                        .then(data => ({
                            label: option.label,
                            ip: option.ip,
                            port: option.port,
                            mid: option.Mid,
                            showType: option.ShowType || '0',
                            deviceType: option.type,
                            success: true,
                            data: data
                        }))
                        .catch(err => ({
                            label: option.label,
                            ip: option.ip,
                            port: option.port,
                            mid: option.Mid,
                            showType: option.ShowType || '0',
                            deviceType: option.type,
                            success: false,
                            error: err.message || String(err)
                        }));
                }
            });

            // 等待当前批次完成
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            // logger.debug(`批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(options.length / batchSize)} 完成`);
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;
        // logger.info(`批量查询完成: 成功=${successCount}, 失败=${failCount}`);

        if (!isCancelled) {
            res.send({
                success: true,
                total: options.length,
                successCount: results.filter(r => r.success).length,
                failCount: results.filter(r => !r.success).length,
                results: results
            });
        }

    } catch (err) {
        logger.error(`批量查询失败: ${err.message}`);
        res.status(500).send({ 
            success: false,
            error: err.message 
        });
    }
});
module.exports=router
module.exports.Gmain = Gmain;  // 添加这一行
module.exports.queryUtilization = queryUtilization;  // 添加这一行