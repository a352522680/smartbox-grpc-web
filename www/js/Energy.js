
$(window).resize(function () {          //当浏览器大小变化时缩放
    var oldx = $(window).width();
    var oldy = $(window).height()
    let sx = $(window).width() / 1707;
    let sy = $(window).height() / 932;
    $("#main").css("transform", "scale(" + sx + "," + sy + ")");
    $("#main").css("transform-origin", "left top")
});
$(function () { 
    let sx = $(window).width() / 1707;
    let sy = $(window).height() / 932;
    $("#main").css("transform", "scale(" + sx + "," + sy + ")");
    $("#main").css("transform-origin", "left top")
})


var DayD_Target=[];//目标电量
var DayS_Target=[];//目标水量
var DayQ_Target=[];//目标气量

var Year="";
var Month="";
var totalWorkDaysOfMonth = "";
$(function () { 

    // 初始加载
    loadData();
    // 设置定时器，每3分钟 
    setInterval(function() {
        loadData();
    }, 180000);
    // 监听月度数据刷新事件（可选，如果需要立即更新显示）
    $(document).on('energyParameterDataRefreshed', function() {
        console.log("检测到月度数据更新，刷新显示...");
        loadData();
    });
    // 统一监听回车事件
    $(document).on("keypress", "#cumulativeWorkDays, #totalWorkDaysOfMonth", function(e) {
        if (e.which === 13) {
            e.preventDefault(); // 阻止默认回车行为
            
            var $this = $(this);
            var inputId = $this.attr('id');
            var newValue =$("#cumulativeWorkDays").val();
            var newValue1 = $("#totalWorkDaysOfMonth").val().replace(/[^0-9]/g, "");
            updateWorkDay(newValue, newValue1);
        }
    });

});
function loadData() {
     DayD_Target=[];//目标电量
     DayS_Target=[];//目标水量
     DayQ_Target=[];//目标气量
     Time=getCurrentTime();
    $("#Time").html(Time);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth()
    const currentDay = now.getDate(); // 当前日期（几号）
    const calendarMonth = now.getMonth() + 1; // 1~12
    Year=year;
    Month=month+1;
    //年度转换：4月=1, 5月=2, ..., 12月=9, 1月=10, 2月=11, 3月=12
    if (Month >= 4) {
        Month = Month - 3;   // 4→1, 5→2, ..., 12→9
    } else {
        Month = Month + 9;   // 1→10, 2→11, 3→12
    }
    var shortYear = String(Year).slice(-2);
    $("#NYD1,#NYD2,#NYD3").html(`${shortYear}年${calendarMonth}月电量实际（1000kwh）`)
    $("#NYD18_1").html(`18年${calendarMonth}月电量实际（1000kwh）`)
    $("#NYD18_2").html(`18年${calendarMonth}月水量目标（T）`)
    $("#NYD1_1,#NYD2_1,#NYD3_1").html(`${shortYear}年${calendarMonth}月电量目标（1000kwh）`)
    $("#NYS1,#NYS2,#NYS3").html(`${shortYear}年${calendarMonth}月水量实际（T）`) 
    $("#NYS1_1,#NYS2_1,#NYS3_1").html(`${shortYear}年${calendarMonth}月水量目标（T）`)
    $("#NYS18_1,#NYS18_2").html(`18年${calendarMonth}月水量实际（T）`)
    $("#NYQ1,#NYQ2,#NYQ3").html(`${shortYear}年${calendarMonth}月气量实际（Nm³）`)
    $("#NYQ1_1,#NYQ2_1,#NYQ3_1").html(`${shortYear}年${calendarMonth}月气量目标（Nm³）`)
    $("#NYQ18_1,#NYQ18_2").html(`18年${calendarMonth}月气量实际（Nm³）`)
    $("#LastYearDtext").html(`${shortYear-1}年度电量目标（1000kwh）`)
    $("#LastYearDvalue").html(LastYear[0]);
    $("#LastYearStext").html(`${shortYear-1}年度水量目标（T）`)
    $("#LastYearSvalue").html(LastYear[1]);
    $("#LastYearQtext").html(`${shortYear-1}年度气量目标（Nm³）`)
    $("#LastYearQvalue").html(LastYear[2]);

    var cumulativeWorkDays = "0";
    totalWorkDaysOfMonth = "0";
    // 计算累计出勤日（从当月1日到今天，排除周末）
    $.ajax({
        url: "/Local/read",  
        async: false, 
        type: "get",           
        dataType: "json",      
        success: function (data) {
            totalWorkDaysOfMonth=data.Plan;
            cumulativeWorkDays=data.fact;
        }
    })



    $("#cumulativeWorkDays").val(cumulativeWorkDays)
    // 计算当月总出勤日（整个月，排除周末）
    $("#totalWorkDaysOfMonth").val(`本月计划出勤 ${totalWorkDaysOfMonth} 日`);
    $("#Monthrate").html(Math.round((cumulativeWorkDays / totalWorkDaysOfMonth) * 100) + "%")
    // 获取当月第一个工作日和最后一个工作日
    var firstWorkDay = getFirstWorkDayOfMonth(year, month);
    var firstWorkDayStr = formatDate(firstWorkDay);
    $("#firstWorkDayStr").html(firstWorkDayStr)
    $("#lastWorkDayStr").html(formatDate(now))
    
    $("#Y18D").html(Year18[0])
    $("#Y18S").html(Year18[1])
    $("#Y18Q").html(Year18[2])
    
    
    $("#JGD_D").html(JGD_D_Monthly)
    $("#DLD_D").html(DLD_D_Monthly)
    $("#D_Target").html(parseInt(JGD_D_Monthly+DLD_D_Monthly));
    
    $("#JGD_S").html(JGD_S_Monthly)
    $("#DLD_S").html(DLD_S_Monthly)
    $("#S_Target").html(parseInt(JGD_S_Monthly+DLD_S_Monthly));

    $("#JGD_Q").html(JGD_Q_Monthly)
    $("#DLD_Q").html(DLD_Q_Monthly)
    $("#Q_Target").html(parseInt(JGD_Q_Monthly+DLD_Q_Monthly));

    $("#JGD_D_18").html(JGD_D18[Month-1])
    $("#DLD_D_18").html(DLD_D18[Month-1])

    $("#JGD_S_18").html(JGD_S18[Month-1])
    $("#DLD_S_18").html(DLD_S18[Month-1])

    $("#JGD_Q_18").html(JGD_Q18[Month-1])
    $("#DLD_Q_18").html(DLD_Q18[Month-1])

    // 使用当前真实时间
    const current = getCurrentTimeString();
    const result = calculateUtilization(current);
    $("#Dayrate").html(`${Math.round(result * 100)}%`)
    Main()
}
 
