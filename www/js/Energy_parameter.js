// Energy_parameter.js
// ========== 数据存储变量 ==========
var Year18 = []; // 18年的电水气总量
var LastYear = [0, 0, 0]; // 去年的电水气目标（2025年）

// ========== 实际数据（2018年） ==========
var JGD_D18 = []; // 18年加工栋电12个月实际
var DLD_D18 = []; // 18年组立栋电12个月实际
var JGD_S18 = []; // 18年加工栋水12个月实际
var DLD_S18 = []; // 18年组立栋水12个月实际
var JGD_Q18 = []; // 18年加工栋气12个月实际
var DLD_Q18 = []; // 18年组立栋气12个月实际

// ========== 目标数据（2026年） ==========
var JGD_D = []; // 加工栋电12个月目标
var DLD_D = []; // 组立栋电12个月目标
var JGD_S = []; // 加工栋水12个月目标
var DLD_S = []; // 组立栋水12个月目标
var JGD_Q = []; // 加工栋气12个月目标
var DLD_Q = []; // 组立栋气12个月目标

// ========== 获取目标数据 ==========
var YearD_Target=[];//年度电目标
var YearS_Target=[];//年度水目标
var YearQ_Target=[];//年度气目标

// ========== 月度目标变量 ==========
var JGD_D_Monthly = 0;  // 加工栋电
var JGD_S_Monthly = 0;  // 加工栋水
var JGD_Q_Monthly = 0;  // 加工栋气
var DLD_D_Monthly = 0;  // 组立栋电
var DLD_S_Monthly = 0;  // 组立栋水
var DLD_Q_Monthly = 0;  // 组立栋气

// ========== 近3月数据 ==========
var LastMonthD = [];
var LastMonthS = [];
var LastMonthQ = [];
var LastMonthD_Target = [];
var LastMonthS_Target = [];
var LastMonthQ_Target = [];

// ========== 年度总量 ==========
var YearCurrently = [];

// ========== 辅助函数 ==========
// 财务年度月份索引转换
function getFiscalMonthIndex(realMonth) {
    if (realMonth >= 4) {
        return realMonth - 4; // 4月->0, 5月->1, ..., 12月->8
    } else {
        return realMonth + 8; // 1月->9, 2月->10, 3月->11
    }
}

// 获取近3个财务月份
function getLast3FiscalMonths(currentRealMonth, currentRealYear) {
    let fiscalMonths = [];
    let tempYear = currentRealYear;
    let tempMonth = currentRealMonth;
    
    for (let i = 0; i < 3; i++) {
        let fiscalIndex = getFiscalMonthIndex(tempMonth);
        
        let fiscalYear;
        if (tempMonth >= 4) {
            fiscalYear = tempYear;
        } else {
            fiscalYear = tempYear - 1;
        }
        
        fiscalMonths.push({
            realYear: tempYear,
            realMonth: tempMonth,
            fiscalYear: fiscalYear,
            fiscalIndex: fiscalIndex
        });
        
        tempMonth--;
        if (tempMonth < 1) {
            tempMonth = 12;
            tempYear--;
        }
    }
    
    return fiscalMonths;
}

// 获取实际值
function getActualValue(year, realMonth, type) {
    let fiscalIndex;
    if (realMonth >= 4) {
        fiscalIndex = realMonth - 4;
    } else {
        fiscalIndex = realMonth + 8;
    }
    
    if (type === 'E') {
        return (JGD_D18[fiscalIndex] || 0) + (DLD_D18[fiscalIndex] || 0);
    } else if (type === 'W') {
        return (JGD_S18[fiscalIndex] || 0) + (DLD_S18[fiscalIndex] || 0);
    } else if (type === 'G') {
        return (JGD_Q18[fiscalIndex] || 0) + (DLD_Q18[fiscalIndex] || 0);
    }
    return 0;
}

// 获取目标值
function getTargetValue(year, realMonth, type) {
    let fiscalIndex;
    if (realMonth >= 4) {
        fiscalIndex = realMonth - 4;
    } else {
        fiscalIndex = realMonth + 8;
    }
    
    if (type === 'E') {
        return (JGD_D[fiscalIndex] || 0) + (DLD_D[fiscalIndex] || 0);
    } else if (type === 'W') {
        return (JGD_S[fiscalIndex] || 0) + (DLD_S[fiscalIndex] || 0);
    } else if (type === 'G') {
        return (JGD_Q[fiscalIndex] || 0) + (DLD_Q[fiscalIndex] || 0);
    }
    return 0;
}

