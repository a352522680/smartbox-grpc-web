const express = require('express');
const router = express.Router();
const db = require('../db/sqlserver');
const path = require('path');
const { createCncPlcClient } = require('../shared/proto');
const { toTimestamp } = require('../shared/time');
const { CNC_STATUS_LABEL, IOT_STATUS_CODE } = require('../shared/constants');
const { getGrpcClient } = require('./grpcClient');

// 关键：支持 JSON body（对齐项目里其他路由写法）
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

function getProcessKey(engineering) {
    const v = (engineering || '').trim();
    if (v.includes('前工程')) return 'front';
    // “研削工程/研磨工程”两种写法都兼容
    if (v.includes('研削') || v.includes('研磨')) return 'grinding';
    if (v.includes('电气')) return 'electrical';
    return 'all';
}

function loadMachineConfig() {
    // www/MachineConfig.json
    const configPath = path.join(__dirname, '..', 'www', 'MachineConfig.json');
    // require 会缓存；对配置频繁改动的情况可改为 fs.readFileSync + JSON.parse
    // eslint-disable-next-line import/no-dynamic-require, global-require
    return require(configPath);
}

function formatDateTime(timestamp) {
    if (!timestamp || typeof timestamp.seconds === 'undefined') {
        return '';
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

function formatStatusHistory(response) {
    const statusHistory = response.cnc_status_history || {};
    const events = statusHistory.status_history || [];
    
    // CNC状态码到前端state的映射（使用 constants.js 中的 CNC_STATUS）
    // 0: UNKNOWN, 1: DISCONNECTED, 2: IDLE, 3: RUNNING, 4: ERROR
    const statusToState = {
        0: 'running',       // UNKNOWN - 未知状态视为运行
        1: 'disconnected',  // DISCONNECTED - 断联
        2: 'stopped',      // IDLE - 待机/停止
        3: 'running',      // RUNNING - 运行
        4: 'alarm',        // ERROR - 报警
    };
    
    return events.map((event) => {
        const cncStatus = Number(event.cnc_status);
        const fullStartTime = formatDateTime(event.start_time);
        const fullEndTime = formatDateTime(event.end_time);
        
        // 转换为 HH:MM 格式
        const startTimePart = fullStartTime.split(' ')[1] || fullStartTime;
        const endTimePart = fullEndTime.split(' ')[1] || fullEndTime;
        const start = startTimePart.substring(0, 5); // "HH:MM"
        const end = endTimePart.substring(0, 5);     // "HH:MM"
        
        return {
            start: start,
            end: end,
            state: statusToState[cncStatus] || 'stopped'
        };
    });
}

// 修复时间格式的函数
function fixTimeFormat(timeStr) {
    if (!timeStr) return timeStr;
    
    // 将空格替换成 T（ISO 8601 格式）
    let fixed = timeStr.replace(/ /g, 'T');
    
    // 如果没有时区信息，添加默认时区 +08:00
    if (!fixed.includes('+') && !fixed.includes('-', 10) && !fixed.includes('Z')) {
        fixed = fixed + '+08:00';
    }
    
    // 修复时区格式（如 +0800 -> +08:00）
    const timezonePattern = /([+-]\d{2})(\d{2})$/;
    if (timezonePattern.test(fixed)) {
        fixed = fixed.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
    }
    
    return fixed;
}

// 查询状态历史的函数（照着 ThreeHistory.js 写）
// 将 QuerySingleCncUtilization 返回的数据转换为 segments 格式
function convertUtilizationToSegments(utilization, baseTime) {
    if (!utilization) return [];
    
    // running_percent 是一个数组，包含每分钟的运行百分比
    const runningPercent = utilization.running_percent || [];
    if (runningPercent.length === 0) return [];
    
    // 从 baseTime 中提取开始时间（格式：2026-06-03 08:00:00）
    const baseHour = 8; // 默认从8点开始
    const segments = [];
    
    // 将百分比数组转换为时间段
    // 假设数组每个元素代表一分钟
    let currentStart = null;
    let currentState = 'stopped';
    
    for (let i = 0; i < runningPercent.length; i++) {
        const percent = runningPercent[i];
        const hour = baseHour + Math.floor(i / 60);
        const minute = i % 60;
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        
        // 根据百分比判断状态
        const state = percent > 50 ? 'running' : 'stopped';
        
        if (state !== currentState) {
            // 状态变化，结束上一个时间段，开始新的时间段
            if (currentStart !== null) {
                segments.push({
                    start: currentStart,
                    end: timeStr,
                    state: currentState
                });
            }
            currentStart = timeStr;
            currentState = state;
        }
    }
    
    // 添加最后一个时间段
    if (currentStart !== null) {
        const lastMinute = runningPercent.length - 1;
        const lastHour = baseHour + Math.floor(lastMinute / 60);
        const lastMin = lastMinute % 60;
        segments.push({
            start: currentStart,
            end: `${String(lastHour).padStart(2, '0')}:${String(lastMin).padStart(2, '0')}`,
            state: currentState
        });
    }
    
    return segments;
}

// 将 QueryEfficiency 返回的数据转换为 segments 格式
function convertEfficiencyToSegments(efficiencyData, baseTime) {
    if (!efficiencyData || !efficiencyData.EfficiencyOutput) return [];
    
    // 查找 UpTime 数据
    const upTimeItem = efficiencyData.EfficiencyOutput.find(item => item.Name === 'UpTime');
    if (!upTimeItem || !upTimeItem.Value || upTimeItem.Value.length === 0) return [];
    
    // UpTime.Value 是一个数组，包含每分钟的运行状态（0或1）
    const upTimeValues = upTimeItem.Value;
    const baseHour = 8; // 默认从8点开始
    const segments = [];
    
    let currentStart = null;
    let currentState = 'stopped';
    
    for (let i = 0; i < upTimeValues.length; i++) {
        const value = upTimeValues[i];
        const hour = baseHour + Math.floor(i / 60);
        const minute = i % 60;
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        
        // value > 0 表示运行
        const state = value > 0 ? 'running' : 'stopped';
        
        if (state !== currentState) {
            if (currentStart !== null) {
                segments.push({
                    start: currentStart,
                    end: timeStr,
                    state: currentState
                });
            }
            currentStart = timeStr;
            currentState = state;
        }
    }
    
    // 添加最后一个时间段
    if (currentStart !== null) {
        const lastMinute = upTimeValues.length - 1;
        const lastHour = baseHour + Math.floor(lastMinute / 60);
        const lastMin = lastMinute % 60;
        segments.push({
            start: currentStart,
            end: `${String(lastHour).padStart(2, '0')}:${String(lastMin).padStart(2, '0')}`,
            state: currentState
        });
    }
    
    return segments;
}

const DAY_START_HOUR = 8;

function parseDateValue(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function toLocalDateFromUtcValue(value) {
    return parseDateValue(value);
}

function formatLocalDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function shiftDateStringByHours(value, hours) {
    if (typeof value !== 'string') return value;

    const trimmed = value.trim();
    if (!/^\d{4}[-/]\d{2}[-/]\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(trimmed)) {
        return value;
    }

    const date = parseDateValue(trimmed);
    if (!date) return value;

    date.setHours(date.getHours() + hours);
    return formatLocalDateTime(date);
}

function shiftGmainTimeValues(data, hours) {
    if (Array.isArray(data)) {
        return data.map(item => shiftGmainTimeValues(item, hours));
    }

    if (data && typeof data === 'object') {
        Object.keys(data).forEach(key => {
            data[key] = shiftGmainTimeValues(data[key], hours);
        });
        return data;
    }

    return shiftDateStringByHours(data, hours);
}

function getTimelineBaseDate(startTime) {
    const startDate = parseDateValue(fixTimeFormat(startTime)) || new Date();
    return new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        DAY_START_HOUR,
        0,
        0
    );
}

function getTimelineEndDate(startTime, endTime) {
    const endDate = parseDateValue(fixTimeFormat(endTime));
    if (endDate) return endDate;

    const baseDate = getTimelineBaseDate(startTime);
    return new Date(baseDate.getTime() + (24 * 60 * 60 * 1000));
}

function dateToTimelineMinute(date, baseDate) {
    return Math.round((date.getTime() - baseDate.getTime()) / 60000);
}

function minuteToTimeLabel(minute) {
    const shiftedMinute = minute + (DAY_START_HOUR * 60);
    const normalizedMinute = ((shiftedMinute % 1440) + 1440) % 1440;
    const hour = Math.floor(normalizedMinute / 60);
    const min = normalizedMinute % 60;
    return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function addSegment(segments, startMinute, endMinute, state) {
    if (endMinute <= startMinute) return;

    const last = segments[segments.length - 1];
    if (last && last.state === state && last.endMinute === startMinute) {
        last.endMinute = endMinute;
        return;
    }

    segments.push({ startMinute, endMinute, state });
}

function formatSegments(segments) {
    return segments
        .filter(segment => segment.endMinute > segment.startMinute)
        .map(segment => ({
            start: minuteToTimeLabel(segment.startMinute),
            end: minuteToTimeLabel(segment.endMinute),
            state: segment.state
        }));
}

function fillStoppedGaps(segments, startMinute, endMinute) {
    const sorted = segments
        .filter(segment => segment.endMinute > startMinute && segment.startMinute < endMinute)
        .map(segment => ({
            startMinute: Math.max(startMinute, segment.startMinute),
            endMinute: Math.min(endMinute, segment.endMinute),
            state: segment.state
        }))
        .sort((a, b) => a.startMinute - b.startMinute || b.endMinute - a.endMinute);

    const result = [];
    let cursor = startMinute;

    sorted.forEach(segment => {
        if (segment.startMinute > cursor) {
            addSegment(result, cursor, segment.startMinute, 'stopped');
        }

        if (segment.endMinute > cursor) {
            addSegment(result, Math.max(cursor, segment.startMinute), segment.endMinute, segment.state);
            cursor = segment.endMinute;
        }
    });

    if (cursor < endMinute) {
        addSegment(result, cursor, endMinute, 'stopped');
    }

    return result;
}

function convertStatusEventsToSegments(events, startTime, endTime) {
    const baseDate = getTimelineBaseDate(startTime);
    const startMinute = 0;
    const endMinute = Math.max(
        startMinute,
        dateToTimelineMinute(getTimelineEndDate(startTime, endTime), baseDate)
    );
    const segments = [];

    (events || []).forEach(event => {
        const startDate = parseDateValue(event.start_time);
        const endDate = parseDateValue(event.end_time);
        if (!startDate || !endDate) return;

        addSegment(
            segments,
            dateToTimelineMinute(startDate, baseDate),
            dateToTimelineMinute(endDate, baseDate),
            event.state || 'stopped'
        );
    });

    return formatSegments(fillStoppedGaps(segments, startMinute, endMinute));
}

function convertHistoricalBarToSegments(historicalData, startTime, endTime) {
    if (!historicalData || !Array.isArray(historicalData.HistoricalBar)) return [];

    const baseDate = getTimelineBaseDate(startTime);
    const startMinute = 0;
    const endMinute = Math.max(
        startMinute,
        dateToTimelineMinute(getTimelineEndDate(startTime, endTime), baseDate)
    );
    if (endMinute <= startMinute) return [];

    const minuteStates = new Array(endMinute - startMinute).fill('stopped');
    const priority = {
        stopped: 0,
        running: 1,
        alarm: 2
    };

    historicalData.HistoricalBar.forEach(item => {
        if (!item || !Array.isArray(item.Value)) return;

        const state = item.Name === 'Running'
            ? 'running'
            : item.Name === 'Alarm'
                ? 'alarm'
                : null;
        if (!state) return;

        for (let i = 0; i + 1 < item.Value.length; i += 3) {
            const startDate = toLocalDateFromUtcValue(item.Value[i]);
            const endDate = toLocalDateFromUtcValue(item.Value[i + 1]);
            if (!startDate || !endDate) continue;

            const rangeStart = Math.max(startMinute, dateToTimelineMinute(startDate, baseDate));
            const rangeEnd = Math.min(endMinute, dateToTimelineMinute(endDate, baseDate));

            for (let minute = rangeStart; minute < rangeEnd; minute += 1) {
                const index = minute - startMinute;
                if (priority[state] > priority[minuteStates[index]]) {
                    minuteStates[index] = state;
                }
            }
        }
    });

    const segments = [];
    let currentState = minuteStates[0];
    let currentStart = startMinute;

    for (let i = 1; i <= minuteStates.length; i += 1) {
        if (i === minuteStates.length || minuteStates[i] !== currentState) {
            addSegment(segments, currentStart, startMinute + i, currentState);
            currentStart = startMinute + i;
            currentState = minuteStates[i];
        }
    }

    return formatSegments(segments);
}

function queryStatusHistory(ip, port, start, end, cnc_uid) {
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
            client.QuerySingleCncStatusHistory(request, (error, response) => {
                if (error) {
                    console.warn("gRPC QuerySingleCncStatusHistory 出错:", error.message, "| device:", cnc_uid);
                    client.close();
                    resolve({ success: true, events: [], total_count: 0 });
                    return;
                }
                
                if (!response.iot_status || Number(response.iot_status.status_code) !== IOT_STATUS_CODE.OK) {
                    console.warn("IotStatus error:", JSON.stringify(response.iot_status || {}), "| device:", cnc_uid);
                    client.close();
                    resolve({ success: true, events: [], total_count: 0 });
                    return;
                }
                
                // 格式化状态历史数据
                const formattedEvents = formatStatusHistory(response);
                client.close();
                resolve({ success: true, events: formattedEvents, total_count: formattedEvents.length });
            });
        } catch (error) {
            console.error("查询准备阶段出错:", error);
            resolve({ success: true, events: [], total_count: 0 });
        }
    });
}

