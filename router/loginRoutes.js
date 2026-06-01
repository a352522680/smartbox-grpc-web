const express = require('express');
const router = express.Router();
const db = require('../db/sqlserver');

// 登录验证接口
router.post('/login', async (req, res) => {
    try {
        const { UserID, PassWord } = req.body;
        
        // 验证参数
        if (!UserID || !PassWord) {
            return res.status(400).json({
                success: false,
                message: '用户名和密码不能为空'
            });
        }
        
        // 查询用户
        const sql = `
            SELECT * FROM Master_User 
            WHERE UserID = @UserID AND PassWord = @PassWord
        `;
        
        const result = await db.query(sql, { 
            UserID: UserID, 
            PassWord: PassWord 
        });
        
        // 判断是否查到数据
        if (result.length > 0) {
            // 查到数据 - 登录成功
            res.json({
                success: true,
                message: '登录成功',
                data: {
                    UserID: result[0].UserID,
                    // 可以根据需要返回其他字段，但建议不要返回密码
                    // UserName: result[0].UserName,
                    // Role: result[0].Role
                }
            });
        } else {
            // 没查到数据 - 登录失败
            res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }
        
    } catch (error) {
        console.error('登录查询失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误，请稍后重试',
            error: error.message
        });
    }
});

// 简化版 - 只返回是否查到
router.get('/checkUser', async (req, res) => {
    try {
        const { UserID, PassWord } = req.query;
        
        if (!UserID || !PassWord) {
            return res.status(400).json({
                success: false,
                message: '参数不完整'
            });
        }
        
        const sql = `
            SELECT COUNT(*) as count FROM Master_User 
            WHERE UserID = @UserID AND PassWord = @PassWord
        `;
        
        const result = await db.query(sql, { 
            UserID: UserID, 
            PassWord: PassWord 
        });
        
        const exists = result[0].count > 0;
        
        res.json({
            success: exists,
            message: exists ? '用户验证通过' : '用户名或密码错误',
            found: exists  // 直接返回有没有查到
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '查询失败',
            found: false
        });
    }
});

module.exports = router;