// ========== 数据刷新函数 ==========
function refreshEnergyParameterData() {
    console.log("开始刷新月度参数数据...", new Date().toLocaleString());
    
    const now = new Date();
    const currentRealYear = now.getFullYear();
    const currentRealMonth = now.getMonth() + 1; // 1-12
    
    // ========== 获取2018年实际数据 ==========
    $.ajax({
        url: "/EnergyTarget/getEnergyTarget2",   
        type: "get",           
        dataType: "json",   
        async: false,
        data: {
            Year: 2018
        },
        success: function (response) {
            if (response.success && response.data) {
                JGD_D18 = new Array(12).fill(0);
                DLD_D18 = new Array(12).fill(0);
                JGD_S18 = new Array(12).fill(0);
                DLD_S18 = new Array(12).fill(0);
                JGD_Q18 = new Array(12).fill(0);
                DLD_Q18 = new Array(12).fill(0);
                
                const dataList = response.data.Data || [];
                
                dataList.forEach(group => {
                    const building = group.Building;
                    const type = group.Type;
                    const monthlyData = group.MonthlyData || [];
                    
                    monthlyData.forEach(month => {
                        const monthNum = month.Month_Num;
                        const actualValue = month.Actual_Value || 0;
                        
                        let fiscalIndex;
                        if (monthNum >= 4) {
                            fiscalIndex = monthNum - 4;
                        } else {
                            fiscalIndex = monthNum + 8;
                        }
                        
                        if (building === '加工栋') {
                            if (type === 'E') {
                                JGD_D18[fiscalIndex] = actualValue;
                            } else if (type === 'W') {
                                JGD_S18[fiscalIndex] = actualValue;
                            } else if (type === 'G') {
                                JGD_Q18[fiscalIndex] = actualValue;
                            }
                        } else if (building === '组立栋') {
                            if (type === 'E') {
                                DLD_D18[fiscalIndex] = actualValue;
                            } else if (type === 'W') {
                                DLD_S18[fiscalIndex] = actualValue;
                            } else if (type === 'G') {
                                DLD_Q18[fiscalIndex] = actualValue;
                            }
                        }
                    });
                });
                console.log("2018年实际数据加载完成");
            }
        },
        error: function (err) { 
            console.log("获取2018年实际数据错误:", err);
        }
    });
    
    // ========== 获取年目标数据（当年） ==========
    $.ajax({
        url: "/EnergyTarget/getEnergyTarget2",   
        type: "get",           
        dataType: "json",      
        async: false,
        data: {
            Year: currentRealYear
        },
        success: function (response) {
            if (response.success && response.data) {
                JGD_D = new Array(12).fill(0);
                DLD_D = new Array(12).fill(0);
                JGD_S = new Array(12).fill(0);
                DLD_S = new Array(12).fill(0);
                JGD_Q = new Array(12).fill(0);
                DLD_Q = new Array(12).fill(0);
                
                const dataList = response.data.Data || [];
                
                dataList.forEach(group => {
                    const building = group.Building;
                    const type = group.Type;
                    const monthlyData = group.MonthlyData || [];
                    
                    monthlyData.forEach(month => {
                        const monthNum = month.Month_Num;
                        const targetValue = month.Target_Value || 0;
                        
                        let fiscalIndex;
                        if (monthNum >= 4) {
                            fiscalIndex = monthNum - 4;
                        } else {
                            fiscalIndex = monthNum + 8;
                        }
                        
                        if (building === '加工栋') {
                            if (type === 'E') JGD_D[fiscalIndex] = targetValue;
                            else if (type === 'W') JGD_S[fiscalIndex] = targetValue;
                            else if (type === 'G') JGD_Q[fiscalIndex] = targetValue;
                        } else if (building === '组立栋') {
                            if (type === 'E') DLD_D[fiscalIndex] = targetValue;
                            else if (type === 'W') DLD_S[fiscalIndex] = targetValue;
                            else if (type === 'G') DLD_Q[fiscalIndex] = targetValue;
                        }
                    });
                });
                console.log("当年目标数据加载完成");
            }
        },
        error: function (err) { 
            console.log("获取目标数据错误:", err);
        }
    });
    
    // ========== 获取年度目标数据 ==========
    $.ajax({
        url: "/EnergyTarget/getAnnualTarget",   
        type: "get",           
        dataType: "json",      
        async: false,
        success: function (response) {
            if (response.success && response.data) {
                YearD_Target = [];
                YearS_Target = [];
                YearQ_Target = [];
                
                var sortedData = response.data.sort(function(a, b) {
                    return a.fiscal_year - b.fiscal_year;
                });
                
                sortedData.forEach(function(item) {
                    YearD_Target.push(item.electricity_target);
                    YearS_Target.push(item.water_target);
                    YearQ_Target.push(item.gas_target);
                });
                console.log("年度目标数据加载完成");
            }
        },
        error: function (err) { 
            console.log("获取年度目标数据错误:", err);
        }
    });
    
    // ========== 获取月度完成数据 ==========
    $.ajax({
        url: "/EnergyTarget/getMonthlyCompleteData",   
        type: "get",           
        dataType: "json",      
        async: false,
        data: {
            Year: currentRealYear,
            Month_Num: currentRealMonth
        },
        success: function (response) {
            if (response.success && response.data) {
                JGD_D_Monthly = 0;
                JGD_S_Monthly = 0;
                JGD_Q_Monthly = 0;
                DLD_D_Monthly = 0;
                DLD_S_Monthly = 0;
                DLD_Q_Monthly = 0;
                
                response.data.forEach(item => {
                    const targetValue = item.Target_Value || 0;
                    
                    if (item.Building === '加工栋') {
                        if (item.Type === 'E') {
                            JGD_D_Monthly = targetValue;
                        } else if (item.Type === 'W') {
                            JGD_S_Monthly = targetValue;
                        } else if (item.Type === 'G') {
                            JGD_Q_Monthly = targetValue;
                        }
                    } else if (item.Building === '组立栋') {
                        if (item.Type === 'E') {
                            DLD_D_Monthly = targetValue;
                        } else if (item.Type === 'W') {
                            DLD_S_Monthly = targetValue;
                        } else if (item.Type === 'G') {
                            DLD_Q_Monthly = targetValue;
                        }
                    }
                });
                console.log("月度完成数据加载完成");
            }
        },
        error: function (err) { 
            console.log("获取月度完成数据错误:", err);
        }
    });
    
    // ========== 获取2025年目标数据（去年） ==========
    $.ajax({
        url: "/EnergyTarget/getEnergyTarget",   
        type: "get",           
        dataType: "json",      
        async: false,
        data: {
            Year: currentRealYear - 1
        },
        success: function (response) {
            if (response.success) {
                let totalElectric = 0;
                let totalWater = 0;
                let totalGas = 0;
                
                response.data.forEach(item => {
                    const targetValue = item.Target_Value || 0;
                    if (item.Type === 'E') {
                        totalElectric += targetValue;
                    } else if (item.Type === 'W') {
                        totalWater += targetValue;
                    } else if (item.Type === 'G') {
                        totalGas += targetValue;
                    }
                });
                
                LastYear[0] = totalElectric;
                LastYear[1] = totalWater;
                LastYear[2] = totalGas;
                console.log("去年目标数据加载完成");
            }
        },
        error: function (err) { 
            console.log("获取去年目标数据错误:", err);
        }
    });
    
    // ========== 获取近3个月数据 ==========
    const last3FiscalMonths = getLast3FiscalMonths(currentRealMonth, currentRealYear);
    
    // 计算实际数据
    var electricSums = [];
    var waterSums = [];
    var gasSums = [];
    
    for (var i = 0; i < last3FiscalMonths.length; i++) {
        const fm = last3FiscalMonths[i];
        electricSums.push(getActualValue(fm.realYear, fm.realMonth, 'E'));
        waterSums.push(getActualValue(fm.realYear, fm.realMonth, 'W'));
        gasSums.push(getActualValue(fm.realYear, fm.realMonth, 'G'));
    }
    
    var avgElectric = electricSums.reduce((a, b) => a + b, 0) / electricSums.length;
    var avgWater = waterSums.reduce((a, b) => a + b, 0) / waterSums.length;
    var avgGas = gasSums.reduce((a, b) => a + b, 0) / gasSums.length;
    
    LastMonthD = [Math.round(avgElectric), Math.round(electricSums[2]), Math.round(electricSums[1]), Math.round(electricSums[0])];
    LastMonthS = [Math.round(avgWater), Math.round(waterSums[2]), Math.round(waterSums[1]), Math.round(waterSums[0])];
    LastMonthQ = [Math.round(avgGas), Math.round(gasSums[2]), Math.round(gasSums[1]), Math.round(gasSums[0])];
    
    // ========== 获取近3月目标数据 ==========
    LastMonthD_Target = [];
    LastMonthS_Target = [];
    LastMonthQ_Target = [];
    
    $.ajax({
        url: '/EnergyTarget/getMonthlyCompleteDataThree',
        type: 'GET',
        dataType: 'json',
        async: false,
        data: {
            Year: currentRealYear,
            Month_Num: currentRealMonth
        },
        success: function (result) { 
            if (result.success) {
                LastMonthD_Target = [0, 0, 0];
                LastMonthS_Target = [0, 0, 0];
                LastMonthQ_Target = [0, 0, 0];
                
                var months = result.queryMonths;
                
                result.data.forEach(function(item) {
                    for (var i = 0; i < months.length; i++) {
                        if (item.year === months[i].year && item.month === months[i].month) {
                            if (item.type === 'E') LastMonthD_Target[i] = item.value;
                            if (item.type === 'W') LastMonthS_Target[i] = item.value;
                            if (item.type === 'G') LastMonthQ_Target[i] = item.value;
                            break;
                        }
                    }
                });
                
                var avgD = (LastMonthD_Target[0] + LastMonthD_Target[1] + LastMonthD_Target[2]) / 3;
                var avgS = (LastMonthS_Target[0] + LastMonthS_Target[1] + LastMonthS_Target[2]) / 3;
                var avgQ = (LastMonthQ_Target[0] + LastMonthQ_Target[1] + LastMonthQ_Target[2]) / 3;
                
                LastMonthD_Target.reverse();
                LastMonthS_Target.reverse();
                LastMonthQ_Target.reverse();
                
                LastMonthD_Target.unshift(Math.round(avgD));
                LastMonthS_Target.unshift(Math.round(avgS));
                LastMonthQ_Target.unshift(Math.round(avgQ));
                console.log("近3月目标数据加载完成");
            }
        },
        error: function (err) { 
            console.log("获取近3月目标数据错误:", err);
        }
    });
    
    // ========== 计算年度总量 ==========
    // 2018财务年度总量（2018年4月-2019年3月）
    var totalElectric18 = 0;
    var totalWater18 = 0;
    var totalGas18 = 0;
    
    // 2018年4-12月
    for (var month = 4; month <= 12; month++) {
        totalElectric18 += getActualValue(2018, month, 'E');
        totalWater18 += getActualValue(2018, month, 'W');
        totalGas18 += getActualValue(2018, month, 'G');
    }
    // 2019年1-3月
    for (var month = 1; month <= 3; month++) {
        totalElectric18 += getActualValue(2019, month, 'E');
        totalWater18 += getActualValue(2019, month, 'W');
        totalGas18 += getActualValue(2019, month, 'G');
    }
    
    // 当前财务年度总量
    var totalElectricCurrently = 0;
    var totalWaterCurrently = 0;
    var totalGasCurrently = 0;
    
    // 当前年4-12月
    for (var month = 4; month <= 12; month++) {
        totalElectricCurrently += getTargetValue(currentRealYear, month, 'E');
        totalWaterCurrently += getTargetValue(currentRealYear, month, 'W');
        totalGasCurrently += getTargetValue(currentRealYear, month, 'G');
    }
    // 下一年1-3月
    for (var month = 1; month <= 3; month++) {
        totalElectricCurrently += getTargetValue(currentRealYear + 1, month, 'E');
        totalWaterCurrently += getTargetValue(currentRealYear + 1, month, 'W');
        totalGasCurrently += getTargetValue(currentRealYear + 1, month, 'G');
    }
    
    Year18 = [totalElectric18, totalWater18, totalGas18];
    YearCurrently = [totalElectricCurrently, totalWaterCurrently, totalGasCurrently];
    
    console.log("年度总量计算完成");
    console.log("2018年度总量:", Year18);
    console.log("当前年度目标总量:", YearCurrently);
    console.log("去年目标总量:", LastYear);
    console.log("月度参数数据刷新完成");
    
    // 触发事件，通知 Energy.js 数据已更新
    $(document).trigger('energyParameterDataRefreshed');
}

// ========== 初始化：首次加载数据 ==========
$(function() {
    console.log("Energy_parameter.js 初始化开始...");
    refreshEnergyParameterData();
    
    // 设置定时刷新：每小时刷新一次月度数据（3600000毫秒）
    setInterval(function() {
        console.log("定时刷新月度参数数据...");
        refreshEnergyParameterData();
    }, 86400000); // 24小时
    
    // 如果需要每天刷新一次，使用以下代码：
    // setInterval(function() {
    //     refreshEnergyParameterData();
    // }, 86400000); // 24小时
});

// 如果不需要等待 DOM 加载，直接执行：
// refreshEnergyParameterData();
// setInterval(refreshEnergyParameterData, 3600000);