function queryUtilization(ip, port, start, end, cnc_uid) {
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
            
            client.QuerySingleCncUtilization(request, (error, response) => {
                if (error) {
                    console.warn('gRPC QuerySingleCncUtilization 不支持或出错:', error.message, '| device:', cnc_uid);
                    client.close();
                    resolve({
                        success: false,
                        data: null
                    });
                    return;
                }
                
                if (!response.iot_status || Number(response.iot_status.status_code) !== IOT_STATUS_CODE.OK) {
                    console.warn('IotStatus error:', response.iot_status, '| device:', cnc_uid);
                    client.close();
                    resolve({
                        success: false,
                        data: null
                    });
                    return;
                }
                
                client.close();
                resolve({
                    success: true,
                    data: response
                });
            });
        } catch (error) {
            console.error('查询准备阶段出错:', error);
            reject({
                success: false,
                message: error.message || '查询准备阶段出错'
            });
        }
    });
}

function Gmain(tabId, ip, port, Start, End, type) {
    return new Promise((resolve, reject) => {
        let target = `${ip}:${port}`;
        const client = getGrpcClient(target);
        let startTime = getStart(Start);
        let endTime = getEnd(End);
        
        const grpcCallHandler = (err, res) => {
            // 不要关闭缓存的客户端，因为 getGrpcClient 是用来复用的
            // client.close();
            if (err == null) {
                try {
                    const localJsonData = shiftGmainTimeValues(JSON.parse(res.jsonData), 8);
                    resolve(localJsonData);
                } catch (parseError) {
                    console.error(`Error parsing response for ${type}: ${parseError.message}`);
                    resolve('0');
                }
            } else {
                console.warn(`gRPC ${type} call error: ${err.message} (Code: ${err.code}) | device: ${tabId}`);
                // 返回 '0' 表示查询失败，让调用方有默认值
                resolve('0');
            }
        };
        
        const requestParams = {
            start: startTime.toObject(),
            end: endTime.toObject(),
            segments: 1,
        };
        
        switch (type) {
            case 'QueryEfficiency':
                requestParams.mask = 45;
                client.QueryEfficiency(requestParams, grpcCallHandler);
                break;
            case 'QueryHistoricalEvent':
                requestParams.mask = 63;
                client.QueryHistoricalEvent(requestParams, grpcCallHandler);
                break;
            case 'QueryHistoricalBar':
                requestParams.mask = 29;
                client.QueryHistoricalBar(requestParams, grpcCallHandler);
                break;
            case 'QueryHistoricalGraph':
                requestParams.mask = 1;
                client.QueryHistoricalGraph(requestParams, grpcCallHandler);
                break;
            case 'QueryUsagePeriod':
                requestParams.mask = 7;
                client.QueryUsagePeriod(requestParams, grpcCallHandler);
                break;
            default:
                console.error(`Unknown gRPC type: ${type}`);
                resolve('2');
        }
    });
}

