
$(window).resize(function () {          //当浏览器大小变化时缩放
    var oldx = $(window).width();
    var oldy = $(window).height()
    let sx = $(window).width() / 1707;
    let sy = $(window).height() / 932;
    $("#main").css("transform", "scale(" + sx + "," + sy + ")");
    $("#main").css("transform-origin", "left top")
});
var Language='1'
$(function(){
    $("#GraphText").html(Graph_L[Language])
    $("#MachineModeText").html(MachineMode_L[Language])
    $("#ConnectText").html(Connect_L[Language])
    $("#StatusSummaryText").html(StatusSummary_L[Language])
    $("#RunningTimeText").html(RunningTime_L[Language])
    $("#AlarmTimeText").html(AlarmTime_L[Language])
    $("#RunningText").html(Running_L[Language])
    $("#AlarmText").html(Alarm_L[Language])
})
var Isshow = false;
var ip="";
var port="";
var MachineName=""
var SetTimeout="";
var SetTimeout2="";
var SetTimeout3="";
var Refresh=(1000 * 60 * 10);//刷新率 --> 10分钟

var Stime="";
var Etime="";
var DateTime="";
var MachineModeType="";
var Tag = true;

// 华兴 新加开始
const MachineType = {
  HEIDENHAIN: 0,
  FANUC: 1,
  HURCO: 2,
  MITSUBISHI: 3,
  HAAS: 4,
  FAGOR: 5,
  GSK: 6
};

// Convert the mapping to allow reverse lookup
const MachineTypeReverse = Object.entries(MachineType).reduce((acc, [key, value]) => {
  acc[value] = key;
  return acc;
}, {});

function getMachineTypeName(value) {
  return MachineTypeReverse[value] || "UNKNOWN"; // Fallback to "UNKNOWN" if not found
}
function getSelectedIp(context = "") {
  const selectedIp = sessionStorage.getItem('selectedIp');
  if (selectedIp) {
    console.log(`${context} Using selected IP from sessionStorage:`, selectedIp);
    return selectedIp;
  } else {
    console.log(`${context} No selected IP from sessionStorage; falling back to LocalConfig IP.`);
    return ip; // Fallback to the default IP from LocalConfig if no selection
  }
}

function getSelectedPort(context = "") {
  const selectedPort = sessionStorage.getItem('selectedPort');
  if (selectedPort) {
    console.log(`${context} Using selected Port from sessionStorage:`, selectedPort);
    return selectedPort;
  } else {
    console.log(`${context} No selected Port from sessionStorage; falling back to LocalConfig Port.`);
    return port; // Fallback to the default Port from LocalConfig if no selection
  }
}

function getSelectedType(context = "") {
  const selectedType = sessionStorage.getItem('selectedType');
  if (selectedType) {
    console.log(`${context} Using selected Type from sessionStorage:`, selectedType);
    return selectedType;
  } else {
    console.log(`${context} No selected Type from sessionStorage; falling back to LocalConfig MachineModeType.`);
    return MachineModeType; // Fallback to the default MachineModeType from LocalConfig if no selection
  }
}

function updateSelectedMachineInfo(selectedValue, selectedDataset) {
  // console.log(`selectedValue = ${selectedValue}`);

  sessionStorage.setItem('selectedIp', selectedDataset.ip);
  sessionStorage.setItem('selectedPort', selectedDataset.port);
  sessionStorage.setItem('selectedType', selectedDataset.type);
  sessionStorage.setItem('selectedMid', selectedDataset.Mid);
  // console.log("Selected IP stored:", selectedDataset.ip);
  // console.log("Selected Port stored:", selectedDataset.port);
  // console.log("Selected Type stored:", selectedDataset.type);
  $("#Start-YMD").val(YYYYMMDD());
    var ShowType= selectedDataset.ShowType;
   JumpWeb(ShowType);
  // Invoke Refresh_ after updating the IP
  Refresh_();
}

function parseUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const params = {};

  // Normalize all keys to lowercase
  for (const [key, value] of urlParams.entries()) {
    params[key.toLowerCase()] = value;
  }

  return params;
}
var ShowType="";
// function loadDropdownData() {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const response = await fetch('/MachineConfig.json');
//       const data = await response.json();

//       const dropdown = document.getElementById('MachineConfigDropdown');
//       // Clear any existing options to prevent duplication
//       dropdown.innerHTML = '';

//       data.options.forEach(option => {
//         const opt = document.createElement('option');
//         opt.value = `${option.ip}:${option.port}`; // Concatenate IP and port
//         opt.textContent = option.label; // Set label as the visible text

//         // Add original attributes as data-* attributes
//         opt.dataset.ip = option.ip;
//         opt.dataset.port = option.port;
//         opt.dataset.type = option.type;
//         opt.dataset.ShowType = option.ShowType;
//          opt.dataset.Mid = option.Mid;
//         dropdown.appendChild(opt); // Add to the dropdown
//       });

//       // Parse URL parameters (case-insensitive)
//       const params = parseUrlParams();
//       const urlMachine = params['machine'];
//       const urlIp = params['ip'];
//       const urlPort = params['port'];

//       let selectedOption = null;

//       if (urlMachine) {
//         // Priority 1: Select based on machine name
//         selectedOption = Array.from(dropdown.options).find(opt => opt.textContent === urlMachine);
//       } else if (urlIp && urlPort) {
//         // Priority 2: Select based on IP and port
//         selectedOption = Array.from(dropdown.options).find(opt => opt.dataset.ip === urlIp && opt.dataset.port === urlPort);
//       } else {
//         // Priority 3: Select based on previous session
//         const prevSelectedIp = sessionStorage.getItem('selectedIp');
//         const prevSelectedPort = sessionStorage.getItem('selectedPort');
//         console.log(`session ip=${prevSelectedIp}, port=${prevSelectedPort}`);
//         if (prevSelectedIp && prevSelectedPort) {
//           selectedOption = Array.from(dropdown.options).find(opt => opt.dataset.ip === prevSelectedIp && opt.dataset.port === prevSelectedPort);
//         }
//       }

