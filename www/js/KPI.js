// KPI.js - 年度KPI设置功能
$(function() {
    // ========== 状态变量 ==========
    let isEditMode = false;
    let editModeType = null;
    let selectedRowIndex = null;
    let currentYearData = null;
    let modifiedRows = new Set();  // 记录被修改过的行索引

    const $tableBody = $('.kpi-settings-table tbody');
    const $startYear = $('#kpi-start-year');
    // 赋值为当前年份
    $startYear.val(new Date().getFullYear());
    const $searchBtn = $('.kpi-settings-search-button');
    const $addBtn = $('.kpi-settings-action-button.is-add');
    const $editBtn = $('.kpi-settings-action-button.is-edit');
    const $deleteBtn = $('.kpi-settings-action-button.is-delete');
    const $actionRow = $('.kpi-settings-action-row');

    // ========== 类型映射 ==========
    const TYPE_MAP = {
        'E': '用电',
        'W': '用水',
        'G': '用气'
    };

    // ========== 动态创建编辑提示条 ==========
    const $editHint = $('<div>')
        .addClass('kpi-edit-mode-hint')
        .attr('id', 'editModeHint')
        .css({
            'display': 'none',
            'align-items': 'center',
            'gap': '8px',
            'padding': '16px 16px',
            'background': '#fff8e1',
            'border': '1px solid #ffc107',
            'border-radius': '10px',
            'color': '#795548',
            'font-size': '14px',
            'font-weight': '500',
            'margin': '0',
            'flex-shrink': '0',
            'max-height': '40px',      // 限制最大高度
            'line-height': '1.2'       // 紧凑行高
        })
        .html(`
            <span style="font-size:18px;">⚠️</span>
            <span id="editModeHintText">编辑模式已开启</span>
        `);
    
    $actionRow.after($editHint);

    // ========== 创建保存按钮 ==========
    const $saveBtn = $('<button>')
        .addClass('kpi-settings-action-button is-save')
        .attr('type', 'button')
        .css({
            'color': '#ffffff',
            'background': '#c50816',
            'border-color': '#c50816',
            'margin-left': 'auto'
        })
        .html('<span style="margin-right:4px;">💾</span> 保存');
    
    $actionRow.append($saveBtn);

    // ========== 从后端加载数据 ==========
    function loadKpiData(year) {
        showToast('正在加载数据...');
        
        $.ajax({
            url: "/EnergyTarget/getEnergyTarget2",
            type: "get",
            dataType: "json",
            data: {
                Year: year
            },
            success: function(response) {
                console.log('加载数据响应:', response);
                if (response.success && response.data) {
                    currentYearData = response.data;
                    renderTableFromApi(response.data);
                    modifiedRows.clear();
                    $tableBody.find('tr.modified-row').removeClass('modified-row');
                    showToast(`已加载 ${response.data.Fiscal_Year_Display} 数据`);
                } else {
                    showToast('未找到该年度数据，将显示空表格');
                    currentYearData = null;
                    clearTable();
                }
            },
            error: function(err) {
                console.error('加载KPI数据失败:', err);
                showToast('加载数据失败，请检查网络连接');
                loadStaticData();
            }
        });
    }

    // ========== 根据API数据渲染表格 ==========
    function renderTableFromApi(apiData) {
        $tableBody.empty();
        
        if (!apiData || !apiData.Data || apiData.Data.length === 0) {
            $tableBody.append('<tr><td colspan="8" style="text-align:center; padding:32px; color:#6b7280;">暂无KPI数据</td></tr>');
            return;
        }

        const monthsData = {};
        for (let i = 1; i <= 12; i++) {
            monthsData[i] = {};
        }

        apiData.Data.forEach(function(item) {
            const building = item.Building;
            const type = item.Type;
            
            item.MonthlyData.forEach(function(monthItem) {
                const month = monthItem.Month_Num;
                const key = building + '_' + type;
                monthsData[month][key] = monthItem.Target_Value || 0;
            });
        });

        const fiscalYearDisplay = apiData.Fiscal_Year_Display || '';
        const startYear = parseInt(fiscalYearDisplay.split('年')[0]) || apiData.Fiscal_Year;

        for (let month = 1; month <= 12; month++) {
            const monthStr = String(month).padStart(2, '0');
            const data = monthsData[month];
            
            const $row = $('<tr>')
                .attr('data-index', month - 1)
                .attr('data-month', month);

            let displayYear = startYear;
            if (month <= 3) {
                displayYear = startYear + 1;
            }
            
            $row.append(`<td>${displayYear}</td>`);
            $row.append(`<td>${monthStr}</td>`);
            $row.append(`<td class="editable-cell" data-type="E" data-building="加工栋" data-month="${month}">${data['加工栋_E'] || 0}</td>`);
            $row.append(`<td class="editable-cell" data-type="E" data-building="组立栋" data-month="${month}">${data['组立栋_E'] || 0}</td>`);
            $row.append(`<td class="editable-cell" data-type="W" data-building="加工栋" data-month="${month}">${data['加工栋_W'] || 0}</td>`);
            $row.append(`<td class="editable-cell" data-type="W" data-building="组立栋" data-month="${month}">${data['组立栋_W'] || 0}</td>`);
            $row.append(`<td class="editable-cell" data-type="G" data-building="加工栋" data-month="${month}">${data['加工栋_G'] || 0}</td>`);
            $row.append(`<td class="editable-cell" data-type="G" data-building="组立栋" data-month="${month}">${data['组立栋_G'] || 0}</td>`);

            $tableBody.append($row);
        }

        addTotalRow();
    }

    // ========== 添加合计行 ==========
    function addTotalRow() {
        const $rows = $tableBody.find('tr:not(.total-row)');
        let totals = [0, 0, 0, 0, 0, 0];
        
        $rows.each(function() {
            const $cells = $(this).find('td');
            for (let i = 2; i <= 7; i++) {
                const val = parseFloat($cells.eq(i).text()) || 0;
                totals[i - 2] += val;
            }
        });

        const $totalRow = $('<tr>').addClass('total-row');
        $totalRow.append('<td></td>');
        $totalRow.append('<td class="total-label">合计</td>');
        for (let i = 0; i < 6; i++) {
            $totalRow.append(`<td>${totals[i]}</td>`);
        }
        $tableBody.append($totalRow);
    }

    // ========== 更新合计行 ==========
    function updateTotalRow() {
        $tableBody.find('.total-row').remove();
        addTotalRow();
    }

    // ========== 清空表格 ==========
    function clearTable() {
        $tableBody.empty();
        $tableBody.append('<tr><td colspan="8" style="text-align:center; padding:32px; color:#6b7280;">暂无数据</td></tr>');
    }

    // ========== 加载静态示例数据 ==========
    function loadStaticData() {
        const staticData = [

        ];

        $tableBody.empty();
        staticData.forEach(function(item, index) {
            const $row = $('<tr>').attr('data-index', index).attr('data-month', parseInt(item.month));
            $row.append(`<td>${item.year}</td>`);
            $row.append(`<td>${item.month}</td>`);
            item.values.forEach(function(val) {
                $row.append(`<td>${val}</td>`);
            });
            $tableBody.append($row);
        });
        addTotalRow();
        modifiedRows.clear();
    }

    // ========== 行选中功能 ==========
    $tableBody.on('click', 'tr:not(.total-row)', function(e) {
        if ($(e.target).is('input')) return;
        
        $tableBody.find('tr.selected-row').removeClass('selected-row');
        $(this).addClass('selected-row');
        selectedRowIndex = parseInt($(this).attr('data-index'));
    });

    // ========== 双击编辑功能 ==========
    $tableBody.on('dblclick', 'tr:not(.total-row) td', function(e) {
        if (!isEditMode) {
            showToast('请先点击"新增"或"修改"按钮进入编辑模式');
            return;
        }

        const $cell = $(this);
        const colIndex = $cell.index();
        if (colIndex < 2 || colIndex > 7) return;

        if ($cell.find('input').length) return;

        const $row = $cell.closest('tr');
        const rowIndex = parseInt($row.attr('data-index'));

        if (editModeType === 'edit') {
            if (selectedRowIndex === null) {
                showToast('请先在表格中点击选择一行数据，再进行修改');
                return;
            }
            if (selectedRowIndex !== rowIndex) {
                showToast('只能编辑当前选中的行，请先点击选中目标行');
                return;
            }
        }

        const currentValue = $cell.text().trim();
        
        const $input = $('<input>')
            .attr('type', 'number')
            .val(currentValue)
            .css({
                'width': '100%',
                'max-width': '100px',
                'padding': '4px 8px',
                'border': '1px solid #c50816',
                'border-radius': '8px',
                'font-size': 'inherit',
                'outline': 'none',
                'background': '#ffffff',
                'font-weight': '500',
                'box-sizing': 'border-box'
            });

        $cell.empty().append($input);
        $input.focus().select();

        function saveEdit() {
            let newValue = parseFloat($input.val());
            if (isNaN(newValue)) newValue = 0;
            
            if (String(newValue) !== currentValue) {
                $cell.text(newValue);
                modifiedRows.add(rowIndex);
                $row.addClass('modified-row');
                updateTotalRow();
            } else {
                $cell.text(currentValue);
            }
        }

        $input.on('blur', saveEdit);
        $input.on('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                $(this).blur();
            }
        });
    });

    // ========== 保存修改的行到后端 ==========
