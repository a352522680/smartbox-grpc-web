$(function (){
    $("#water-start-year").val(new Date().getFullYear()-1);

    var chartDom = document.getElementById('water-monthly-chart');
    var myChart = echarts.init(chartDom);

    var option = {
        title: {
            text: '2025年度月用水量(T)',
            left: '20px',
            top: '10px',
            textStyle: {
                fontSize: 18,
                fontWeight: 'bold',
                color: '#333'
            }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross'
            }
        },
        legend: {
            data: ['2025实际', '2025目标'],
            right: '20px',
            top: '15px',
            icon: 'circle',
            itemWidth: 10,
            itemHeight: 10
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: ['04月', '05月', '06月', '07月', '08月', '09月', '10月', '11月', '12月', '01月', '02月', '03月'],
            axisTick: {
                alignWithLabel: true
            },
            axisLine: {
                lineStyle: {
                    color: '#3e3d3d'
                }
            }
        },
        yAxis: {
            type: 'value',
            min: 0,
            max: 650,
            interval: 100,
            splitLine: {
                lineStyle: {
                    type: 'solid',
                    color: '#f0f0f0'
                }
            }
        },
        series: [
            // 已移除橘黄色柱子（2018实际）
            {
                name: '2025实际',
                type: 'bar',
                barWidth: '30%',
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(
                        0, 0, 0, 1,
                        [
                            { offset: 0, color: '#4c84df' },
                            { offset: 1, color: '#2e63c5' }
                        ]
                    ),
                    borderRadius: [4, 4, 0, 0]
                },
                // 蓝色柱子的数据（2025实际）
                data: [430, 170, 520, 120, 360, 220, 480, 90, 250, 390, 160, 340]
            },
            {
                name: '2025目标',
                type: 'line',
                symbol: 'emptyCircle',
                symbolSize: 8,
                lineStyle: {
                    width: 2,
                    color: '#5b9bd5'
                },
                itemStyle: {
                    color: '#5b9bd5',
                    borderColor: '#5b9bd5',
                    borderWidth: 1
                },
                // 蓝色折线的数据
                data: [280, 410, 420, 320, 290, 410, 320, 230, 460, 340, 320, 290]
            }
        ]
    };

    myChart.setOption(option);

    window.addEventListener('resize', function() {
        myChart.resize();
    });
})