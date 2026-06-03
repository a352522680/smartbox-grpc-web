const express = require('express');
const router = express.Router();
const db = require('../db/sqlserver');

// 关键：必须添加这两行
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.get('/getEnergyTarget2', async (req, res) => {
    try {
        const { 
            Year  // 年度：2025代表2025年4月-2026年3月
        } = req.query;
        
        if (!Year) {
            return res.status(400).json({
                success: false,
                message: '年份不能为空'
            });
        }
        
        const year = parseInt(Year);
        
        let sql = `
            SELECT 
                ID, 
                Year, 
                Month_Num, 
                Target_Value, 
                Actual_Value, 
                Type, 
                Building,
                CASE 
                    WHEN Month_Num = 1 THEN '1月'
                    WHEN Month_Num = 2 THEN '2月'
                    WHEN Month_Num = 3 THEN '3月'
                    WHEN Month_Num = 4 THEN '4月'
                    WHEN Month_Num = 5 THEN '5月'
                    WHEN Month_Num = 6 THEN '6月'
                    WHEN Month_Num = 7 THEN '7月'
                    WHEN Month_Num = 8 THEN '8月'
                    WHEN Month_Num = 9 THEN '9月'
                    WHEN Month_Num = 10 THEN '10月'
                    WHEN Month_Num = 11 THEN '11月'
                    WHEN Month_Num = 12 THEN '12月'
                END as Month_Name,
                CASE 
                    WHEN Actual_Value IS NOT NULL AND Target_Value > 0 
                    THEN ROUND((Actual_Value * 100.0 / Target_Value), 1)
                    ELSE NULL
                END as Completion_Rate,
                CASE 
                    WHEN Actual_Value IS NOT NULL AND Target_Value IS NOT NULL
                    THEN Actual_Value - Target_Value
                    ELSE NULL
                END as Deviation
            FROM TBL_EnergyTarget 
            WHERE (Year = @year AND Month_Num >= 4)
               OR (Year = @year + 1 AND Month_Num <= 3)
            ORDER BY 
                CASE 
                    WHEN Month_Num >= 4 THEN Month_Num 
                    ELSE Month_Num + 12 
                END ASC,
                Building ASC
        `;
        
        const result = await db.query(sql, { year: year });
        
        if (result.length > 0) {
            // 按财务月度顺序重组数据（4,5,6,7,8,9,10,11,12,1,2,3）
            const fiscalMonths = [4,5,6,7,8,9,10,11,12,1,2,3];
            const groupedData = {};
            
            // 按 Building 和 Type 分组
            result.forEach(item => {
                const key = `${item.Building}_${item.Type}`;
                if (!groupedData[key]) {
                    groupedData[key] = {
                        Building: item.Building,
                        Type: item.Type,
                        MonthlyData: {}
                    };
                }
                groupedData[key].MonthlyData[item.Month_Num] = {
                    Target_Value: item.Target_Value ?? 0,
                    Actual_Value: item.Actual_Value ?? null,
                    Completion_Rate: item.Completion_Rate,
                    Deviation: item.Deviation
                };
            });
            
            // 转换为数组格式，按财务月度顺序排列
            const list = Object.values(groupedData).map(group => {
                const monthlyArray = [];
                for (let i = 0; i < fiscalMonths.length; i++) {
                    const month = fiscalMonths[i];
                    monthlyArray.push({
                        Month_Num: month,
                        Month_Name: month === 1 ? '1月' : month === 2 ? '2月' : month === 3 ? '3月' : 
                                    month === 4 ? '4月' : month === 5 ? '5月' : month === 6 ? '6月' :
                                    month === 7 ? '7月' : month === 8 ? '8月' : month === 9 ? '9月' :
                                    month === 10 ? '10月' : month === 11 ? '11月' : '12月',
                        Target_Value: group.MonthlyData[month]?.Target_Value ?? 0,
                        Actual_Value: group.MonthlyData[month]?.Actual_Value ?? null,
                        Completion_Rate: group.MonthlyData[month]?.Completion_Rate ?? null,
                        Deviation: group.MonthlyData[month]?.Deviation ?? null
                    });
                }
                return {
                    Building: group.Building,
                    Type: group.Type,
                    MonthlyData: monthlyArray
                };
            });
            
            res.json({
                success: true,
                message: '查询成功',
                data: {
                    Fiscal_Year: year,
                    Fiscal_Year_Display: `${year}年4月-${year+1}年3月`,
                    Total_Months: 12,
                    Data: list
                }
            });
        } else {
            res.status(404).json({
                success: false,
                message: `未找到${year}年度的数据`
            });
        }
        
    } catch (error) {
        console.error('能源目标查询失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误，请稍后重试',
            error: error.message
        });
    }
});

