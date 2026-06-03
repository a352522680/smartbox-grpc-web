// 使用你提供的“现成 JS”，适配到当前项目：
// - 仅负责渲染 operation-report-board 内的表格/时间轴/筛选/tooltip
// - 导航抽屉交给现有的 Nav.js（本文件不再处理 nav-overlay/menu/logout）
//数据里的数据结构如下：
// target：稼动目标（目标稼动率），单位是百分比的数值。
// 例：target: 45 → 页面显示 45%，并用它和 rate 做对比（决定颜色提示）。
// rate：实际稼动率（当前/统计出来的稼动率），单位也是百分比的数值。
// 例：rate: 35 → 页面显示 35%。
// 代码里还会用 rate vs target 来加样式：
// rate === 0 → 标红（is-low）
// rate < target → 可能标黄/标红（is-warning/is-low）
// rate >= target → 正常颜色
// processKey：所属“工程分类”的内部标识（给筛选 Tab 用的，不直接展示）。
// 例如 Tab 上的：
// all（全工程）
// front（前工程）
// grinding（研削工程）
// electrical（电气工程）
$(function() {
   const now = new Date();
  // 月份（0-11，需要 +1）
  const month = now.getMonth() + 1;
  // 日期
  const day = now.getDate();
  $("#StatisticalDay").html("统计日："+month + "-" + day);

})
window.addEventListener("DOMContentLoaded", () => {
  const timeScale = document.querySelector("#operation-time-scale");
  const boardBody = document.querySelector("#operation-board-body");
  const searchInput = document.querySelector("#operation-search-input");
  const processTabs = [...document.querySelectorAll("[data-process-tab]")];
  let timelineTooltip;

  const START_HOUR = 8;
  const END_HOUR = 32;
  const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;
  let activeProcess = "all";
  let machineRows = [];

  function renderLoading() {
    if (!boardBody) return;

    boardBody.innerHTML = '<tr><td class="operation-empty-cell operation-loading-cell" colspan="7"><span class="operation-loading-spinner"></span><span>数据加载中...</span></td></tr>';
  }

  const statusLabels = {
    running: "运行",
    stopped: "停止",
    alarm: "报警",
    shutdown: "关机",
    disconnected: "断联",
  };

  function fetchData() {
    renderLoading();

    $.ajax({
      url: "/Engineering/list",
      type: "GET",
      dataType: "json",
      success: function(response) {
        if (response.success && response.data) {
          machineRows = response.data;
          renderRows();
        } else {
          console.error("接口返回错误:", response);
          boardBody.innerHTML = '<tr><td class="operation-empty-cell" colspan="7">数据加载失败</td></tr>';
        }
      },
      error: function(err) {
        console.error("请求失败:", err);
        boardBody.innerHTML = '<tr><td class="operation-empty-cell" colspan="7">数据加载失败</td></tr>';
      }
    });
  }

  function parseTime(value) {
    if (typeof value !== "string" || !value.includes(":")) return NaN;
    const [hours, minutes] = value.split(":").map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return NaN;
    const normalizedHours = hours < START_HOUR ? hours + 24 : hours;
    return (normalizedHours - START_HOUR) * 60 + minutes;
  }

  function getSegmentStyle(segment) {
    const parsedStart = parseTime(segment.start);
    if (!Number.isFinite(parsedStart)) return null;

    const start = Math.min(TOTAL_MINUTES, Math.max(0, parsedStart));
    let parsedEnd = parseTime(segment.end);
    if (!Number.isFinite(parsedEnd)) return null;
    if (parsedEnd === parsedStart) return null;
    if (parsedEnd < parsedStart) parsedEnd += 24 * 60;
    const end = Math.min(TOTAL_MINUTES, parsedEnd);
    const width = Math.max(0, end - start);

    return {
      start: `${(start / TOTAL_MINUTES) * 100}%`,
      width: `${(width / TOTAL_MINUTES) * 100}%`,
    };
  }

  function createCell(row, text, className) {
    const cell = document.createElement("td");
    cell.className = className;
    cell.textContent = text;
    row.appendChild(cell);
    return cell;
  }

  function renderTimeScale() {
    if (!timeScale) return;

    timeScale.innerHTML = "";
    for (let hour = START_HOUR; hour <= END_HOUR; hour += 1) {
      const label = document.createElement("span");
      const displayHour = hour % 24;
      const offsetMinutes = (hour - START_HOUR) * 60;
      label.textContent = `${String(displayHour).padStart(2, "0")}:00`;
      label.style.setProperty("--tick-left", `${(offsetMinutes / TOTAL_MINUTES) * 100}%`);
      timeScale.appendChild(label);
    }
  }

  function getTimelineTooltip() {
    if (timelineTooltip) return timelineTooltip;

    timelineTooltip = document.createElement("div");
    timelineTooltip.className = "operation-timeline-tooltip hidden";
    document.body.appendChild(timelineTooltip);
    return timelineTooltip;
  }

  function positionTimelineTooltip(tooltip, event) {
    const offset = 12;
    const tooltipWidth = tooltip.offsetWidth || 180;
    const tooltipHeight = tooltip.offsetHeight || 96;
    const targetRect = event.currentTarget?.getBoundingClientRect?.();
    const pointerX =
      Number.isFinite(event.clientX) && event.clientX > 0
        ? event.clientX
        : targetRect
          ? targetRect.left + targetRect.width / 2
          : 8;
    const pointerY =
      Number.isFinite(event.clientY) && event.clientY > 0
        ? event.clientY
        : targetRect
          ? targetRect.top + targetRect.height / 2
          : 8;
    const maxLeft = window.innerWidth - tooltipWidth - 8;
    const maxTop = window.innerHeight - tooltipHeight - 8;
    const left = Math.min(maxLeft, Math.max(8, pointerX + offset));
    const top = Math.min(maxTop, Math.max(8, pointerY + offset));

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function showTimelineTooltip(event, row, segment) {
    const tooltip = getTimelineTooltip();
    const status = statusLabels[segment.state] || segment.state;

    tooltip.innerHTML = `
      <div class="operation-tooltip-title">${row.machine}</div>
      <div class="operation-tooltip-row"><span>开始时间</span><strong>${segment.start}</strong></div>
      <div class="operation-tooltip-row"><span>结束时间</span><strong>${segment.end}</strong></div>
      <div class="operation-tooltip-row">
        <span>状态</span>
        <strong class="operation-tooltip-status"><span class="operation-tooltip-dot" data-state="${segment.state}"></span>${status}</strong>
      </div>
    `;
    tooltip.classList.remove("hidden");
    positionTimelineTooltip(tooltip, event);
  }

  function hideTimelineTooltip() {
    timelineTooltip?.classList.add("hidden");
  }

  function getRateClass(row) {
    const rate = Number(row.rate);
    const target = Number(row.target);
    if (!Number.isFinite(rate) || !Number.isFinite(target)) return "";
    if (rate < target) return "is-low";
    return "";
  }

  function renderTimeline(cell, row) {
    const track = document.createElement("div");
    track.className = "timeline-track";
    track.setAttribute("aria-label", `${row.machine} 稼动时间线`);

    row.segments.forEach((segment) => {
      const item = document.createElement("span");
      const style = getSegmentStyle(segment);
      if (!style) return;

      const { start, width } = style;
      if (width === "0%") return;

      item.className = "timeline-segment";
      item.dataset.state = segment.state;
      item.style.setProperty("--start", start);
      item.style.setProperty("--width", width);
      item.tabIndex = 0;
      item.setAttribute("aria-label", `${row.machine} ${segment.start}-${segment.end} ${statusLabels[segment.state]}`);
      item.addEventListener("mouseenter", (event) => showTimelineTooltip(event, row, segment));
      item.addEventListener("mousemove", (event) => positionTimelineTooltip(getTimelineTooltip(), event));
      item.addEventListener("mouseleave", hideTimelineTooltip);
      item.addEventListener("focus", (event) => showTimelineTooltip(event, row, segment));
      item.addEventListener("blur", hideTimelineTooltip);
      track.appendChild(item);
    });

    cell.appendChild(track);
  }

  function renderRows() {
    if (!boardBody) return;

    boardBody.innerHTML = "";
    
    if (machineRows.length === 0) {
      const emptyRow = document.createElement("tr");
      const emptyCell = document.createElement("td");
      emptyCell.className = "operation-empty-cell";
      emptyCell.colSpan = 7;
      emptyCell.textContent = "加载中...";
      emptyRow.appendChild(emptyCell);
      boardBody.appendChild(emptyRow);
      return;
    }

    const query = searchInput?.value.trim().toLowerCase() || "";
    const visibleRows = machineRows.filter((row) => {
      const matchesProcess = activeProcess === "all" || row.processKey === activeProcess;
      const haystack = `${row.machine} ${row.model} ${row.process} ${row.subprocess}`.toLowerCase();
      return matchesProcess && (!query || haystack.includes(query));
    });

    if (!visibleRows.length) {
      const emptyRow = document.createElement("tr");
      const emptyCell = document.createElement("td");
      emptyCell.className = "operation-empty-cell";
      emptyCell.colSpan = 7;
      emptyCell.textContent = "未找到匹配设备";
      emptyRow.appendChild(emptyCell);
      boardBody.appendChild(emptyRow);
      return;
    }

    visibleRows.forEach((row) => {
      const tableRow = document.createElement("tr");

      createCell(tableRow, row.machine, "operation-sticky operation-sticky-machine operation-machine-name");
      createCell(tableRow, row.model, "operation-sticky operation-sticky-model");
      createCell(tableRow, `${row.target}%`, "operation-sticky operation-sticky-target operation-target");
      createCell(tableRow, `${Math.round(row.rate)}%`, `operation-sticky operation-sticky-rate operation-rate ${getRateClass(row)}`);
      createCell(tableRow, row.process, "operation-sticky operation-sticky-process operation-process");
      createCell(tableRow, row.subprocess, "operation-sticky operation-sticky-subprocess operation-subprocess");

      const timelineCell = createCell(tableRow, "", "operation-timeline-cell");
      renderTimeline(timelineCell, row);

      boardBody.appendChild(tableRow);
    });
  }

  searchInput?.addEventListener("input", renderRows);

  processTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activeProcess = tab.dataset.processTab || "all";
      processTabs.forEach((button) => {
        const isActive = button === tab;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-selected", String(isActive));
      });
      renderRows();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hideTimelineTooltip();
    }
  });

  renderTimeScale();
  fetchData(); // 调用接口获取数据
});
