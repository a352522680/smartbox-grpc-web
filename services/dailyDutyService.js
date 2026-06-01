// services/dailyDutyService.js
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
const db = require('../db/sqlserver');
const { Gmain, queryUtilization } = require('../router/router');

class DailyDutyService {
    constructor() {
        this.isRunning = false;
        this.taskName = '设备数据每日值守';
        this.logDir = path.join(process.cwd(), 'logs');
        this.ensureLogDir();
    }

    ensureLogDir() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    writeLog(level, message, data = null) {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
        
        const logFile = path.join(this.logDir, `duty-${dateStr}.log`);
        let logMessage = `[${timeStr}] [${level}] [${this.taskName}] ${message}`;
        
        if (data) {
            logMessage += '\n' + JSON.stringify(data, null, 2);
        }
        logMessage += '\n';
        
        fs.appendFileSync(logFile, logMessage, 'utf8');
        
        if (level === 'ERROR') {
            console.error(logMessage);
        } else {
            console.log(logMessage);
        }
    }

    /**
     * 查询数据库中最后一条记录的时间
     */
    async getLastRecordTime() {
        try {
            const sqlString = `SELECT MAX([Time]) as lastTime FROM TBL_Machine_daily_data`;
            const result = await db.query(sqlString);
            
            if (result && result.length > 0 && result[0].lastTime) {
                const lastTime = new Date(result[0].lastTime);
                this.writeLog('INFO', `数据库最后记录时间: ${lastTime.toLocaleString('zh-CN')}`);
                return lastTime;
            }
            
            this.writeLog('WARN', '数据库中暂无记录');
            return null;
        } catch (error) {
            this.writeLog('ERROR', '查询最后记录时间失败', { 错误: error.message });
            return null;
        }
    }

    /**
     * 计算缺失的天数
     */
    getMissedDays(lastRecordTime) {
        const now = new Date();
        const today8AM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
        
        const missedDays = [];
        
        if (!lastRecordTime) {
            // 如果没有记录，只执行今天的（不往前补太多）
            this.writeLog('INFO', '数据库无历史记录，仅执行今天的任务');
            return missedDays;
        }

        // 从最后记录时间开始，找到下一个8点
        let next8AM = new Date(lastRecordTime);
        next8AM.setHours(8, 0, 0, 0);
        
        // 如果最后记录时间在8点之后，下一个应该是第二天8点
        if (lastRecordTime >= next8AM) {
            next8AM.setDate(next8AM.getDate() + 1);
        }
        
        // 收集所有缺失的日期（到今天的8点为止）
        while (next8AM < today8AM) {
            missedDays.push(new Date(next8AM));
            next8AM.setDate(next8AM.getDate() + 1);
        }

        this.writeLog('INFO', `检测到 ${missedDays.length} 天缺失数据`);
        
        if (missedDays.length > 0) {
            console.log(`⚠️ 发现数据缺失，缺失天数: ${missedDays.length}`);
            missedDays.forEach(day => {
                console.log(`   - ${day.toLocaleDateString('zh-CN')}`);
            });
        }
        
        return missedDays;
    }