function getStart(Start) {
    var currentTime = Start;
    var date = new Date(currentTime);
    const { Timestamp } = require('google-protobuf/google/protobuf/timestamp_pb.js');
    var t = new Timestamp();
    t.setSeconds(Math.floor(date.getTime() / 1000));
    t.setNanos((date.getTime() % 1000) * 1e6);
    return t;
}

function getEnd(End) {
    var currentTime = End;
    var date = new Date(currentTime);
    const { Timestamp } = require('google-protobuf/google/protobuf/timestamp_pb.js');
    var t = new Timestamp();
    t.setSeconds(Math.floor(date.getTime() / 1000));
    t.setNanos((date.getTime() % 1000) * 1e6);
    return t;
}

function getQueryTimeRange() {
    var now = new Date();
    var today8am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
    
    var Stime, Etime;
    
    if (now >= today8am) {
        // 已经过了今天8点，查询今天8点到当前时间
        Stime = today8am;
        Etime = now;
    } else {
        // 还没到今天8点，查询昨天8点到当前时间
        Stime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 8, 0, 0);
        Etime = now;
    }
    
    function formatDateTime(date) {
        var year = date.getFullYear();
        var month = ('0' + (date.getMonth() + 1)).slice(-2);
        var day = ('0' + date.getDate()).slice(-2);
        var hours = ('0' + date.getHours()).slice(-2);
        var minutes = ('0' + date.getMinutes()).slice(-2);
        var seconds = ('0' + date.getSeconds()).slice(-2);
        return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
    }
    
    return {
        Stime: formatDateTime(Stime),
        Etime: formatDateTime(Etime)
    };
}

