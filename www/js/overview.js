const FIGMA_CANVAS_WIDTH = 1551;
const FIGMA_CANVAS_HEIGHT = 956;
const floorplanCanvas = document.querySelector("#overview-floorplan-canvas");
const floorplanFrame = document.querySelector(".overview-floorplan-frame");
var isEditMode = false;
var OriginalX="";
var OriginalY="";
// 在文件顶部添加刷新间隔常量
const REFRESH_INTERVAL =1 * 60 * 1000;; // 1分钟 = 180000毫秒
var refreshTimer = null; // 定时器变量
var FreqCount=1;

const LOADING_CONFIG = {
    skeletonColor: '#f0f0f0',
    animationDuration: '1.5s'
};

// 获取查询时间范围（通用函数）
function getQueryTimeRange() {
    var now = new Date();
    var today8am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
    
    var Stime, Etime;
    
    if (now >= today8am) {
        // 已经过了今天8点，查询今天8点到当前时间
        Stime = today8am;
        Etime = now;
    } else {
        // 还没到今天8点，查询昨天8点到当前时间
        Stime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 8, 0, 0);
        Etime = now;
    }
    
    return {
        Stime: formatDateTime(Stime),
        Etime: formatDateTime(Etime)
    };
}

// 编辑按钮切换函数
function Edit() {
    isEditMode = !isEditMode;
    var editButton = document.getElementById('editButton');
    
    if (isEditMode) {
        editButton.textContent = '完成';
        editButton.style.color = '#3b82f6'; // 蓝色高亮
        editButton.style.fontWeight = 'bold';
        // 给所有设备添加可编辑样式
        $('.overview-machine-tile').addClass('editable');
        // 停止自动刷新
        stopAutoRefresh();
        console.log('进入编辑模式，已停止自动刷新');
    } else {
        editButton.textContent = '编辑';
        editButton.style.color = ''; // 恢复默认
        editButton.style.fontWeight = '';
        // 移除可编辑样式
        $('.overview-machine-tile').removeClass('editable');
        // 重新启动自动刷新
        var timeRange = getQueryTimeRange();
        startAutoRefresh(timeRange.Stime, timeRange.Etime);
        console.log('退出编辑模式，已重新启动自动刷新');
    }
}
// 添加停止刷新函数
function stopAutoRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
        console.log('已清除自动刷新定时器');
    }
    // 取消所有活跃的 AJAX 请求
    cancelAllAjaxRequests();
}
window.addEventListener("resize", () => {
  fitFloorplanToFrame();
});
if (window.ResizeObserver && floorplanFrame) {
  new ResizeObserver(() => {
    fitFloorplanToFrame();
  }).observe(floorplanFrame);
}
$(function() { 
    // 使用通用函数获取时间范围
    var timeRange = getQueryTimeRange();
    var Stime = timeRange.Stime;
    var Etime = timeRange.Etime;
    
    console.log('查询时间范围:', Stime, '~', Etime);
    
    // 先获取设备位置，创建div
    getMachinePosition().then(function() {
        // div创建完成后，再请求效率数据
        fetchEfficiencyData(Stime, Etime);
        // 启动定时刷新
        startAutoRefresh(Stime, Etime);
    });

    fitFloorplanToFrame();
    

    // 拖动功能 - 使用 Pointer Events + 自定义 CSS 变量
    const floorplanCanvas = document.querySelector("#overview-floorplan-canvas");
    
    // 拖动功能 - 修正版
    $(document).on('pointerdown', '.overview-machine-tile', function(event) {
        if(isEditMode==false){
            return;
        }
        if (!floorplanCanvas) return;
        event.preventDefault();
        
        // 重置拖拽状态
        isDragging = false;

        const tile = $(this);
        const x = tile.attr('v-x');
        const y = tile.attr('v-y');
        OriginalX=x;
        OriginalY=y;

        const canvasRect = floorplanCanvas.getBoundingClientRect();
        const tileRect = this.getBoundingClientRect();
        
        const offsetX = event.clientX - tileRect.left;
        const offsetY = event.clientY - tileRect.top;
        
        const halfTileWidthPercent = (tileRect.width / canvasRect.width) * 50;
        const halfTileHeightPercent = (tileRect.height / canvasRect.height) * 50;

        tile.addClass('is-dragging');
        this.setPointerCapture(event.pointerId);

        const origLeft = parseFloat(tile.css('left')) || 0;
        const origTop = parseFloat(tile.css('top')) || 0;

        // 记录起始位置
        const startX = event.clientX;
        const startY = event.clientY;
        let hasMoved = false;
        let finalLeft = origLeft;
        let finalTop = origTop;

        const onPointerMove = (moveEvent) => {
            // 判断是否真正移动了（设置最小阈值3px）
            const moveDistance = Math.sqrt(
                Math.pow(moveEvent.clientX - startX, 2) + 
                Math.pow(moveEvent.clientY - startY, 2)
            );
            
            if (moveDistance > 3) {
                hasMoved = true;
                isDragging = true;
            }
            
            // 没有真正移动就不处理
            if (!hasMoved) return;
            
            const centerX = moveEvent.clientX - canvasRect.left - offsetX + tileRect.width / 2;
            const centerY = moveEvent.clientY - canvasRect.top - offsetY + tileRect.height / 2;
            
            const newLeft = clamp(
                (centerX / canvasRect.width) * 100, 
                halfTileWidthPercent, 
                100 - halfTileWidthPercent
            );
            const newTop = clamp(
                (centerY / canvasRect.height) * 100, 
                halfTileHeightPercent, 
                100 - halfTileHeightPercent
            );
            
            tile.css({
                'left': newLeft + '%',
                'top': newTop + '%'
            });
            finalLeft = newLeft;
            finalTop = newTop;
        };
        
        const finishDrag = () => {
            tile.removeClass('is-dragging');
            document.removeEventListener('pointermove', onPointerMove);
            
            const elementId = tile.attr('id');
            const machineId = elementId ? elementId.replace('m', '') : '';
            
            // 只有真正移动了才保存位置
            if (hasMoved && machineId && (finalLeft !== origLeft || finalTop !== origTop)) {
                updateMachinePosition(machineId, finalLeft, finalTop)
                    .then(function() {
                        console.log('位置更新成功');
                    })
                    .catch(function() {
                        console.log('位置更新失败，恢复原位置');
                        tile.css({
                            'left': origLeft + '%',
                            'top': origTop + '%'
                        });
                    });
            }
            
            // 延迟重置拖拽状态
            setTimeout(() => {
                isDragging = false;
            }, 100);
        };

        const onPointerUp = () => {
            this.releasePointerCapture(event.pointerId);
        };

        const onPointerCancel = () => {
            this.releasePointerCapture(event.pointerId);
        };

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp, { once: true });
        document.addEventListener('pointercancel', onPointerCancel, { once: true });
        this.addEventListener('lostpointercapture', finishDrag, { once: true });
    });

    // 防止拖拽时的文本选择
    $(document).on('dragstart', '.overview-machine-tile', function(e) {
        e.preventDefault();
    });

    // 点击遮罩层关闭弹窗
    document.getElementById('machine-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
})
// 添加自动刷新函数
function startAutoRefresh(Stime, Etime) {
    // 清除旧定时器
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }
    
    // 设置新的定时器，每1分钟刷新一次
    refreshTimer = setInterval(function() {
        console.log('自动刷新效率数据 - ' + new Date().toLocaleTimeString());
        FreqCount++;
        $("#freq").html(FreqCount);
        // 重新计算时间范围
        var timeRange = getQueryTimeRange();
        
        // 刷新效率数据
        fetchEfficiencyData(timeRange.Stime, timeRange.Etime);
    }, REFRESH_INTERVAL);
}
// 页面卸载时清除定时器
window.addEventListener('beforeunload', function() {
    stopAutoRefresh();
});
// clamp 辅助函数
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function fitFloorplanToFrame() {
    const floorplanCanvas = document.querySelector("#overview-floorplan-canvas");
    const floorplanFrame = document.querySelector(".overview-floorplan-frame");
    if (!floorplanCanvas || !floorplanFrame) return;

    const frameWidth = floorplanFrame.clientWidth;
    const frameHeight = floorplanFrame.clientHeight;
    if (!frameWidth || !frameHeight) return;

    const canvasAspect = FIGMA_CANVAS_WIDTH / FIGMA_CANVAS_HEIGHT;
    let width = frameWidth;
    let height = width / canvasAspect;

    if (height > frameHeight) {
        height = frameHeight;
        width = height * canvasAspect;
    }

    floorplanCanvas.style.width = `${width}px`;
    floorplanCanvas.style.height = `${height}px`;
}