//       if (!selectedOption && dropdown.options.length > 0) {
//         // Priority 4: Default to the first option
//         selectedOption = dropdown.options[0];
//         console.log("Defaulting to first option in dropdown.");
//       }

//       if (selectedOption) {
//         dropdown.value = selectedOption.value;
//         sessionStorage.setItem('selectedIp', selectedOption.dataset.ip);
//         sessionStorage.setItem('selectedPort', selectedOption.dataset.port);
//         sessionStorage.setItem('selectedType', selectedOption.dataset.type);
//         console.log(`Session Storage (on dropdown load) set values: ip=${selectedOption.dataset.ip}, port=${selectedOption.dataset.port}, type=${selectedOption.dataset.type}`)
//       } else {
//         console.error("No valid dropdown selection found.");
//       }

//       // Clear URL parameters after initial load
//       history.replaceState(null, '', window.location.pathname);

//       resolve();
//     } catch (error) {
//       console.error('Error loading dropdown data:', error);
//       reject(error);
//     }
//   });
// }
 function loadDropdownData() {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch('/MachineConfig.json');
      const data = await response.json();

      const dropdown = document.getElementById('MachineConfigDropdown');
      // Clear any existing options to prevent duplication
      dropdown.innerHTML = '<option value="">-- 请选择机床 --</option>';

      // 按 type 分组
      const categoryMap = new Map();
      data.options.forEach(option => {
        const category = option.type || "其他";  // 使用 type 作为分组依据
        if (!categoryMap.has(category)) {
          categoryMap.set(category, []);
        }
        categoryMap.get(category).push(option);
      });

      // 创建 optgroup 分组
      for (const [category, options] of categoryMap) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = category;  // 显示 FANUC, HEIDENHAIN, HURCO 等
        
        options.forEach(option => {
          const opt = document.createElement('option');
          opt.value = `${option.ip}:${option.port}`;
          opt.textContent = option.label;
          
          // Add original attributes as data-* attributes
          opt.dataset.ip = option.ip;
          opt.dataset.port = option.port;
          opt.dataset.type = option.type;
          opt.dataset.ShowType = option.ShowType;
          opt.dataset.Mid = option.Mid;
          
          optgroup.appendChild(opt);
        });
        
        dropdown.appendChild(optgroup);
      }

      // 添加CSS样式使optgroup更美观
      const style = document.createElement('style');
      style.textContent = `
        #MachineConfigDropdown optgroup {
          font-weight: bold;
          background-color: #f0f2f5;
          color: #1a1a2e;
          font-size: 13px;
          padding: 5px 0;
        }
        #MachineConfigDropdown optgroup option {
          font-weight: normal;
          padding-left: 20px;
          background-color: white;
          color: #333;
        }
        #MachineConfigDropdown optgroup option:hover {
          background-color: #e8f0fe;
        }
      `;
      document.head.appendChild(style);

      // Parse URL parameters (case-insensitive)
      const params = parseUrlParams();
      const urlMachine = params['machine'];
      const urlIp = params['ip'];
      const urlPort = params['port'];

 
      //下拉选中
        // Parse URL parameters (case-insensitive)
         
        const urlMid =sessionStorage.getItem('selectedMid');

        let selectedOption = null;

        // 根据 Mid 选中
        if (urlMid) {
            for (const opt of dropdown.options) {
                if (opt.dataset?.Mid == urlMid) {
                    selectedOption = opt;
                    console.log(`找到 Mid=${urlMid} 的选项:`, opt.textContent);
                    break;
                }
            }
        }

        // 如果没有通过 Mid 选中，且 dropdown 有选项，默认选中第一个（跳过 placeholder）
        if (!selectedOption && dropdown.options.length > 1) {
            selectedOption = dropdown.options[1];
            console.log("没有 mid 参数，默认选中第一个选项:", selectedOption.textContent);
        }

        // 执行选中
        if (selectedOption && selectedOption.value) {
            //dropdown.value = selectedOption.value;
			dropdown.selectedIndex = Array.from(dropdown.options).indexOf(selectedOption);
            if (selectedOption.dataset) {
                sessionStorage.setItem('selectedIp', selectedOption.dataset.ip);
                sessionStorage.setItem('selectedPort', selectedOption.dataset.port);
                sessionStorage.setItem('selectedType', selectedOption.dataset.type);
                sessionStorage.setItem('selectedMid', selectedOption.dataset.Mid);
                console.log(`选中并保存: mid=${selectedOption.dataset.mid}`);
            }
        }

      // Clear URL parameters after initial load
      history.replaceState(null, '', window.location.pathname);

      resolve();
    } catch (error) {
      console.error('Error loading dropdown data:', error);
      reject(error);
    }
  });
}

function isValidIp(ip) {
  const ipPattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ip && ipPattern.test(ip);
}
//  新加完毕