function extractRateFromDevice(device) {
    // 从设备数据中提取 rate，参考 overview.js 的 updateDeviceUI
    if (!device || !device.data || device.data === "2" || device.data === "0") {
        return null;
    }
    
    var percent;
    
    if (device.data.EfficiencyOutput) {
        // 格式1: 包含EfficiencyOutput数组
        var upTimeItem = device.data.EfficiencyOutput.find(function(item) {
            return item.Name === "UpTime";
        });
        
        if (!upTimeItem || !upTimeItem.Value || upTimeItem.Value.length === 0) {
            return null;
        }
        
        percent = upTimeItem.Value[0] * 100;
    } else if (Array.isArray(device.data)) {
        // 格式2: data直接是数组
        if (device.data.length === 0) {
            return null;
        }
        percent = device.data[0];
    } else {
        return null;
    }
    
    return percent;
}

/**
 * GET /Engineering/targetValues
 * 返回 MachineID -> TargetValue 的映射，用于 overview 页面动态颜色判断
 */
router.get('/targetValues', async (req, res) => {
    try {
        const sql = `
            SELECT MachineID, TargetValue
            FROM TBL_Engineering
            WHERE MachineID IS NOT NULL AND MachineID <> ''
            ORDER BY CAST(MachineID AS INT);
        `;

        const rows = await db.query(sql, {});

        // 转换为 { machineId: targetValue } 的映射
        const targetMap = {};
        rows.forEach(row => {
            const machineId = String(row.MachineID).trim();
            const targetValue = row.TargetValue !== null && row.TargetValue !== undefined
                ? Number(row.TargetValue)
                : null;
            if (machineId) {
                targetMap[machineId] = targetValue;
            }
        });

        res.json({
            success: true,
            data: targetMap
        });
    } catch (error) {
        console.error('TargetValue 查询失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误，请稍后重试',
            error: error.message
        });
    }
});