// 查询设备位置
function getMachinePosition(M_ID) {
    return $.ajax({
        url: '/api/getMachinePosition',
        type: 'GET',
        data: {
            M_ID: M_ID
        },
        dataType: 'json',
        beforeSend: function(jqXHR) {
            activeAjaxRequests.push(jqXHR);
            // 显示整体加载状态
            showGlobalLoading();
        },
        success: function(res) {
            if (res.success) {
                for(var i=0;i<res.data.length;i++){
                    var M_ID = res.data[i].M_ID;
                    var M_Name = res.data[i].M_Name;
                    var PositionX = res.data[i].PositionX;
                    var PositionY = res.data[i].PositionY;
                    $("#MachineBox").append(`<div onclick='ClickMachine(this)' class="overview-machine-tile" v-x="${PositionX}" v-y="${PositionY}" id="m${M_ID}" style="top:${PositionY}%;left:${PositionX}%"  >
                       <span class='overview-tile-label'>${M_Name}</span> 
                    </div>`);
                }
                
            } else {
                console.log('查询失败:', res.message);
            }
            hideGlobalLoading();
        },
        complete: function(XHR) {
            var index = activeAjaxRequests.indexOf(XHR);
            if (index > -1) {
                activeAjaxRequests.splice(index, 1);
            }
        },
        error: function(xhr, status, error) {
            console.log('请求失败:', error);
            hideGlobalLoading();
        }
    });
}