//  更改
document.addEventListener('DOMContentLoaded', async () => {

  var oldx = $(window).width();
  var oldy = $(window).height()
  let sx = $(window).width() / 1707;
  let sy = $(window).height() / 932;
  $("#main").css("transform", "scale(" + sx + "," + sy + ")");
  $("#main").css("transform-origin", "left top")
  laydate.render({
    elem: '#Start-YMD' //指定元素
    , lang: 'en'
    , theme: '#000000'   
  });

  laydate.render({
    elem: '#Start-HMS' //指定元素
    , lang: 'en'
    , type: 'time'
    , theme: '#000000'
  });

    laydate.render({
        elem: '#startDate'
        , lang: 'en'
        ,type: 'datetime'
        ,range: true
        , theme: '#000000'
    });
  
  //
  var myChart = echarts.init(document.getElementById('mainChart'));
  myChart.showLoading({
    text: 'loading...',
    color: '#c23531',
    textColor: '#000000',
    maskColor: 'rgba(255, 255, 255, 0.2)',
    zlevel: 0
  });

  await loadDropdownData(); // Ensure loadDropdownData completes first
  var ShowType = $("#MachineConfigDropdown").find('option:selected').attr("data--show-type");
  JumpWeb(ShowType)
  var ShowArr = [];
  $.ajax({
    url: "/Local/read",
    type: "Get",
    datatype: "json",
    async: false,
    success: function (data) {
      for (var i = 0; i < data.data.length; i++) {
        if (data.data[i].status == "0") {
          ShowArr.push(data.data[i].id)
          $("#WidgetsBox").append('<div id="wb' + data.data[i].id + '" wb=' + data.data[i].id + ' onclick="WBbut(this)"><span>' + data.data[i].name + '</span></div>')
        }
        else {
          $("#WidgetsBox").append('<div style=" background: #eeecec;" id="wb' + data.data[i].id + '" wb=' + data.data[i].id + '><span>' + data.data[i].name + '</span><span class="tick">✔</span></div>')
        }
      }

      ip = data.ip;
      port = data.port;
      MachineName = data.MachineName;
      Stime = data.STime;
      Etime = data.ETime;
      DateTime = data.STime;
      MachineModeType = data.MachineModeType;

      $("#Start-HMS").val(DateTime);
      $("#MachineName").val(MachineName);
    },
    error: function (err) {
      console.log(err);
    }
  });


  // Generate a unique ID for this tab (only if it doesn't already exist)
  if (!sessionStorage.getItem('tabId')) {
    sessionStorage.setItem('tabId', Math.random().toString(36).slice(2, 9));  // Simple UUID generator
  }

  //显示图像
  show(ShowArr);

  //填充时间
    var timeRange = getQueryTimeRange();
    Stime = timeRange.Stime + " " + Stime;
    Etime = getCurrentDateTime();
    $("#Start-YMD").val(timeRange.Stime);
    $("#End-YMD").html(timeRange.Etime);
//   Stime = YYYYMMDD() + " " + Stime;
//   Etime = YYYYMMDD2() + " " + Etime;
//   $("#Start-YMD").val(Stime.split(' ')[0]);
//   $("#End-YMD").html(Etime.split(' ')[0]);


  const startYmdElement = document.getElementById('Start-YMD');
  if (startYmdElement) {
    let lastValue = startYmdElement.value;
    const pollInterval = 200; // Adjust as needed

    setInterval(() => {
      const currentValue = startYmdElement.value;
      if (currentValue !== lastValue) {
        lastValue = currentValue;

        // Update End-YMD
        const startDate = new Date(currentValue);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 1);
        // Format the date
        const formattedEndDate = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
        // Update the HTML content of #End-YMD
        $("#End-YMD").html(formattedEndDate);
      }
    }, pollInterval);
  }

  LeftOne();
 
  Chart();

 
});

//左1
var LeftOne =()=>{
    //var mid = $("#MachineConfigDropdown").find('option:selected').attr("data--mid");
    var mid=sessionStorage.getItem("selectedMid");
    $.ajax({
        url: "/ThreeUtilization/use",      
        data:{
            ip: getSelectedIp("QueryEfficiency"), 
            port: getSelectedPort("QueryEfficiency"), 
            start:formatDate(Stime),
            end:formatDate(Etime),
            cnc_uid:mid,
            type:'utilization'
        },
        type: "get",          
        datatype: "json",
        
        headers: {
          'tab-id': sessionStorage.getItem('tabId')  // Include the unique tab ID in the headers
        },
        
        success: function (data) {
             
            if(data.success==false){
                console.log("未返回数据")
                return
            }
            console.log(data.data.cnc_utilization.connected_percent[0])
            console.log(data.data.cnc_utilization.error_percent[0])
            console.log(data.data.cnc_utilization.running_percent[0])
            
            var Time = data.data.cnc_utilization.connected_percent[0].toFixed(2) ;
            $("#barValue1").css("width",parseInt(Time)+"%");
            $("#PercentValue1").html(parseInt(Time)+"%")

            var Time = data.data.cnc_utilization.running_percent[0].toFixed(2) ;
            $("#barValue2").css("width",parseInt(Time)+"%");
            $("#PercentValue2").html(parseInt(Time)+"%")

            var Time = data.data.cnc_utilization.error_percent[0].toFixed(2) ;
            $("#barValue4").css("width",parseInt(Time)+"%");
            $("#PercentValue4").html(parseInt(Time)+"%")
        },        
        complete: function (XHR, TS) {
            XHR = null;
            if(Tag){
                SetTimeout = self.setTimeout(function(){
                    if($("#left_1").length>0){
                      LeftOne();
                    }
                }, Refresh);
            }


        },
        error: function (err) { 
            console.log(err); 
        }
    });
}

 
 