/**
 * GET /Engineering/list
 * 返回设备工程配置（用于设备稼动页面渲染的基础字段）
 *
 * Query:
 *  - engineering: 可选，按 Engineering 过滤（精确匹配）
 *  - machineId: 可选，按 MachineID 过滤（int，对应 MachineConfig.json 的 Mid）
 */
router.get('/list', async (req, res) => {
    try {
        const { engineering, machineId, start, end } = req.query;

        let sql = `
            SELECT ID, Engineering, SubEngineering, MachineID, TargetValue, Model
            FROM TBL_Engineering
            WHERE 1=1
        `;
        const params = {};

        if (engineering) {
            sql += ' AND Engineering = @Engineering';
            params.Engineering = engineering;
        }

        if (machineId !== undefined && machineId !== null && String(machineId).trim() !== '') {
            sql += ' AND MachineID = @MachineID';
            params.MachineID = Number(machineId);
        }

        sql += ' ORDER BY CAST(MachineID AS INT);';

        const rows = await db.query(sql, params);

        // MachineConfig.json 里的 Mid → label
        let machineCfg = { options: [] };
        try {
            machineCfg = loadMachineConfig() || machineCfg;
        } catch (e) {
            // 配置不存在/JSON错误也不影响接口主流程
            machineCfg = { options: [] };
        }
        const machineMap = new Map(
            (machineCfg.options || []).map(o => [Number(o.Mid), o])
        );

        // 获取时间范围：优先使用传入的 start/end，否则使用默认的8点逻辑
        let timeRange = getQueryTimeRange();
        let startTime = start || timeRange.Stime;
        let endTime = end || timeRange.Etime;

        // 先批量查询所有设备的 rate 数据（参考 useBatch）
        let rateMap = new Map();
        try {
            const rateResults = await queryBatchEfficiency(machineCfg.options, startTime, endTime);
            rateResults.forEach(device => {
                if (device.mid) {
                    rateMap.set(Number(device.mid), device);
                }
            });
        } catch (err) {
            console.error('批量查询 rate 失败:', err);
            // 失败时 rateMap 保持空，不影响主流程
        }

        // 并行查询所有设备的 segments 数据
        const dataPromises = rows.map(async r => {
            const mid = Number(r.MachineID);
            const machineOption = machineMap.get(mid);
            const label = machineOption?.label || `M-${mid}`;
            const process = r.Engineering || '';
            const subprocess = r.SubEngineering || '';
            const target = (r.TargetValue === null || typeof r.TargetValue === 'undefined') ? null : Number(r.TargetValue);
            const model = r.Model || '';
            
            // 获取 rate
            let rate = null;
            const rateDevice = rateMap.get(mid);
            if (rateDevice) {
                rate = extractRateFromDevice(rateDevice);
            }
            
            let segments = [];
            
            if (machineOption) {
                try {
                    const showType = machineOption.ShowType || '0';
                    
                    if (showType === '2') {
                        // ShowType 2: 使用 QuerySingleCncUtilization（和 router.js 一致）
                        const historyResult = await queryStatusHistory(machineOption.ip, machineOption.port, startTime, endTime, machineOption.Mid);
                        if (historyResult.success && Array.isArray(historyResult.events)) {
                            segments = historyResult.events;
                        }
                    } else {
                        // 其他 ShowType: 使用 QueryEfficiency（和 router.js 一致）
                        const historicalBarData = await Gmain('engineering_seg_' + mid, machineOption.ip, machineOption.port, startTime, endTime, 'QueryHistoricalBar');
                        if (historicalBarData && historicalBarData !== '0' && historicalBarData !== '2') {
                            segments = convertHistoricalBarToSegments(historicalBarData, startTime, endTime);
                        }
                    }
                } catch (err) {
                    console.error(`获取设备 ${label} 数据失败:`, err);
                    // 查询失败时 segments 保持为空数组，不影响主流程
                }
            }

            return {
                machine: label,
                model: model,
                target: target,
                rate: rate,
                processKey: getProcessKey(process),
                process: process,
                subprocess: subprocess,
                segments: segments
            };
        });

        const data = await Promise.all(dataPromises);

        res.json({
            success: true,
            message: '查询成功',
            total: data.length,
            data
        });
    } catch (error) {
        console.error('Engineering 查询失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误，请稍后重试',
            error: error.message
        });
    }
});

