$(function(){
    $("#air-yearly-end-year").val(new Date().getFullYear()-1);

    var chartDom = document.getElementById('air-yearly-chart');
    var myChart = echarts.init(chartDom);

    var option = {
        title: {
            text: '2018-2025 年度气压用量(T)',
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
            data: ['气压实际', '气压目标'],
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
            data: ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'],
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
            max: 8000,
            interval: 1600,
            splitLine: {
                lineStyle: {
                    type: 'solid',
                    color: '#f0f0f0'
                }
            },
            axisLabel: {
                formatter: function (value) {
                    return value.toLocaleString();
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
                
                data: [2580, 1020, 3120, 720, 2160, 1320, 2880, 540, 1500, 2340, 960, 2040]
            },
            {
                name: '组装',
                type: 'bar',
                    stack: 'total',
                    itemStyle: {
                        color: '#69c41b'
                    },
                
                data: [1720, 680, 2080, 480, 1440, 880, 1920, 360, 1000, 1506, 640, 1036]
            },
            {
                name: '气压目标',
                type: 'line',
                symbol: 'emptyCircle',
                symbolSize: 8,
                lineStyle: {
                    width: 2,
                    color: '#f59e0b'
                },
                itemStyle: {
                    color: '#f59e0b',
                    borderColor: '#f59e0b',
                    borderWidth: 1
                },
                data: [4200, 4050, 3900, 3750, 3600, 3350, 2200, 2600]
            }
        ]
    };

    myChart.setOption(option);

    window.addEventListener('resize', function() {
        myChart.resize();
    });
})