//图形；
var tagCount=0;
var Chart=()=>{
    //var mid = $("#MachineConfigDropdown").find('option:selected').attr("data--mid");
    var mid=sessionStorage.getItem("selectedMid");
    var arrcx=[];

    $.ajax({
        url: "/ThreeHistory/history",      
        data:{
            ip: getSelectedIp("Historical Data"), 
            port: getSelectedPort("Historical Data"), 
            start:formatDate(Stime),
            end:formatDate(Etime),
            cnc_uid:mid,
            type:'history'
        },
        type: "get",          
        datatype: "json",
        
        headers: {
          'tab-id': sessionStorage.getItem('tabId')  // Include the unique tab ID in the headers
        },
      
        success: function (data) {
            if(data.success==true){
                tagCount++;
              if (tagCount < 10) {
                Chart();
              }
              else {
                tagCount = 0;
              }
            }
            var RunData2 = [];
            var AlarmData = [];
            for(var x=0;x<data.events.length;x++){
                var ChartData=data.events[x];
                
                if(ChartData.cnc_status_name=="RUNNING"){
                    var starttime = [new Date(ConvertDateFromUtcToLocal(ChartData.start_time)), '7'];
                    RunData2.push(starttime)
                    var endtime =[new Date(ConvertDateFromUtcToLocal(ChartData.end_time)), '7'];
                    RunData2.push(endtime)
                    var endtime =[new Date(ConvertDateFromUtcToLocal(ChartData.end_time)), ''];
                    RunData2.push(endtime)


                }
                if(ChartData.cnc_status_name=="ERROR"){
                     var starttime = [new Date(ConvertDateFromUtcToLocal(ChartData.start_time)), '7'];
                    AlarmData.push(starttime)
                    var endtime =[new Date(ConvertDateFromUtcToLocal(ChartData.end_time)), '7'];
                    AlarmData.push(endtime)
                    var endtime =[new Date(ConvertDateFromUtcToLocal(ChartData.end_time)), ''];
                    AlarmData.push(endtime)
                }

            }
            var ly5 = {
                name: "Running",
                type: 'line',
                step: 'end',
                data: RunData2,
                color: '#61cf3c',
                symbolSize: 6,   //折线点的大小
                itemStyle: {
                    normal: {
                        lineStyle: {        // 系列级个性化折线样式 
                            width: 40,
                            type: 'solid',//线条渐变色 
                        }
                    }
                }
            }
            arrcx.push(ly5)
            var ly6 = {
                name: "Alarm",
                type: 'line',
                step: 'end',
                data: AlarmData,
                color: '#f45152',
                symbolSize: 6,   //折线点的大小
                itemStyle: {
                    normal: {
                        lineStyle: {        // 系列级个性化折线样式 
                            width: 40
                        }
                    }
                }
            }

            arrcx.push(ly6);
            //绘制图形
            var myChart = echarts.init(document.getElementById('mainChart'));
             myChart.showLoading({
    text: 'loading...',
    color: '#c23531',
    textColor: '#000000',
    maskColor: 'rgba(255, 255, 255, 0.2)',
    zlevel: 0
  });
            var option = {
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(156,156,156,0.8)',// 背景颜色
                    textStyle: {
                        color: 'black'
                    },
                    formatter: function (params, ticket, callback) {
                        var htmlStr = '';
                        var name = '';
                        var namearr = [];
                        for (var i = 0; i < params.length; i++) {
                            var param = params[i];

                            var xName = param.name;//x轴的名称
                            var seriesName = param.seriesName;//图例名称
                            var seriescolor = param.color
                            if ($.inArray(seriesName, namearr) < 0) {
                                namearr.push(seriescolor);

                            }
                            else {
                                continue;
                            }
                            var value = param.value[0];//y轴值
                            var year = value.getFullYear();
                            var month = value.getMonth() + 1; //js从0开始取
                            var date1 = value.getDate();
                            var hour = value.getHours();
                            var minutes = value.getMinutes();
                            var second = value.getSeconds();
                            var datatime = year + "-" + month + "-" + date1 + " " + hour + ":" + minutes + ":" + second;
                            if (seriescolor + datatime + seriesName == name) {
                                continue;
                            }
                            var color = param.color;//图例颜色

                            var zhi = param.value[1];
                            var bj = param.value[2];//报警信息

                            if (i === 0) {
                                htmlStr += xName + '<br/>';//x轴的名称
                            }
                            htmlStr += '<div>';
                            //为了保证和原来的效果一样，这里自己实现了一个点的效果
                            htmlStr += '<span style="margin-right:5px;display:inline-block;width:10px;height:10px;border-radius:5px;background-color:' + color + ';"></span>';

                            // 文本颜色设置--2020-07-23(需要设置,请解注释下面一行)
                            //htmlStr += '<span style="color:'+color+'">';

                            //圆点后面显示的文本
                            if (seriesName == "FeedOverride") {
                                htmlStr += seriesName + '：' + datatime + "{" + zhi * 150 + "}";
                            }
                            else if (seriesName == "Alarm") {
                                htmlStr += seriesName + '：' + datatime + "{" + bj + "}";
                            }
                            else if(seriesName=="Mode"){
                                 htmlStr += param.value[3]; + '：' + datatime;
                            }
                            else {
                                htmlStr += seriesName + '：' + datatime;
                            }
                            // 文本颜色设置--2020-07-23(需要设置,请解注释下面一行)
                            //htmlStr += '</span>';

                            htmlStr += '</div>';
                            name = seriescolor + datatime + seriesName;
                        }

                        return htmlStr;
                    }

                },
                animation: false,
                grid: {
                    left: 10,
                    right: 20,
                    top: "0px",
                    bottom: 0,
                    containLabel: true
                },
                xAxis: {
                    type: 'time',
                    axisLabel: {   // X轴线 标签修改 
                        textStyle: {
                           
                            fontSize:'12px'
                        }
                    },
                    axisTick: {
                        show: true, // 显示轴刻度
                        alignWithLabel: true // 刻度与标签对齐
                    
                    },
                    axisLine: {
                        lineStyle: {
                           
                            width: 1,//这里是为了突出显示加上的  
                        }
                    }
                },
                dataZoom: [{
                    type: "inside",
                    disabled: false,
                    filterMode: 'none'
                }],
                yAxis: {
                    type: 'value',
                    minInterval: 14,
                    interval: 14, //每次增加几个
                    splitLine: { show: false },
                    axisLine: {
                        show:true,
                        lineStyle: {
                            
                            width: 1,//这里是为了突出显示加上的  
                        }
                    },
                    axisTick: {
                        show: false,
                        inside: true
                    },
                    axisLabel: {
                        formatter: function () {
                            return "";
                        }

                    }
                },
                series: arrcx
            };
            myChart.setOption(option);
            if (arrcx.length != 0) {
                myChart.hideLoading();
                arrcx = [];

            }
            else if (arrcx.length == 0) {
                myChart.hideLoading();
                arrcx = [];

            }
        },
        complete: function (XHR, TS) {
            XHR = null;
            if(Tag){
              SetTimeout3 = self.setTimeout(function () {
                    console.log("Timeout3 Chart called")
                    Chart();
                }, Refresh);
            }


        },
        error: function (err) { 
            console.log(err); 
        }
    });



}