// 查询能源目标数据（支持财务年度查询和多种月份查询）
router.get('/getEnergyTarget', async (req, res) => {
    try {
        const { 
            Year          // 自然年度：2025
        } = req.query;
        if (!Year) {
            return res.status(400).json({
                success: false,
                message: '年份不能为空'
            });
        }
        let sql = `
            SELECT 
                ID, 
                Year, 
                Month_Num, 
                Target_Value, 
                Actual_Value, 
                Type, 
                Building,
                CASE 
                    WHEN Month_Num = 1 THEN '1月'
                    WHEN Month_Num = 2 THEN '2月'
                    WHEN Month_Num = 3 THEN '3月'
                    WHEN Month_Num = 4 THEN '4月'
                    WHEN Month_Num = 5 THEN '5月'
                    WHEN Month_Num = 6 THEN '6月'
                    WHEN Month_Num = 7 THEN '7月'
                    WHEN Month_Num = 8 THEN '8月'
                    WHEN Month_Num = 9 THEN '9月'
                    WHEN Month_Num = 10 THEN '10月'
                    WHEN Month_Num = 11 THEN '11月'
                    WHEN Month_Num = 12 THEN '12月'
                END as Month_Name,
                CASE 
                    WHEN Month_Num >= 4 THEN CONCAT(Year, '-', Year + 1)
                    ELSE CONCAT(Year - 1, '-', Year)
                END as Fiscal_Year_Display,
                CASE 
                    WHEN Actual_Value IS NOT NULL AND Target_Value > 0 
                    THEN ROUND((Actual_Value * 100.0 / Target_Value), 1)
                    ELSE NULL
                END as Completion_Rate,
                CASE 
                    WHEN Actual_Value IS NOT NULL AND Target_Value IS NOT NULL
                    THEN Actual_Value - Target_Value
                    ELSE NULL
                END as Deviation
            FROM TBL_EnergyTarget 
            WHERE 1=1
        `;
        
        let params = {};
        
        // 按自然年度查询
        if (Year) {
            const year = parseInt(Year);
            sql += ` AND ((Year = @Year AND Month_Num >= 4) OR (Year = @NextYear AND Month_Num <= 3))`;
            params.Year = year;
            params.NextYear = year + 1;
        }
        
        sql += ` ORDER BY Year DESC, Month_Num ASC, Building`;
        
        const result = await db.query(sql, params);
        
        if (result.length > 0) {
            // 返回数组
            const list = result.map(item => ({
                ID: item.ID,
                Year: item.Year,
                Month_Num: item.Month_Num,
                Month_Name: item.Month_Name,
                Fiscal_Year_Display: item.Fiscal_Year_Display,
                Target_Value: item.Target_Value ?? 0,
                Actual_Value: item.Actual_Value ?? null,
                Completion_Rate: item.Completion_Rate,
                Deviation: item.Deviation,
                Type: item.Type,
                Building: item.Building
            }));
            
            // 统计汇总
            let totalTarget = 0;
            let totalActual = 0;
            let actualCount = 0;
            
            list.forEach(item => {
                totalTarget += item.Target_Value;
                if (item.Actual_Value !== null) {
                    totalActual += item.Actual_Value;
                    actualCount++;
                }
            });
            
            const summary = {
                total_target: totalTarget,
                total_actual: totalActual,
                avg_completion_rate: totalTarget > 0 ? (totalActual * 100.0 / totalTarget).toFixed(1) : 0,
                completed_months: list.filter(item => item.Actual_Value >= item.Target_Value).length,
                total_months: list.length,
                data_entered_months: actualCount,
                total_deviation: totalActual - totalTarget
            };
            
            // 查询条件说明
            const queryInfo = {
                year: Year || null
            };
            
            res.json({
                success: true,
                message: '查询成功',
                query: queryInfo,
                data: list,
                summary: summary,
                total: list.length
            });
            
        } else {
            res.status(404).json({
                success: false,
                message: '未找到符合条件的数据'
            });
        }
        
    } catch (error) {
        console.error('能源目标查询失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误，请稍后重试',
            error: error.message
        });
    }
});
// 获取某个月份的完整数据（自动补全缺失的组合）
router.get('/getMonthlyCompleteData', async (req, res) => {
    try {
        const { Year, Month_Num } = req.query;
        
        if (!Year || !Month_Num) {
            return res.status(400).json({
                success: false,
                message: '年份和月份不能为空'
            });
        }
        
               // 查询数据
        const sql = `
            SELECT *
            FROM TBL_EnergyTarget
            WHERE Year = @Year AND Month_Num = @Month_Num
        `;
        
        const result = await db.query(sql, {
            Year: parseInt(Year),
            Month_Num: parseInt(Month_Num)
        });
        // 返回的数据中已经包含 Building 和 Type 字段
        res.json({
            success: true,
            data: result
        });
        
    } catch (error) {
        console.error('获取月度数据失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: error.message
        });
    }
});

