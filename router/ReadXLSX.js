const express = require('express');
const XLSX = require('xlsx');
const path = require('path');
const router = express.Router();

// 通用读取函数
function readExcelData(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: 0 });

    // 构建行映射
    const rowMap = {};
    for (let i = 1; i < data.length; i++) {
        const label = data[i]?.[0]?.toString().trim();
        if (label) {
            rowMap[label] = data[i].slice(1, 13).map(v => Number(v) || 0);
        }
    }
    return rowMap;
}

// 获取2018年实际数据
router.get('/actual-2018', (req, res) => {
    try {
        const filePath = path.join(__dirname, '../data/2018年实测.xlsx');
        const rowMap = readExcelData(filePath);

        res.json({
            success: true,
            year: 2018,
            dataType: '实际数据',
            data: {
                加工栋电12个月实际: rowMap['加工栋电12个月实际'] || [],
                组立栋电12个月实际: rowMap['组立栋电12个月实际'] || [],
                加工栋水12个月实际: rowMap['加工栋水12个月实际'] || [],
                组立栋水12个月实际: rowMap['组立栋水12个月实际'] || [],
                加工栋气12个月实际: rowMap['加工栋气12个月实际'] || [],
                组立栋气12个月实际: rowMap['组立栋气12个月实际'] || []
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '读取实际数据失败', message: error.message });
    }
});

// 获取2026年目标数据
router.get('/target-2026', (req, res) => {
    try {
        const filePath = path.join(__dirname, '../data/2026年目标.xlsx');
        const rowMap = readExcelData(filePath);

        res.json({
            success: true,
            year: 2026,
            dataType: '目标数据',
            data: {
                加工栋电12个月目标: rowMap['加工栋电12个月目标'] || [],
                组立栋电12个月目标: rowMap['组立栋电12个月目标'] || [],
                加工栋水12个月目标: rowMap['加工栋水12个月目标'] || [],
                组立栋水12个月目标: rowMap['组立栋水12个月目标'] || [],
                加工栋气12个月目标: rowMap['加工栋气12个月目标'] || [],
                组立栋气12个月目标: rowMap['组立栋气12个月目标'] || []
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '读取目标数据失败', message: error.message });
    }
});
// 获取2025年目标数据
router.get('/target-2025', (req, res) => {
    try {
        const filePath = path.join(__dirname, '../data/2025年目标.xlsx');
        const rowMap = readExcelData(filePath);

        // 获取各项目标数组（默认空数组）
        const electricProcessing = rowMap['加工栋电12个月目标'] || [];
        const electricAssembly = rowMap['组立栋电12个月目标'] || [];
        const waterProcessing = rowMap['加工栋水12个月目标'] || [];
        const waterAssembly = rowMap['组立栋水12个月目标'] || [];
        const gasProcessing = rowMap['加工栋气12个月目标'] || [];
        const gasAssembly = rowMap['组立栋气12个月目标'] || [];

        // 汇总计算（按你的计算方式）
        let totalElectricTarget = 0;
        let totalWaterTarget = 0;
        let totalGasTarget = 0;

        for (let i = 0; i < 12; i++) {
            totalElectricTarget += (electricProcessing[i] || 0) + (electricAssembly[i] || 0);
            totalWaterTarget += (waterProcessing[i] || 0) + (waterAssembly[i] || 0);
            totalGasTarget += (gasProcessing[i] || 0) + (gasAssembly[i] || 0);
        }

        res.json({
            success: true,
            year: 2025,
            dataType: '目标数据',
            summary: {
                totalElectricTarget,   // 电全年总目标
                totalWaterTarget,      // 水全年总目标
                totalGasTarget         // 气全年总目标
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '读取目标数据失败', message: error.message });
    }
});

module.exports = router;