// ========== 保存修改的行到后端 ==========
// ========== 保存修改的行到后端 ==========
function saveToServer() {
    if (modifiedRows.size === 0) {
        showToast('没有需要保存的修改');
        return;
    }

    showToast(`正在保存 ${modifiedRows.size} 行数据...`);

    // 收集所有需要保存的数据
    const allItems = [];

    modifiedRows.forEach(function(rowIndex) {
        const $row = $tableBody.find(`tr[data-index="${rowIndex}"]`);
        if (!$row.length) return;

        const month = parseInt($row.attr('data-month'));
        const $cells = $row.find('td');
        const year = parseInt($cells.eq(0).text());

        // 6个数值列
        const columns = [
            { col: 2, type: 'E', building: '加工栋' },
            { col: 3, type: 'E', building: '组立栋' },
            { col: 4, type: 'W', building: '加工栋' },
            { col: 5, type: 'W', building: '组立栋' },
            { col: 6, type: 'G', building: '加工栋' },
            { col: 7, type: 'G', building: '组立栋' }
        ];

        columns.forEach(function(colDef) {
            const rawValue = parseFloat($cells.eq(colDef.col).text());
            const targetValue = Math.round(rawValue);  // 四舍五入取整
            
            allItems.push({
                Year: year,
                Month_Num: month,
                Type: colDef.type,
                Building: colDef.building,
                Target_Value: isNaN(targetValue) ? 0 : targetValue
            });
        });
    });

    console.log('准备保存的数据:', allItems);

    let successCount = 0;
    let failCount = 0;
    const totalCount = allItems.length;

    // 逐条保存
    function saveItem(index) {
        if (index >= allItems.length) {
            // 全部完成
            if (failCount === 0) {
                showToast(`保存成功！共保存 ${successCount} 条数据`);
                modifiedRows.clear();
                $tableBody.find('tr.modified-row').removeClass('modified-row');
                exitEditMode();
                // 重新加载数据
                const year = parseInt($startYear.val()) || 2026;
                loadKpiData(year);
            } else {
                showToast(`保存完成：成功 ${successCount} 条，失败 ${failCount} 条`);
            }
            return;
        }

        const item = allItems[index];
        
        $.ajax({
            url: "/EnergyTarget/updateEnergyTarget",
            type: "post",
            dataType: "json",
            contentType: "application/json",
            data: JSON.stringify(item),
            success: function(response) {
                if (response.success) {
                    successCount++;
                } else {
                    failCount++;
                    console.error(`保存失败:`, response.message, item);
                }
                saveItem(index + 1);
            },
            error: function(err) {
                failCount++;
                console.error(`请求失败:`, err, item);
                saveItem(index + 1);
            }
        });
    }

    // 开始逐条保存
    saveItem(0);
}
    // ========== 新增按钮 ==========
    $addBtn.on('click', function() {
        if (isEditMode && editModeType === 'add') {
            exitEditMode();
            return;
        }

        enterEditMode('add');

        const startYear = parseInt($startYear.val()) || 2026;
        const $existingRows = $tableBody.find('tr:not(.total-row)');
        const newMonth = $existingRows.length + 1;
        
        if (newMonth > 12) {
            showToast('已存在12个月的数据，无法再新增');
            exitEditMode();
            return;
        }

        const monthStr = String(newMonth).padStart(2, '0');
        let displayYear = startYear;
        if (newMonth <= 3) {
            displayYear = startYear + 1;
        }

        const newRowIndex = $existingRows.length;
        const $newRow = $('<tr>')
            .attr('data-index', newRowIndex)
            .attr('data-month', newMonth)
            .addClass('selected-row')
            .addClass('modified-row');

        $newRow.append(`<td>${displayYear}</td>`);
        $newRow.append(`<td>${monthStr}</td>`);
        $newRow.append(`<td class="editable-cell" data-type="E" data-building="加工栋" data-month="${newMonth}">0</td>`);
        $newRow.append(`<td class="editable-cell" data-type="E" data-building="组立栋" data-month="${newMonth}">0</td>`);
        $newRow.append(`<td class="editable-cell" data-type="W" data-building="加工栋" data-month="${newMonth}">0</td>`);
        $newRow.append(`<td class="editable-cell" data-type="W" data-building="组立栋" data-month="${newMonth}">0</td>`);
        $newRow.append(`<td class="editable-cell" data-type="G" data-building="加工栋" data-month="${newMonth}">0</td>`);
        $newRow.append(`<td class="editable-cell" data-type="G" data-building="组立栋" data-month="${newMonth}">0</td>`);

        $tableBody.find('.total-row').remove();
        $tableBody.append($newRow);
        addTotalRow();

        $tableBody.find('tr.selected-row').removeClass('selected-row');
        $newRow.addClass('selected-row');
        selectedRowIndex = newRowIndex;
        modifiedRows.add(newRowIndex);

        showToast(`已添加 ${displayYear}年${monthStr}月 数据，编辑后请点击"保存"按钮`);
    });

    // ========== 修改按钮 ==========
    $editBtn.on('click', function() {
        if (isEditMode && editModeType === 'edit') {
            exitEditMode();
            return;
        }

        if (selectedRowIndex === null) {
            showToast('请先在表格中点击选择一行数据，再点击修改按钮');
            return;
        }

        enterEditMode('edit');
    });

    // ========== 删除按钮 ==========
    $deleteBtn.on('click', function() {
        if (isEditMode) {
            exitEditMode();
        }

        if (selectedRowIndex === null) {
            showToast('请先选择要删除的行');
            return;
        }

        const $selectedRow = $tableBody.find(`tr[data-index="${selectedRowIndex}"]`);
        if (!$selectedRow.length) {
            showToast('未找到选中行，请重新选择');
            return;
        }

        const year = $selectedRow.find('td').eq(0).text();
        const month = $selectedRow.find('td').eq(1).text();

        if (confirm(`确定删除 ${year}年${month}月 的KPI数据吗？`)) {
            // 将该行所有值设为0并标记为修改
            const $cells = $selectedRow.find('td');
            for (let i = 2; i <= 7; i++) {
                $cells.eq(i).text('0');
            }
            modifiedRows.add(selectedRowIndex);
            $selectedRow.addClass('modified-row');
            updateTotalRow();
            showToast('已将该行数据清零，请点击"保存"按钮同步到服务器');
        }
    });

    // ========== 保存按钮 ==========
    $saveBtn.on('click', function() {
        if (isEditMode) {
            exitEditMode();
        }
        saveToServer();
    });

    // ========== 搜索按钮 ==========
    $searchBtn.on('click', function() {
        const year = parseInt($startYear.val());
        
        if (isNaN(year)) {
            showToast('请输入有效的年份');
            return;
        }

        exitEditMode();
        selectedRowIndex = null;
        $tableBody.find('tr.selected-row').removeClass('selected-row');
        modifiedRows.clear();
        $tableBody.find('tr.modified-row').removeClass('modified-row');

        loadKpiData(year);
    });

    // ========== 编辑模式管理 ==========
    function enterEditMode(type) {
        isEditMode = true;
        editModeType = type;

        $editHint.css('display', 'flex');
        
        if (type === 'add') {
            $('#editModeHintText').text('新增模式已开启，双击数值单元格编辑新行数据。编辑完成后请点击"保存"按钮。');
        } else if (type === 'edit') {
            $('#editModeHintText').text('修改模式已开启，双击数值单元格进行修改。仅保存修改过的行。点击"保存"按钮提交。');
        }

        if (type === 'add') {
            $addBtn.css({
                'background': '#22a2ff',
                'color': '#ffffff',
                'border-color': '#22a2ff'
            });
            $editBtn.css({
                'background': '#f4fff8',
                'color': '#44c483',
                'border-color': 'rgba(68, 196, 131, 0.18)'
            });
        } else if (type === 'edit') {
            $editBtn.css({
                'background': '#44c483',
                'color': '#ffffff',
                'border-color': '#44c483'
            });
            $addBtn.css({
                'background': '#f6fbff',
                'color': '#22a2ff',
                'border-color': 'rgba(34, 162, 255, 0.18)'
            });
        }
        $(".kpi-settings-table-shell").css("margin-top","25px")
    }

    function exitEditMode() {
        isEditMode = false;
        editModeType = null;

        $editHint.css('display', 'none');

        $addBtn.css({
            'background': '#f6fbff',
            'color': '#22a2ff',
            'border-color': 'rgba(34, 162, 255, 0.18)'
        });
        $editBtn.css({
            'background': '#f4fff8',
            'color': '#44c483',
            'border-color': 'rgba(68, 196, 131, 0.18)'
        });
         $(".kpi-settings-table-shell").css("margin-top","0px")
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

    // ========== 添加样式 ==========
    $('<style>')
        .text(`
            .kpi-settings-table tbody tr.selected-row {
                background-color: #fff2e0 !important;
                outline: 1px solid #ff8c42;
                outline-offset: -1px;
            }
            .kpi-settings-table tbody tr.modified-row {
                background-color: #fffde7 !important;
            }
            .kpi-settings-table tbody tr:not(.total-row) {
                cursor: pointer;
            }
            .kpi-settings-table tbody tr:not(.total-row):hover {
                background-color: #fafcff;
            }
            .kpi-settings-action-button.is-save {
                height: 34px;
                padding: 0 16px;
                border: 1px solid #c50816;
                border-radius: 10px;
                cursor: pointer;
                font-weight: 550;
                font-size: 0.85rem;
                display: flex;
                align-items: center;
                gap: 4px;
                transition: 0.2s;
            }
            .kpi-settings-action-button.is-save:hover {
                background: #a00610 !important;
                border-color: #a00610 !important;
            }
        `)
        .appendTo('head');

    // ========== 页面初始化 ==========
    const defaultYear = 2026;
    loadKpiData(defaultYear);
});