//3个月份的值
router.get('/getMonthlyCompleteDataThree', async (req, res) => {
    try {
        const { Year, Month_Num } = req.query;
        
        if (!Year || !Month_Num) {
            return res.status(400).json({
                success: false,
                message: '年份和月份不能为空'
            });
        }
        
        const year = parseInt(Year);
        const month = parseInt(Month_Num);
        
        // 计算三个月：当月、前月、前前月，处理跨年
        const months = [];
        for (let i = 0; i < 3; i++) {
            let m = month - i;
            let y = year;
            if (m <= 0) {
                m += 12;
                y -= 1;
            }
            months.push({ year: y, month: m });
        }
        
        // 构建查询条件
        const conditions = months.map((_, index) => 
            `(Year = @Year${index} AND Month_Num = @Month${index})`
        ).join(' OR ');
        
        const sql = `
            SELECT 
                Year,
                Month_Num,
                Type,
                SUM(Target_Value) AS Total_Target_Value
            FROM TBL_EnergyTarget
            WHERE ${conditions}
            GROUP BY Year, Month_Num, Type
            ORDER BY Year DESC, Month_Num DESC, Type
        `;
        // 构建参数
        const params = {};
        months.forEach((item, index) => {
            params[`Year${index}`] = item.year;
            params[`Month${index}`] = item.month;
        });
        
        const result = await db.query(sql, params);
        

        
        // 整理返回格式
        const data = result.map(row => ({
            year: row.Year,
            month: row.Month_Num,
            type: row.Type,           // E电 / W水 / G气
            typeName: row.Type === 'E' ? '电' : row.Type === 'W' ? '水' : '气',
            value: row.Total_Target_Value
        }));
        
        res.json({
            success: true,
            data: data,
            queryMonths: months
        });
        
    } catch (error) {
        console.error('获取月度数据失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: error.message
        });
    }
});