    /**
     * 启动定时任务 - 每天8点执行
     */
    start() {
        // 每天8:00:00执行
        cron.schedule('0 0 8 * * *', async () => {
            this.writeLog('INFO', '==================== 定时任务触发 ====================');
            
            try {
                // 1. 先查数据库最后记录时间
                const lastRecordTime = await this.getLastRecordTime();
                
                // 2. 检查是否有缺失的天数
                const missedDays = this.getMissedDays(lastRecordTime);
                
                // 3. 先补偿缺失的天数
                if (missedDays.length > 0) {
                    console.log(`\n🔄 开始补偿 ${missedDays.length} 天缺失数据...`);
                    
                    for (let i = 0; i < missedDays.length; i++) {
                        const missedDay = missedDays[i];
                        
                        // 结束时间是这天8点
                        const endTime = new Date(missedDay);
                        endTime.setHours(8, 0, 0, 0);
                        
                        // 开始时间是往前推24小时
                        const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
                        
                        console.log(`\n📅 补偿 [${i + 1}/${missedDays.length}] ${missedDay.toLocaleDateString('zh-CN')}`);
                        console.log(`   时间范围: ${startTime.toLocaleString('zh-CN')} ~ ${endTime.toLocaleString('zh-CN')}`);
                        
                        this.writeLog('INFO', `补偿执行第 ${i + 1}/${missedDays.length} 天`, {
                            日期: missedDay.toLocaleDateString('zh-CN'),
                            开始时间: startTime.toISOString(),
                            结束时间: endTime.toISOString()
                        });
                        
                        try {
                            await this.executeDutyTask(
                                startTime.toISOString(),
                                endTime.toISOString()
                            );
                            console.log(`   ✅ 补偿完成`);
                        } catch (error) {
                            console.log(`   ❌ 补偿失败: ${error.message}`);
                            this.writeLog('ERROR', `补偿 ${missedDay.toLocaleDateString('zh-CN')} 失败`, {
                                错误: error.message
                            });
                        }
                        
                        // 每次补偿之间等待5秒，避免请求太快
                        if (i < missedDays.length - 1) {
                            console.log('   ⏳ 等待5秒...');
                            await new Promise(resolve => setTimeout(resolve, 5000));
                        }
                    }
                    
                    console.log('\n✅ 缺失数据补偿完成\n');
                } else {
                    console.log('✅ 数据完整，无需补偿\n');
                }
                
                // 4. 执行今天的任务
                console.log('📊 开始执行今日值守任务...');
                await this.executeDutyTask();
                
            } catch (error) {
                this.writeLog('ERROR', '定时任务执行异常', {
                    错误: error.message,
                    堆栈: error.stack
                });
                console.error('❌ 定时任务执行异常:', error.message);
            }
            
            this.writeLog('INFO', '==================== 定时任务结束 ====================');
            
        }, {
            timezone: "Asia/Shanghai"
        });

        this.writeLog('INFO', '定时任务已启动，将在每天8:00执行');
        console.log('⏰ 定时任务已启动，每天8:00自动执行（含缺失数据补偿）');
    }

