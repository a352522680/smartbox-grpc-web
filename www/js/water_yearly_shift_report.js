$(function(){
    $("#water-yearly-end-year").val(new Date().getFullYear()-1);

    // 1. 初始化 ECharts 实例
        var chartDom = document.getElementById('water-yearly-chart');
        var myChart = echarts.init(chartDom);

        // 2. 配置项
        var option = {
            title: {
                text: '2018-2025 年度用水量(T)',
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
                data: ['水实际', '水目标'],
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
                    name: '水实际',
                    type: 'bar',
                    barWidth: '45%',
                     itemStyle: {
                        color: new echarts.graphic.LinearGradient(
                            0, 0, 0, 1, // 从 (x1, y1) 到 (x2, y2)，即从上到下
                            [
                                { offset: 0, color: '#4c84df' }, // 0% 处的颜色
                                { offset: 1, color: '#2e63c5' }  // 100% 处的颜色
                            ]
                        ),
                        borderRadius: [4, 4, 0, 0]
                    },
                    data: [3900, 5700, 8200, 3900, 3100, 1800, 2400, 2600]
                },
                {
                    name: '水目标',
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

        // 3. 设置配置项并渲染图表
        myChart.setOption(option);

        // 4. 窗口大小变化时自适应
        window.addEventListener('resize', function() {
            myChart.resize();
        });
})