// 添加能源目标数据
router.post('/addEnergyTarget', async (req, res) => {
    try {
        const { Year, Month_Num, Target_Value, Type, Building, Actual_Value } = req.body;
        
        // 验证必填参数
        if (!Year) {
            return res.status(400).json({
                success: false,
                message: '年份不能为空'
            });
        }
        
        if (!Month_Num) {
            return res.status(400).json({
                success: false,
                message: '月份不能为空'
            });
        }
        
        if (Month_Num < 1 || Month_Num > 12) {
            return res.status(400).json({
                success: false,
                message: '月份必须在1-12之间'
            });
        }
        
        if (Target_Value === undefined || Target_Value === null) {
            return res.status(400).json({
                success: false,
                message: '目标值不能为空'
            });
        }
        
        if (!Type) {
            return res.status(400).json({
                success: false,
                message: '类型不能为空'
            });
        }
        
        if (!Building) {
            return res.status(400).json({
                success: false,
                message: '栋别不能为空（加工栋/组立栋）'
            });
        }
        
        if (Building !== '加工栋' && Building !== '组立栋') {
            return res.status(400).json({
                success: false,
                message: '栋别必须是加工栋或组立栋'
            });
        }
        
        // 检查是否已存在相同记录
        const checkSql = `
            SELECT COUNT(*) as count FROM TBL_EnergyTarget 
            WHERE Year = @Year AND Month_Num = @Month_Num AND Type = @Type AND Building = @Building
        `;
        const checkResult = await db.query(checkSql, { 
            Year: parseInt(Year), 
            Month_Num: parseInt(Month_Num), 
            Type: Type,
            Building: Building
        });
        
        if (checkResult[0].count > 0) {
            return res.status(409).json({
                success: false,
                message: '该年月份类型栋别的数据已存在，请使用更新接口'
            });
        }
        
        // 执行插入
        const insertSql = `
            INSERT INTO TBL_EnergyTarget (Year, Month_Num, Target_Value, Type, Building, Actual_Value)
            OUTPUT INSERTED.ID
            VALUES (@Year, @Month_Num, @Target_Value, @Type, @Building, @Actual_Value)
        `;
        
        const insertResult = await db.query(insertSql, {
            Year: parseInt(Year),
            Month_Num: parseInt(Month_Num),
            Target_Value: parseInt(Target_Value),
            Type: Type,
            Building: Building,
            Actual_Value: Actual_Value ? parseInt(Actual_Value) : null
        });
        
        const newId = insertResult[0]?.ID || insertResult.insertId;
        
        // 查询刚插入的数据
        const selectSql = `
            SELECT ID, Year, Month_Num, Target_Value, Actual_Value, Type, Building
            FROM TBL_EnergyTarget WHERE ID = @ID
        `;
        const newData = await db.query(selectSql, { ID: newId });
        
        res.json({
            success: true,
            message: '添加成功',
            data: {
                ID: newId,
                Year: newData[0].Year,
                Month_Num: newData[0].Month_Num,
                Month_Name: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'][newData[0].Month_Num - 1],
                Target_Value: newData[0].Target_Value,
                Actual_Value: newData[0].Actual_Value,
                Type: newData[0].Type,
                Building: newData[0].Building
            }
        });
        
    } catch (error) {
        console.error('能源目标添加失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误，请稍后重试',
            error: error.message
        });
    }
});