    /**
     * 执行值守任务
     */
    async executeDutyTask(startTime = null, endTime = null) {
        if (this.isRunning) {
            this.writeLog('WARN', '上一次任务尚未完成，跳过本次执行');
            return;
        }

        this.isRunning = true;
        const taskStartTime = Date.now();

        try {
            const now = new Date();
            
            if (!endTime) {
                // 结束时间：今天8点
                const today8AM = new Date(now);
                today8AM.setHours(8, 0, 0, 0);
                endTime = today8AM.toISOString();
            }
            
            if (!startTime) {
                // 开始时间：昨天8点（往前推24小时）
                const today8AM = new Date(now);
                today8AM.setHours(8, 0, 0, 0);
                const yesterday8AM = new Date(today8AM.getTime() - 24 * 60 * 60 * 1000);
                startTime = yesterday8AM.toISOString();
            }

            this.writeLog('INFO', `开始查询数据: ${startTime} ~ ${endTime}`);
            console.log(`📅 查询时间范围: ${new Date(startTime).toLocaleString('zh-CN')} ~ ${new Date(endTime).toLocaleString('zh-CN')}`);

            // 1. 查询所有设备数据
            const queryResult = await this.queryAllDevices(startTime, endTime);
            
            this.writeLog('INFO', '数据查询完成', {
                总数: queryResult.total,
                成功: queryResult.successCount,
                失败: queryResult.failCount
            });
            
            // 2. 保存到数据库
            const saveResult = await this.saveToDatabase(queryResult.results);
            
            // 3. 记录完成日志
            const duration = ((Date.now() - taskStartTime) / 1000).toFixed(2);
            
            const summary = {
                状态: '成功',
                执行时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
                耗时: `${duration}秒`,
                查询统计: {
                    总设备数: queryResult.total,
                    查询成功: queryResult.successCount,
                    查询失败: queryResult.failCount
                },
                存储统计: {
                    插入记录数: saveResult.insertedCount
                }
            };
            
            this.writeLog('INFO', '任务执行完成', summary);
            console.log('✅ 任务执行完成，耗时:', duration, '秒');

            // 记录失败的设备
            if (queryResult.failCount > 0) {
                const failedDevices = queryResult.results
                    .filter(r => !r.success)
                    .map(r => ({
                        设备: r.label,
                        MID: r.mid,
                        IP: r.ip,
                        错误: r.error
                    }));
                
                this.writeLog('WARN', '查询失败的设备详情', failedDevices);
            }

            return {
                success: true,
                ...saveResult
            };

        } catch (error) {
            const errorInfo = {
                错误信息: error.message,
                错误堆栈: error.stack,
                失败时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
            };
            
            this.writeLog('ERROR', '任务执行失败', errorInfo);
            console.error('❌ 任务执行失败:', error.message);
            
            return {
                success: false,
                error: error.message
            };
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * 查询所有设备数据
     */
    async queryAllDevices(startTime, endTime) {
        const config = require('../www/MachineConfig.json');
        const options = config.options;
        
        const batchSize = 10;
        const results = [];
        const activeGrpcClients = []; 
        this.writeLog('INFO', `开始批量查询，设备总数: ${options.length}, 批次大小: ${batchSize}`);

        for (let i = 0; i < options.length; i += batchSize) {
            const batch = options.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(options.length / batchSize);
            
            const batchPromises = batch.map(option => {
                const uniqueTabId = `duty_${option.label}_${option.ip}_${option.port}`;
                
                if (option.ShowType === '2') {
                    return queryUtilization(option.ip, option.port, startTime, endTime, option.Mid,activeGrpcClients)
                        .then(result => ({
                            mid: option.Mid,
                            label: option.label,
                            ip: option.ip,
                            success: true,
                            data: result.data
                        }))
                        .catch(err => ({
                            mid: option.Mid,
                            label: option.label,
                            ip: option.ip,
                            success: false,
                            error: err.message || String(err)
                        }));
                } else {
                    return Gmain(uniqueTabId, option.ip, option.port, startTime, endTime, 'QueryEfficiency')
                        .then(data => ({
                            mid: option.Mid,
                            label: option.label,
                            ip: option.ip,
                            success: true,
                            data: data
                        }))
                        .catch(err => ({
                            mid: option.Mid,
                            label: option.label,
                            ip: option.ip,
                            success: false,
                            error: err.message || String(err)
                        }));
                }
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            this.writeLog('DEBUG', `批次 ${batchNumber}/${totalBatches} 完成`);
            console.log(`📦 批次 ${batchNumber}/${totalBatches} 完成`);
        }

        return {
            total: options.length,
            successCount: results.filter(r => r.success).length,
            failCount: results.filter(r => !r.success).length,
            results
        };
    }

    /**
     * 保存数据到数据库
     */
    async saveToDatabase(results) {
        const pool = db.getPool();
        const transaction = new db.sql.Transaction(pool);
        
        try {
            this.writeLog('INFO', '开始保存数据到数据库');
            
            await transaction.begin();
            
            const request = new db.sql.Request(transaction);
            
            const insertSql = `
                INSERT INTO TBL_Machine_daily_data 
                ([mid], [Value], [Time])
                VALUES 
                (@mid, @value, @time)
            `;

            let insertedCount = 0;
            
            const now = new Date();
            const timeStr = now.toLocaleString('zh-CN', { 
                timeZone: 'Asia/Shanghai',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).replace(/\//g, '-');
            
            for (const item of results) {
                if (item.success && item.mid) {
                    request.parameters = {};
                    
                    const valueToSave = JSON.stringify(item.data);
                    
                    request.input('mid', db.sql.NVarChar(50), String(item.mid));
                    request.input('value', db.sql.NVarChar(db.sql.MAX), valueToSave);
                    request.input('time', db.sql.NVarChar(200), timeStr);
                    
                    await request.query(insertSql);
                    insertedCount++;
                    
                    this.writeLog('DEBUG', `保存设备数据: mid=${item.mid}, label=${item.label}, time=${timeStr}`);
                }
            }

            await transaction.commit();
            
            this.writeLog('INFO', `数据保存成功，共插入 ${insertedCount} 条记录`);
            console.log(`💾 数据保存成功，共插入 ${insertedCount} 条记录`);
            
            return {
                insertedCount,
                totalResults: results.length,
                successDevices: results.filter(r => r.success).length,
                failedDevices: results.filter(r => !r.success).length
            };

        } catch (error) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error('回滚失败:', rollbackError.message);
            }
            
            this.writeLog('ERROR', '保存数据到数据库失败', {
                错误: error.message,
                堆栈: error.stack
            });
            console.error('💥 保存数据失败:', error.message);
            throw error;
        }
    }

    /**
     * 手动触发值守任务（可用于测试）
     */
    async manualExecute(startTime, endTime) {
        this.writeLog('INFO', '手动触发值守任务');
        return await this.executeDutyTask(startTime, endTime);
    }

    /**
     * 查询历史记录
     */
    async queryHistory(date = null) {
        try {
            let sqlString = 'SELECT * FROM TBL_Machine_daily_data';
            const params = {};
            
            if (date) {
                sqlString += ' WHERE CONVERT(date, [Time]) = @date';
                params.date = {
                    type: db.sql.Date,
                    value: date
                };
            }
            
            sqlString += ' ORDER BY ID DESC';
            
            const result = await db.query(sqlString, params);
            
            return {
                success: true,
                data: result,
                count: result.length
            };
        } catch (error) {
            this.writeLog('ERROR', '查询历史记录失败', { 错误: error.message });
            throw error;
        }
    }
}

// 导出单例
module.exports = new DailyDutyService();