// 批量查询效率数据，参考 router.js 的 useBatch
async function queryBatchEfficiency(options, start, end) {
    const batchSize = 10;
    const results = [];
    
    for (let i = 0; i < options.length; i += batchSize) {
        const batch = options.slice(i, i + batchSize);
        const batchPromises = batch.map(option => {
            const uniqueTabId = 'engineering_' + option.Mid;
            
            if (option.ShowType === '2') {
                // ShowType 2: 使用 queryUtilization
                return queryUtilization(option.ip, option.port, start, end, option.Mid)
                    .then(result => ({
                        label: option.label,
                        ip: option.ip,
                        port: option.port,
                        mid: option.Mid,
                        showType: option.ShowType || '0',
                        deviceType: option.type,
                        success: result.success,
                        data: result.success ? result.data.cnc_utilization?.running_percent || [] : null,
                        error: result.error
                    }));
            } else {
                // 其他 ShowType: 使用 Gmain + QueryEfficiency
                return Gmain(uniqueTabId, option.ip, option.port, start, end, 'QueryEfficiency')
                    .then(data => ({
                        label: option.label,
                        ip: option.ip,
                        port: option.port,
                        mid: option.Mid,
                        showType: option.ShowType || '0',
                        deviceType: option.type,
                        success: data !== '0' && data !== '2',
                        data: data
                    }));
            }
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
    }
    
    return results;
}

module.exports = router;