//自定义的显示模块
var Widget=()=>{
    if($("#WidgetsBox").css("display")=="none"){
        $("#WidgetsBox").css("display","block")
    }
    else{
        $("#WidgetsBox").css("display","none")
    }

}
var WBbut=(obj)=>{
    var wb=$(obj).attr("wb");
    var id=$(obj).attr("id")
    $("#"+id+" .tick").remove();
    $(obj).append('<span class="tick">✔</span>')
    modules(wb,"1")
}

var but_Machine=()=>{
    var MachineName=$("#MachineName").val();
    var ly=[{
        "MachineName":MachineName
    }];
    var jsons=JSON.stringify(ly);
    $.ajax({
        url: "/Local/edit",      
        data:{jsons},
        type: "get",          
        datatype: "json",
        success: function (data) {
            if(data=="1"){
                alert("Update completed")
            }
        },
        error: function (err) { 
            console.log(err); 
        }
    });
}
var EditTime_=()=>{
    var Time=$("#Start-HMS").val();

    var ly=[{
        "Time":Time
    }];
    var jsons=JSON.stringify(ly);
    $.ajax({
        url: "/Local/editTime",      
        data:{jsons},
        type: "get",          
        datatype: "json",
        success: function (data) {
            if(data=="1"){
                alert("Update completed")
            }
            location.reload()
        },
        error: function (err) { 
            console.log(err); 
        }
    });
}
//停止计时器
var Stop=()=>{
    clearTimeout(SetTimeout);
    clearTimeout(SetTimeout2);
    clearTimeout(SetTimeout3);
}
//显示模块
function show(arr){
    if(arr.length!=0){
        for(var i=0;i<arr.length;i++){
            if(arr[i]<=6){
                _Close1(arr[i])
                _Close2(arr[i])
            }
            else{
                _Close3(arr[i])

            }
        }
    }
}


//补8小时
function ConvertDateFromUtcToLocal(date) {
    const d = new Date();
    //let diff = -(d.getTimezoneOffset() / 60);
    var newDate = new Date(date);
    //newDate.setHours(newDate.getHours() + diff);
    var year = newDate.getFullYear();
    var mon = newDate.getMonth() + 1;
    var day = newDate.getDate();
    var h = newDate.getHours();
    var m = newDate.getMinutes();
    var s = newDate.getSeconds();
    return year + "-" + Appendzero(mon) + "-" + Appendzero(day) + " " + Appendzero(h) + ":" + Appendzero(m) + ":" + Appendzero(s);
}
//补0
function Appendzero(obj) {
    if (obj < 10) return "0" + "" + obj;
    else return obj;
}


function _Close1(obj){

    if($("#left_one .left_small_box").length==1){
        return;
    }

    var id="";
    if(typeof obj=="object"){
        id=$(obj).attr("id").split('_')[2];
        modules(id,"0")
    }
    else{
        id=obj;
    }
    if(id>4){
        return;
    }
    var width=$("#left_"+id).width()
    var height=$("#left_"+id).height();
    $("#left_"+id).remove();
    $("#wb"+id+" .tick").remove();

    if(parseInt(id)%2==0){
        let count=0;
        if($("#left_4").length>0){
            var height_=$("#left_4").height();
            $("#left_4").css("min-height",height_+height+8+"px");
            $("#left_4").css("top","0")
            count++
        }
        if($("#left_2").length>0){
            var height_=$("#left_2").height();
            $("#left_2").css("min-height",height_+height+8+"px");
            $("#left_2").css("top","0")
            count++
        }
        if(count==0){
            var width_=$("#left_1").width();
            $("#left_1").css("min-width",width+width_+8+"px");
            var width_=$("#left_3").width();
            $("#left_3").css("min-width",width+width_+8+"px");
        }
    }
    else{
        let count=0;
        if($("#left_1").length>0){
            var height_=$("#left_1").height();
            $("#left_1").css("min-height",height_+height+8+"px");
            $("#left_1").css("top","0")
            count++
        }
        if($("#left_3").length>0){
            var height_=$("#left_3").height();
            $("#left_3").css("min-height",height_+height+8+"px");
            $("#left_3").css("top","0")
            count++
        }
        if(count==0){
            var width_=$("#left_2").width();
            $("#left_2").css("min-width",width+width_+8+"px");
            var width_=$("#left_4").width();
            $("#left_4").css("min-width",width+width_+8+"px");
        }
    }

}
function _Close2(obj){
    if($("#left_two .Lt").length==1){
        return;
    }
    var id="";
    if(typeof obj=="object"){
        id=$(obj).attr("id").split('_')[2];
        modules(id,"0")
    }
    else{
        id=obj;
    }
    var height=$("#left_"+id).height();
    $("#left_"+id).remove();
    $("#wb"+id+" .tick").remove();

    if(id=="5"){
        var height1=$("#left_6_main").height();
        var height_=$("#left_6").height();
        $("#left_6").css("min-height",height_+height+8+"px");
        //$("#left_6_main").css("height","280px")
        $("#left_6_main").css("height",height1*2+50+"px")
    }
    else{
        var height1=$("#left_5_box").height();
        var height_=$("#left_5").height();
        $("#left_5").css("min-height",height_+height+8+"px");
        $("#left_5_box").css("height",height1*2+50+"px")
    }

}
function _Close3(obj){
    if($("#right .Rt").length==1){
        return;
    }
    var id="";
    if(typeof obj=="object"){
        id=$(obj).attr("id").split('_')[2];
        modules(id,"0")
    }
    else{
        id=obj;
    }
    var height=$("#right_"+id).height();
    var height2=$("#right_"+id+"_box").height();
    $("#right_"+id).remove();
    $("#wb"+id+" .tick").remove();
    if(id=="8"){
        var height_=$("#right_9").height();
        var height_2=$("#right_9_box").height();
        $("#right_9").css("min-height",height_+height+8+"px");
        $("#right_9_box").css("height",height_2+height2+60+"px");

        var height_=$("#right_8").height();
        var height_2=$("#right_8_box").height();
        $("#right_8").css("min-height",height_+height+8+"px");
        $("#right_8_box").css("height",height_2+height2+60+"px");
    }
    else{
        var height_=$("#right_8").height();
        var height_2=$("#right_9_box").height();
        $("#right_8").css("min-height",height_+height+8+"px");
        $("#right_8_box").css("height",height_2+height2+60+"px");

        var height_=$("#right_9").height();
        $("#right_9").css("min-height",height_+height+8+"px");
        $("#right_9_box").css("height",height_2+height2+60+"px");
    }

}

