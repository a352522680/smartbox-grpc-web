var Express = require('express');
//创建路由
var router=Express.Router();

const grpc = require('@grpc/grpc-js');
const { Timestamp } = require('google-protobuf/google/protobuf/timestamp_pb.js');

// 华兴 新加开始
const { getGrpcClient } = require('./grpcClient');
const activeCalls = {};  // Dictionary to store active calls
const debugPrint = true;
const logger = require('./logger');

const maxRetries = 3;  // Set a limit for retries
const retryDelay = 10000;  // Delay in milliseconds (10 seconds)
// 华兴 新加完毕

function asyncOperation1(tabId, ip, port, Start, End, retryCount = 0){

    // 华兴 新加开始
    const type = "QueryHistoricalEvent";
    const dictKey = (tabId + type);
    if (activeCalls[dictKey] && debugPrint) {
      logger.debug(`ChartApi: 开始尝试取消之前 (${activeCalls[dictKey].ts}) 可能未完成 ${type} 对象 IP: ${activeCalls[dictKey].ip}, args: start=${activeCalls[dictKey].start}, end=${activeCalls[dictKey].end}`);
      activeCalls[dictKey].call.cancel();  // Cancel the previous call if there is a new call for the same type; no harm done if it's completed
    }
    // 华兴 新加完毕

    //Promise
    var p = new Promise(function(resolve, reject){ 
        let target=ip+":"+port;
        const client = getGrpcClient(target);
        let start=getStart(Start);
        let end=getEnd(End);
        var oo={
            mask:63,
            start:start.toObject(),
            end:end.toObject(),
            segments:1
        } 

        // 华兴 更改
        const now = new Date();
        activeCalls[dictKey] = {
          ip: ip,
          ts: now,
          start: Start,
          end: End,
          call: client.QueryHistoricalEvent(oo, function (err, res) {
              if (err == null) {
                const end = Date.now();
                if (debugPrint) {
                  logger.info(`ChartApi: QueryHistoricalEvent return OK took ${(end - now.getTime()) / 1000} secs (args:  start=${Start}, end=${End})`);
                }
                const localJsonData = JSON.parse(res.jsonData)
                resolve(localJsonData) // 华兴 更改用局部变量，全局变量会导致竞态条件
              } else if (err.code === grpc.status.UNAVAILABLE && retryCount < maxRetries) {
                // Handle UNAVAILABLE error by retrying after a delay
                if (debugPrint) {
                  logger.warn(`QueryHistoricalEvent unavailable, retrying... (Attempt ${retryCount + 1}/${maxRetries})`);
                }
                setTimeout(() => {
                  resolve(asyncOperation1(tabId, ip, port, Start, End, retryCount + 1));  // Retry with incremented count
                }, retryDelay);
              }
              else {
                // 华兴 更改报错处理与打印
                if (err.code === grpc.status.CANCELLED) {
                  if (debugPrint) {
                    logger.debug(`ChartApi: 取消掉之前未完成 (${now}) QueryHistoricalEvent 对象是: ${target} (args:  start=${Start}, end=${End})`)
                  }
                } else {
                  logger.error(`ChartApi: QueryHistoricalEvent (${now}) 报错： ${err}; 对象是: ${target} (args:  start=${Start}, end=${End})`)
                }
                resolve('2');
              }
            })
        }
    });
    return p;
}
function asyncOperation2(tabId, ip, port, Start, End, retryCount = 0) {
    // 华兴 新加开始
    var type = "QueryHistoricalBar";
    const dictKey = (tabId + type);
    if (activeCalls[dictKey] && debugPrint) {
      //logger.debug(`ChartApi: 开始尝试取消之前 (${activeCalls[dictKey].ts}) 可能未完成 ${type} 对象 IP: ${activeCalls[dictKey].ip}, args: start=${activeCalls[dictKey].start}, end=${activeCalls[dictKey].end}`);
      activeCalls[dictKey].call.cancel();  // Cancel the previous call if there is a new call for the same type; no harm done if it's completed
    }
    // 华兴 新加完毕

    var p = new Promise(function(resolve, reject){ 
        let target=ip+":"+port;
        const client = getGrpcClient(target);
        let start=getStart(Start);
        let end=getEnd(End);
        var oo2={
            mask:29,
            start:start.toObject(),
            end:end.toObject(),
            segments:1
        }

        // 华兴 更改
        const now = new Date();
        activeCalls[dictKey] = {
          ip: ip,
          ts: now,
          start: Start,
          end: End,
          call: client.QueryHistoricalBar(oo2, function (err, res) {
            if (err == null) {
              const end = Date.now();
              if (debugPrint) {
                //logger.info(`ChartApi: QueryHistoricalBar return OK took ${(end - now.getTime()) / 1000} secs (args:  start=${Start}, end=${End})`);
              }
              const localJsonData = JSON.parse(res.jsonData)
              resolve(localJsonData) // 华兴 更改用局部变量，全局变量会导致竞态条件
            } else if (err.code === grpc.status.UNAVAILABLE && retryCount < maxRetries) {
              // Handle UNAVAILABLE error by retrying after a delay
              if (debugPrint) {
                logger.warn(`QueryHistoricalBar unavailable, retrying... (Attempt ${retryCount + 1}/${maxRetries})`);
              }
              setTimeout(() => {
                resolve(asyncOperation2(tabId, ip, port, Start, End, retryCount + 1));  // Retry with incremented count
              }, retryDelay);
            }
            else {
              // 华兴 更改报错处理与打印
              if (err.code === grpc.status.CANCELLED) {
                if (debugPrint) {
                  logger.debug(`ChartApi: 取消掉之前未完成 (${now}) QueryHistoricalBar 对象是: ${target} (args:  start=${Start}, end=${End})`)
                }
              } else {
                logger.error(`ChartApi: QueryHistoricalBar (${now}) 报错： ${err}; 对象是: ${target} (args:  start=${Start}, end=${End})`)
              }
              resolve('2');
            }
          })
        }
    })

    return p;
}
function asyncOperation3(tabId, ip, port, Start, End, retryCount = 0) {
    // 华兴 新加开始
    var type = "QueryHistoricalGraph";
    const dictKey = (tabId + type);
    if (activeCalls[dictKey] && debugPrint) {
      //logger.debug(`ChartApi: 开始尝试取消之前 (${activeCalls[dictKey].ts}) 可能未完成 ${type} 对象 IP: ${activeCalls[dictKey].ip}, args: start=${activeCalls[dictKey].start}, end=${activeCalls[dictKey].end}`);
      activeCalls[dictKey].call.cancel();  // Cancel the previous call if there is a new call for the same type; no harm done if it's completed
      }
    // 华兴 新加完毕

    var p = new Promise(function (resolve, reject) { 
        let target=ip+":"+port;
        const client = getGrpcClient(target);
        let start=getStart(Start);
        let end=getEnd(End);
        var oo3={
            mask:1,
            start:start.toObject(),
            end:end.toObject(),
            segments:1
        } 

        // 华兴 更改
        const now = new Date();
        activeCalls[dictKey] = {
          ip: ip,
          ts: now,
          start: Start,
          end: End,
          call: client.QueryHistoricalGraph(oo3, function (err, res) {
            if (err == null) {
              const end = Date.now();
              if (debugPrint) {
                //logger.info(`ChartApi: QueryHistoricalGraph return OK took ${(end - now.getTime()) / 1000} secs (args:  start=${Start}, end=${End})`);
              }
              const localJsonData = JSON.parse(res.jsonData)
              resolve(localJsonData) // 华兴 更改用局部变量，全局变量会导致竞态条件
            } else if (err.code === grpc.status.UNAVAILABLE && retryCount < maxRetries) {
              // Handle UNAVAILABLE error by retrying after a delay
              if (debugPrint) {
                logger.warn(`QueryHistoricalGraph unavailable, retrying... (Attempt ${retryCount + 1}/${maxRetries})`);
              }
              setTimeout(() => {
                resolve(asyncOperation3(tabId, ip, port, Start, End, retryCount + 1));  // Retry with incremented count
              }, retryDelay);
            }
            else {
              // 华兴 更改报错处理与打印
              if (err.code === grpc.status.CANCELLED) {
                if (debugPrint) {
                  logger.debug(`ChartApi: 取消掉之前未完成 (${now}) QueryHistoricalGraph 对象是: ${target} (args:  start=${Start}, end=${End})`)
                }
              } else {
                logger.error(`ChartApi: QueryHistoricalGraph (${now}) 报错： ${err}; 对象是: ${target} (args:  start=${Start}, end=${End})`)
              }
              resolve('2');
            }
          })
        }
    })
    return p;
}
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
    var ip=req.query.ip;
    var port=req.query.port;
    var start=req.query.start;
    var end=req.query.end;
    var ChartArr = [];

    req.on('close', () => {
      // Print client information
      // console.log('Client disconnected from ChartApi:');
      if (false) {
        console.log('Client IP:', req.ip);               // Client IP address
        console.log('Request URL:', req.originalUrl);    // The requested URL
        console.log('Headers:', req.headers);            // Client headers for more details
        console.log('Client User-Agent:', req.get('User-Agent'));  // Browser info
      }
    });

    const tabId = req.headers['tab-id'];

    Promise.all([
      asyncOperation1(tabId, ip, port, start, end),
      asyncOperation2(tabId, ip, port, start, end),
      asyncOperation3(tabId, ip, port, start, end)
    ])
    .then(results => {
      ChartArr.push(...results);
      // console.log(ChartArr);
      res.send(ChartArr);
    })
    .catch(error => {
      res.status(500).send("Error processing data");
      logger.error(`Error in one of the async operations: ${error}`);
    });
})

module.exports=router