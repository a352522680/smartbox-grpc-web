const sql = require('mssql');

// 数据库配置
const dbConfig = {
    user: 'sa',                          // 数据库用户名
    password: '875213smt',            // 数据库密码
    server: '127.0.0.1',             // SQL Server 地址
    port: 1433,                          // 端口号
    database: 'SMT_Alarm',           // 数据库名称
    pool: {
        max: 10,                         // 连接池最大连接数
        min: 0,                          // 最小连接数
        idleTimeoutMillis: 30000         // 空闲连接超时时间
    },
    options: {
        encrypt: false,                  // 是否加密
        trustServerCertificate: true     // 信任服务器证书
    }
};

let pool = null;

// 初始化数据库连接
async function initDB() {
    try {
        pool = await sql.connect(dbConfig);
        console.log('SQL Server 数据库连接成功');
        console.log('数据库:', dbConfig.database);
        return pool;
    } catch (err) {
        console.error('SQL Server 数据库连接失败:', err);
        throw err;
    }
}

// 获取连接池
function getPool() {
    if (!pool) {
        throw new Error('数据库未初始化，请先调用 initDB()');
    }
    return pool;
}

// 通用查询方法 - 返回记录集
async function query(sqlString, params = {}) {
    try {
        const request = getPool().request();
        
        // 添加参数
        Object.keys(params).forEach(key => {
            request.input(key, params[key]);
        });
        
        const result = await request.query(sqlString);
        return result.recordset;  // 返回记录集
    } catch (err) {
        console.error('查询失败:', err);
        throw err;
    }
}

// 执行单条SQL（不返回结果集）
async function execute(sqlString, params = {}) {
    try {
        const request = getPool().request();
        
        Object.keys(params).forEach(key => {
            request.input(key, params[key]);
        });
        
        const result = await request.query(sqlString);
        return result;  // 返回完整结果对象
    } catch (err) {
        console.error('执行失败:', err);
        throw err;
    }
}

// 执行存储过程
async function executeProcedure(procedureName, params = {}) {
    try {
        const request = getPool().request();
        
        Object.keys(params).forEach(key => {
            request.input(key, params[key]);
        });
        
        const result = await request.execute(procedureName);
        return result.recordset;
    } catch (err) {
        console.error('存储过程执行失败:', err);
        throw err;
    }
}

// 关闭数据库连接
async function closeDB() {
    try {
        if (pool) {
            await pool.close();
            console.log('数据库连接已关闭');
        }
    } catch (err) {
        console.error('关闭数据库连接失败:', err);
    }
}

module.exports = {
    initDB,
    getPool,
    query,
    execute,
    executeProcedure,
    closeDB,
    sql
};