function Main(){
    const now = new Date();
    const currentRealYear = now.getFullYear();
    const currentRealMonth = now.getMonth() + 1; // 1-12
    $.ajax({
        url: "/Energy/dashboard",   
        type: "get",           
        dataType: "json",      
        success: function (data) {
            // 处理返回的数据
            if (data.success) {
                var datas=data.data.utility_dashboard_data
                 
                var JG_S_D_SUM=0;
                var JG_S_S_SUM=0;
                var JG_S_Q_SUM=0;
                for(var i=0;i<datas.facility_utility_usage_cur_month.length;i++){
                    //加工栋-组立栋实测
                    if(datas.facility_utility_usage_cur_month[i].facility_uid=="1"){
                        
                        $("#JG_S_D1").html(Math.round(datas.facility_utility_usage_cur_month[i].utility_usage[0].energy_usage/1000) )
                        $("#JG_S_S1").html(Math.round(datas.facility_utility_usage_cur_month[i].utility_usage[0].water_usage))
                        $("#JG_S_Q1").html(Math.round(datas.facility_utility_usage_cur_month[i].utility_usage[0].air_usage))
                        JG_S_D_SUM+=parseFloat(datas.facility_utility_usage_cur_month[i].utility_usage[0].energy_usage)
                        JG_S_S_SUM+=parseFloat(datas.facility_utility_usage_cur_month[i].utility_usage[0].water_usage)
                        JG_S_Q_SUM+=parseFloat(datas.facility_utility_usage_cur_month[i].utility_usage[0].air_usage)
                        if(JGD_D_Monthly==0){
                            $("#Dbfb2").html("0%")
                        }
                        else{
                            $("#Dbfb2").html(Math.round((datas.facility_utility_usage_cur_month[i].utility_usage[0].energy_usage / 1000 / JGD_D_Monthly)*100) + "%")

                        }
                        if(JGD_S_Monthly==0){
                            $("#Sbfb2").html("0%")
                        }
                        else{
                            $("#Sbfb2").html(Math.round((datas.facility_utility_usage_cur_month[i].utility_usage[0].water_usage / JGD_S_Monthly) * 100) + "%")
                        }
                        if(JGD_Q_Monthly==0){
                            $("#Qbfb2").html("0%")
                        }
                        else{
                            $("#Qbfb2").html(Math.round((datas.facility_utility_usage_cur_month[i].utility_usage[0].air_usage / JGD_Q_Monthly) * 100) + "%")
                        }
                    }
                    else{
                        
                        $("#JG_S_D2").html(Math.round(datas.facility_utility_usage_cur_month[i].utility_usage[0].energy_usage/1000) )
                        $("#JG_S_S2").html(Math.round(datas.facility_utility_usage_cur_month[i].utility_usage[0].water_usage))
                        $("#JG_S_Q2").html(Math.round(datas.facility_utility_usage_cur_month[i].utility_usage[0].air_usage))
                        JG_S_D_SUM+=parseFloat(datas.facility_utility_usage_cur_month[i].utility_usage[0].energy_usage)
                        JG_S_S_SUM+=parseFloat(datas.facility_utility_usage_cur_month[i].utility_usage[0].water_usage)
                        JG_S_Q_SUM+=parseFloat(datas.facility_utility_usage_cur_month[i].utility_usage[0].air_usage)

                        if(DLD_D_Monthly==0){
                            $("#Dbfb3").html("0%")
                        }
                        else{
                            $("#Dbfb3").html(Math.round((datas.facility_utility_usage_cur_month[i].utility_usage[0].energy_usage / 1000 / DLD_D_Monthly) * 100) + "%")
                        }
                        if(DLD_S_Monthly==0){
                            $("#Sbfb3").html("0%")
                        }
                        else{
                            $("#Sbfb3").html(Math.round((datas.facility_utility_usage_cur_month[i].utility_usage[0].water_usage / DLD_S_Monthly) * 100) + "%")

                        }
                        if(DLD_Q_Monthly==0){
                            $("#Qbfb3").html("0%")
                        }
                        else{
                            $("#Qbfb3").html(Math.round((datas.facility_utility_usage_cur_month[i].utility_usage[0].air_usage / DLD_Q_Monthly) * 100) + "%")
                        }
                        
                    }
                    
                }
                $("#JG_S_D_SUM").html(Math.round(Math.round(JG_S_D_SUM/1000)) )
                $("#JG_S_S_SUM").html(Math.round(JG_S_S_SUM))
                $("#JG_S_Q_SUM").html(Math.round(JG_S_Q_SUM))


                
                var YearArr=[];
                var energy_usageArr=[];
                var water_usageArr=[];
                var air_usageArr=[];
                var last3mths_D=[];
                var last3mths_S=[];
                var last3mths_Q=[];
                var last3mths_month=[];
                var MonthD1=[];
                var MonthD2=[];
                var MonthS1=[];
                var MonthS2=[];
                var MonthQ1=[];
                var MonthQ2=[];
                var Day=[];
                for(var i=0;i<datas.all_workyearly_utility_usage.length;i++){ 
                    YearArr.push(datas.all_workyearly_utility_usage[i].work_year)
                    energy_usageArr.push(Math.round(datas.all_workyearly_utility_usage[i].energy_usage/1000) )
                    water_usageArr.push(Math.round(datas.all_workyearly_utility_usage[i].water_usage) )
                    air_usageArr.push(Math.round(datas.all_workyearly_utility_usage[i].air_usage))
                }
                var YearEnergy_usage=energy_usageArr[energy_usageArr.length-1];
                var YearWater_usage=water_usageArr[water_usageArr.length-1];
                var YearAir_usage=air_usageArr[air_usageArr.length-1];
                

                ChartD1(YearArr,energy_usageArr,YearD_Target)
                ChartS1(YearArr,water_usageArr,YearS_Target)
                ChartQ1(YearArr,air_usageArr,YearQ_Target)

                last3mths_D.push(Math.round(datas.all_ave_mthly_utility_usage_cur_workyear.energy_usage/1000))
                last3mths_S.push(Math.round(datas.all_ave_mthly_utility_usage_cur_workyear.water_usage) )
                last3mths_Q.push(Math.round(datas.all_ave_mthly_utility_usage_cur_workyear.air_usage))
                last3mths_month.push("AVE.")
 
                for(var i=0;i<datas.all_monthly_utility_usage_last3mths.length;i++){
                    last3mths_D.push(Math.round(datas.all_monthly_utility_usage_last3mths[i].energy_usage/1000) )
                    last3mths_S.push(Math.round(datas.all_monthly_utility_usage_last3mths[i].water_usage) )
                    last3mths_Q.push(Math.round(datas.all_monthly_utility_usage_last3mths[i].air_usage) )
                    last3mths_month.push(datas.all_monthly_utility_usage_last3mths[i].current_month+"月")
 
                }
 
                ChartD2(last3mths_month,last3mths_D,LastMonthD,LastMonthD_Target)
                ChartS2(last3mths_month,last3mths_S,LastMonthS,LastMonthS_Target)
                ChartQ2(last3mths_month,last3mths_Q,LastMonthQ,LastMonthQ_Target)

                for(var i=0;i<datas.all_daily_utility_usage_cur_month.length;i++){
                    var currentMonthD = Number(datas.all_daily_utility_usage_cur_month[i].energy_usage);
                    var illum = Number(datas.all_daily_utility_usage_cur_month[i].energy_usage_illum);
                    MonthD1.push(Math.round((currentMonthD - illum)/1000) );
                    MonthD2.push(Math.round(illum/1000) );

                 
                    Day.push(currentRealMonth+"-"+parseInt(i+1))
                    DayD_Target.push(Math.round(parseInt(JGD_D_Monthly+DLD_D_Monthly)/totalWorkDaysOfMonth))

                    DayS_Target.push(Math.round(parseInt(JGD_S_Monthly+DLD_S_Monthly)/totalWorkDaysOfMonth))
                    DayQ_Target.push(Math.round(parseInt(JGD_Q_Monthly+DLD_Q_Monthly)/totalWorkDaysOfMonth))
                }
                // 外层循环遍历设施
                for (let i = 0; i < datas.facility_daily_utility_usage_cur_month.length; i++) {
                    const facility = datas.facility_daily_utility_usage_cur_month[i];
                    
                    // 判断 facility_uid
                    if (facility.facility_uid === "1") {
                        // 内层循环遍历每天的数据
                        for (let j = 0; j < facility.utility_usage_by_day.length; j++) {
                            MonthS1.push(Math.round(facility.utility_usage_by_day[j].water_usage) );
                            MonthQ1.push(Math.round(facility.utility_usage_by_day[j].air_usage));
                        }
                    } else if (facility.facility_uid === "2") {
                        // 内层循环遍历每天的数据
                        for (let j = 0; j < facility.utility_usage_by_day.length; j++) {
                            MonthS2.push(Math.round(facility.utility_usage_by_day[j].water_usage));
                            MonthQ2.push(Math.round(facility.utility_usage_by_day[j].air_usage));
                        }
                    }
                }
                
                ChartD3(MonthD1,MonthD2,DayD_Target,Day)
                ChartS3(MonthS1,MonthS2,DayS_Target,Day)
                ChartQ3(MonthQ1,MonthQ2,DayQ_Target,Day)

                var sum = YearCurrently[0] ? ((YearEnergy_usage) / YearCurrently[0]) * 100 : 0;
                $("#Dbfb1").html(Math.round(sum) + "%");

                var sum2 = YearCurrently[1] ? ((YearEnergy_usage) / YearCurrently[1]) * 100 : 0;
                $("#Sbfb1").html(Math.round(sum2) + "%");

                var sum3 = YearCurrently[2] ? ((YearEnergy_usage) / YearCurrently[2]) * 100 : 0;
                $("#Qbfb1").html(Math.round(sum3)+ "%");
                
            } else {
                console.log("请求失败:", data.message);
            }
        },
        error: function (err) { 
            alert("请求失败！请检查数据采集盒接口是否正常！");
            console.log("请求错误:", err);
            console.log("状态码:", err.status);
            console.log("错误信息:", err.responseText);
        }
    });

}
function  ChartD1(Arr1,Arr2,Arr3){
        let myChart = echarts.init(document.getElementById('electric_chart1'));
        
        let option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                // 小尺寸下 tooltip 字体稍小
                textStyle: { fontSize: 12 }
            },
            legend: {
                data: ['实测电量', '目标电量'],
                // 小尺寸下图例放在底部或调整位置避免占用太多空间
                left: 'center',
                top: 0,
                itemWidth: 20,
                itemHeight: 10,
                textStyle: { fontSize: 12 },
                // 图例背景透明，减少视觉拥挤
                backgroundColor: 'transparent',
                textStyle: { 
                   
                    color: '#111'  // 设置文字颜色，可以是十六进制、RGB、颜色名称等
                },
            },
            grid: {
                // 小尺寸关键：增大边距比例确保标签和坐标轴完整显示
                left: '2%',      // 左侧留出空间给 y 轴文字
                right: '2%',
                top: '25%',       // 顶部留更多空间给图例和柱子顶部标签
                bottom: '1%',    // 底部留空间给 x 轴标签
                containLabel: true,
                // 可选：添加背景色便于调试，生产环境可移除
                backgroundColor: 'transparent'
            },
            xAxis: {
                type: 'category',
                data: Arr1,
                // 小尺寸下 x 轴标签旋转或间隔显示
                axisLabel: {
                    fontSize: 8,
                    rotate: 30,           // 旋转30度避免文字重叠
                    interval: 1,          // 显示所有标签，旋转后可以容纳
                    margin: 4
                },
                axisTick: { show: false }, // 隐藏刻度线，更简洁
                axisLine: { lineStyle: { width: 1 } }
            },
            yAxis: [
                {
                    type: 'value',
                    nameTextStyle: { fontWeight: 'bold', fontSize: 7 },
                    axisLabel: { 
                        formatter: '{value}',
                        fontSize: 7
                    },
                    splitLine: { lineStyle: { type: 'dashed', width: 0.5 } },
                    nameLocation: 'middle',
                    nameGap: 20
                },
                {
                    type: 'value',
                    position: 'right',
                    axisLabel: { show: false },
                    axisTick: { show: false },
                    axisLine: { show: false },
                    splitLine: { show: false }
                }
            ],
            series: [
                {
                    name: '实测电量',
                    type: 'bar',
                    // 小尺寸下柱状图宽度适当减小，避免柱子之间过于拥挤
                    barWidth: '45%',
                    barGap: '20%',
                    data: Arr2,
                    label: {
                        show: true,
                        position: 'top',
                        // 小尺寸关键优化：减小字体、偏移量微调
                        formatter: function(params) {
                            // 返回数值，如果数值太大可以简化显示，这里保持原值
                            return params.value;
                        },
                        fontWeight: 'bold',
                        fontSize: 11,           // 小字体适配小尺寸
                        color: '#ffb11f',
                        
                        padding: [1, 2, 1, 2], // 减小内边距
                        borderRadius: 3,
                        // 关键：小尺寸下偏移量不能太大，否则会超出 grid 区域
                        offset: [0, -2]
                        // 添加边框让文字更清晰
                         
                    },
                    itemStyle: {
                        borderRadius: [3, 3, 0, 0],
                        color: '#ffb11f'
                    }
                },
                {
                    name: '目标电量',
                    type: 'line',
                    
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 5,          // 小尺寸下折线点缩小
                    data: Arr3,
                    itemStyle: {
                        color: '#c23531',
                        borderColor: '#c23531',
                        borderWidth: 1
                    },
                    lineStyle: { width: 1.5 },
                    // 折线图不显示标签，避免干扰
                    label: { show: false },
                    // 小尺寸下可以稍微降低平滑度，减少渲染开销
                    smooth: true
                }
            ],
            // 全局字体设置
            textStyle: { fontSize: 9 }
        };

        myChart.setOption(option);
        
        // 监听窗口大小变化
        window.addEventListener('resize', function() {
            myChart.resize();
        });
        
        // 可选：如果初始化后仍有显示问题，延迟微调一次
        setTimeout(() => {
            myChart.resize();
        }, 100);

}
function  ChartS1(Arr1,Arr2,Arr3){
        let myChart = echarts.init(document.getElementById('water_chart1'));
        
        let option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                // 小尺寸下 tooltip 字体稍小
                textStyle: { fontSize: 12 }
            },
            legend: {
                data: ['实测水量', '目标水量'],
                // 小尺寸下图例放在底部或调整位置避免占用太多空间
                left: 'center',
                top: 0,
                itemWidth: 20,
                itemHeight: 10,
                backgroundColor: 'transparent',
                textStyle: { 
                    color: '#111'
                },
            },
            grid: {
                // 小尺寸关键：增大边距比例确保标签和坐标轴完整显示
                left: '2%',      // 左侧留出空间给 y 轴文字
                right: '2%',
                top: '25%',       // 顶部留更多空间给图例和柱子顶部标签
                bottom: '1%',    // 底部留空间给 x 轴标签
                containLabel: true,
                // 可选：添加背景色便于调试，生产环境可移除
                backgroundColor: 'transparent'
            },
            xAxis: {
                type: 'category',
                data: Arr1,
                // 小尺寸下 x 轴标签旋转或间隔显示
                axisLabel: {
                    fontSize: 8,
                    rotate: 30,           // 旋转30度避免文字重叠
                    interval: 1,          // 显示所有标签，旋转后可以容纳
                    margin: 4
                },
                axisTick: { show: false }, // 隐藏刻度线，更简洁
                axisLine: { lineStyle: { width: 1 } }
            },
            yAxis: [
                {
                    type: 'value',
                    nameTextStyle: { fontWeight: 'bold', fontSize: 7 },
                    axisLabel: { 
                        formatter: '{value}',
                        fontSize: 7
                    },
                    splitLine: { lineStyle: { type: 'dashed', width: 0.5 } },
                    nameLocation: 'middle',
                    nameGap: 20
                },
                {
                    type: 'value',
                    position: 'right',
                    axisLabel: { show: false },
                    axisTick: { show: false },
                    axisLine: { show: false },
                    splitLine: { show: false }
                }
            ],
            series: [
                {
                    name: '实测水量',
                    type: 'bar',
                    // 小尺寸下柱状图宽度适当减小，避免柱子之间过于拥挤
                    barWidth: '45%',
                    barGap: '20%',
                    data: Arr2,
                    label: {
                        show: true,
                        position: 'top',
                        // 小尺寸关键优化：减小字体、偏移量微调
                        formatter: function(params) {
                            // 返回数值，如果数值太大可以简化显示，这里保持原值
                            return params.value;
                        },
                        fontWeight: 'bold',
                        fontSize: 11,           // 小字体适配小尺寸
                        color: '#ffb11f',
                        
                        padding: [1, 2, 1, 2], // 减小内边距
                        borderRadius: 3,
                        // 关键：小尺寸下偏移量不能太大，否则会超出 grid 区域
                        offset: [0, -2]
                        // 添加边框让文字更清晰
                         
                    },
                    itemStyle: {
                        borderRadius: [3, 3, 0, 0],
                        color: '#ffb11f'
                    }
                },
                {
                    name: '目标水量',
                    type: 'line',
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 5,          // 小尺寸下折线点缩小
                    data: Arr3,
                    itemStyle: {
                        color: '#c23531',
                        borderColor: '#c23531',
                        borderWidth: 1
                    },
                    lineStyle: { width: 1.5 },
                    // 折线图不显示标签，避免干扰
                    label: { show: false },
                    // 小尺寸下可以稍微降低平滑度，减少渲染开销
                    smooth: true
                }
            ],
            // 全局字体设置
            textStyle: { fontSize: 9 }
        };

        myChart.setOption(option);
        
        // 监听窗口大小变化
        window.addEventListener('resize', function() {
            myChart.resize();
        });
        
        // 可选：如果初始化后仍有显示问题，延迟微调一次
        setTimeout(() => {
            myChart.resize();
        }, 100);

}
function  ChartQ1(Arr1,Arr2,Arr3){
        let myChart = echarts.init(document.getElementById('air_chart1'));
        
        let option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                // 小尺寸下 tooltip 字体稍小
                textStyle: { fontSize: 12 }
            },
            legend: {
                data: ['实测气量', '目标气量'],
                // 小尺寸下图例放在底部或调整位置避免占用太多空间
                left: 'center',
                top: 0,
                itemWidth: 20,
                itemHeight: 10,
                textStyle: { fontSize: 12 },
                // 图例背景透明，减少视觉拥挤
                backgroundColor: 'transparent',
                textStyle: { 
                   
                    color: '#111'  // 设置文字颜色，可以是十六进制、RGB、颜色名称等
                },
            },
            grid: {
                // 小尺寸关键：增大边距比例确保标签和坐标轴完整显示
                left: '2%',      // 左侧留出空间给 y 轴文字
                right: '2%',
                top: '25%',       // 顶部留更多空间给图例和柱子顶部标签
                bottom: '1%',    // 底部留空间给 x 轴标签
                containLabel: true,
                // 可选：添加背景色便于调试，生产环境可移除
                backgroundColor: 'transparent'
            },
            xAxis: {
                type: 'category',
                data: Arr1,
                // 小尺寸下 x 轴标签旋转或间隔显示
                axisLabel: {
                    fontSize: 8,
                    rotate: 30,           // 旋转30度避免文字重叠
                    interval: 1,          // 显示所有标签，旋转后可以容纳
                    margin: 4
                },
                axisTick: { show: false }, // 隐藏刻度线，更简洁
                axisLine: { lineStyle: { width: 1 } }
            },
            yAxis: [
                {
                    type: 'value',
                    nameTextStyle: { fontWeight: 'bold', fontSize: 7 },
                    axisLabel: { 
                        formatter: '{value}',
                        fontSize: 7
                    },
                    splitLine: { lineStyle: { type: 'dashed', width: 0.5 } },
                    nameLocation: 'middle',
                    nameGap: 20
                },
                {
                    type: 'value',
                    position: 'right',
                    axisLabel: { show: false },
                    axisTick: { show: false },
                    axisLine: { show: false },
                    splitLine: { show: false }
                }
            ],
            series: [
                {
                    name: '实测气量',
                    type: 'bar',
                    // 小尺寸下柱状图宽度适当减小，避免柱子之间过于拥挤
                    barWidth: '45%',
                    barGap: '20%',
                    data: Arr2,
                    label: {
                        show: true,
                        position: 'top',
                        // 小尺寸关键优化：减小字体、偏移量微调
                        formatter: function(params) {
                            // 返回数值，如果数值太大可以简化显示，这里保持原值
                            return params.value;
                        },
                        fontWeight: 'bold',
                        fontSize: 11,           // 小字体适配小尺寸
                        color: '#ffb11f',
                        
                        padding: [1, 2, 1, 2], // 减小内边距
                        borderRadius: 3,
                        // 关键：小尺寸下偏移量不能太大，否则会超出 grid 区域
                        offset: [0, -2]
                        // 添加边框让文字更清晰
                         
                    },
                    itemStyle: {
                        borderRadius: [3, 3, 0, 0],
                        color: '#ffb11f'
                    }
                },
                {
                    name: '目标气量',
                    type: 'line',
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 5,          // 小尺寸下折线点缩小
                    data: Arr3,
                    itemStyle: {
                        color: '#c23531',
                        borderColor: '#c23531',
                        borderWidth: 1
                    },
                    lineStyle: { width: 1.5 },
                    // 折线图不显示标签，避免干扰
                    label: { show: false },
                    // 小尺寸下可以稍微降低平滑度，减少渲染开销
                    smooth: true
                }
            ],
            // 全局字体设置
            textStyle: { fontSize: 9 }
        };

        myChart.setOption(option);
        
        // 监听窗口大小变化
        window.addEventListener('resize', function() {
            myChart.resize();
        });
        
        // 可选：如果初始化后仍有显示问题，延迟微调一次
        setTimeout(() => {
            myChart.resize();
        }, 100);

}
function ChartD2(Arr1,Arr2,Arr3,Arr4){
    let myChart = echarts.init(document.getElementById('electric_chart2'));
    
    let option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            textStyle: { fontSize: 12 }
        },
        legend: {
            data: [ '18年电量','实测电量', '目标电量'],  // 添加新的图例项
            left: 'center',
            top: 0,
            itemWidth: 20,
            itemHeight: 10,
            backgroundColor: 'transparent',
            textStyle: { 
                color: '#111'
            },
        },
        grid: {
            left: '2%',
            right: '2%',
            top: '25%',
            bottom: '1%',
            containLabel: true,
            backgroundColor: 'transparent'
        },
        xAxis: {
            type: 'category',
            data: Arr1,
            axisLabel: {
                fontSize: 10,
                margin: 4
            },
            axisTick: { show: false },
            axisLine: { lineStyle: { width: 1 } }
        },
        yAxis: [
            {
                type: 'value',
                nameTextStyle: { fontWeight: 'bold', fontSize: 7 },
                axisLabel: { 
                    formatter: '{value}',
                    fontSize: 7
                },
                splitLine: { lineStyle: { type: 'dashed', width: 0.5 } },
                nameLocation: 'middle',
                nameGap: 20
            },
            {
                type: 'value',
                position: 'right',
                axisLabel: { show: false },
                axisTick: { show: false },
                axisLine: { show: false },
                splitLine: { show: false }
            }
        ],
        series: [
            {
                name: '18年电量',  // 新增的柱子
                type: 'bar',
                barWidth: '30%',
                barGap: '10%',
                data: Arr3,  // 计划电量数据，可以根据实际需求修改
                label: {
                    show: true,
                    position: 'top',
                    formatter: function(params) {
                        return params.value;
                    },
                    fontWeight: 'bold',
                    fontSize: 11,
                    color: '#57a6ff',
                    padding: [1, 2, 1, 2],
                    borderRadius: 3,
                    offset: [0, -2]
                },
                itemStyle: {
                    borderRadius: [3, 3, 0, 0],
                    color: '#57a6ff'  
                }
            },
            {
                name: '实测电量',
                type: 'bar',
                barWidth: '30%',  // 减小宽度，为多根柱子留空间
                barGap: '10%',    // 柱子之间的间距
                data: Arr2,
                label: {
                    show: true,
                    position: 'top',
                    formatter: function(params) {
                        return params.value;
                    },
                    fontWeight: 'bold',
                    fontSize: 11,
                    color: '#ffb11f',
                    padding: [1, 2, 1, 2],
                    borderRadius: 3,
                    offset: [0, -2]
                },
                itemStyle: {
                    borderRadius: [3, 3, 0, 0],
                    color: '#ffb11f'
                }
            },
            {
                name: '目标电量',
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 5,
                data: Arr4,
                itemStyle: {
                    color: '#c23531',
                    borderColor: '#c23531',
                    borderWidth: 1
                },
                lineStyle: { width: 1.5 },
                label: { show: false },
                smooth: true
            }
        ],
        textStyle: { fontSize: 9 }
    };

    myChart.setOption(option);
    
    window.addEventListener('resize', function() {
        myChart.resize();
    });
    
    setTimeout(() => {
        myChart.resize();
    }, 100);
}
function ChartS2(Arr1,Arr2,Arr3,Arr4){
    let myChart = echarts.init(document.getElementById('water_chart2'));
    
    let option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            textStyle: { fontSize: 12 }
        },
        legend: {
            data: [ '18年水量','实测水量', '目标水量'],  // 添加新的图例项
            left: 'center',
            top: 0,
            itemWidth: 20,
            itemHeight: 10,
            backgroundColor: 'transparent',
            textStyle: { 
                color: '#111'
            },
        },
        grid: {
            left: '2%',
            right: '2%',
            top: '25%',
            bottom: '1%',
            containLabel: true,
            backgroundColor: 'transparent'
        },
        xAxis: {
            type: 'category',
            data: Arr1,
            axisLabel: {
                fontSize: 10,
                margin: 4
            },
            axisTick: { show: false },
            axisLine: { lineStyle: { width: 1 } }
        },
        yAxis: [
            {
                type: 'value',
                nameTextStyle: { fontWeight: 'bold', fontSize: 7 },
                axisLabel: { 
                    formatter: '{value}',
                    fontSize: 7
                },
                splitLine: { lineStyle: { type: 'dashed', width: 0.5 } },
                nameLocation: 'middle',
                nameGap: 20
            },
            {
                type: 'value',
                position: 'right',
                axisLabel: { show: false },
                axisTick: { show: false },
                axisLine: { show: false },
                splitLine: { show: false }
            }
        ],
        series: [
            {
                name: '18年水量',  // 新增的柱子
                type: 'bar',
                barWidth: '30%',
                barGap: '10%',
                data: Arr3,  // 计划电量数据，可以根据实际需求修改
                label: {
                    show: true,
                    position: 'top',
                    formatter: function(params) {
                        return params.value;
                    },
                    fontWeight: 'bold',
                    fontSize: 11,
                    color: '#57a6ff',
                    padding: [1, 2, 1, 2],
                    borderRadius: 3,
                    offset: [0, -2]
                },
                itemStyle: {
                    borderRadius: [3, 3, 0, 0],
                    color: '#57a6ff'  
                }
            },
            {
                name: '实测水量',
                type: 'bar',
                barWidth: '30%',  // 减小宽度，为多根柱子留空间
                barGap: '10%',    // 柱子之间的间距
                data: Arr2,
                label: {
                    show: true,
                    position: 'top',
                    formatter: function(params) {
                        return params.value;
                    },
                    fontWeight: 'bold',
                    fontSize: 11,
                    color: '#ffb11f',
                    padding: [1, 2, 1, 2],
                    borderRadius: 3,
                    offset: [0, -2]
                },
                itemStyle: {
                    borderRadius: [3, 3, 0, 0],
                    color: '#ffb11f'
                }
            },
            {
                name: '目标水量',
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 5,
                data: Arr4,
                itemStyle: {
                    color: '#c23531',
                    borderColor: '#c23531',
                    borderWidth: 1
                },
                lineStyle: { width: 1.5 },
                label: { show: false },
                smooth: true
            }
        ],
        textStyle: { fontSize: 9 }
    };

    myChart.setOption(option);
    
    window.addEventListener('resize', function() {
        myChart.resize();
    });
    
    setTimeout(() => {
        myChart.resize();
    }, 100);
}
function ChartQ2(Arr1,Arr2,Arr3,Arr4){
    let myChart = echarts.init(document.getElementById('air_chart2'));
    
    let option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            textStyle: { fontSize: 12 }
        },
        legend: {
            data: [ '18年气量','实测气量', '目标气量'],  // 添加新的图例项
            left: 'center',
            top: 0,
            itemWidth: 20,
            itemHeight: 10,
            backgroundColor: 'transparent',
            textStyle: { 
                color: '#111'
            },
        },
        grid: {
            left: '2%',
            right: '2%',
            top: '25%',
            bottom: '1%',
            containLabel: true,
            backgroundColor: 'transparent'
        },
        xAxis: {
            type: 'category',
            data: Arr1,
            axisLabel: {
                fontSize: 10,
                margin: 4
            },
            axisTick: { show: false },
            axisLine: { lineStyle: { width: 1 } }
        },
        yAxis: [
            {
                type: 'value',
                nameTextStyle: { fontWeight: 'bold', fontSize: 7 },
                axisLabel: { 
                    formatter: '{value}',
                    fontSize: 7
                },
                splitLine: { lineStyle: { type: 'dashed', width: 0.5 } },
                nameLocation: 'middle',
                nameGap: 20
            },
            {
                type: 'value',
                position: 'right',
                axisLabel: { show: false },
                axisTick: { show: false },
                axisLine: { show: false },
                splitLine: { show: false }
            }
        ],
        series: [
            {
                name: '18年气量',  // 新增的柱子
                type: 'bar',
                barWidth: '30%',
                barGap: '10%',
                data: Arr3,  // 计划电量数据，可以根据实际需求修改
                label: {
                    show: true,
                    position: 'top',
                    formatter: function(params) {
                        return params.value;
                    },
                    fontWeight: 'bold',
                    fontSize: 11,
                    color: '#57a6ff',
                    padding: [1, 2, 1, 2],
                    borderRadius: 3,
                    offset: [0, -2]
                },
                itemStyle: {
                    borderRadius: [3, 3, 0, 0],
                    color: '#57a6ff'  
                }
            },
            {
                name: '实测气量',
                type: 'bar',
                barWidth: '30%',  // 减小宽度，为多根柱子留空间
                barGap: '10%',    // 柱子之间的间距
                data: Arr2,
                label: {
                    show: true,
                    position: 'top',
                    formatter: function(params) {
                        return params.value;
                    },
                    fontWeight: 'bold',
                    fontSize: 11,
                    color: '#ffb11f',
                    padding: [1, 2, 1, 2],
                    borderRadius: 3,
                    offset: [0, -2]
                },
                itemStyle: {
                    borderRadius: [3, 3, 0, 0],
                    color: '#ffb11f'
                }
            },
            {
                name: '目标气量',
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 5,
                data: Arr4,
                itemStyle: {
                    color: '#c23531',
                    borderColor: '#c23531',
                    borderWidth: 1
                },
                lineStyle: { width: 1.5 },
                label: { show: false },
                smooth: true
            }
        ],
        textStyle: { fontSize: 9 }
    };

    myChart.setOption(option);
    
    window.addEventListener('resize', function() {
        myChart.resize();
    });
    
    setTimeout(() => {
        myChart.resize();
    }, 100);
}
function  ChartD3(Arr1_1,Arr1_2,Arr2,Arr3){
        let myChart = echarts.init(document.getElementById('electric_chart3'));
        
        let option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                // 小尺寸下 tooltip 字体稍小
                textStyle: { fontSize: 12 }
            },
            legend: {
                data: ['加工','照明', '目标电量'],
                // 小尺寸下图例放在底部或调整位置避免占用太多空间
                left: 'center',
                top: 0,
                itemWidth: 20,
                itemHeight: 10,
                textStyle: { fontSize: 12 },
                // 图例背景透明，减少视觉拥挤
                backgroundColor: 'transparent',
                textStyle: { 
                   
                    color: '#111'  // 设置文字颜色，可以是十六进制、RGB、颜色名称等
                },
            },
            grid: {
                // 小尺寸关键：增大边距比例确保标签和坐标轴完整显示
                left: '2%',      // 左侧留出空间给 y 轴文字
                right: '2%',
                top: '25%',       // 顶部留更多空间给图例和柱子顶部标签
                bottom: '1%',    // 底部留空间给 x 轴标签
                containLabel: true,
                // 可选：添加背景色便于调试，生产环境可移除
                backgroundColor: 'transparent'
            },
            xAxis: {
                type: 'category',
                data: Arr3,
                // 小尺寸下 x 轴标签旋转或间隔显示
                axisLabel: {
                    fontSize: 10,
                    
                    margin: 4
                },
                axisTick: { show: false }, // 隐藏刻度线，更简洁
                axisLine: { lineStyle: { width: 1 } }
            },
            yAxis: [
                {
                    type: 'value',
                    nameTextStyle: { fontWeight: 'bold', fontSize: 7 },
                    axisLabel: { 
                        formatter: '{value}',
                        fontSize: 7
                    },
                    splitLine: { lineStyle: { type: 'dashed', width: 0.5 } },
                    nameLocation: 'middle',
                    nameGap: 20
                },
                {
                    type: 'value',
                    position: 'right',
                    axisLabel: { show: false },
                    axisTick: { show: false },
                    axisLine: { show: false },
                    splitLine: { show: false }
                }
            ],
            series: [
                {
                    name: '加工',
                    type: 'bar',
                    stack: 'total', // 关键：同名 stack 会堆叠在一起
                    barWidth: '35%', // 柱子宽度
                    itemStyle: {
                        color: '#ffb11f' // 深红色
                    },
                    data: Arr1_1
                },
                {
                    name: '照明',
                    type: 'bar',
                    stack: 'total',
                    itemStyle: {
                        color: '#69c41b' // 草绿色
                    },
                    data: Arr1_2
                },
                {
                    name: '目标电量',
                    type: 'line',
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 5,          // 小尺寸下折线点缩小
                    data: Arr2,
                    itemStyle: {
                        color: '#c23531',
                        borderColor: '#c23531',
                        borderWidth: 1
                    },
                    lineStyle: { width: 1.5 },
                    // 折线图不显示标签，避免干扰
                    label: { show: false },
                    // 小尺寸下可以稍微降低平滑度，减少渲染开销
                    smooth: true
                }
            ],
            // 全局字体设置
            textStyle: { fontSize: 9 }
        };

        myChart.setOption(option);
        
        // 监听窗口大小变化
        window.addEventListener('resize', function() {
            myChart.resize();
        });
        
        // 可选：如果初始化后仍有显示问题，延迟微调一次
        setTimeout(() => {
            myChart.resize();
        }, 100);

}
function  ChartS3(Arr1_1,Arr1_2,Arr2,Arr3){
        let myChart = echarts.init(document.getElementById('water_chart3'));
        
        let option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                // 小尺寸下 tooltip 字体稍小
                textStyle: { fontSize: 12 }
            },
            legend: {
                data: ['加工栋', '组装栋', '目标水量'],
                // 小尺寸下图例放在底部或调整位置避免占用太多空间
                left: 'center',
                top: 0,
                itemWidth: 20,
                itemHeight: 10,
                textStyle: { fontSize: 12 },
                // 图例背景透明，减少视觉拥挤
                backgroundColor: 'transparent',
                textStyle: { 
                   
                    color: '#111'  // 设置文字颜色，可以是十六进制、RGB、颜色名称等
                },
            },
            grid: {
                // 小尺寸关键：增大边距比例确保标签和坐标轴完整显示
                left: '2%',      // 左侧留出空间给 y 轴文字
                right: '2%',
                top: '25%',       // 顶部留更多空间给图例和柱子顶部标签
                bottom: '1%',    // 底部留空间给 x 轴标签
                containLabel: true,
                // 可选：添加背景色便于调试，生产环境可移除
                backgroundColor: 'transparent'
            },
            xAxis: {
                type: 'category',
                data: Arr3,
                // 小尺寸下 x 轴标签旋转或间隔显示
                axisLabel: {
                    fontSize: 10,
                    
                    margin: 4
                },
                axisTick: { show: false }, // 隐藏刻度线，更简洁
                axisLine: { lineStyle: { width: 1 } }
            },
            yAxis: [
                {
                    type: 'value',
                    nameTextStyle: { fontWeight: 'bold', fontSize: 7 },
                    axisLabel: { 
                        formatter: '{value}',
                        fontSize: 7
                    },
                    splitLine: { lineStyle: { type: 'dashed', width: 0.5 } },
                    nameLocation: 'middle',
                    nameGap: 20
                },
                {
                    type: 'value',
                    position: 'right',
                    axisLabel: { show: false },
                    axisTick: { show: false },
                    axisLine: { show: false },
                    splitLine: { show: false }
                }
            ],
            series: [
                {
                    name: '加工栋',
                    type: 'bar',
                    stack: 'total', // 关键：同名 stack 会堆叠在一起
                    barWidth: '35%', // 柱子宽度
                    itemStyle: {
                        color: '#ffb11f' // 深红色
                    },
                    data: Arr1_1
                },
                {
                    name: '组装栋',
                    type: 'bar',
                    stack: 'total',
                    itemStyle: {
                        color: '#69c41b' // 草绿色
                    },
                    data: Arr1_2
                },
                {
                    name: '目标水量',
                    type: 'line',
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 5,          // 小尺寸下折线点缩小
                    data: Arr2,
                    itemStyle: {
                        color: '#c23531',
                        borderColor: '#c23531',
                        borderWidth: 1
                    },
                    lineStyle: { width: 1.5 },
                    // 折线图不显示标签，避免干扰
                    label: { show: false },
                    // 小尺寸下可以稍微降低平滑度，减少渲染开销
                    smooth: true
                }
            ],
            // 全局字体设置
            textStyle: { fontSize: 9 }
        };

        myChart.setOption(option);
        
        // 监听窗口大小变化
        window.addEventListener('resize', function() {
            myChart.resize();
        });
        
        // 可选：如果初始化后仍有显示问题，延迟微调一次
        setTimeout(() => {
            myChart.resize();
        }, 100);

}
function  ChartQ3(Arr1_1,Arr1_2,Arr2,Arr3){
         
        let myChart = echarts.init(document.getElementById('air_chart3'));
        
        let option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                // 小尺寸下 tooltip 字体稍小
                textStyle: { fontSize: 12 }
            },
            legend: {
                data: ['加工栋','组装栋', '目标电量'],
                // 小尺寸下图例放在底部或调整位置避免占用太多空间
                left: 'center',
                top: 0,
                itemWidth: 20,
                itemHeight: 10,
                textStyle: { fontSize: 12 },
                // 图例背景透明，减少视觉拥挤
                backgroundColor: 'transparent',
                textStyle: { 
                   
                    color: '#111'  // 设置文字颜色，可以是十六进制、RGB、颜色名称等
                },
            },
            grid: {
                // 小尺寸关键：增大边距比例确保标签和坐标轴完整显示
                left: '2%',      // 左侧留出空间给 y 轴文字
                right: '2%',
                top: '25%',       // 顶部留更多空间给图例和柱子顶部标签
                bottom: '1%',    // 底部留空间给 x 轴标签
                containLabel: true,
                // 可选：添加背景色便于调试，生产环境可移除
                backgroundColor: 'transparent'
            },
            xAxis: {
                type: 'category',
                data: Arr3,
                // 小尺寸下 x 轴标签旋转或间隔显示
                axisLabel: {
                    fontSize: 10,
                    
                    margin: 4
                },
                axisTick: { show: false }, // 隐藏刻度线，更简洁
                axisLine: { lineStyle: { width: 1 } }
            },
            yAxis: [
                {
                    type: 'value',
                    nameTextStyle: { fontWeight: 'bold', fontSize: 7 },
                    axisLabel: { 
                        formatter: '{value}',
                        fontSize: 7
                    },
                    splitLine: { lineStyle: { type: 'dashed', width: 0.5 } },
                    nameLocation: 'middle',
                    nameGap: 20
                },
                {
                    type: 'value',
                    position: 'right',
                    axisLabel: { show: false },
                    axisTick: { show: false },
                    axisLine: { show: false },
                    splitLine: { show: false }
                }
            ],
            series: [
                 {
                    name: '加工栋',
                    type: 'bar',
                    stack: 'total', // 关键：同名 stack 会堆叠在一起
                    barWidth: '35%', // 柱子宽度
                    itemStyle: {
                        color: '#ffb11f' // 深红色
                    },
                    data: Arr1_1
                },
                {
                    name: '组装栋',
                    type: 'bar',
                    stack: 'total',
                    itemStyle: {
                        color: '#69c41b' // 草绿色
                    },
                    data: Arr1_2
                },
                {
                    name: '目标电量',
                    type: 'line',
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 5,          // 小尺寸下折线点缩小
                    data: Arr2,
                    itemStyle: {
                        color: '#c23531',
                        borderColor: '#c23531',
                        borderWidth: 1
                    },
                    lineStyle: { width: 1.5 },
                    // 折线图不显示标签，避免干扰
                    label: { show: false },
                    // 小尺寸下可以稍微降低平滑度，减少渲染开销
                    smooth: true
                }
            ],
            // 全局字体设置
            textStyle: { fontSize: 9 }
        };

        myChart.setOption(option);
        
        // 监听窗口大小变化
        window.addEventListener('resize', function() {
            myChart.resize();
        });
        
        // 可选：如果初始化后仍有显示问题，延迟微调一次
        setTimeout(() => {
            myChart.resize();
        }, 100);

}
function getCurrentTime() {
    const now = new Date();
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 获取当月第一个工作日（排除周末）
function getFirstWorkDayOfMonth(year, month) {
    const firstDay = new Date(year, month, 1);
    let currentDay = new Date(firstDay);
    
    // 从1号开始找，直到找到第一个工作日
    while (currentDay.getDay() === 0 || currentDay.getDay() === 6) {
        currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return currentDay;
}

// 获取当月最后一个工作日（排除周末）
function getLastWorkDayOfMonth(year, month) {
    const lastDay = new Date(year, month + 1, 0);
    let currentDay = new Date(lastDay);
    
    // 从最后一天开始往前找，直到找到最后一个工作日
    while (currentDay.getDay() === 0 || currentDay.getDay() === 6) {
        currentDay.setDate(currentDay.getDate() - 1);
    }
    
    return currentDay;
}
// 格式化日期为 YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

//总工作时间：8:00 到次日 1:25，共 940分钟  去掉休息时间段  算当前时间的点的工作稼动率
function calculateUtilization(currentTime) {
    // 休息时段列表 (开始时间, 结束时间，单位：分钟从0:00开始)
    const breaks = [
        { start: 10 * 60, end: 10 * 60 + 10 },       // 10:00-10:10
        { start: 12 * 60, end: 12 * 60 + 45 },       // 12:00-12:45
        { start: 15 * 60, end: 15 * 60 + 10 },       // 15:00-15:10
        { start: 19 * 60, end: 19 * 60 + 30 },       // 19:00-19:30
        { start: 22 * 60, end: 22 * 60 + 10 }        // 22:00-22:10
    ];

    // 工作时间总长（分钟）：8:00 到 第二天 1:25
    const totalWorkMinutes = 940;

    // 将 "HH:MM" 转换成从 0:00 开始的分钟数
    function timeToMinutes(timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    }

    // 当前时间（分钟）
    const currentMinutes = timeToMinutes(currentTime);

    // 工作开始时间 8:00 = 480 分钟
    const workStart = 8 * 60;

    // 如果当前时间早于 8:00，则时长为 0
    if (currentMinutes <= workStart) {
        return 0;
    }

    // 从 8:00 到当前时间的总分钟数
    const totalMinutes = currentMinutes - workStart;

    // 计算这段时间内的休息分钟数
    let restMinutes = 0;
    for (const b of breaks) {
        const restStart = b.start;
        const restEnd = b.end;
        // 休息时段与 [workStart, currentMinutes] 的交集
        const overlapStart = Math.max(restStart, workStart);
        const overlapEnd = Math.min(restEnd, currentMinutes);
        if (overlapEnd > overlapStart) {
            restMinutes += (overlapEnd - overlapStart);
        }
    }

    // 净运行时间
    const netRunMinutes = totalMinutes - restMinutes;

    // 稼动率
    const utilization = netRunMinutes / totalWorkMinutes;

    return utilization;
}

// 获取当前时间的 "HH:MM" 格式
function getCurrentTimeString() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// 通用的修改出勤日方法
function updateWorkDay(val, val1) {
    var plan = val1;
    var fact = val;
    cumulativeWorkDays= val;
    totalWorkDaysOfMonth=val1;
    
    
    $.ajax({
        url: "/Local/updatePlanFact",
        type: "get",
        data: {
            Plan: plan,
            fact: fact
        },
        success: function(response) {
            if (response === "1") {
                console.log("修改成功");
 
                $("#totalWorkDaysOfMonth").val(`本月计划出勤 ${totalWorkDaysOfMonth} 日`);
                $("#Monthrate").html(Math.round((cumulativeWorkDays / totalWorkDaysOfMonth) * 100) + "%");
               
                showToast("数据已更新")
                 // 取消焦点
                $(document.activeElement).blur();
            } else {
                 
                showToast("修改失败")
                 // 取消焦点
                $(document.activeElement).blur();
            }
        },
        error: function() {
            showToast("请求失败");
             // 取消焦点
            $(document.activeElement).blur();
        }
    });
}
// ========== Toast 提示 ==========
function showToast(message) {
    $('.kpi-toast').remove();
    
    const $toast = $('<div>')
        .addClass('kpi-toast')
        .text(message)
        .css({
            'position': 'fixed',
            'top': '80px',
            'left': '50%',
            'transform': 'translateX(-50%)',
            'background': '#333333',
            'color': '#ffffff',
            'padding': '12px 24px',
            'border-radius': '8px',
            'font-size': '14px',
            'z-index': '9999',
            'box-shadow': '0 4px 12px rgba(0,0,0,0.2)',
            'white-space': 'nowrap'
        });
    
    $('body').append($toast);
    
    setTimeout(function() {
        $toast.fadeOut(300, function() {
            $(this).remove();
        });
    }, 3000);
}
