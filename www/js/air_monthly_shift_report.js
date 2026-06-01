$(function (){
    $("#air-start-year").val(new Date().getFullYear()-1);

    var chartDom = document.getElementById('air-monthly-chart');
    var myChart = echarts.init(chartDom);

    var option = {
        title: {
            text: '2025 年度月气压用量 (T)',
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
            data: ['加工', '组装', '2025 目标'],
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
            data: ['04 月', '05 月', '06 月', '07 月', '08 月', '09 月', '10 月', '11 月', '12 月', '01 月', '02 月', '03 月'],
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
            {
                name: '加工',
                type: 'bar',
                    stack: 'total',
                    barWidth: '35%',
                    itemStyle: {
                        color: '#ffb11f'
                    },
                stack: '2025 实际',
                data: [258, 102, 312, 72, 216, 132, 288, 54, 150, 234, 96, 204]
            },
            {
                name: '组装',
                type: 'bar',
                    stack: 'total',
                    itemStyle: {
                        color: '#69c41b'
                    },
                stack: '2025 实际',
                data: [172, 68, 208, 48, 144, 88, 192, 36, 100, 156, 64, 136]
            },
            {
                name: '2025 目标',
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
                data: [280, 410, 420, 320, 290, 410, 320, 230, 460, 340, 320, 290]
            }
        ]
    };

    myChart.setOption(option);

    window.addEventListener('resize', function() {
        myChart.resize();
    });
})