// 修改能源目标数据（存在则更新，不存在则新增）
router.post('/updateEnergyTarget', async (req, res) => {
    try {
        const { Year, Month_Num, Target_Value, Type, Building, Actual_Value } = req.body;
        
        // 验证必填参数
        if (!Year) {
            return res.status(400).json({
                success: false,
                message: '年份不能为空'
            });
        }
        
        if (!Month_Num) {
            return res.status(400).json({
                success: false,
                message: '月份不能为空'
            });
        }
        
        if (Month_Num < 1 || Month_Num > 12) {
            return res.status(400).json({
                success: false,
                message: '月份必须在1-12之间'
            });
        }
        
        if (Target_Value === undefined || Target_Value === null) {
            return res.status(400).json({
                success: false,
                message: '目标值不能为空'
            });
        }
        
        if (!Type) {
            return res.status(400).json({
                success: false,
                message: '类型不能为空'
            });
        }
        
        if (!Building) {
            return res.status(400).json({
                success: false,
                message: '栋别不能为空'
            });
        }
        
        if (Building !== '加工栋' && Building !== '组立栋') {
            return res.status(400).json({
                success: false,
                message: '栋别必须是加工栋或组立栋'
            });
        }
        
        const year = parseInt(Year);
        const monthNum = parseInt(Month_Num);
        const targetValue = parseInt(Target_Value);
        const actualValue = (Actual_Value !== undefined && Actual_Value !== null && Actual_Value !== '') ? parseInt(Actual_Value) : null;
        
        // 1. 检查记录是否存在
        const checkSql = `
            SELECT ID, Year, Month_Num, Target_Value, Actual_Value, Type, Building 
            FROM TBL_EnergyTarget 
            WHERE Year = @Year 
              AND Month_Num = @Month_Num 
              AND Type = @Type 
              AND Building = @Building
        `;
        
        const checkResult = await db.query(checkSql, {
            Year: year,
            Month_Num: monthNum,
            Type: Type,
            Building: Building
        });
        
        let resultData = null;
        let action = '';
        
        if (checkResult.length > 0) {
            // ========== 记录存在，只更新 Target_Value ==========
            action = '更新';
            
            const updateSql = `
                UPDATE TBL_EnergyTarget 
                SET Target_Value = @Target_Value
                WHERE Year = @Year 
                  AND Month_Num = @Month_Num 
                  AND Type = @Type 
                  AND Building = @Building
            `;
            
            await db.query(updateSql, {
                Year: year,
                Month_Num: monthNum,
                Type: Type,
                Building: Building,
                Target_Value: targetValue
            });
            
            // 查询更新后的数据
            const selectResult = await db.query(checkSql, {
                Year: year,
                Month_Num: monthNum,
                Type: Type,
                Building: Building
            });
            
            resultData = selectResult[0];
            
        } else {
            // ========== 记录不存在，执行新增 ==========
            action = '新增';
            
            const insertSql = `
                INSERT INTO TBL_EnergyTarget (Year, Month_Num, Target_Value, Type, Building, Actual_Value)
                OUTPUT INSERTED.ID
                VALUES (@Year, @Month_Num, @Target_Value, @Type, @Building, @Actual_Value)
            `;
            
            const insertResult = await db.query(insertSql, {
                Year: year,
                Month_Num: monthNum,
                Target_Value: targetValue,
                Type: Type,
                Building: Building,
                Actual_Value: actualValue
            });
            
            const newId = insertResult[0]?.ID || insertResult.insertId;
            
            resultData = {
                ID: newId,
                Year: year,
                Month_Num: monthNum,
                Target_Value: targetValue,
                Actual_Value: actualValue,
                Type: Type,
                Building: Building
            };
        }
        
        // 计算完成率
        let completionRate = null;
        if (resultData.Actual_Value !== null && resultData.Target_Value > 0) {
            completionRate = (resultData.Actual_Value * 100.0 / resultData.Target_Value).toFixed(1);
        }
        
        res.json({
            success: true,
            message: `${action}成功`,
            action: action,
            data: {
                ID: resultData.ID,
                Year: resultData.Year,
                Month_Num: resultData.Month_Num,
                Month_Name: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'][resultData.Month_Num - 1],
                Target_Value: resultData.Target_Value ?? 0,
                Actual_Value: resultData.Actual_Value ?? null,
                Completion_Rate: completionRate,
                Type: resultData.Type,
                Building: resultData.Building
            }
        });
        
    } catch (error) {
        console.error('能源目标更新失败:', error);
        
        if (error.number === 2627) {
            return res.status(409).json({
                success: false,
                message: '数据已存在，请刷新页面后重试'
            });
        }
        
        res.status(500).json({
            success: false,
            message: '服务器错误，请稍后重试',
            error: error.message
        });
    }
});