// 修改设备位置
function updateMachinePosition(M_ID, PositionX, PositionY) {
    return $.ajax({
        url: '/api/updateMachinePosition',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            M_ID: M_ID,
            PositionX: PositionX,
            PositionY: PositionY
        }),
        dataType: 'json',
        success: function(res) {
            if (res.success) {
                console.log('更新成功:', res.data);
            } else {
                console.log('更新失败:', res.message);
            }
        },
        error: function(xhr, status, error) {
            console.log('请求失败:', error);
        }
    });
}
var activeAjaxRequests = [];
// 取消所有活跃的 AJAX 请求
function cancelAllAjaxRequests() {
    while (activeAjaxRequests.length > 0) {
        var xhr = activeAjaxRequests.pop();
        if (xhr && xhr.abort) {
            xhr.abort();
        }
    }
}
// 提取效率数据请求为独立函数
function fetchEfficiencyData(Stime, Etime) {
    // 取消之前的请求
    cancelAllAjaxRequests();
    // 给所有设备添加加载状态
    if(FreqCount=="1"){
        $('.overview-machine-tile').addClass('loading');
    }
    
    $.ajax({
        url: "/router/useBatch",
        data: {
            start: Stime,
            end: Etime,
            type: 'QueryEfficiency'
        },
        type: "get",
        datatype: "json",
        headers: {
            'tab-id': sessionStorage.getItem('tabId')
        },
        success: function(response) {
            var devices = response.results || response;
            
            if (!devices || devices.length === 0) {
                console.log("未返回设备数据");
                 // 移除加载状态
                $('.overview-machine-tile').removeClass('loading');
                return;
            }
            
            devices.forEach(function(device) {
                updateDeviceUI(device);
            });
            // 移除所有设备的加载状态
            $('.overview-machine-tile').removeClass('loading');
        },
        beforeSend: function(jqXHR) {
            // 将新的请求添加到活跃列表
            activeAjaxRequests.push(jqXHR);
        },
        complete: function(XHR, TS) {
            // 从活跃列表中移除已完成的请求
            var index = activeAjaxRequests.indexOf(XHR);
            if (index > -1) {
                activeAjaxRequests.splice(index, 1);
            }
            XHR = null;
            
        },
        error: function(err) {
            console.log("批量查询失败:", err);
             // 即使失败也移除加载状态
            $('.overview-machine-tile').removeClass('loading');
        }
    });
}
function updateDeviceUI(device) {
    
    var mid = device.mid;
    var $targetDiv = $('#m' + mid);
     
    if ($targetDiv.length === 0) {
        console.log('未找到设备div: m' + mid + ' (' + device.label + ')');
        return;
    }
    
    // 数据无效则跳过
    if (!device.data || device.data === "2" || device.data === "0") {
        console.log(device.label + ' 无有效数据');
        return;
    }
   
    var upTimePercent;
    var percent;
    
    // 判断数据格式
    if (device.data.EfficiencyOutput) {
        // 格式1: 包含EfficiencyOutput数组
        var upTimeItem = device.data.EfficiencyOutput.find(function(item) {
            return item.Name === "UpTime";
        });
        
        if (!upTimeItem || !upTimeItem.Value || upTimeItem.Value.length === 0) {
            console.log(device.label + ' 未找到UpTime数据');
            return;
        }
        
        percent = upTimeItem.Value[0] * 100;
        upTimePercent = percent.toFixed(0) + '%';
        
    } else if (Array.isArray(device.data)) {
        // 格式2: data直接是数组
        if (device.data.length === 0) {
            console.log(device.label + ' 无有效数据');
            return;
        }
        
        percent = device.data[0];
        upTimePercent = percent.toFixed(0) + '%';
        
    } else {
        console.log(device.label + ' 未知数据格式');
        return;
    }
    
    // 检查是否已经存在环形图，如果不存在则创建
    if ($targetDiv.find('.overview-tile-ring').length === 0) {
        $targetDiv.prepend(`<span class="overview-tile-ring" aria-hidden="true">
            <span class="overview-progress-ring overview-progress-ring-running"></span>
            <span class="overview-progress-ring-value">${upTimePercent}</span>
        </span>`);
    }
    
    // 更新数值
    $targetDiv.find('.overview-progress-ring-value').text(upTimePercent);
    
    // 根据利用率设置环形图颜色
    var color;
    if (percent >= 50) {
        color = '#22c55e'; // 绿色
    } else if (percent >= 40) {
        color = '#eab308'; // 黄色
    } else {
        color = '#ef4444'; // 红色
    }
    // 更新环形图颜色
    $targetDiv.find('.overview-progress-ring-running').css('background', 
        `conic-gradient(#e5e7eb 0%, #e5e7eb ${100-percent}%, ${color} ${100-percent}%, ${color} 100%)`
    );
}
// 打开弹窗
function openModal(machine,type) {
    if(type=="0"){
        document.getElementById('modal-title').textContent = machine.label || '设备详情';
        document.getElementById('machine-iframe').src = 'index.html';
        document.getElementById('machine-modal').style.display = 'flex';
    }
    else if(type=="1"){
        document.getElementById('modal-title').textContent = machine.label || '设备详情';
        document.getElementById('machine-iframe').src = 'Part.html';
        document.getElementById('machine-modal').style.display = 'flex';
    }
    else if(type=="2"){
        document.getElementById('modal-title').textContent = machine.label || '设备详情';
        document.getElementById('machine-iframe').src = 'ThreeColor.html';
        document.getElementById('machine-modal').style.display = 'flex';
    }
    // 停止自动刷新
    stopAutoRefresh();
    console.log('打开弹窗，已停止自动刷新');
}
// 全局加载状态管理
function showGlobalLoading() {
    // 检查是否已存在加载提示
    if ($('#global-loading').length === 0) {
        $('.overview-floorplan-canvas').append(`
            <div id="global-loading" class="global-loading-overlay">
                <div class="loading-spinner"></div>
                <div class="loading-text">加载设备数据中...</div>
            </div>
        `);
    }
}