//刷新
var Refresh_ = () => {
    console.log("!!!!!!!!!!!!!!!!!!! Refresh invoked")

    Tag=false;
    Stop();
    if(YYYYMMDD()==$("#Start-YMD").val()){
        location.reload()
    }
    var myChart = echarts.init(document.getElementById('mainChart'));
    myChart.setOption( {
        series: [{
            // 重置为初始状态或者清空数据
            data: []
        }]
    });
    myChart.clear();
       myChart.showLoading({
    text: 'loading...',
    color: '#c23531',
    textColor: '#000000',
    maskColor: 'rgba(255, 255, 255, 0.2)',
    zlevel: 0
  });
      var timeRange = getQueryTimeRange();
    Stime = timeRange.Stime + " " + Stime;
    Etime = getCurrentDateTime();
    $("#Start-YMD").val(timeRange.Stime);
    $("#End-YMD").html(timeRange.Etime);
    // Stime=$("#Start-YMD").val()+" "+DateTime;
    // Etime=TT($("#Start-YMD").val())+" "+DateTime;
    // $("#Start-YMD").val(Stime.split(' ')[0]);
    // $("#End-YMD").html(Etime.split(' ')[0]);

    LeftOne();
 
    Chart();
 
}

var Refresh_2 = () => {
    debugger;
    Tag=false;
    Stop();
    //var mid = $("#MachineConfigDropdown").find('option:selected').attr("data--mid");
    var mid=sessionStorage.getItem("selectedMid");
    $("#popup").css("display","block")
    var timeRange = getQueryTimeRange();
    Stime = timeRange.Stime + " " + Stime;
    Etime = getCurrentDateTime();
    $("#Start-YMD").val(timeRange.Stime);
    $("#End-YMD").html(timeRange.Etime);
    $.ajax({
        url: "/ThreeUtilization/use",      
        data:{
            ip: getSelectedIp("QueryEfficiency"), // 华兴 更改
            port: getSelectedPort("QueryEfficiency"), // 华兴 更改
            start:formatDate(Stime),
            end:formatDate(Etime),
            cnc_uid:mid,
            type:'utilization'
        },
        type: "get",          
        datatype: "json",
        // 华兴 新加开始
        headers: {
          'tab-id': sessionStorage.getItem('tabId')  // Include the unique tab ID in the headers
        },
        // 华兴 新加完毕
        success: function (data) {
            $("#popup_1").html("");
            $("#popup_2").html("");
            $("#popup_3").html("");
            $("#popup_4").html("");
             if(data.success==false){
                console.log("未返回数据")
                return
            }
            console.log(data.data.cnc_utilization.connected_percent[0])
            console.log(data.data.cnc_utilization.error_percent[0])
            console.log(data.data.cnc_utilization.running_percent[0])
            var Connect = data.data.cnc_utilization.connected_percent[0].toFixed(2);
            $("#popup_1").append('<div class= "MainMachineS_1" >' +
                            '<div class="MachineS_name">Connect</div>' +
                            '<div class="MachineS_Per" style="background: conic-gradient(#ebcd37 0%, #ebcd37 ' + Connect + '%, #4d4f42 ' + Connect + '%, #4d4f42 100%);"><div class="MachineS_Single">' + Connect + '%</div></div>' +
            '</div>')
                var Running = data.data.cnc_utilization.running_percent[0].toFixed(2);
 
            $("#popup_2").append('<div class= "MainMachineS_1" >' +
                            '<div class="MachineS_name">Running</div>' +
                            '<div class="MachineS_Per" style="background: conic-gradient(#35e79d 0%, #35e79d ' + Running + '%, #235860 ' + Running + '%, #235860 100%);"><div class="MachineS_Single">' + Running + '%</div></div>' +
            '</div>')
            var Alarm = data.data.cnc_utilization.error_percent[0].toFixed(2);
            Alarm=formatNumber(Alarm);
            $("#popup_4").append('<div class= "MainMachineS_1" >' +
                            '<div class="MachineS_name">Alarm</div>' +
                            '<div class="MachineS_Per" style="background: conic-gradient(#e53132 0%, #e53132 ' + Alarm + '%, #512b40 ' + Alarm + '%, #512b40 100%);"><div class="MachineS_Single">' + Alarm + '%</div></div>' +
            '</div>')
            
        },        
        error: function (err) { 
            console.log(err); 
        }
    });
 

}
//模块显示关闭
function modules(id,status){
    if(status=="0"){
        var ly=[{
            "id":id,
            "status":"0"
        }];
    }
    else{
        var ly=[{
            "id":id,
            "status":"1"
        }];
    }
    var jsons=JSON.stringify(ly);
    $.ajax({
        url: "/Local/update",      
        data:{jsons},
        type: "get",          
        datatype: "json",
        success: function (data) {
            if(status=="1"){
                location.reload()
            }
            else{
                $("#wb"+id+"").css("background","none")
                $("#wb"+id+"").attr("onclick","WBbut(this)")
            }

        },
        error: function (err) { 
            console.log(err); 
        }
    });

}
//下载
function Download(){
    //var mid = $("#MachineConfigDropdown").find('option:selected').attr("data--mid");
    var mid=sessionStorage.getItem("selectedMid");
    $.ajax({
        url: "/ThreeHistory/history",      
        data:{
            ip: getSelectedIp("Historical Data"), // 华兴 更改
            port: getSelectedPort("Historical Data"), // 华兴 更改
            start:formatDate(Stime),
            end:formatDate(Etime),
            cnc_uid:mid,
            type:'history'
        },
        // 华兴 新加完毕
        success: function (data) {
            let str=[];
            for(let i = 0; i < data.events.length; i++) {
              let item = data.events[i]
              str.push(item)
            }
            var json = JSON.stringify(str);
            //encodeURIComponent解决中文乱码， \ufeff是 ""
            let uri = 'data:text;charset=utf-8,\ufeff' + encodeURIComponent(json)
            //通过创建a标签实现
            let link = document.createElement("a")
            link.href = uri
            //对下载的文件命名
            link.download = ""+Stime+"File.json"
            link.click()

        },
        error: function (err) { 
            console.log(err); 
        }
    });

}
//查看历史
function ViewHistory(){
    var bool=$("#HistoryBox").css("display");
    $("#startDate").val("")
    if(bool=="none"){
        $("#HistoryBox").css("display","flex")

    }
    else{
        $("#HistoryBox").css("display","none")
    }

    
}
function Popupclose()
{
    $("#popup_1").html("");
    $("#popup_2").html("");
    $("#popup_3").html("");
    $("#popup_4").html("");
    $("#popup_box_NC_data").html("")
    $("#popup").css("display","none")
    $("#popup_load").css("display","block")
}