// 删除能源目标数据
router.post('/deleteEnergyTarget', async (req, res) => {
    try {
        const { ID } = req.body;
        
        if (!ID) {
            return res.status(400).json({
                success: false,
                message: 'ID不能为空'
            });
        }
        
        // 1. 先检查记录是否存在
        const checkSql = `SELECT COUNT(*) as count FROM TBL_EnergyTarget WHERE ID = @ID`;
        const checkResult = await db.query(checkSql, { ID: parseInt(ID) });
        
        if (checkResult[0].count === 0) {
            return res.status(404).json({
                success: false,
                message: '记录不存在，无法删除'
            });
        }
        
        // 2. 执行删除
        const deleteSql = `DELETE FROM TBL_EnergyTarget WHERE ID = @ID`;
        await db.query(deleteSql, { ID: parseInt(ID) });
        
        res.json({
            success: true,
            message: '删除成功'
        });
        
    } catch (error) {
        console.error('能源目标删除失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误，请稍后重试',
            error: error.message
        });
    }
});

// 批量保存月度目标
router.post('/batchSaveEnergyTarget', async (req, res) => {
    try {
        const { Year, Type, Building, MonthlyTargets } = req.body;
        
        if (!Year || !Type || !Building || !MonthlyTargets || !Array.isArray(MonthlyTargets) || MonthlyTargets.length === 0) {
            return res.status(400).json({
                success: false,
                message: '参数不完整：需要年份、类型、栋别和月度数据数组'
            });
        }
        
        if (Building !== '加工栋' && Building !== '组立栋') {
            return res.status(400).json({
                success: false,
                message: '栋别必须是加工栋或组立栋'
            });
        }
        
        const year = parseInt(Year);
        const results = [];
        let successCount = 0;
        let failCount = 0;
        
        // 逐条处理，不使用事务
        for (const item of MonthlyTargets) {
            const { Month_Num, Target_Value, Actual_Value } = item;
            
            if (!Month_Num || Target_Value === undefined || Target_Value === null) {
                results.push({
                    Month_Num: Month_Num,
                    success: false,
                    message: '月份或目标值缺失'
                });
                failCount++;
                continue;
            }
            
            if (Month_Num < 1 || Month_Num > 12) {
                results.push({
                    Month_Num: Month_Num,
                    success: false,
                    message: '月份必须在1-12之间'
                });
                failCount++;
                continue;
            }
            
            try {
                // 先检查记录是否存在
                const checkSql = `
                    SELECT COUNT(*) as count 
                    FROM TBL_EnergyTarget 
                    WHERE Year = @Year 
                      AND Month_Num = @Month_Num 
                      AND Type = @Type 
                      AND Building = @Building
                `;
                
                const checkResult = await db.query(checkSql, {
                    Year: year,
                    Month_Num: parseInt(Month_Num),
                    Type: Type,
                    Building: Building
                });
                
                if (checkResult[0].count > 0) {
                    // 记录存在，执行更新
                    const updateSql = `
                        UPDATE TBL_EnergyTarget 
                        SET Target_Value = @Target_Value,
                            Actual_Value = CASE 
                                WHEN @Actual_Value IS NOT NULL THEN @Actual_Value 
                                ELSE Actual_Value 
                            END
                        WHERE Year = @Year 
                          AND Month_Num = @Month_Num 
                          AND Type = @Type 
                          AND Building = @Building
                    `;
                    
                    await db.query(updateSql, {
                        Year: year,
                        Month_Num: parseInt(Month_Num),
                        Type: Type,
                        Building: Building,
                        Target_Value: parseInt(Target_Value),
                        Actual_Value: Actual_Value ? parseInt(Actual_Value) : null
                    });
                    
                    results.push({
                        Month_Num: Month_Num,
                        success: true,
                        message: '更新成功'
                    });
                } else {
                    // 记录不存在，执行插入
                    const insertSql = `
                        INSERT INTO TBL_EnergyTarget (Year, Month_Num, Target_Value, Type, Building, Actual_Value)
                        VALUES (@Year, @Month_Num, @Target_Value, @Type, @Building, @Actual_Value)
                    `;
                    
                    await db.query(insertSql, {
                        Year: year,
                        Month_Num: parseInt(Month_Num),
                        Type: Type,
                        Building: Building,
                        Target_Value: parseInt(Target_Value),
                        Actual_Value: Actual_Value ? parseInt(Actual_Value) : null
                    });
                    
                    results.push({
                        Month_Num: Month_Num,
                        success: true,
                        message: '新增成功'
                    });
                }
                
                successCount++;
                
            } catch (error) {
                results.push({
                    Month_Num: Month_Num,
                    success: false,
                    message: error.message
                });
                failCount++;
            }
        }
        
        res.json({
            success: true,
            message: `批量保存完成，成功${successCount}条，失败${failCount}条`,
            data: {
                Year: year,
                Type: Type,
                Building: Building,
                Total: MonthlyTargets.length,
                SuccessCount: successCount,
                FailCount: failCount,
                Results: results
            }
        });
        
    } catch (error) {
        console.error('批量保存失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误，请稍后重试',
            error: error.message
        });
    }
});