function hideGlobalLoading() {
    $('#global-loading').fadeOut(300, function() {
        $(this).remove();
    });
}
// 关闭弹窗
function closeModal() {
    document.getElementById('machine-modal').style.display = 'none';
    document.getElementById('machine-iframe').src = '';
    // 重新启动自动刷新
    var timeRange = getQueryTimeRange();
    startAutoRefresh(timeRange.Stime, timeRange.Etime);
    console.log('关闭弹窗，已重新启动自动刷新');
}


function ClickMachine(obj) {
    if (isEditMode) {
        return;
    }
    var mid = $(obj).attr("id").split("m")[1];
    
    $.getJSON('MachineConfig.json', function(data) {
        var machine = data.options.find(function(item) {
            return item.Mid === mid;
        });
        
        if (machine) {
            sessionStorage.setItem('selectedIp', machine.ip);
            sessionStorage.setItem('selectedPort', machine.port);
            sessionStorage.setItem('selectedType', machine.type);
            sessionStorage.setItem('selectedMid', mid);
            openModal(machine,machine.ShowType);
             
        }
    }).fail(function() {
        console.log('读取 MachineConfig.json 失败');
    });
}

// 格式化成字符串 "YYYY-MM-DD HH:mm:ss"
function formatDateTime(date) {
    var year = date.getFullYear();
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    var day = ('0' + date.getDate()).slice(-2);
    var hours = ('0' + date.getHours()).slice(-2);
    var minutes = ('0' + date.getMinutes()).slice(-2);
    var seconds = ('0' + date.getSeconds()).slice(-2);
    return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
}