//正负数保留小数
function round(num, iCount = 3) {
    // iCount 保留几位小数
    let changeNum = num
    let zs = true
    // 判断是否是负数
    if (changeNum < 0) {
        changeNum = Math.abs(changeNum)
        zs = false
    }
    const iB = Math.pow(10, iCount)
    // 有时乘100结果也不精确
    const value1 = changeNum * iB
    let intDecSet = []
    let intDecHun = []

    let fValue = value1
    const value2 = value1.toString()
    const iDot = value2.indexOf('.')

    // 如果是小数
    if (iDot !== -1) {
        intDecSet = changeNum.toString().split('.')

        // 如果是科学计数法结果
        if (intDecSet[1].indexOf('e') !== -1) {
            return Math.round(value1) / iB
        }
        intDecHun = value2.split('.')

        if (intDecSet[1].length <= iCount) {
            return parseFloat(num, 10)
        }

        const fValue3 = parseInt(intDecSet[1].substring(iCount, iCount + 1), 10)

        if (fValue3 >= 5) {
            fValue = parseInt(intDecHun[0], 10) + 1
        } else {
            // 对于传入的形如111.834999999998 的处理（传入的计算结果就是错误的，应为111.835）
            if (fValue3 === 4 && intDecSet[1].length > 10 && parseInt(intDecSet[1].substring(iCount + 1, iCount + 2), 10) === 9) {
                fValue = parseInt(intDecHun[0], 10) + 1
            } else {
                fValue = parseInt(intDecHun[0], 10)
            }
        }
    }
    // 如果是负数就用0减四舍五入的绝对值
    let val = zs ? (fValue / iB) : (0 - fValue / iB)

    const d = val.toString().split('.')
    if (d.length === 1) {
        return val.toString() + '.00'
    }
    if (d.length > 1) {
        if (d[1].length < 2) {
            val = val.toString() + '0'
        }
        return val
    }
}
function YYYYMMDD() {
    //今天
    var time = new Date().getTime();
    var datetime = new Date();
    datetime.setTime(time);
    var year = datetime.getFullYear();
    var month = datetime.getMonth() + 1 < 10 ? "0" + (datetime.getMonth() + 1) : datetime.getMonth() + 1;
    var date = datetime.getDate() < 10 ? "0" + datetime.getDate() : datetime.getDate();
    return year + "-" + month + "-" + date;
}
function YYYYMMDD2(){
    //+1天
    var datetime = new Date();
    datetime.setDate(datetime.getDate() + 1);
    var time = datetime.getTime();
    datetime.setTime(time);
    var year = datetime.getFullYear();
    var month = datetime.getMonth() + 1 < 10 ? "0" + (datetime.getMonth() + 1) : datetime.getMonth() + 1;
    var date = datetime.getDate() < 10 ? "0" + datetime.getDate() : datetime.getDate();
    return year + "-" + month + "-" + date;
}
function TT(T){

    var datetime =  new Date(T);
    datetime.setDate(datetime.getDate() + 1);
    var time = datetime.getTime();
    datetime.setTime(time);
    var year = datetime.getFullYear();
    var month = datetime.getMonth() + 1 < 10 ? "0" + (datetime.getMonth() + 1) : datetime.getMonth() + 1;
    var date = datetime.getDate() < 10 ? "0" + datetime.getDate() : datetime.getDate();
    return year + "-" + month + "-" + date;
}
//机床模式