// 获取年度汇总统计
router.get('/getYearlySummary', async (req, res) => {
    try {
        const { Year, Type, Building } = req.query;
        
        if (!Year) {
            return res.status(400).json({
                success: false,
                message: '年份不能为空'
            });
        }
        
        const year = parseInt(Year);
        
        let sql = `
            SELECT 
                Type,
                Building,
                COUNT(*) as Total_Months,
                SUM(Target_Value) as Total_Target,
                SUM(Actual_Value) as Total_Actual,
                AVG(CASE WHEN Actual_Value IS NOT NULL AND Target_Value > 0 
                    THEN (Actual_Value * 100.0 / Target_Value) ELSE NULL END) as Avg_Completion_Rate,
                SUM(CASE WHEN Actual_Value >= Target_Value THEN 1 ELSE 0 END) as Completed_Months,
                SUM(CASE WHEN Actual_Value IS NULL THEN 1 ELSE 0 END) as Pending_Months
            FROM TBL_EnergyTarget
            WHERE Year = @Year
        `;
        
        let params = { Year: year };
        
        if (Type) {
            sql += ` AND Type = @Type`;
            params.Type = Type;
        }
        
        if (Building) {
            sql += ` AND Building = @Building`;
            params.Building = Building;
        }
        
        sql += ` GROUP BY Type, Building ORDER BY Type, Building`;
        
        const result = await db.query(sql, params);
        
        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: `未找到${year}年的数据`
            });
        }
        
        res.json({
            success: true,
            message: '查询成功',
            data: result.map(item => ({
                type: item.Type,
                building: item.Building,
                total_months: item.Total_Months,
                total_target: item.Total_Target,
                total_actual: item.Total_Actual,
                avg_completion_rate: item.Avg_Completion_Rate ? item.Avg_Completion_Rate.toFixed(1) : 0,
                completed_months: item.Completed_Months,
                pending_months: item.Pending_Months,
                completion_status: item.Total_Actual >= item.Total_Target ? '达标' : '未达标'
            }))
        });
        
    } catch (error) {
        console.error('年度汇总查询失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误，请稍后重试',
            error: error.message
        });
    }
});
//年度目标值
router.get('/getAnnualTarget', async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const startYear = 2018;
        const endYear = currentYear;  // 当前年-1
        
        let sql = `
            SELECT 
                CASE 
                    WHEN Month_Num >= 4 THEN Year 
                    ELSE Year - 1 
                END as Fiscal_Year,
                Type,
                SUM(Target_Value) as Annual_Target
            FROM TBL_EnergyTarget 
            WHERE 1=1
        `;
        
        let params = {};
        
        // 筛选年度范围（通过自然年计算财年）
        sql += ` AND (
            (Month_Num >= 4 AND Year BETWEEN @StartYear AND @EndYear)
            OR 
            (Month_Num <= 3 AND Year BETWEEN @StartYearPlus1 AND @EndYearPlus1)
        )`;
        params.StartYear = startYear;
        params.EndYear = endYear;
        params.StartYearPlus1 = startYear + 1;
        params.EndYearPlus1 = endYear + 1;
        
        // Type 都要：E、W、G
        sql += ` AND Type IN ('E', 'W', 'G')`;
        
        // Building 算2个的和：加工栋 + 组立栋
        sql += ` AND Building IN (N'加工栋', N'组立栋')`;
        
        sql += ` GROUP BY 
            CASE 
                WHEN Month_Num >= 4 THEN Year 
                ELSE Year - 1 
            END,
            Type
        `;
        
        sql += ` HAVING 
            CASE 
                WHEN Month_Num >= 4 THEN Year 
                ELSE Year - 1 
            END BETWEEN @StartYear AND @EndYear
        `;
        
        sql += ` ORDER BY Fiscal_Year DESC, Type`;
        
        const result = await db.query(sql, params);
        
        // 生成所有财年范围（确保缺失的年度也有数据）
        const fiscalYearMap = new Map();
        for (let year = startYear; year <= endYear; year++) {
            fiscalYearMap.set(year, {
                fiscal_year: year,
                fiscal_year_display: `${year}-${year + 1}`,
                electricity_target: 0,  // 电 (E) 默认0
                water_target: 0,        // 水 (W) 默认0
                gas_target: 0,          // 气 (G) 默认0
                total_target: 0
            });
        }
        
        // 用查询结果更新默认值
        result.forEach(item => {
            const year = item.Fiscal_Year;
            if (fiscalYearMap.has(year)) {
                const yearData = fiscalYearMap.get(year);
                
                // 按类型填充目标值
                if (item.Type === 'E') {
                    yearData.electricity_target = item.Annual_Target || 0;
                } else if (item.Type === 'W') {
                    yearData.water_target = item.Annual_Target || 0;
                } else if (item.Type === 'G') {
                    yearData.gas_target = item.Annual_Target || 0;
                }
                
                yearData.total_target = yearData.electricity_target + yearData.water_target + yearData.gas_target;
            }
        });
        
        // 转换为数组并按财年降序排列
        const annualData = Array.from(fiscalYearMap.values())
            .sort((a, b) => b.fiscal_year - a.fiscal_year);
        
        // 计算总计
        const totalSummary = {
            total_electricity: annualData.reduce((sum, item) => sum + item.electricity_target, 0),
            total_water: annualData.reduce((sum, item) => sum + item.water_target, 0),
            total_gas: annualData.reduce((sum, item) => sum + item.gas_target, 0),
            total_all: annualData.reduce((sum, item) => sum + item.total_target, 0)
        };
        
        res.json({
            success: true,
            message: '年度目标查询成功',
            query: {
                start_year: startYear,
                end_year: endYear,
                year_range: `财年${startYear}-${startYear+1} 到 ${endYear}-${endYear+1}`,
                type: '电(E)、水(W)、气(G)',
                building: '加工栋 + 组立栋'
            },
            data: annualData,
            summary: totalSummary,
            total: annualData.length
        });
        
    } catch (error) {
        console.error('年度目标查询失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误，请稍后重试',
            error: error.message
        });
    }
});
module.exports = router;