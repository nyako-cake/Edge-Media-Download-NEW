/**
 * 界面层脚本（不依赖 Node / Eagle 引擎）
 * 只负责：面板切换、侧栏收纳、标签列拖动与合并、说明折叠、下载队列行的渲染。
 * 引擎侧通过 window.EVDUI 调用，事件通过 document 上的自定义事件回传。
 */
(function () {
  var TITLES = { download: "下载列表", settings: "下载设置", tags: "导入信息", dependencies: "依赖", account: "账号", theme: "外观" };
  var navItems = document.querySelectorAll(".sidebar-item");
  var panels = document.querySelectorAll(".panel-content");
  var titleEl = document.getElementById("panelTitle");
  var downloadBar = document.getElementById("downloadBar");
  var content = document.getElementById("content");
if (content && !content.getAttribute("data-panel")) content.setAttribute("data-panel", "download");
  var currentView = null;

  function emit(name, detail) {
    document.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
  }

  function show(view, animate) {
    if (!TITLES[view] || view === currentView) return;
    currentView = view;
    Array.prototype.forEach.call(navItems, function (i) {
      i.classList.toggle("active", i.dataset.view === view);
    });
    Array.prototype.forEach.call(panels, function (p) {
      var on = p.dataset.panel === view;
      p.hidden = !on;
      p.classList.remove("panel-in");
      if (on && animate) {
        void p.offsetWidth;
        p.classList.add("panel-in");
      }
    });
    if (titleEl) titleEl.textContent = TITLES[view];
    if (downloadBar) downloadBar.hidden = view !== "download";
    if (content) { content.setAttribute("data-panel", view); content.scrollTop = 0; }
    emit("evd:panel", { view: view });
    requestAnimationFrame(function () { updateOverlayScroll(); });
  }

  /* ---------------- 覆盖式滚动条（不占内容宽度） ---------------- */
  var scrollBar = null;
  var scrollThumb = null;
  var scrollRaf = 0;
  var contentBasePaddingRight = null;

  function ensureOverlayScroll() {
    if (scrollBar) return;
    if (!content || !content.parentElement) return;
    contentBasePaddingRight = parseFloat(getComputedStyle(content).paddingRight) || 16;
    scrollBar = document.createElement("div");
    scrollBar.className = "content-scrollbar";
    scrollThumb = document.createElement("div");
    scrollThumb.className = "thumb";
    scrollBar.appendChild(scrollThumb);
    content.parentElement.appendChild(scrollBar);
  }

  function updateOverlayScroll() {
    ensureOverlayScroll();
    if (!content || !scrollBar) return;
    var container = content.parentElement;
    /* 兜底：若当前 Chromium 不认隐藏滚动条的写法，用负外边距把被占掉的宽度补回来 */
    var gutter = content.offsetWidth - content.clientWidth;
    if (gutter > 1) {
      content.style.marginRight = "-" + gutter + "px";
      content.style.paddingRight = (contentBasePaddingRight + gutter) + "px";
    } else if (content.style.marginRight) {
      content.style.marginRight = "";
      content.style.paddingRight = "";
    }
    var cr = container.getBoundingClientRect();
    var sr = content.getBoundingClientRect();
    var trackTop = Math.round(sr.top - cr.top) + 2;
    var trackHeight = Math.max(0, Math.round(sr.height) - 4);
    scrollBar.style.top = trackTop + "px";
    scrollBar.style.height = trackHeight + "px";
    var scrollable = content.scrollHeight - content.clientHeight;
    if (scrollable <= 1 || trackHeight <= 0) {
      scrollBar.classList.remove("is-visible");
      return;
    }
    var thumbHeight = Math.max(32, Math.round(trackHeight * (content.clientHeight / content.scrollHeight)));
    var maxOffset = Math.max(0, trackHeight - thumbHeight);
    var ratio = Math.min(1, Math.max(0, content.scrollTop / scrollable));
    scrollThumb.style.height = thumbHeight + "px";
    scrollThumb.style.transform = "translateY(" + (ratio * maxOffset).toFixed(1) + "px)";
    scrollBar.classList.add("is-visible");
  }

  function scheduleOverlayScroll() {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(function () {
      scrollRaf = 0;
      updateOverlayScroll();
    });
  }

  if (content) {
    content.addEventListener("scroll", scheduleOverlayScroll, { passive: true });
    if (typeof ResizeObserver !== "undefined") {
      var contentObserver = new ResizeObserver(scheduleOverlayScroll);
      contentObserver.observe(content);
      Array.prototype.forEach.call(content.children, function (panel) { contentObserver.observe(panel); });
    }
    if (typeof MutationObserver !== "undefined") {
      var contentMutation = new MutationObserver(scheduleOverlayScroll);
      contentMutation.observe(content, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "class", "style"] });
    }
    window.addEventListener("resize", scheduleOverlayScroll);
    scheduleOverlayScroll();
  }

  Array.prototype.forEach.call(navItems, function (item) {
    item.addEventListener("click", function () { show(item.dataset.view, true); });
  });

  var hashView = (location.hash || "").replace("#", "");
  show(TITLES[hashView] ? hashView : "download", false);

  /* 侧栏收纳 */
  var sidebar = document.querySelector(".sidebar");
  var collapseBtn = document.getElementById("collapseBtn");
  function toggleCollapse() {
    var collapsed = sidebar.classList.toggle("collapsed");
    collapseBtn.setAttribute("title", collapsed ? "展开侧栏" : "收纳侧栏");
  }
  if (collapseBtn) {
    collapseBtn.addEventListener("click", toggleCollapse);
    collapseBtn.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleCollapse(); }
    });
  }

  /* 主题色块：只负责上色与高亮，记忆与「跟随 Eagle」由引擎处理 */
  function setTheme(name) {
    document.body.setAttribute("theme", name);
    document.body.className = document.body.className.replace(/theme-\w+/g, "theme-" + name);
    Array.prototype.forEach.call(document.querySelectorAll(".themes-picker .theme"), function (x) {
      x.classList.toggle("active", x.dataset.theme === name);
    });
  }
  var themeApplied = false;
  /* 启动瞬间同步色块选中态：引擎初始化前先点亮当前主题的色块，避免选中状态晚一步出现 */
  setTheme(document.body.getAttribute("theme") || "gray");
  Array.prototype.forEach.call(document.querySelectorAll(".themes-picker .theme"), function (sw) {
    sw.addEventListener("click", function (e) {
      e.stopPropagation();
      setTheme(sw.dataset.theme);
      themeApplied = true;
      emit("evd:theme-pick", { theme: sw.dataset.theme });
    });
  });

  /* 推特信息规则：拖动排序 */
  function dragAfter(list, y) {
    var els = Array.prototype.slice.call(list.querySelectorAll(".checkbox-item:not(.dragging)"));
    for (var i = 0; i < els.length; i++) {
      var box = els[i].getBoundingClientRect();
      if (y < box.top + box.height / 2) return els[i];
    }
    return null;
  }
  function unwrapGroup(group) {
    if (!group || !group.parentNode) return;
    var parent = group.parentNode;
    /* 描边层必须随组一起消失：它一旦被留在列表里，定位基准会变成 .content，
       会带着原尺寸跑到面板左上角盖住第一张卡片 */
    Array.prototype.slice.call(group.querySelectorAll(".link-frame")).forEach(function (f) {
      if (f.parentNode) f.parentNode.removeChild(f);
    });
    while (group.firstChild) parent.insertBefore(group.firstChild, group);
    parent.removeChild(group);
  }
  function sweepOrphanFrames() {
    Array.prototype.slice.call(document.querySelectorAll(".link-frame")).forEach(function (f) {
      if (!f.parentNode || !f.parentNode.classList.contains("link-group")) {
        if (f.parentNode) f.parentNode.removeChild(f);
      }
    });
  }
  function unlinkItem(item) {
    if (!item || !item.closest) return;
    var group = item.closest(".link-group");
    if (!group) return;
    Array.prototype.slice.call(group.querySelectorAll(".checkbox-item")).forEach(function (i) {
      i.classList.remove("linked");
    });
    unwrapGroup(group);
  }

  var tagList = null;
  Array.prototype.forEach.call(document.querySelectorAll(".rule-group"), function (g) {
    var t = g.querySelector(".block-title");
    if (t && t.textContent.trim().indexOf("标签") === 0) tagList = g.querySelector(".checkbox-items");
  });
  sweepOrphanFrames();

  function itemChecked(item) {
    var box = item.querySelector('input[type="checkbox"]');
    return !!(box && box.checked);
  }

  Array.prototype.forEach.call(document.querySelectorAll(".rule-group .checkbox-items"), function (list) {
    Array.prototype.slice.call(list.querySelectorAll(".checkbox-item")).forEach(function (item) {
      var handle = document.createElement("div");
      handle.className = "drag-handle";
      handle.title = "拖动排序";
      handle.setAttribute("role", "button");
      handle.setAttribute("aria-label", "拖动排序");
      item.appendChild(handle);

      handle.addEventListener("mousedown", function () {
        unlinkItem(item);
        item.setAttribute("draggable", "true");
      });
      window.addEventListener("mouseup", function () { item.removeAttribute("draggable"); });

      item.addEventListener("dragstart", function (e) {
        item.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        try { e.dataTransfer.setData("text/plain", "x"); } catch (err) {}
      });
      item.addEventListener("dragend", function () {
        item.classList.remove("dragging");
        item.removeAttribute("draggable");
        emit("evd:tag-change", { reason: "order" });
      });
    });

    list.addEventListener("dragover", function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      var dragging = list.querySelector(".checkbox-item.dragging");
      if (!dragging) return;
      var after = dragAfter(list, e.clientY);
      if (after) list.insertBefore(dragging, after); else list.appendChild(dragging);
    });
  });

  /* 标签列「合并」 */
  var pendingLink = null;
  var refreshLinkButtons = function () {};

  function layoutLinkFrame(group) {
    if (!group) return;
    var frame = group.querySelector(".link-frame");
    var items = group.querySelectorAll(".checkbox-item");
    if (!frame || items.length < 2) return;
    var g = group.getBoundingClientRect();
    var r0 = items[0].getBoundingClientRect();
    var r1 = items[1].getBoundingClientRect();
    var off = 2;
    frame.style.left = (r0.left - off - g.left) + "px";
    frame.style.top = (r0.top - off - g.top) + "px";
    frame.style.width = (r0.width + off * 2) + "px";
    frame.style.height = (r1.bottom - r0.top + off * 2) + "px";
  }

  function clearPending() {
    if (pendingLink) pendingLink.classList.remove("linking");
    pendingLink = null;
    if (tagList) tagList.classList.remove("link-picking");
    refreshLinkButtons();
    return true;
  }

  function linkItems(a, b) {
    if (!a || !b || a === b || !tagList) return;
    if (a.parentNode !== tagList && !(a.closest && a.closest(".link-group"))) return;
    if (b.parentNode !== tagList && !(b.closest && b.closest(".link-group"))) return;
    unlinkItem(a);
    unlinkItem(b);
    if (b.parentNode !== tagList) tagList.appendChild(b);
    tagList.insertBefore(b, a.nextSibling);
    var group = document.createElement("div");
    group.className = "link-group";
    var frame = document.createElement("div");
    frame.className = "link-frame";
    group.appendChild(frame);
    tagList.insertBefore(group, a);
    group.appendChild(a);
    group.appendChild(b);
    a.classList.add("linked");
    b.classList.add("linked");
    layoutLinkFrame(group);
  }

  window.addEventListener("resize", function () {
    Array.prototype.slice.call(document.querySelectorAll(".link-group")).forEach(function (g) {
      layoutLinkFrame(g);
    });
  });

  if (tagList) {
    refreshLinkButtons = function () {
      Array.prototype.slice.call(tagList.querySelectorAll(".checkbox-item")).forEach(function (item) {
        var btn = item.querySelector(".link-btn");
        if (!btn) return;
        var on = itemChecked(item);
        btn.hidden = !(on || (pendingLink && !on && item !== pendingLink));
      });
    };

    Array.prototype.slice.call(tagList.querySelectorAll(".checkbox-item")).forEach(function (item) {
      var btn = document.createElement("div");
      btn.className = "link-btn";
      btn.textContent = "合并";
      btn.title = "与另一项合并为一条标签";
      btn.setAttribute("role", "button");
      btn.setAttribute("tabindex", "0");
      item.insertBefore(btn, item.querySelector(".drag-handle"));

      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        e.preventDefault();
        if (item.closest(".link-group")) {
          unlinkItem(item);
          clearPending();
          emit("evd:tag-change", { reason: "unlink" });
          return;
        }
        if (pendingLink === item) { clearPending(); return; }
        if (pendingLink) {
          var other = pendingLink;
          clearPending();
          linkItems(other, item);
          var boxA = other.querySelector('input[type="checkbox"]');
          var boxB = item.querySelector('input[type="checkbox"]');
          if (boxA) boxA.checked = true;
          if (boxB) boxB.checked = true;
          refreshLinkButtons();
          emit("evd:tag-change", { reason: "link" });
          return;
        }
        if (!itemChecked(item)) return;
        pendingLink = item;
        item.classList.add("linking");
        tagList.classList.add("link-picking");
        refreshLinkButtons();
      });
    });

    document.addEventListener("change", function (e) {
      if (!e.target || e.target.type !== "checkbox") return;
      var item = e.target.closest ? e.target.closest(".checkbox-item[data-field]") : null;
      if (!item) return;
      refreshLinkButtons();
      var panel = "";
      if (item.closest("#twNameFields")) panel = "name";
      else if (item.closest("#twAnnotationFields")) panel = "annotation";
      else if (item.closest("#twTagFields")) panel = "tags";
      if (panel) emit("evd:tag-check", { panel: panel, field: item.dataset.field, checked: !!e.target.checked });
    });

    document.addEventListener("click", function (e) {
      if (!pendingLink) return;
      if (tagList.contains(e.target)) return;
      clearPending();
    });

    refreshLinkButtons();
  }

  /* 列说明折叠 */
  Array.prototype.forEach.call(document.querySelectorAll(".rule-group"), function (g) {
    var desc = g.querySelector(".rule-desc");
    if (!desc) return;
    function toggleDesc(e) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      var open = g.classList.toggle("hint-open");
      desc.setAttribute("aria-expanded", open ? "true" : "false");
    }
    desc.addEventListener("click", toggleDesc);
    desc.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") toggleDesc(e);
    });
  });

  document.addEventListener("click", function (e) {
    Array.prototype.slice.call(document.querySelectorAll(".rule-group.hint-open")).forEach(function (g) {
      var desc = g.querySelector(".rule-desc");
      var hint = g.querySelector(".rule-hint");
      if (desc && desc.contains(e.target)) return;
      if (hint && hint.contains(e.target)) return;
      g.classList.remove("hint-open");
      if (desc) desc.setAttribute("aria-expanded", "false");
    });
  });

  /* 恢复默认：先拆合并框，再按初始顺序复位 */
  var defaultOrder = Array.prototype.slice.call(document.querySelectorAll(".rule-group .checkbox-items"))
    .map(function (list) {
      return { list: list, items: Array.prototype.slice.call(list.querySelectorAll(".checkbox-item")) };
    });

  function resetOrder() {
    clearPending();
    Array.prototype.slice.call(document.querySelectorAll(".link-group")).forEach(function (g) {
      Array.prototype.slice.call(g.querySelectorAll(".checkbox-item")).forEach(function (i) {
        i.classList.remove("linked");
      });
      unwrapGroup(g);
    });
    defaultOrder.forEach(function (group) {
      group.items.forEach(function (item) { group.list.appendChild(item); });
    });
    refreshLinkButtons();
    emit("evd:tag-change", { reason: "reset" });
  }
  var resetBtn = document.getElementById("resetOrder");
  if (resetBtn) {
    resetBtn.addEventListener("click", resetOrder);
    resetBtn.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); resetOrder(); }
    });
  }

  /* 下载队列行 */
  var listEl = document.getElementById("downloadList");
  var emptyEl = document.getElementById("downloadEmpty");
  var filterEl = document.getElementById("downloadFilter");
  var startAllBtn = document.getElementById("queueStartAll");
  var pauseAllBtn = document.getElementById("queuePauseAll");
  var rows = {};
  var queueFilter = "all";
  var queuePaused = false;

  function rowMatches(row) {
    if (queueFilter === "all") return true;
    var state = row.getAttribute("data-state") || "waiting";
    if (queueFilter === "active") {
      return state === "waiting" || state === "preparing" || state === "downloading";
    }
    return state === queueFilter;
  }

  function refreshCounts() {
    if (!filterEl) return;
    var stats = { all: 0, active: 0, completed: 0, error: 0 };
    Object.keys(rows).forEach(function (id) {
      var row = rows[id];
      if (!row) return;
      var state = row.getAttribute("data-state") || "waiting";
      stats.all++;
      if (state === "waiting" || state === "preparing" || state === "downloading") stats.active++;
      if (state === "completed") stats.completed++;
      if (state === "error") stats.error++;
    });
    Array.prototype.slice.call(filterEl.querySelectorAll(".segment")).forEach(function (seg) {
      var countEl = seg.querySelector(".seg-count");
      if (!countEl) return;
      var name = seg.getAttribute("data-filter") || "all";
      countEl.textContent = String(stats[name] || 0);
    });
  }

  function refreshEmpty() {
    var total = listEl ? listEl.children.length : 0;
    var hasVisible = false;
    for (var i = 0; listEl && i < listEl.children.length; i++) {
      var node = listEl.children[i];
      if (!node.classList.contains("filtered-out")) { hasVisible = true; break; }
    }
    if (emptyEl) {
      emptyEl.hidden = !!hasVisible;
      var title = emptyEl.querySelector(".title");
      var desc = emptyEl.querySelector("p");
      if (title) {
        title.textContent = total > 0 && !hasVisible ? "没有符合条件的任务" : "暂无下载任务";
      }
      if (desc) desc.hidden = total > 0 && !hasVisible;
    }
    if (listEl) listEl.style.paddingTop = hasVisible ? "4px" : "0";
  }

  function applyFilter() {
    Object.keys(rows).forEach(function (id) {
      var row = rows[id];
      if (!row) return;
      row.classList.toggle("filtered-out", !rowMatches(row));
    });
    refreshEmpty();
    refreshCounts();
  }

  function setFilter(name) {
    queueFilter = name || "all";
    if (filterEl) {
      Array.prototype.slice.call(filterEl.querySelectorAll(".segment")).forEach(function (seg) {
        var active = seg.getAttribute("data-filter") === queueFilter;
        seg.classList.toggle("active", active);
        seg.setAttribute("aria-selected", active ? "true" : "false");
      });
    }
    applyFilter();
  }

  function setQueuePaused(paused) {
    queuePaused = !!paused;
    if (pauseAllBtn) pauseAllBtn.classList.toggle("is-off", queuePaused);
    if (startAllBtn) startAllBtn.classList.toggle("is-off", !queuePaused);
  }

  function bulk(action) {
    emit("evd:queue-bulk", { action: action });
  }

  if (startAllBtn) {
    startAllBtn.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); bulk("start"); }
    });
  }
  if (pauseAllBtn) {
    pauseAllBtn.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); bulk("pause"); }
    });
  }

  setFilter("all");
  setQueuePaused(false);

  /* 兜底：即使元素级监听在 Electron 里被拖动区/覆盖层吞掉，也能通过事件委托生效 */
  document.addEventListener("click", function (e) {
    var target = e.target;
    var nav = target && target.closest ? target.closest(".sidebar-item") : null;
    if (nav && nav.dataset.view) show(nav.dataset.view, true);
    var seg = target && target.closest ? target.closest(".download-toolbar .segment") : null;
    if (seg) setFilter(seg.getAttribute("data-filter"));
    var startAll = target && target.closest ? target.closest("#queueStartAll") : null;
    if (startAll) bulk("start");
    var pauseAll = target && target.closest ? target.closest("#queuePauseAll") : null;
    if (pauseAll) bulk("pause");
  }, true);

  function buildRow(item) {
    var row = document.createElement("div");
    row.className = "download-item";
    row.setAttribute("data-id", String(item.id));
    row.innerHTML =
      (item && item.from
        ? '<div class="item-from"><img alt=""><span></span></div>'
        : '') +
      '<div class="item-title"></div>' +
      '<div class="item-progress"><div class="bar"></div></div>' +
      '<div class="item-meta">' +
        '<span class="item-status"></span>' +
        '<span class="item-eta"></span>' +
        '<div class="item-actions">' +
          '<div class="link-btn" data-act="copy">复制链接</div>' +
          '<div class="link-btn" data-act="remove">删除记录</div>' +
        '</div>' +
      '</div>';
    return row;
  }

  function applyFrom(row, from) {
    if (!from) return;
    var box = row.querySelector(".item-from");
    if (!box) return;
    var img = box.querySelector("img");
    var label = box.querySelector("span");
    if (from.avatarData) {
      img.src = from.avatarData;
      img.style.display = "";
    } else {
      img.style.display = "none";
    }
    label.textContent = from.screenName ? "@" + from.screenName : from.name || "好友";
  }

  function applyRow(id, data) {
    var row = rows[id];
    if (!row) return;
    var state = data.state || "waiting";
    row.setAttribute("data-state", state);
    row.classList.toggle("completed", state === "completed");
    row.classList.toggle("error", state === "error");
    row.classList.toggle("indeterminate", state === "preparing");
    if (typeof data.title === "string" && data.title) {
      row.querySelector(".item-title").textContent = data.title;
    }
    if (data.from) applyFrom(row, data.from);
    row.querySelector(".item-status").textContent = data.status || "";
    row.querySelector(".item-eta").textContent = data.eta || "";
    var bar = row.querySelector(".item-progress .bar");
    bar.style.width = (data.progress == null ? "0" : Math.max(0, Math.min(100, data.progress))) + "%";
    var actions = row.querySelector(".item-actions");
    var retry = actions.querySelector('[data-act="retry"]');
    if (state === "error" && !retry) {
      retry = document.createElement("div");
      retry.className = "link-btn";
      retry.setAttribute("data-act", "retry");
      retry.textContent = "重试";
      actions.insertBefore(retry, actions.firstChild);
    } else if (state !== "error" && retry) {
      retry.parentNode.removeChild(retry);
    }
    applyFilter();
  }

  if (listEl) {
    listEl.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest(".link-btn") : null;
      if (!btn) return;
      var row = btn.closest(".download-item");
      if (!row) return;
      emit("evd:queue-action", { id: Number(row.getAttribute("data-id")), action: btn.getAttribute("data-act"), btn: btn });
    });
  }

  window.EVDUI = {
    showPanel: function (view, animate) { show(view, animate !== false); },
    currentPanel: function () { return currentView; },
    setTheme: setTheme,
    themeAppliedByUser: function () { return themeApplied; },
    addQueueItem: function (item) {
      if (!listEl) return;
      var row = buildRow(item);
      rows[item.id] = row;
      listEl.appendChild(row);
      applyRow(item.id, item);
      refreshEmpty();
      refreshCounts();
      listEl.scrollTop = listEl.scrollHeight;
    },
    updateQueueItem: function (id, data) { applyRow(id, data); },
    setQueuePaused: function (paused) { setQueuePaused(paused); },
    setQueueFilter: function (name) { setFilter(name); },
    removeQueueItem: function (id) {
      var row = rows[id];
      if (!row) return;
      if (row.parentNode) row.parentNode.removeChild(row);
      delete rows[id];
      refreshEmpty();
      refreshCounts();
    },
    flashButton: function (btn, text) {
      if (!btn) return;
      var original = btn.textContent;
      btn.textContent = text;
      setTimeout(function () { btn.textContent = original; }, 1500);
    },
    tagState: function () {
      var cols = { name: "twNameFields", annotation: "twAnnotationFields", tags: "twTagFields" };
      var out = { join: [] };
      Object.keys(cols).forEach(function (key) {
        var container = document.getElementById(cols[key]);
        if (!container) return;
        var order = [];
        var fields = [];
        var groups = [];
        Array.prototype.slice.call(container.children).forEach(function (node) {
          if (node.classList && node.classList.contains("link-group")) {
            Array.prototype.slice.call(node.querySelectorAll(".checkbox-item")).forEach(function (item) {
              order.push(item.dataset.field);
              fields.push(item.dataset.field);
              groups.push({ field: item.dataset.field, checked: itemChecked(item) });
            });
          } else if (node.classList && node.classList.contains("checkbox-item")) {
            order.push(node.dataset.field);
            fields.push(node.dataset.field);
            groups.push({ field: node.dataset.field, checked: itemChecked(node) });
          }
        });
        // 合并组：同一 link-group 内的第二项起，标为并入上一条
        Array.prototype.slice.call(container.querySelectorAll(".link-group")).forEach(function (group) {
          var items = group.querySelectorAll(".checkbox-item");
          for (var i = 1; i < items.length; i++) out.join.push(items[i].dataset.field);
        });
        out[key] = { order: order, checked: {} };
        groups.forEach(function (g) { out[key].checked[g.field] = g.checked; });
      });
      return out;
    },
    setColumnChecked: function (column, field, on) {
      var cols = { name: "twNameFields", annotation: "twAnnotationFields", tags: "twTagFields" };
      var container = document.getElementById(cols[column]);
      if (!container) return;
      var item = container.querySelector('.checkbox-item[data-field="' + field + '"]');
      if (!item) return;
      var box = item.querySelector('input[type="checkbox"]');
      if (box) box.checked = !!on;
      refreshLinkButtons();
    },
    applyOrder: function (column, order) {
      var cols = { name: "twNameFields", annotation: "twAnnotationFields", tags: "twTagFields" };
      var container = document.getElementById(cols[column]);
      if (!container) return;
      Array.prototype.slice.call(order || []).forEach(function (field) {
        var item = container.querySelector('.checkbox-item[data-field="' + field + '"]');
        if (item) container.appendChild(item);
      });
    },
    applyJoin: function (fields) {
      if (!tagList) return;
      clearPending();
      sweepOrphanFrames();
      Array.prototype.slice.call(document.querySelectorAll(".link-group")).forEach(function (g) {
        Array.prototype.slice.call(g.querySelectorAll(".checkbox-item")).forEach(function (i) {
          i.classList.remove("linked");
        });
        unwrapGroup(g);
      });
      Array.prototype.slice.call(fields || []).forEach(function (field) {
        var item = tagList.querySelector('.checkbox-item[data-field="' + field + '"]');
        if (!item) return;
        var prev = item.previousElementSibling;
        if (prev && prev.classList.contains("link-group")) {
          var last = prev.querySelector(".checkbox-item:last-of-type");
          if (last) {
            prev.appendChild(item);
            last.classList.add("linked");
            item.classList.add("linked");
            layoutLinkFrame(prev);
          }
        } else if (prev && prev.classList.contains("checkbox-item")) {
          var group = document.createElement("div");
          group.className = "link-group";
          group.appendChild(document.createElement("div")).className = "link-frame";
          tagList.insertBefore(group, prev);
          group.appendChild(prev);
          group.appendChild(item);
          prev.classList.add("linked");
          item.classList.add("linked");
          layoutLinkFrame(group);
        }
      });
      sweepOrphanFrames();
      refreshLinkButtons();
    },
    resetLayout: resetOrder
  };
})();