// 华兴 更改
function Machine_Mode_Name(mode, machineType) {
  // Convert machineType from string to corresponding numeric value, if necessary
  const machineTypeKey = typeof machineType === "string" ? MachineType[machineType.toUpperCase()] : machineType;
  
  // console.log(`machineType = ${machineType}`);
  // console.log(`machineTypeKey = ${machineTypeKey}`);
  
  // Helper function to simplify mode mappings
  function createMapping(heidenhain, fanuc, hurco, mitsubishi, haas, fagor, gsk) {
    return {
      [MachineType.HEIDENHAIN]: heidenhain,
      [MachineType.FANUC]: fanuc,
      [MachineType.HURCO]: hurco,
      [MachineType.MITSUBISHI]: mitsubishi,
      [MachineType.HAAS]: haas,
      [MachineType.FAGOR]: fagor,
      [MachineType.GSK]: gsk
    };
}  
  
  // Optimized modeMapping using the helper function
  const modeMapping = {
    0: createMapping("MANUAL", "MDI", "DIAGNOSTIC", "MANUAL", "AUTOMATIC", "RESET", "EDIT"),
    1: createMapping("MDI", "MEM", "IDLE", "AUTOMATIC", "MANUAL", "JOG", "MEM"),
    2: createMapping("HWHEEL", "IDLE", "MANUAL", null, "MANUAL_DATA_INPUT", "MDI", "MDI"),
    3: createMapping("SINGLESTEP", "EDIT", "MANUALSETUP", null, "SEMI_AUTOMATIC", "PROGRAM", "DNC"),
    4: createMapping("AUTOMATIC", "HNDL", "AUTOPREP", null, "EDIT", "STOPPED_BY_M0", "JOB"),
    5: createMapping("OTHER", "JOG", "AUTORUN", null, "FEED_HOLD", "STOPPED_WITH_CYCLE_STOP", "HANDLE"),
    6: createMapping("SMART", "TIJ", "INTERRUPTCYCLE", null, "UNAVAILABLE", "STOPPED_IN_SINGLE_BLK_MODE", "REF"),
    7: createMapping("RPF", "TIH", null, null, null, "SYNTAX_CHECKS", null),
    8: createMapping(null, "INC_FEED", null, null, null, "BLK_SEARCH", null),
    9: createMapping(null, "REF", null, null, null, "BLK_SEARCH_FINISHED", null),
    10: createMapping(null, "RMT", null, null, null, "EXE_TIME_EST", null),
    11: createMapping(null, null, null, null, null, null, "IN_SIM", null)
  };

  try {
    return modeMapping[mode]?.[machineTypeKey];
  } catch (error) {
    console.log(`Invalid machine mode: ${mode}`);
    return "";
  }
  // Lookup machine mode
  const machineMode = modeMapping[mode]?.[machineTypeKey];
  return machineMode ?? "UNKNOWN";
}


function formatNumber(num, decimals = 2) {
    return Math.round(num * Math.pow(10, decimals))*100 / Math.pow(10, decimals);
}
function formatUTCDateToYYYYMMDDHHMMSS(date) {
    function pad(number) {
        if (number < 10) {
            return '0' + number;
        }
        return number;
    }
 
    var year = date.getUTCFullYear();
    var month = pad(date.getUTCMonth() + 1); // 月份是从0开始的
    var day = pad(date.getUTCDate());
    var hours = pad(date.getUTCHours());
    var minutes = pad(date.getUTCMinutes());
    var seconds = pad(date.getUTCSeconds());
 
    return year + '' + month + '' + day + '' + hours + '' + minutes + '' + seconds;
}
function convertToTimeRanges(arr) {

    const result = [];
    try{
        for (let i = 0; i < arr.length - 2; i += 2) {
            const timeRange = [
                new Date(ConvertDateFromUtcToLocal(arr[i])),      // 开始时间
                new Date(ConvertDateFromUtcToLocal(arr[i + 2])),  // 结束时间
                14,
                arr[i + 1]   // 模式
            ];
            result.push(timeRange);
        }
    }
    catch{
        result = []
        console.log("ModeChange数据格式不对")
    }
    return result;
}
function formatDate(dateString) {
    // 解析输入日期
    const [datePart, timePart] = dateString.split(' ');
    const [year, month, day] = datePart.split('-');
    const [hour, minute, second] = timePart.split(':');
    
    // 创建 Date 对象（本地时间）
    const date = new Date(year, month - 1, day, hour, minute, second);
    
    // 转换为东八区时间并格式化为 ISO 字符串
    const year2 = date.getFullYear();
    const month2 = String(date.getMonth() + 1).padStart(2, '0');
    const day2 = String(date.getDate()).padStart(2, '0');
    const hour2 = String(date.getHours()).padStart(2, '0');
    const minute2 = String(date.getMinutes()).padStart(2, '0');
    const second2 = String(date.getSeconds()).padStart(2, '0');
    
    // 计算时区偏移（东八区为 +08:00）
    const offset = '+08:00';
    
    return `${year2}-${month2}-${day2}T${hour2}:${minute2}:${second2}${offset}`;
}
//跳页面
function JumpWeb(Type){
    if(Type=="0"){
        window.open("index.html", "_self");
    }
    else if(Type=="1"){
        window.open("Part.html", "_self");
    }
    else if(Type=="2"){
       
    }
}

function getQueryTimeRange() {
    var now = new Date();
    var today8am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
    
    var Stime, Etime;
    
    if (now >= today8am) {
        // 已经过了今天8点，查询今天8点到明天8点
        Stime = YYYYMMDD();
        Etime = YYYYMMDD2();
    } else {
        // 还没到今天8点，查询昨天8点到今天8点
        var yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        Stime = formatDate2(yesterday);
        Etime = YYYYMMDD();
    }
    
    return {
        Stime: Stime,
        Etime: Etime
    };
}
// 格式化日期为 YYYY-MM-DD
function formatDate2(date) {
    var year = date.getFullYear();
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    var day = ('0' + date.getDate()).slice(-2);
    return year + "-" + month + "-" + day;
}
function getCurrentDateTime() {
    const now = new Date();
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}