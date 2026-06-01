const express = require('express');
const router = express.Router();
const db = require('../db/sqlserver');
// 关键：必须添加这两行
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
// 查询设备位置
router.get('/getMachinePosition', async (req, res) => {
    try {
        const { M_ID } = req.query;
        let sql = '';        
        let params = {}; 
        
        if (M_ID) {
            sql = `
                SELECT M_ID, M_Name, PositionX, PositionY 
                FROM TBL_Machine 
                WHERE M_ID = @M_ID
            `;
            params = { M_ID: M_ID };
        } else {
            sql = `
                SELECT M_ID, M_Name, PositionX, PositionY 
                FROM TBL_Machine
            `;
        }
        sql+= ' ORDER BY CAST(M_ID AS INT);';
        const result = await db.query(sql, params);
        
        if (result.length > 0) {
            if (M_ID) {
                // 传了M_ID，返回单个对象
                res.json({
                    success: true,
                    message: '查询成功',
                    data: {
                        M_ID: result[0].M_ID,
                        M_Name: result[0].M_Name,
                        PositionX: result[0].PositionX ?? 0,
                        PositionY: result[0].PositionY ?? 0
                    }
                });
            } else {
                // 没传M_ID，返回数组
                const list = result.map(item => ({
                    M_ID: item.M_ID,
                    M_Name: item.M_Name,
                    PositionX: item.PositionX ?? 0,
                    PositionY: item.PositionY ?? 0
                }));
                res.json({
                    success: true,
                    message: '查询成功',
                    data: list
                });
            }
        } else {
            res.status(404).json({
                success: false,
                message: M_ID ? '未找到该设备' : '暂无设备数据'
            });
        }
        
    } catch (error) {
        console.error('设备位置查询失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误，请稍后重试',
            error: error.message
        });
    }
});

// 修改设备位置
router.post('/updateMachinePosition', async (req, res) => {
    try {
        const { M_ID, PositionX, PositionY } = req.body;
        
        // 验证参数...
        if (!M_ID) {
            return res.status(400).json({
                success: false,
                message: '设备ID不能为空'
            });
        }
        
        if (PositionX === undefined || PositionX === null || 
            PositionY === undefined || PositionY === null) {
            return res.status(400).json({
                success: false,
                message: '坐标参数不完整'
            });
        }
        
        // 1. 先检查设备是否存在
        const checkSql = `SELECT COUNT(*) as count FROM TBL_Machine WHERE M_ID = @M_ID`;
        const checkResult = await db.query(checkSql, { M_ID: M_ID });
        
        if (checkResult[0].count === 0) {
            return res.status(404).json({
                success: false,
                message: '设备不存在，无法更新'
            });
        }
        
        // 2. 执行更新
        const updateSql = `UPDATE TBL_Machine SET PositionX = @PositionX, PositionY = @PositionY WHERE M_ID = @M_ID`;
        const updateResult = await db.query(updateSql, { 
            M_ID: M_ID, 
            PositionX: PositionX, 
            PositionY: PositionY 
        });
        
        // 3. 检查更新影响的行数
        //console.log('更新影响行数:', updateResult.rowsAffected || updateResult.affectedRows);
        
        // 4. 重新查询更新后的数据（使用相同的连接或确保事务已提交）
        const selectSql = `SELECT M_ID, M_Name, PositionX, PositionY FROM TBL_Machine WHERE M_ID = @M_ID`;
        const updatedResult = await db.query(selectSql, { M_ID: M_ID });
        
        // 5. 添加安全检查
        if (!updatedResult || updatedResult.length === 0 || !updatedResult[0]) {
            // 如果查询不到，但更新成功了，至少返回基本信息
            return res.json({
                success: true,
                message: '位置更新成功',
                data: {
                    M_ID: M_ID,
                    M_Name: '未知',  // 或者从之前的查询获取
                    PositionX: PositionX,
                    PositionY: PositionY
                }
            });
        }
        
        res.json({
            success: true,
            message: '位置更新成功',
            data: {
                M_ID: updatedResult[0].M_ID,
                M_Name: updatedResult[0].M_Name,
                PositionX: updatedResult[0].PositionX ?? PositionX,
                PositionY: updatedResult[0].PositionY ?? PositionY
            }
        });
        
    } catch (error) {
        console.error('设备位置更新失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误，请稍后重试',
            error: error.message
        });
    }
});
module.exports = router;