(function () {
  "use strict";

  const STAGES = {
    assessment: "测评待完成",
    interview_prep: "面经准备",
    interviewing: "将面试",
    waiting_result: "等结果",
    closed: "close",
  };

  const ANNOUNCEMENTS = [
    "JD自动识别：上传截图或文本，自动提取岗位关键词与高频问题。",
    "一键面经准备：按当前轮次生成问题清单与作答思路。",
    "面试复盘：自动沉淀亮点、改进项与下一步行动建议。",
  ];

  const PREP_TEMPLATES = [
    { title: "项目拆解题", thought: "先定义目标和北极星指标，再拆执行路径与验证方式。" },
    { title: "跨团队协作题", thought: "明确冲突来源、优先级依据、对齐机制和风险兜底。" },
    { title: "优先级取舍题", thought: "用影响范围×实现成本×时效风险做排序，给出不做理由。" },
    { title: "追问加压题", thought: "先给结论，再用数据和反例补充，最后收束到行动。" },
  ];

  const PREP_ROUNDS = [
    { key: "first", label: "一面", icon: "🧭" },
    { key: "second", label: "二面", icon: "⚡" },
    { key: "third", label: "三面", icon: "🎯" },
  ];

  const PROCESS_STEPS = [
    { key: "assessment", label: "测评" },
    { key: "first", label: "一面" },
    { key: "second", label: "二面" },
    { key: "third", label: "三面" },
    { key: "hr", label: "HR" },
    { key: "offer", label: "Offer" },
  ];

  const MAILBOX_LABELS = {
    qq: "QQ邮箱",
    netease: "网易邮箱",
  };

  const DEMO_MAILBOX_PROVIDER_MAP = {
    "op-001": "qq",
    "op-002": "netease",
    "op-003": "netease",
    "op-004": "qq",
    "op-005": "qq",
  };

  const state = {
    connected: false,
    provider: "",
    connectedMailboxes: [],
    mailboxEditMode: { qq: false, netease: false },
    selectedId: "",
    flowView: "prep",
    processModalOpen: false,
    modalTargetId: "",
    modalReviewRound: "",
    tickerIndex: 0,
    tickerTimer: null,
    demoOpportunityPool: [],
    filters: { keyword: "", stage: "all" },
    opportunities: [
      {
        id: "op-001",
        company: "字节跳动",
        role: "AI产品实习生-火山方舟",
        city: "杭州",
        dueAt: "2026-04-20 15:30",
        meetingLink: "https://meeting.feishu.cn/j/913245666",
        stage: "interview_prep",
        risk: "urgent",
        nextAction: "完成一面高频追问演练并准备30秒版本答案。",
        timeline: [
          { label: "收到一面邀约", time: "2026-04-16 10:32" },
          { label: "确认面试时间", time: "2026-04-16 11:05" },
        ],
        jd: null,
        prep: null,
        review: null,
      },
      {
        id: "op-002",
        company: "美团",
        role: "增长产品实习生",
        city: "北京",
        dueAt: "2026-04-22 23:59",
        meetingLink: "https://meeting.tencent.com/dm/8877123",
        stage: "assessment",
        risk: "normal",
        nextAction: "完成在线测评并记录错题类型。",
        timeline: [
          { label: "收到测评通知邮件", time: "2026-04-17 09:15" },
          { label: "测评截止时间已同步", time: "2026-04-17 09:16" },
        ],
        jd: {
          source: "图片：meituan-jd.webp",
          updatedAt: "2026-04-17 20:12",
          keywords: ["增长实验", "指标设计", "A/B测试", "用户留存", "跨团队协作"],
          responsibilities: [
            "负责核心增长场景需求拆解和方案推进",
            "协同研发与设计推进版本上线并追踪效果",
          ],
          focusQuestions: [
            "如何定义一个增长策略的成效指标？",
            "资源受限时，你如何做优先级取舍？",
          ],
        },
        prep: null,
        review: null,
      },
      {
        id: "op-003",
        company: "阿里云",
        role: "AIGC产品运营实习生",
        city: "上海",
        dueAt: "2026-04-26 18:00",
        meetingLink: "https://meeting.aliyun.com/session/82hsa",
        stage: "waiting_result",
        risk: "normal",
        nextAction: "2天后发跟进邮件，同时补充业务取舍题答案。",
        timeline: [
          { label: "完成二面", time: "2026-04-14 14:20" },
          { label: "进入等结果", time: "2026-04-14 17:00" },
        ],
        jd: null,
        prep: null,
        review: {
          source: "音频：aliyun-second-round.m4a",
          createdAt: "2026-04-14 21:10",
          strengths: ["结构清晰，表达有重点", "案例与指标结合较好"],
          gaps: ["追问时收束不够快", "竞品对比层面可以更深入"],
          actions: ["补2组业务取舍题模板", "做一次模拟追问演练并计时"],
          nextAction: "本周完成追问演练，准备跟进邮件。",
        },
      },
      {
        id: "op-004",
        company: "快手",
        role: "推荐策略产品实习生",
        city: "北京",
        dueAt: "2026-04-18 19:30",
        meetingLink: "https://meeting.kuaishou.com/93aa61",
        stage: "interviewing",
        risk: "urgent",
        nextAction: "今晚完成二面案例复盘并更新追问答案。",
        timeline: [
          { label: "一面通过", time: "2026-04-15 16:12" },
          { label: "二面已安排", time: "2026-04-16 13:00" },
        ],
        jd: null,
        prep: null,
        review: null,
      },
      {
        id: "op-005",
        company: "B站",
        role: "内容策略实习生",
        city: "上海",
        dueAt: "2026-04-10 18:20",
        meetingLink: "",
        stage: "closed",
        risk: "normal",
        nextAction: "流程关闭，保留复盘供后续岗位复用。",
        timeline: [{ label: "流程结束", time: "2026-04-10 18:20" }],
        jd: null,
        prep: null,
        review: null,
      },
    ],
  };

  const el = {
    mailboxStatus: document.getElementById("mailbox-status"),
    openConnectBtn: document.getElementById("open-connect-btn"),
    statTotal: document.getElementById("stat-total"),
    statAssessment: document.getElementById("stat-assessment"),
    statInterview: document.getElementById("stat-interview"),
    statWaiting: document.getElementById("stat-waiting"),
    statClose: document.getElementById("stat-close"),
    statUrgent: document.getElementById("stat-urgent"),
    filterKeyword: document.getElementById("filter-keyword"),
    filterStage: document.getElementById("filter-stage"),
    announcementTicker: document.getElementById("announcement-ticker"),
    list: document.getElementById("job-list"),
    modalOverlay: document.getElementById("modal-overlay"),
    processModal: document.getElementById("process-modal"),
    processCompany: document.getElementById("process-company"),
    processRole: document.getElementById("process-role"),
    processDueTime: document.getElementById("process-due-time"),
    processMeetingLink: document.getElementById("process-meeting-link"),
    processTimeline: document.getElementById("process-timeline"),
    processScrollRoot: document.getElementById("process-scroll-root"),
    processJd: document.getElementById("process-jd-content"),
    processPrepRounds: document.getElementById("process-prep-rounds"),
    processPrep: document.getElementById("process-prep-content"),
    processReviewRounds: document.getElementById("process-review-rounds"),
    processReview: document.getElementById("process-review-content"),
    connectModal: document.getElementById("connect-modal"),
    connectTip: document.getElementById("connect-tip"),
    connectQqEmail: document.getElementById("connect-qq-email"),
    connectQqCode: document.getElementById("connect-qq-code"),
    connectNeteaseEmail: document.getElementById("connect-netease-email"),
    connectNeteaseCode: document.getElementById("connect-netease-code"),
    connectQqBtn: document.getElementById("connect-qq-btn"),
    connectNeteaseBtn: document.getElementById("connect-netease-btn"),
    mailboxCardQq: document.getElementById("mailbox-card-qq"),
    mailboxCardNetease: document.getElementById("mailbox-card-netease"),
    connectQqView: document.getElementById("connect-qq-view"),
    connectNeteaseView: document.getElementById("connect-netease-view"),
    connectQqForm: document.getElementById("connect-qq-form"),
    connectNeteaseForm: document.getElementById("connect-netease-form"),
    connectQqDisplay: document.getElementById("connect-qq-display"),
    connectNeteaseDisplay: document.getElementById("connect-netease-display"),
    connectQqCodeField: document.getElementById("connect-qq-code-field"),
    connectNeteaseCodeField: document.getElementById("connect-netease-code-field"),
    connectQqCancelEdit: document.getElementById("connect-qq-cancel-edit"),
    connectNeteaseCancelEdit: document.getElementById("connect-netease-cancel-edit"),
    connectedMailboxPreview: document.getElementById("connected-mailbox-preview"),
    jdModal: document.getElementById("jd-modal"),
    jdFile: document.getElementById("jd-file"),
    jdText: document.getElementById("jd-text"),
    jdFileLabel: document.getElementById("jd-file-label"),
    jdPreview: document.getElementById("jd-result-preview"),
    reviewModal: document.getElementById("review-modal"),
    reviewFile: document.getElementById("review-file"),
    reviewText: document.getElementById("review-text"),
    reviewFileLabel: document.getElementById("review-file-label"),
    reviewPreview: document.getElementById("review-result-preview"),
    loadingOverlay: document.getElementById("loading-overlay"),
    loadingText: document.getElementById("loading-text"),
    toast: document.getElementById("toast"),
  };

  let toastTimer = null;
  let clockTimer = null;

  init();

  function init() {
    state.demoOpportunityPool = state.opportunities.map((item) => {
      const cloned = cloneOpportunity(item);
      cloned.mailboxProvider = DEMO_MAILBOX_PROVIDER_MAP[cloned.id] || "qq";
      return cloned;
    });
    state.opportunities = [];
    state.selectedId = "";
    normalizeConnectedMailboxState();
    hydrateWorkflowState();
    window.applyWorkflowUpdateFromMailbox = applyWorkflowUpdateFromMailbox;
    bindEvents();
    renderAll();
    startClockPolling();
    startTicker();
    openConnectModal("首次进入请连接邮箱。你也可以先浏览页面交互。");
  }

  function hydrateWorkflowState() {
    state.opportunities.forEach((opp) => {
      ensureOpportunityWorkflow(opp);
    });
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const actionNode = event.target.closest("[data-action]");
      if (!actionNode) return;
      onAction({
        action: actionNode.dataset.action,
        id: actionNode.dataset.id || "",
        page: actionNode.dataset.page || "",
        provider: actionNode.dataset.provider || "",
        target: actionNode.dataset.target || "",
        stage: actionNode.dataset.stage || "",
        round: actionNode.dataset.round || "",
      });
    });

    el.filterKeyword.addEventListener("input", () => {
      state.filters.keyword = el.filterKeyword.value.trim();
      renderList();
    });

    el.filterStage.addEventListener("change", () => {
      state.filters.stage = el.filterStage.value;
      renderStats();
      renderList();
    });

    el.modalOverlay.addEventListener("click", closeAllModals);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeAllModals();
    });

    setupFileInput(el.jdFile, el.jdFileLabel, "点击上传或拖拽截图到此处");
    setupFileInput(el.reviewFile, el.reviewFileLabel, "点击上传复盘材料");

    setupDropZone(el.jdModal.querySelector(".dropzone"), el.jdFileLabel);
    setupDropZone(el.reviewModal.querySelector(".dropzone"), el.reviewFileLabel);

    [el.connectQqEmail, el.connectQqCode, el.connectNeteaseEmail, el.connectNeteaseCode]
      .filter(Boolean)
      .forEach((input) => {
        input.addEventListener("input", renderConnectFormState);
      });
  }

  function startClockPolling() {
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = setInterval(() => {
      renderStats();
      renderList();
      if (state.processModalOpen) {
        renderProcessModal();
      }
    }, 60 * 1000);
  }

  function onAction(desc) {
    switch (desc.action) {
      case "open-connect":
        openConnectModal("连接邮箱后，可自动识别邮件中的面试流程。");
        return;
      case "connect-mailbox":
        connectMailboxByKey(desc.provider || "");
        return;
      case "edit-mailbox":
        startMailboxEdit(desc.provider || "");
        return;
      case "cancel-mailbox-edit":
        cancelMailboxEdit(desc.provider || "");
        return;
      case "close-modal":
      case "close-process-modal":
        closeAllModals();
        return;
      case "filter-stat":
        applyStageFilter(desc.stage || "all");
        return;
      case "select-item":
        selectOpportunity(desc.id);
        renderAll();
        return;
      case "toggle-card":
        openProcessPage(desc.id, "prep");
        return;
      case "open-process":
        openProcessPage(desc.id, desc.target || "");
        return;
      case "jd-entry":
        handleJdEntry(desc.id);
        return;
      case "open-jd-upload":
        openJdModal(state.selectedId);
        return;
      case "submit-jd":
        submitJd();
        return;
      case "prep-entry":
        prepFromCard(desc.id);
        return;
      case "run-prep":
        runPrepSearch(state.selectedId);
        return;
      case "review-entry":
        openReviewAnchor(desc.id);
        return;
      case "open-review-upload":
        openReviewModal(state.selectedId);
        return;
      case "submit-review":
        submitReview();
        return;
      case "jump-icon":
        switchFlowView(desc.target || "prep", true);
        return;
      case "set-prep-round":
        handlePrepRoundSelection(desc.id || state.selectedId, desc.round || "first");
        return;
      case "set-review-round":
        handleReviewRoundSelection(desc.id || state.selectedId, desc.round || "first");
        return;
      case "quick-jump":
        openProcessPage(desc.id, desc.target || "prep");
        return;
      default:
        return;
    }
  }

  function applyStageFilter(stage) {
    state.filters.stage = stage;
    el.filterStage.value = stage;
    renderStats();
    renderList();
  }

  function connectMailboxByKey(key, options = {}) {
    normalizeConnectedMailboxState();
    const normalized = key === "qq" || key === "netease" ? key : "";
    if (!normalized) return false;

    const cfg = {
      closeOnSuccess: true,
      silent: false,
      ...options,
    };

    const draft = readMailboxDraft(normalized);
    if (!isDraftValid(draft)) {
      if (!cfg.silent) showToast(`请先填写${MAILBOX_LABELS[normalized]}邮箱地址和验证码。`);
      return false;
    }

    const existingIndex = state.connectedMailboxes.findIndex((item) => item.key === normalized);
    if (existingIndex >= 0) {
      if (!state.mailboxEditMode[normalized]) {
        if (!cfg.silent) showToast(`${MAILBOX_LABELS[normalized]}已连接。`);
        return false;
      }
      state.connectedMailboxes[existingIndex] = {
        ...state.connectedMailboxes[existingIndex],
        email: draft.email,
        connectedAt: now(),
      };
      state.mailboxEditMode[normalized] = false;
    } else {
      state.connectedMailboxes.push({
        key: normalized,
        label: MAILBOX_LABELS[normalized],
        email: draft.email,
        connectedAt: now(),
      });
      state.mailboxEditMode[normalized] = false;
    }

    normalizeConnectedMailboxState();
    syncOpportunitiesByConnectedMailboxes();
    renderAll();
    renderConnectFormState();

    if (cfg.closeOnSuccess) {
      closeAllModals();
      renderAll();
    }
    if (!cfg.silent) {
      showToast(existingIndex >= 0 ? `${MAILBOX_LABELS[normalized]}已更换（Demo）。` : `${MAILBOX_LABELS[normalized]}连接成功（Demo）。`);
    }
    return true;
  }

  function startMailboxEdit(key) {
    const normalized = key === "qq" || key === "netease" ? key : "";
    if (!normalized) return;
    if (!isMailboxConnected(normalized)) return;
    const mailbox = getConnectedMailbox(normalized);
    state.mailboxEditMode[normalized] = true;
    if (normalized === "qq") {
      if (el.connectQqEmail) el.connectQqEmail.value = mailbox?.email || "";
      if (el.connectQqCode) el.connectQqCode.value = "";
    } else {
      if (el.connectNeteaseEmail) el.connectNeteaseEmail.value = mailbox?.email || "";
      if (el.connectNeteaseCode) el.connectNeteaseCode.value = "";
    }
    renderConnectFormState();
  }

  function cancelMailboxEdit(key) {
    const normalized = key === "qq" || key === "netease" ? key : "";
    if (!normalized) return;
    state.mailboxEditMode[normalized] = false;
    renderConnectFormState();
  }

  function isMailboxConnected(key) {
    return state.connectedMailboxes.some((item) => item.key === key);
  }

  function getConnectedMailbox(key) {
    return state.connectedMailboxes.find((item) => item.key === key) || null;
  }

  function readMailboxDraft(key) {
    if (key === "qq") {
      return {
        email: String(el.connectQqEmail?.value || "").trim(),
        code: String(el.connectQqCode?.value || "").trim(),
      };
    }
    if (key === "netease") {
      return {
        email: String(el.connectNeteaseEmail?.value || "").trim(),
        code: String(el.connectNeteaseCode?.value || "").trim(),
      };
    }
    return { email: "", code: "" };
  }

  function isDraftValid(draft) {
    return Boolean(draft?.email && draft?.code);
  }

  function syncOpportunitiesByConnectedMailboxes() {
    normalizeConnectedMailboxState();
    const active = new Set(state.connectedMailboxes.map((item) => item.key));
    const existing = new Map(state.opportunities.map((item) => [item.id, item]));

    state.opportunities = state.demoOpportunityPool
      .filter((item) => active.has(item.mailboxProvider))
      .map((template) => existing.get(template.id) || cloneOpportunity(template));

    if (!state.opportunities.length) {
      state.selectedId = "";
      state.processModalOpen = false;
      return;
    }

    hydrateWorkflowState();
    if (!state.opportunities.some((item) => item.id === state.selectedId)) {
      state.selectedId = state.opportunities[0].id;
    }
  }

  function renderConnectFormState() {
    normalizeConnectedMailboxState();
    const qqConnected = isMailboxConnected("qq");
    const neteaseConnected = isMailboxConnected("netease");
    const qqEditing = Boolean(state.mailboxEditMode.qq);
    const neteaseEditing = Boolean(state.mailboxEditMode.netease);
    const qqDraft = readMailboxDraft("qq");
    const neteaseDraft = readMailboxDraft("netease");
    const qqReady = isDraftValid(qqDraft);
    const neteaseReady = isDraftValid(neteaseDraft);
    const qqMailbox = getConnectedMailbox("qq");
    const neteaseMailbox = getConnectedMailbox("netease");

    const qqShowConnectedView = qqConnected && !qqEditing;
    const neteaseShowConnectedView = neteaseConnected && !neteaseEditing;
    el.connectQqView?.classList.toggle("hidden", !qqShowConnectedView);
    el.connectQqForm?.classList.toggle("hidden", qqShowConnectedView);
    el.connectNeteaseView?.classList.toggle("hidden", !neteaseShowConnectedView);
    el.connectNeteaseForm?.classList.toggle("hidden", neteaseShowConnectedView);

    if (el.connectQqDisplay) {
      el.connectQqDisplay.textContent = qqMailbox?.email || "-";
    }
    if (el.connectNeteaseDisplay) {
      el.connectNeteaseDisplay.textContent = neteaseMailbox?.email || "-";
    }

    const qqNeedCode = !qqConnected || qqEditing;
    const neteaseNeedCode = !neteaseConnected || neteaseEditing;
    el.connectQqCodeField?.classList.toggle("hidden", !qqNeedCode);
    el.connectNeteaseCodeField?.classList.toggle("hidden", !neteaseNeedCode);
    el.connectQqCancelEdit?.classList.toggle("hidden", !qqEditing);
    el.connectNeteaseCancelEdit?.classList.toggle("hidden", !neteaseEditing);

    if (el.connectQqBtn) {
      el.connectQqBtn.disabled = qqConnected && !qqEditing ? true : !qqReady;
      el.connectQqBtn.textContent = qqEditing ? "确认更换 QQ 邮箱" : "连接 QQ 邮箱";
    }
    if (el.connectNeteaseBtn) {
      el.connectNeteaseBtn.disabled = neteaseConnected && !neteaseEditing ? true : !neteaseReady;
      el.connectNeteaseBtn.textContent = neteaseEditing ? "确认更换 网易邮箱" : "连接 网易邮箱";
    }

    el.mailboxCardQq?.classList.toggle("is-connected", qqConnected);
    el.mailboxCardNetease?.classList.toggle("is-connected", neteaseConnected);

    if (!el.connectedMailboxPreview) return;
    if (!state.connectedMailboxes.length) {
      el.connectedMailboxPreview.textContent = "当前未连接邮箱。";
      return;
    }
    const text = state.connectedMailboxes
      .map((item) => `${item.label}（${item.email}）`)
      .join("，");
    el.connectedMailboxPreview.textContent = `已连接：${text}`;
  }

  // Workflow step progression must come from mailbox sync events, not manual prep/review actions.
  function applyWorkflowUpdateFromMailbox(opportunityId, update) {
    const target = findOpportunityById(opportunityId);
    if (!target || !update || typeof update !== "object") return false;
    const step = String(update.step || "");
    if (!PROCESS_STEPS.some((item) => item.key === step)) return false;

    const eventTime = String(update.time || now());
    markWorkflowStepVisited(target, step, eventTime);

    const syncedStep = getWorkflowStep(target);
    const inferredRound = inferLatestInterviewRoundFromStepTimes(
      target.workflow.stepTimes || {},
      syncedStep
    );
    const round = targetRoundKey(update.round || stepToRound(step) || stepToRound(syncedStep) || inferredRound);
    if (round) {
      target.workflow.activeRound = round;
      target.workflow.activeReviewRound = round;
      target.workflow.activeRoundSource = "auto";
      target.workflow.activeReviewRoundSource = "auto";
    }

    if (update.label) {
      target.timeline.unshift({ label: String(update.label), time: eventTime });
    }

    if (update.nextAction) {
      target.nextAction = String(update.nextAction);
    } else {
      target.nextAction = suggestNextAction(getEffectiveStage(target));
    }
    renderAll();
    return true;
  }

  function renderAll() {
    renderConnectFormState();
    renderAuthState();
    renderStats();
    renderList();
    renderProcessModal();
  }

  function renderAuthState() {
    normalizeConnectedMailboxState();
    if (state.connectedMailboxes.length) {
      const emails = state.connectedMailboxes.map((item) => item.email).join("、");
      el.mailboxStatus.className = "pill success";
      el.mailboxStatus.textContent = `已连接 ${state.connectedMailboxes.length}/2 · ${emails}`;
      if (el.openConnectBtn) el.openConnectBtn.textContent = "继续连接";
    } else {
      el.mailboxStatus.className = "pill danger";
      el.mailboxStatus.textContent = "邮箱未连接";
      if (el.openConnectBtn) el.openConnectBtn.textContent = "连接邮箱";
    }
  }

  function renderStats() {
    const all = state.opportunities;
    el.statTotal.textContent = String(all.length);
    el.statAssessment.textContent = String(all.filter((x) => getEffectiveStage(x) === "assessment").length);
    el.statInterview.textContent = String(all.filter((x) => getEffectiveStage(x) === "interviewing").length);
    el.statWaiting.textContent = String(all.filter((x) => getEffectiveStage(x) === "waiting_result").length);
    el.statClose.textContent = String(all.filter((x) => getEffectiveStage(x) === "closed").length);
    el.statUrgent.textContent = String(all.filter((x) => isUrgent(x)).length);

    document.querySelectorAll(".stat-card[data-stage]").forEach((node) => {
      node.classList.toggle("is-active", node.dataset.stage === state.filters.stage);
    });
  }

  function renderList() {
    if (!state.connectedMailboxes.length) {
      el.list.innerHTML =
        '<li class="job-card"><p class="muted">请先连接邮箱后查看投递记录。Demo 可随便填写邮箱地址和验证码。</p></li>';
      return;
    }
    const items = getFilteredOpportunities();
    if (!items.length) {
      el.list.innerHTML = '<li class="job-card"><p class="muted">没有匹配结果，试试更换筛选条件。</p></li>';
      return;
    }

    el.list.innerHTML = items
      .map((item, index) => {
        const selected = state.selectedId === item.id ? "is-selected" : "";
        const pinned = index === 0;
        const jdLabel = item.jd ? "查看JD" : "JD上传";
        const urgentTag = isUrgent(item) ? '<span class="tag urgent">加急!!!</span>' : "";
        return `
          <li class="job-card ${selected}">
            <div class="job-head">
              <div data-action="select-item" data-id="${item.id}">
                <h3>${escapeHtml(item.company)}</h3>
                <p>${escapeHtml(item.role)}</p>
              </div>
              <div class="job-tags">
                <span class="tag stage ${escapeHtml(getStageTagClass(item))}">${escapeHtml(getStageDisplayLabel(item))}</span>
                <span class="tag date">${escapeHtml(formatDateTag(item.dueAt))}</span>
                ${urgentTag}
                <button
                  class="btn btn-ghost small expand-btn"
                  data-action="open-process"
                  data-id="${item.id}"
                  data-target="prep"
                  title="展开"
                >
                  ↗
                </button>
              </div>
            </div>
            <div class="job-meta">
              <span>🗓️ ${escapeHtml(formatDateTime(item.dueAt))}</span>
              <span>会议号/链接：</span>
              ${
                item.meetingLink
                  ? `<a href="${escapeAttr(item.meetingLink)}" target="_blank" rel="noreferrer">${escapeHtml(item.meetingLink)}</a>`
                  : '<span class="muted">暂无链接</span>'
              }
            </div>
            ${
              pinned
                ? `
              <div class="job-actions">
                <div class="action-row">
                  <button class="btn btn-ghost" data-action="jd-entry" data-id="${item.id}">${jdLabel}</button>
                  <button class="btn btn-ghost" data-action="open-process" data-id="${item.id}" data-target="prep">流程查看</button>
                  <button class="btn btn-ghost" data-action="prep-entry" data-id="${item.id}">面经准备</button>
                  <button class="btn btn-ghost" data-action="review-entry" data-id="${item.id}">面试复盘</button>
                </div>
              </div>
            `
                : ""
            }
          </li>
        `;
      })
      .join("");
  }

  function renderProcessModal() {
    const opp = findSelected();
    if (!opp) {
      el.processModal.classList.add("hidden");
      return;
    }

    el.processCompany.textContent = opp.company;
    el.processRole.textContent = opp.role;
    el.processDueTime.textContent = `🗓️ ${formatDateTime(opp.dueAt)}`;

    if (opp.meetingLink) {
      el.processMeetingLink.href = opp.meetingLink;
      el.processMeetingLink.textContent = opp.meetingLink;
    } else {
      el.processMeetingLink.removeAttribute("href");
      el.processMeetingLink.textContent = "暂无会议链接";
    }

    el.processTimeline.innerHTML = renderProgressTimeline(opp);
    el.processJd.innerHTML = renderJdSection(opp);
    el.processPrepRounds.innerHTML = renderPrepRoundSwitch(opp);
    el.processPrep.innerHTML = renderPrepSection(opp, getCurrentPrepRound(opp));
    el.processReviewRounds.innerHTML = renderReviewRoundSwitch(opp);
    el.processReview.innerHTML = renderReviewSection(opp, getCurrentReviewRound(opp));

    switchFlowView(state.flowView, false);
    el.processModal.classList.toggle("hidden", !state.processModalOpen);
  }

  function openProcessPage(id, target) {
    if (!state.connectedMailboxes.length || !state.opportunities.length) {
      openConnectModal("请先连接邮箱后再查看流程。");
      return;
    }
    if (id) selectOpportunity(id);
    state.processModalOpen = true;
    renderProcessModal();
    openOverlay();

    if (!target || target === "prep") {
      switchFlowView("prep", true);
      return;
    }

    if (target === "jd") {
      switchFlowView("jd", true);
      return;
    }

    if (target === "review") {
      switchFlowView("review", true);
      return;
    }

    el.processScrollRoot.scrollTo({ top: 0, behavior: "smooth" });
  }

  function switchFlowView(view, shouldScroll) {
    const next = ["jd", "prep", "review"].includes(view) ? view : "prep";
    state.flowView = next;

    const jdSection = document.getElementById("section-jd");
    const prepSection = document.getElementById("section-prep");
    const reviewSection = document.getElementById("section-review");
    jdSection?.classList.toggle("hidden", next !== "jd");
    prepSection?.classList.toggle("hidden", next !== "prep");
    reviewSection?.classList.toggle("hidden", next !== "review");

    document.querySelectorAll('.icon-chip[data-action="jump-icon"]').forEach((chip) => {
      chip.classList.toggle("is-active", chip.dataset.target === next);
    });

    if (!shouldScroll) return;
    const section = document.getElementById(`section-${next}`);
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function selectOpportunity(id) {
    if (!id) return;
    if (!findOpportunityById(id)) return;
    state.selectedId = id;
    renderProcessModal();
    renderList();
  }

  function handleJdEntry(id) {
    const opp = findOpportunityById(id);
    if (!opp) return;

    if (opp.jd) {
      openProcessPage(id, "jd");
      showToast("已跳转到 JD icon 区域。");
      return;
    }

    openJdModal(id);
  }

  function prepFromCard(id) {
    openProcessPage(id, "prep");
    runPrepSearch(id);
  }

  function openReviewAnchor(id) {
    openProcessPage(id, "review");
  }

  function openJdModal(id) {
    state.modalTargetId = id || state.selectedId;
    el.jdPreview.textContent = "";
    el.jdFile.value = "";
    el.jdText.value = "";
    el.jdFileLabel.textContent = "点击上传或拖拽截图到此处";
    openModal(el.jdModal);
  }

  function openReviewModal(id, round) {
    const target = findOpportunityById(id) || findSelected();
    if (!target) return;
    state.modalTargetId = target.id;
    state.modalReviewRound = targetRoundKey(round) || getCurrentReviewRound(target);
    const roundMeta = getRoundMeta(state.modalReviewRound);
    el.reviewPreview.textContent = `当前上传轮次：${roundMeta.icon} ${roundMeta.label}`;
    el.reviewFile.value = "";
    el.reviewText.value = "";
    el.reviewFileLabel.textContent = `点击上传${roundMeta.label}复盘材料`;
    openModal(el.reviewModal);
  }

  async function submitJd() {
    const target = findOpportunityById(state.modalTargetId) || findSelected();
    if (!target) return;

    const file = el.jdFile.files[0];
    const text = el.jdText.value.trim();
    if (!file && !text) {
      el.jdPreview.textContent = "请先上传截图或粘贴问题。";
      return;
    }

    showLoading(true, "正在识别JD截图并抽取关键词...");
    await sleep(1000);

    target.jd = buildJdSummary(target, text, file);
    target.timeline.unshift({ label: "上传并识别 JD", time: now() });
    target.nextAction = "JD已识别，建议开始准备当前轮次面经。";

    showLoading(false);
    closeAllModals();
    renderAll();
    openProcessPage(target.id, "jd");
    showToast("JD识别完成，已自动写入流程。");
  }

  async function runPrepSearch(id) {
    const target = findOpportunityById(id) || findSelected();
    if (!target) return;

    const selectedRound = getCurrentPrepRound(target);
    const roundMeta = getRoundMeta(selectedRound);
    const keywords = buildPrepKeywords(target);
    showLoading(true, `正在为您准备${roundMeta.label}面经...`);
    await sleep(1200);

    const livePrep = await invokeXiaohongshuSkill(keywords, target, selectedRound);
    const currentPrep = livePrep || buildPrepResult(target, keywords, selectedRound);
    target.prep = mergePrepResultByRound(target.prep, currentPrep, selectedRound);
    target.timeline.unshift({ label: `${roundMeta.label}面经已准备`, time: now() });
    target.nextAction = `完成${roundMeta.label}高频追问模拟并沉淀答案。`;

    showLoading(false);
    renderAll();
    openProcessPage(target.id, "prep");
    showToast(`${roundMeta.label}面经准备完成。`);
  }

  async function submitReview() {
    const target = findOpportunityById(state.modalTargetId) || findSelected();
    if (!target) return;
    const reviewRound = targetRoundKey(state.modalReviewRound) || getCurrentReviewRound(target);
    const roundMeta = getRoundMeta(reviewRound);

    const file = el.reviewFile.files[0];
    const text = el.reviewText.value.trim();
    if (!file && !text) {
      el.reviewPreview.textContent = "请上传至少一份资料或补充文字信息。";
      return;
    }

    showLoading(true, `正在生成${roundMeta.label}复盘结论...`);
    await sleep(1100);

    const reviewSummary = buildReviewSummary(text, file, reviewRound);
    const currentReviewState = ensureReviewState(target);
    target.review = mergeReviewResultByRound(currentReviewState, reviewSummary, reviewRound);
    target.timeline.unshift({ label: `${roundMeta.label}复盘已上传`, time: now() });
    target.nextAction = reviewSummary.nextAction;

    showLoading(false);
    closeAllModals();
    renderAll();
    openProcessPage(target.id, "review");
    showToast(`${roundMeta.label}复盘已生成。`);
  }

  function handlePrepRoundSelection(id, round) {
    const normalizedRound = targetRoundKey(round) || "first";
    const result = setPrepRound(id, normalizedRound);
    if (!result.target) return;

    renderProcessModal();
    const roundMeta = getRoundMeta(normalizedRound);
    if (result.changed) {
      const hasPrep = hasPrepContentForRound(result.target, normalizedRound);
      showToast(hasPrep ? `已切换到${roundMeta.label}内容。` : `已切换到${roundMeta.label}，当前该轮还没有面经内容。`);
      return;
    }

    showToast(`当前已是${roundMeta.label}。`);
  }

  function setPrepRound(id, round) {
    if (!id) return { target: null, changed: false };
    if (!PREP_ROUNDS.some((item) => item.key === round)) return { target: null, changed: false };
    const target = findOpportunityById(id);
    if (!target) return { target: null, changed: false };
    ensureOpportunityWorkflow(target);
    const prevRound = getCurrentPrepRound(target);
    target.workflow.activeRound = round;
    target.workflow.activeRoundSource = "manual";
    return { target, changed: prevRound !== round };
  }

  function getCurrentPrepRound(opp) {
    ensureOpportunityWorkflow(opp);
    const active = targetRoundKey(opp.workflow.activeRound);
    if (active) return active;
    const step = opp.workflow?.currentStep || "assessment";
    return inferAutoPrepRound(step, opp.dueAt);
  }

  function renderPrepRoundSwitch(opp) {
    const activeRound = getCurrentPrepRound(opp);
    return PREP_ROUNDS.map(
      (round) => `
        <button
          type="button"
          class="round-chip ${activeRound === round.key ? "is-active" : ""} ${hasPrepContentForRound(opp, round.key) ? "is-ready" : ""}"
          aria-pressed="${activeRound === round.key ? "true" : "false"}"
          title="${round.label}${hasPrepContentForRound(opp, round.key) ? "（已生成）" : "（待生成）"}"
          data-action="set-prep-round"
          data-id="${opp.id}"
          data-round="${round.key}"
        >
          <span>${round.icon}</span>
          <span>${round.label}</span>
        </button>
      `
    ).join("");
  }

  function handleReviewRoundSelection(id, round) {
    const normalizedRound = targetRoundKey(round) || "first";
    const result = setReviewRound(id, normalizedRound);
    if (!result.target) return;

    renderProcessModal();
    const roundMeta = getRoundMeta(normalizedRound);
    if (result.changed) {
      const hasReview = hasReviewContentForRound(result.target, normalizedRound);
      showToast(hasReview ? `已切换到${roundMeta.label}复盘。` : `已切换到${roundMeta.label}，当前该轮还没有复盘内容。`);
      return;
    }

    showToast(`当前已是${roundMeta.label}。`);
  }

  function setReviewRound(id, round) {
    if (!id) return { target: null, changed: false };
    const normalized = targetRoundKey(round);
    if (!normalized) return { target: null, changed: false };
    const target = findOpportunityById(id);
    if (!target) return { target: null, changed: false };
    ensureOpportunityWorkflow(target);
    const prevRound = getCurrentReviewRound(target);
    target.workflow.activeReviewRound = normalized;
    target.workflow.activeReviewRoundSource = "manual";
    return { target, changed: prevRound !== normalized };
  }

  function getCurrentReviewRound(opp) {
    ensureOpportunityWorkflow(opp);
    const selected = targetRoundKey(opp.workflow.activeReviewRound);
    if (selected) return selected;
    const step = opp.workflow?.currentStep || "assessment";
    return inferAutoReviewRound(step, opp.dueAt);
  }

  function renderReviewRoundSwitch(opp) {
    const activeRound = getCurrentReviewRound(opp);
    return PREP_ROUNDS.map(
      (round) => `
        <button
          type="button"
          class="round-chip ${activeRound === round.key ? "is-active" : ""} ${hasReviewContentForRound(opp, round.key) ? "is-ready" : ""}"
          aria-pressed="${activeRound === round.key ? "true" : "false"}"
          title="${round.label}${hasReviewContentForRound(opp, round.key) ? "（已生成）" : "（待生成）"}"
          data-action="set-review-round"
          data-id="${opp.id}"
          data-round="${round.key}"
        >
          <span>${round.icon}</span>
          <span>${round.label}</span>
        </button>
      `
    ).join("");
  }

  function hasPrepContentForRound(opp, round) {
    const normalized = targetRoundKey(round);
    if (!normalized || !opp?.prep?.items?.length) return false;
    return opp.prep.items.some((item) => targetRoundKey(item.round) === normalized);
  }

  function hasReviewContentForRound(opp, round) {
    const normalized = targetRoundKey(round);
    if (!normalized) return false;
    const reviewState = ensureReviewState(opp);
    return Boolean(reviewState?.rounds?.[normalized]);
  }

  function renderJdSection(opp) {
    if (!opp.jd) {
      return "<p>还没有 JD。点击“上传/更新JD”后可上传截图或粘贴问题，系统会自动识别并给出高频问答方向。</p>";
    }

    return `
      <p><strong>来源：</strong>${escapeHtml(opp.jd.source)} · ${escapeHtml(opp.jd.updatedAt)}</p>
      <p><strong>关键词：</strong>${opp.jd.keywords.map((k) => `<span class="quick-chip">${escapeHtml(k)}</span>`).join(" ")}</p>
      <div class="process-card">
        <strong>核心职责</strong>
        <ul>${opp.jd.responsibilities.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
      <div class="process-card">
        <strong>高频追问</strong>
        <ul>${opp.jd.focusQuestions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
    `;
  }

  function renderProgressTimeline(opp) {
    const currentIndex = detectCurrentStepIndex(opp);

    return PROCESS_STEPS.map((step, index) => {
      const status = index < currentIndex ? "done" : index === currentIndex ? "current" : "pending";
      const classes = [`timeline-step`, `is-${status}`];
      if (index === currentIndex && shouldShowPastTimeProgress(opp, step)) {
        classes.push("is-time-passed");
      }
      const timeText = getTimelineTimeText(opp, step, status);
      return `
        <li class="${classes.join(" ")}">
          <strong>${escapeHtml(step.label)}</strong>
          <span>${escapeHtml(timeText)}</span>
        </li>
      `;
    }).join("");
  }

  function detectCurrentStepIndex(opp) {
    return stepIndex(getWorkflowStep(opp));
  }

  function getRoundMeta(round) {
    return PREP_ROUNDS.find((item) => item.key === round) || PREP_ROUNDS[0];
  }

  function getInterviewRoundKey(opp) {
    ensureOpportunityWorkflow(opp);
    const currentRound = targetRoundKey(opp.workflow.activeRound) || stepToRound(opp.workflow.currentStep);
    return currentRound || "first";
  }

  function getStepTime(opp, step) {
    ensureOpportunityWorkflow(opp);
    const stepKey = step?.key || "";
    const currentStep = opp.workflow.currentStep || "assessment";
    const storedTime = opp.workflow.stepTimes?.[stepKey] || "";
    if (storedTime) return storedTime;
    if (stepKey === currentStep && opp.dueAt) {
      return formatDateTime(opp.dueAt);
    }
    return "";
  }

  function getTimelineTimeText(opp, step, status) {
    const recorded = getStepTime(opp, step);
    if (recorded) return recorded;
    if (status === "pending") return "待推进";
    const currentStep = getWorkflowStep(opp);
    const fallback = getStepTime(opp, { key: currentStep });
    return fallback || formatDateTimeFromMs(Date.now());
  }

  function shouldShowPastTimeProgress(opp, step) {
    ensureOpportunityWorkflow(opp);
    const stepKey = step?.key || "";
    const currentStep = opp.workflow.currentStep || "assessment";
    if (stepKey !== currentStep || !isInterviewStep(stepKey)) return false;
    const interviewAt = parseTime(opp.dueAt);
    if (interviewAt === Number.MAX_SAFE_INTEGER) return false;
    return interviewAt <= Date.now();
  }

  function renderPrepSection(opp, round) {
    const currentRound = getRoundMeta(round);
    if (!opp.prep) {
      return `<p>点击“准备面经”后，系统会自动整理相关关键词，并输出${currentRound.label}问题+作答思路。</p>`;
    }

    const roundItems = opp.prep.items.filter((item) => item.round === currentRound.key);
    if (!roundItems.length) {
      return `<p><strong>当前轮次：</strong>${currentRound.icon} ${currentRound.label}</p><p>当前轮次还未生成面经。点击右上角“准备面经”将只生成${currentRound.label}内容。</p>`;
    }

    return `
      <p><strong>当前轮次：</strong>${currentRound.icon} ${currentRound.label}</p>
      <p><strong>检索时间：</strong>${escapeHtml(opp.prep.generatedAt)}</p>
      <p><strong>检索词：</strong>${opp.prep.keywords.map((k) => `<span class="quick-chip">${escapeHtml(k)}</span>`).join(" ")}</p>
      ${opp.prep.sources
        .map(
          (source) => `
            <div class="process-card">
              <strong>${escapeHtml(source.title)}</strong>
              <p>${escapeHtml(source.highlights.join("；"))}</p>
            </div>
          `
        )
        .join("")}
      ${roundItems
        .map(
          (item, index) => `
            <div class="process-card">
              <strong>Q${index + 1}. ${escapeHtml(item.question)}</strong>
              <p>思路：${escapeHtml(item.thought)}</p>
            </div>
          `
        )
        .join("")}
    `;
  }

  function renderReviewSection(opp, round) {
    const currentRound = getRoundMeta(round);
    const reviewState = ensureReviewState(opp);
    const summary = reviewState.rounds[currentRound.key];

    if (!summary) {
      return `<p><strong>当前轮次：</strong>${currentRound.icon} ${currentRound.label}</p><p>当前轮次还未上传复盘。点击右上角“上传复盘资料”将只生成${currentRound.label}复盘结论。</p>`;
    }

    return `
      <p><strong>当前轮次：</strong>${currentRound.icon} ${currentRound.label}</p>
      <p><strong>来源：</strong>${escapeHtml(summary.source)} · ${escapeHtml(summary.createdAt)}</p>
      <div class="process-card">
        <strong>做得好</strong>
        <ul>${summary.strengths.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
      </div>
      <div class="process-card">
        <strong>待改进</strong>
        <ul>${summary.gaps.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
      </div>
      <div class="process-card">
        <strong>行动项</strong>
        <ul>${summary.actions.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
      </div>
    `;
  }

  function buildJdSummary(opp, text, file) {
    const content = `${opp.role} ${text}`.trim();
    const keywords = pickKeywords(content, opp.company);

    return {
      source: file ? inferFileLabel(file.name) : "文本粘贴",
      updatedAt: now(),
      keywords,
      responsibilities: [
        "拆解业务场景并输出可执行需求方案",
        "联动研发与设计推进版本落地",
        "围绕核心指标持续迭代并复盘",
      ],
      focusQuestions: [
        "你如何定义这个岗位最关键的结果指标？",
        "跨团队推进时如何处理目标冲突与优先级？",
      ],
    };
  }

  function buildPrepKeywords(opp) {
    const base = [opp.company, opp.role, getStageDisplayLabel(opp), "产品面经", "高频追问"];
    if (opp.jd?.keywords?.length) base.push(...opp.jd.keywords.slice(0, 2));
    return [...new Set(base)].slice(0, 7);
  }

  function buildPrepResult(opp, keywords, round) {
    const roundMeta = getRoundMeta(round);
    const sourceMap = {
      first: [
        { title: "热门面经帖：产品一面高频题", highlights: ["强调结构化表达", "先结论后展开"] },
        { title: "实习经验帖：一面自我介绍", highlights: ["突出业务场景", "避免背景铺陈过长"] },
      ],
      second: [
        { title: "经验帖：二面深挖追问", highlights: ["准备替代方案", "给出指标权衡依据"] },
        { title: "二面案例拆解：业务增长策略", highlights: ["写清目标约束", "展示路径和验证"] },
      ],
      third: [
        { title: "复盘帖：三面综合判断题", highlights: ["讲清优先级机制", "展示跨团队协同思路"] },
        { title: "三面高压追问：如何稳住表达", highlights: ["先答核心结论", "再补风险和兜底"] },
      ],
    };

    const items = PREP_TEMPLATES.slice(0, 3).map((template, idx) => ({
      round: roundMeta.key,
      question: `${keywords[idx % keywords.length]} 场景下你会如何设计并推进？`,
      thought: template.thought,
    }));

    return {
      generatedAt: now(),
      keywords,
      sources: sourceMap[roundMeta.key] || sourceMap.first,
      items,
    };
  }

  function mergePrepResultByRound(existing, incoming, round) {
    const normalizedIncoming = normalizePrepRounds(incoming, round);
    if (!existing) return normalizedIncoming;

    const normalizedExisting = normalizePrepRounds(existing);
    const kept = normalizedExisting.items.filter((item) => item.round !== round);
    const combinedItems = [...kept, ...normalizedIncoming.items];
    const order = { first: 0, second: 1, third: 2 };
    combinedItems.sort((a, b) => (order[a.round] ?? 9) - (order[b.round] ?? 9));

    const keywords = [...new Set([...(normalizedExisting.keywords || []), ...(normalizedIncoming.keywords || [])])].slice(
      0,
      8
    );

    return {
      generatedAt: normalizedIncoming.generatedAt || now(),
      keywords,
      sources: normalizedIncoming.sources?.length ? normalizedIncoming.sources : normalizedExisting.sources || [],
      items: combinedItems,
    };
  }

  function buildReviewSummary(text, file, round) {
    const lower = text.toLowerCase();
    const strengths = ["回答结构完整，能先给结论", "案例中有业务目标和指标支撑"];
    const gaps = ["追问时可再精简表达", "风险兜底策略还可以更具体"];
    const actions = [
      "补2组业务优先级题的标准答题模板",
      "准备1组“失败案例复盘”用于压力追问",
      "下次面试前做一次15分钟模拟问答",
    ];

    if (lower.includes("紧张") || lower.includes("卡壳")) {
      gaps.unshift("现场稳定性有波动，建议增加过渡句模板");
    }
    if (lower.includes("数据")) {
      strengths.unshift("数据口径解释清晰，结论可验证");
    }

    return {
      round: targetRoundKey(round) || "first",
      source: file ? inferFileLabel(file.name) : "文本输入",
      createdAt: now(),
      strengths: strengths.slice(0, 3),
      gaps: gaps.slice(0, 3),
      actions,
      nextAction: actions[0],
    };
  }

  function ensureReviewState(opp) {
    if (!opp.review) {
      return { generatedAt: "", rounds: {} };
    }

    if (opp.review.rounds && typeof opp.review.rounds === "object") {
      return opp.review;
    }

    const inferredRound =
      detectReviewRoundFromSource(opp.review.source) ||
      targetRoundKey(opp.workflow?.activeReviewRound) ||
      inferLatestInterviewRoundFromStepTimes(opp.workflow?.stepTimes || {}, opp.workflow?.currentStep || "") ||
      "first";

    const legacyEntry = {
      round: inferredRound,
      source: opp.review.source || "文本输入",
      createdAt: opp.review.createdAt || now(),
      strengths: Array.isArray(opp.review.strengths) ? opp.review.strengths : [],
      gaps: Array.isArray(opp.review.gaps) ? opp.review.gaps : [],
      actions: Array.isArray(opp.review.actions) ? opp.review.actions : [],
      nextAction: opp.review.nextAction || suggestNextAction(getEffectiveStage(opp)),
    };

    opp.review = {
      generatedAt: legacyEntry.createdAt,
      rounds: { [inferredRound]: legacyEntry },
    };
    return opp.review;
  }

  function mergeReviewResultByRound(existing, incoming, round) {
    const target = targetRoundKey(round) || "first";
    const rounds = existing?.rounds && typeof existing.rounds === "object" ? { ...existing.rounds } : {};
    rounds[target] = {
      ...incoming,
      round: target,
    };
    return {
      generatedAt: incoming.createdAt || now(),
      rounds,
    };
  }

  function detectReviewRoundFromSource(source) {
    const text = String(source || "").toLowerCase();
    if (!text) return "";
    if (text.includes("third") || text.includes("三面")) return "third";
    if (text.includes("second") || text.includes("二面")) return "second";
    if (text.includes("first") || text.includes("一面")) return "first";
    return "";
  }

  async function invokeXiaohongshuSkill(keywords, opp, round) {
    if (typeof window.callXiaohongshuSkill === "function") {
      try {
        const result = await window.callXiaohongshuSkill({
          keywords,
          company: opp.company,
          role: opp.role,
          round,
        });
        return normalizePrepPayload(result, keywords, round);
      } catch (_error) {
        return null;
      }
    }

    if (typeof window.__XHS_SKILL_ENDPOINT__ === "string" && window.__XHS_SKILL_ENDPOINT__) {
      try {
        const response = await fetch(window.__XHS_SKILL_ENDPOINT__, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keywords, company: opp.company, role: opp.role, round }),
        });
        if (!response.ok) return null;
        return normalizePrepPayload(await response.json(), keywords, round);
      } catch (_error) {
        return null;
      }
    }

    return null;
  }

  function normalizePrepPayload(payload, fallbackKeywords, forcedRound) {
    if (!payload || typeof payload !== "object") return null;
    if (!Array.isArray(payload.items) || !payload.items.length) return null;

    const keywords =
      Array.isArray(payload.keywords) && payload.keywords.length ? payload.keywords : fallbackKeywords;

    return normalizePrepRounds(
      {
      generatedAt: payload.generatedAt || now(),
      keywords: keywords.slice(0, 8),
      sources: (Array.isArray(payload.sources) ? payload.sources : [])
        .filter((item) => item && item.title)
        .map((item) => ({
          title: String(item.title),
          highlights: Array.isArray(item.highlights) ? item.highlights.map((x) => String(x)) : [],
        }))
        .slice(0, 4),
      items: payload.items
        .filter((item) => item && item.question && item.thought)
        .map((item) => ({
          round: String(item.round || item.stage || "").toLowerCase(),
          question: String(item.question),
          thought: String(item.thought),
        }))
        .slice(0, 8),
      },
      forcedRound
    );
  }

  function normalizePrepRounds(prep, forcedRound) {
    if (!prep || !Array.isArray(prep.items)) return prep;

    const allowed = new Set(PREP_ROUNDS.map((item) => item.key));
    const force = allowed.has(forcedRound) ? forcedRound : "";
    const normalizedItems = prep.items.map((item, index) => {
      let round = String(item.round || "").toLowerCase();
      if (round === "1" || round.includes("first") || round.includes("一面")) round = "first";
      if (round === "2" || round.includes("second") || round.includes("二面")) round = "second";
      if (round === "3" || round.includes("third") || round.includes("三面")) round = "third";
      if (force) {
        round = force;
      } else if (!allowed.has(round)) {
        round = PREP_ROUNDS[index % PREP_ROUNDS.length].key;
      }
      return { ...item, round };
    });

    return { ...prep, items: normalizedItems };
  }

  function ensureOpportunityWorkflow(opp) {
    if (!opp) return;
    if (opp.workflow && opp.workflow.currentStep && opp.workflow.stepTimes) {
      const currentStep = opp.workflow.currentStep || "assessment";
      const prepSource = opp.workflow.activeRoundSource === "manual" ? "manual" : "auto";
      const reviewSource = opp.workflow.activeReviewRoundSource === "manual" ? "manual" : "auto";
      opp.workflow.activeRoundSource = prepSource;
      opp.workflow.activeReviewRoundSource = reviewSource;

      if (prepSource !== "manual" || !targetRoundKey(opp.workflow.activeRound)) {
        opp.workflow.activeRound = inferAutoPrepRound(currentStep, opp.dueAt);
        opp.workflow.activeRoundSource = "auto";
      }
      if (reviewSource !== "manual" || !targetRoundKey(opp.workflow.activeReviewRound)) {
        opp.workflow.activeReviewRound = inferAutoReviewRound(currentStep, opp.dueAt);
        opp.workflow.activeReviewRoundSource = "auto";
      }
      backfillReachedStepTimes(opp);
      ensureReviewState(opp);
      syncLegacyStageFromWorkflow(opp);
      return;
    }

    const stepTimes = extractStepTimesFromTimeline(opp.timeline || []);
    const round = inferRoundFromStepTimes(stepTimes);
    let currentStep = inferStepFromLegacyStage(opp.stage, round);
    if (currentStep === "offer" && !stepTimes.offer) stepTimes.offer = "";
    if (currentStep === "hr" && !stepTimes.hr) stepTimes.hr = "";

    if (stepTimes.offer) currentStep = "offer";
    else if (opp.stage === "waiting_result" || opp.stage === "closed") currentStep = "hr";
    else if (stepTimes.hr && currentStep !== "assessment") currentStep = "hr";
    else if (stepTimes.third) currentStep = "third";
    else if (stepTimes.second) currentStep = "second";
    else if (stepTimes.first) currentStep = "first";

    opp.workflow = {
      currentStep,
      activeRound: inferAutoPrepRound(currentStep, opp.dueAt),
      activeRoundSource: "auto",
      activeReviewRound: inferAutoReviewRound(currentStep, opp.dueAt),
      activeReviewRoundSource: "auto",
      stepTimes,
      updatedAt: now(),
    };
    backfillReachedStepTimes(opp);
    ensureReviewState(opp);
    syncLegacyStageFromWorkflow(opp);
  }

  // Demo 阶段允许自动补齐缺失时间，但统一写回 workflow.stepTimes，保证展示口径一致。
  function backfillReachedStepTimes(opp) {
    if (!opp?.workflow?.stepTimes) return;
    const steps = PROCESS_STEPS.map((item) => item.key);
    const currentIdx = stepIndex(opp.workflow.currentStep || "assessment");
    if (currentIdx < 0) return;

    const stepTimes = opp.workflow.stepTimes;
    const fallbackCurrent = parseTime(opp.dueAt) !== Number.MAX_SAFE_INTEGER ? parseTime(opp.dueAt) : Date.now();
    const currentKey = steps[currentIdx];
    if (!stepTimes[currentKey] || parseTime(stepTimes[currentKey]) === Number.MAX_SAFE_INTEGER) {
      stepTimes[currentKey] = formatDateTimeFromMs(fallbackCurrent);
    }

    const reached = new Array(currentIdx + 1).fill(null);
    for (let i = 0; i <= currentIdx; i += 1) {
      const parsed = parseTime(stepTimes[steps[i]]);
      reached[i] = parsed === Number.MAX_SAFE_INTEGER ? null : parsed;
    }

    let firstKnown = reached.findIndex((value) => value !== null);
    if (firstKnown === -1) {
      reached[currentIdx] = fallbackCurrent;
      firstKnown = currentIdx;
    }

    const defaultGapMs = 90 * 60 * 1000;
    for (let i = firstKnown - 1; i >= 0; i -= 1) {
      reached[i] = reached[i + 1] - defaultGapMs;
    }

    let cursor = 1;
    while (cursor <= currentIdx) {
      if (reached[cursor] !== null) {
        cursor += 1;
        continue;
      }
      const start = cursor - 1;
      let end = cursor;
      while (end <= currentIdx && reached[end] === null) end += 1;
      if (end <= currentIdx && reached[start] !== null && reached[end] !== null) {
        const slots = end - start;
        const stepMs = Math.max(10 * 60 * 1000, Math.floor((reached[end] - reached[start]) / slots));
        for (let offset = 1; offset < slots; offset += 1) {
          reached[start + offset] = reached[start] + stepMs * offset;
        }
        cursor = end + 1;
        continue;
      }
      for (let i = cursor; i <= currentIdx; i += 1) {
        reached[i] = reached[i - 1] + defaultGapMs;
      }
      break;
    }

    for (let i = 0; i <= currentIdx; i += 1) {
      if (!stepTimes[steps[i]] || parseTime(stepTimes[steps[i]]) === Number.MAX_SAFE_INTEGER) {
        stepTimes[steps[i]] = formatDateTimeFromMs(reached[i] || fallbackCurrent);
      }
    }
  }

  function extractStepTimesFromTimeline(timeline) {
    const stepTimes = {
      assessment: "",
      first: "",
      second: "",
      third: "",
      hr: "",
      offer: "",
    };
    timeline.forEach((line) => {
      const step = detectTimelineStep(line.label);
      if (!step) return;
      if (!stepTimes[step]) stepTimes[step] = line.time || "";
    });
    return stepTimes;
  }

  function detectTimelineStep(label) {
    const text = String(label || "").toLowerCase();
    if (!text) return "";
    if (text.includes("offer") || text.includes("录用") || text.includes("录取")) return "offer";
    if (
      text.includes("hr") ||
      text.includes("终面") ||
      text.includes("等结果") ||
      text.includes("待结果") ||
      text.includes("等待结果")
    ) {
      return "hr";
    }
    if (text.includes("三面")) return "third";
    if (text.includes("二面")) return "second";
    if (text.includes("一面")) return "first";
    if (text.includes("测评")) return "assessment";
    return "";
  }

  function inferRoundFromStepTimes(stepTimes) {
    if (stepTimes.third) return "third";
    if (stepTimes.second) return "second";
    return "first";
  }

  function inferLatestInterviewRoundFromStepTimes(stepTimes, currentStep) {
    if (currentStep === "offer" || currentStep === "hr" || stepTimes.third) return "third";
    if (stepTimes.second) return "second";
    return "first";
  }

  function inferStepFromLegacyStage(stage, round) {
    if (stage === "assessment") return "assessment";
    if (stage === "interviewing" || stage === "interview_prep") return round || "first";
    if (stage === "waiting_result") return "hr";
    if (stage === "closed") return "hr";
    return "assessment";
  }

  function getWorkflowStep(opp) {
    ensureOpportunityWorkflow(opp);
    return opp.workflow.currentStep || "assessment";
  }

  function setWorkflowStep(opp, step, time) {
    if (!opp) return;
    ensureOpportunityWorkflow(opp);
    const normalizedStep = PROCESS_STEPS.some((item) => item.key === step) ? step : "assessment";
    opp.workflow.currentStep = normalizedStep;
    if (time && !opp.workflow.stepTimes[normalizedStep]) {
      opp.workflow.stepTimes[normalizedStep] = time;
    }
    opp.workflow.activeRound = inferAutoPrepRound(normalizedStep, opp.dueAt);
    opp.workflow.activeRoundSource = "auto";
    opp.workflow.activeReviewRound = inferAutoReviewRound(normalizedStep, opp.dueAt);
    opp.workflow.activeReviewRoundSource = "auto";
    backfillReachedStepTimes(opp);
    opp.workflow.updatedAt = now();
    syncLegacyStageFromWorkflow(opp);
  }

  function markWorkflowStepVisited(opp, step, time) {
    if (!opp) return;
    ensureOpportunityWorkflow(opp);
    const normalizedStep = PROCESS_STEPS.some((item) => item.key === step) ? step : "";
    if (!normalizedStep) return;
    if (time && !opp.workflow.stepTimes[normalizedStep]) {
      opp.workflow.stepTimes[normalizedStep] = time;
    }
    const current = getWorkflowStep(opp);
    if (stepIndex(normalizedStep) > stepIndex(current)) {
      setWorkflowStep(opp, normalizedStep, time);
      return;
    }
    backfillReachedStepTimes(opp);
    opp.workflow.updatedAt = now();
  }

  function getEffectiveStage(opp) {
    ensureOpportunityWorkflow(opp);
    if (opp.stage === "closed") return "closed";
    const step = getWorkflowStep(opp);
    if (step === "assessment") return "assessment";
    if (step === "first" || step === "second" || step === "third") return "interviewing";
    if (step === "hr" || step === "offer") return "waiting_result";
    return "assessment";
  }

  function stepToRound(step) {
    if (step === "first" || step === "second" || step === "third") return step;
    return "";
  }

  function isInterviewStep(step) {
    return step === "first" || step === "second" || step === "third";
  }

  function inferAutoPrepRound(step, dueAt) {
    if (step === "hr" || step === "offer") return "third";
    if (!isInterviewStep(step)) return "first";
    return isDueTimePassed(dueAt) ? nextInterviewRound(step) : step;
  }

  function inferAutoReviewRound(step, dueAt) {
    if (step === "hr" || step === "offer") return "third";
    if (!isInterviewStep(step)) return "first";
    return isDueTimePassed(dueAt) ? step : prevInterviewRound(step);
  }

  function nextInterviewRound(round) {
    if (round === "first") return "second";
    if (round === "second") return "third";
    return "third";
  }

  function prevInterviewRound(round) {
    if (round === "third") return "second";
    if (round === "second") return "first";
    return "first";
  }

  function isDueTimePassed(value) {
    const time = parseTime(value);
    if (time === Number.MAX_SAFE_INTEGER) return false;
    return time <= Date.now();
  }

  function targetRoundKey(value) {
    if (value === "first" || value === "second" || value === "third") return value;
    return "";
  }

  function stepIndex(step) {
    const index = PROCESS_STEPS.findIndex((item) => item.key === step);
    return index >= 0 ? index : 0;
  }

  function inferLatestInterviewRound(opp) {
    ensureOpportunityWorkflow(opp);
    if (opp.workflow.stepTimes.third || opp.workflow.currentStep === "hr" || opp.workflow.currentStep === "offer") {
      return "third";
    }
    if (opp.workflow.stepTimes.second || opp.workflow.currentStep === "second") return "second";
    return "first";
  }

  function syncLegacyStageFromWorkflow(opp) {
    if (!opp || opp.stage === "closed") return;
    const step = opp.workflow?.currentStep || "assessment";
    if (step === "assessment") {
      opp.stage = "assessment";
      return;
    }
    if (step === "first" || step === "second" || step === "third") {
      opp.stage = "interviewing";
      return;
    }
    if (step === "hr" || step === "offer") {
      opp.stage = "waiting_result";
    }
  }

  function suggestNextAction(stage) {
    switch (stage) {
      case "assessment":
        return "优先完成测评，并记录错题类型。";
      case "interview_prep":
        return "结合JD完成面经准备并做一轮模拟。";
      case "interviewing":
        return "确认面试安排并准备高频追问。";
      case "waiting_result":
        return "等待结果，同时准备跟进邮件。";
      case "closed":
        return "流程结束，整理经验沉淀为通用模板。";
      default:
        return "确认下一步动作并推进。";
    }
  }

  function getFilteredOpportunities() {
    const keyword = state.filters.keyword.toLowerCase();
    const filtered = state.opportunities.filter((item) => {
      const stage = getEffectiveStage(item);
      const byKeyword =
        !keyword || `${item.company}${item.role}${item.city}`.toLowerCase().includes(keyword);
      const byStage =
        state.filters.stage === "all"
          ? true
          : state.filters.stage === "urgent"
          ? isUrgent(item)
          : stage === state.filters.stage;
      return byKeyword && byStage;
    });
    return filtered.sort(compareOpportunityOrder);
  }

  function compareOpportunityOrder(a, b) {
    const aStage = getEffectiveStage(a);
    const bStage = getEffectiveStage(b);
    const aClosed = aStage === "closed";
    const bClosed = bStage === "closed";
    if (aClosed !== bClosed) return aClosed ? 1 : -1;

    const urgentDiff = Number(isUrgent(b)) - Number(isUrgent(a));
    if (urgentDiff !== 0) return urgentDiff;

    const timeDiff = parseTime(a.dueAt) - parseTime(b.dueAt);
    if (timeDiff !== 0) return timeDiff;

    const stageOrder = {
      interviewing: 0,
      assessment: 1,
      waiting_result: 3,
      closed: 4,
    };
    const stageDiff = (stageOrder[aStage] ?? 9) - (stageOrder[bStage] ?? 9);
    if (stageDiff !== 0) return stageDiff;

    return a.company.localeCompare(b.company, "zh-CN");
  }

  function getStageTagClass(item) {
    const stage = getEffectiveStage(item);
    return stage === "interviewing" ? "stage-interviewing" : `stage-${stage}`;
  }

  function getStageDisplayLabel(item) {
    const stage = getEffectiveStage(item);
    if (stage === "closed") return STAGES.closed;
    const step = getWorkflowStep(item);
    if (stage === "interviewing") {
      const round = PREP_ROUNDS.find((x) => x.key === stepToRound(step));
      return round ? round.label : "将面试";
    }
    if (step === "hr") return "HR";
    if (step === "offer") return "Offer";
    return STAGES[stage] || stage;
  }

  function isUrgent(item) {
    if (getEffectiveStage(item) === "closed") return false;
    if (item.risk === "urgent") return true;
    const diff = parseTime(item.dueAt) - Date.now();
    return diff < 1000 * 60 * 60 * 36;
  }

  function parseTime(value) {
    if (!value) return Number.MAX_SAFE_INTEGER;
    const normalized = value.includes("T")
      ? value
      : value.includes(" ")
      ? value.replace(" ", "T")
      : `${value}T09:00:00`;
    const time = Date.parse(normalized);
    return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
  }

  function formatDateTag(value) {
    const time = parseTime(value);
    if (time === Number.MAX_SAFE_INTEGER) return value;
    const d = new Date(time);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function formatDateTime(value) {
    const time = parseTime(value);
    if (time === Number.MAX_SAFE_INTEGER) return value;
    const d = new Date(time);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  }

  function formatDateTimeFromMs(ms) {
    const d = new Date(ms);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  }

  function findOpportunityById(id) {
    return state.opportunities.find((x) => x.id === id);
  }

  function findSelected() {
    return findOpportunityById(state.selectedId);
  }

  function setupFileInput(input, labelNode, defaultText) {
    input.addEventListener("change", () => {
      const file = input.files[0];
      labelNode.textContent = file ? `已选择：${file.name}` : defaultText;
    });
  }

  function setupDropZone(zone, labelNode) {
    if (!zone) return;
    const input = zone.querySelector("input[type='file']");
    zone.addEventListener("dragover", (event) => {
      event.preventDefault();
      zone.style.borderColor = "rgba(122, 76, 255, 0.8)";
    });
    zone.addEventListener("dragleave", () => {
      zone.style.borderColor = "";
    });
    zone.addEventListener("drop", (event) => {
      event.preventDefault();
      zone.style.borderColor = "";
      const [file] = event.dataTransfer.files || [];
      if (!file) return;
      const data = new DataTransfer();
      data.items.add(file);
      input.files = data.files;
      labelNode.textContent = `已选择：${file.name}`;
    });
  }

  function openConnectModal(tip) {
    normalizeConnectedMailboxState();
    el.connectTip.textContent = state.connectedMailboxes.length
      ? `${tip} 已连接后可在对应卡片点击“更换邮箱”更新地址。`
      : tip;
    renderConnectFormState();
    openModal(el.connectModal);
  }

  function normalizeConnectedMailboxState() {
    const rawList = Array.isArray(state.connectedMailboxes) ? state.connectedMailboxes : [];
    const map = new Map();

    rawList.forEach((raw) => {
      const key = normalizeMailboxKey(raw?.key || raw?.provider || raw?.label || "");
      if (!key) return;
      const email = String(raw?.email || raw?.address || "").trim();
      map.set(key, {
        key,
        label: MAILBOX_LABELS[key],
        email,
        connectedAt: raw?.connectedAt || now(),
      });
    });

    state.connectedMailboxes = Array.from(map.values());
    state.connected = state.connectedMailboxes.length > 0;
  }

  function normalizeMailboxKey(value) {
    const text = String(value || "").toLowerCase();
    if (text.includes("qq")) return "qq";
    if (text.includes("netease") || text.includes("163") || text.includes("网易")) return "netease";
    return "";
  }

  function openModal(node) {
    closeAllModals();
    node.classList.remove("hidden");
    openOverlay();
  }

  function openOverlay() {
    el.modalOverlay.classList.remove("hidden");
  }

  function closeAllModals() {
    [el.processModal, el.connectModal, el.jdModal, el.reviewModal].forEach((node) => {
      node.classList.add("hidden");
    });
    state.processModalOpen = false;
    state.modalReviewRound = "";
    state.mailboxEditMode.qq = false;
    state.mailboxEditMode.netease = false;
    if (el.connectQqCode) el.connectQqCode.value = "";
    if (el.connectNeteaseCode) el.connectNeteaseCode.value = "";
    renderConnectFormState();
    el.modalOverlay.classList.add("hidden");
  }

  function showLoading(show, text) {
    if (text) el.loadingText.textContent = text;
    el.loadingOverlay.classList.toggle("hidden", !show);
  }

  function showToast(message) {
    el.toast.textContent = message;
    el.toast.classList.remove("hidden");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.add("hidden"), 1700);
  }

  function startTicker() {
    el.announcementTicker.textContent = ANNOUNCEMENTS[0];
    if (state.tickerTimer) clearInterval(state.tickerTimer);
    state.tickerTimer = setInterval(() => {
      state.tickerIndex = (state.tickerIndex + 1) % ANNOUNCEMENTS.length;
      el.announcementTicker.textContent = ANNOUNCEMENTS[state.tickerIndex];
    }, 4200);
  }

  function cloneOpportunity(item) {
    return JSON.parse(JSON.stringify(item));
  }

  function inferFileLabel(name) {
    const lower = name.toLowerCase();
    if (/\.(png|jpg|jpeg|webp)$/i.test(lower)) return `图片：${name}`;
    if (/\.(mp3|wav|m4a)$/i.test(lower)) return `音频：${name}`;
    return `文档：${name}`;
  }

  function pickKeywords(text, company) {
    const seeds = [company, "业务分析", "产品策略", "跨团队协作", "指标设计", "数据驱动"];
    if (text.includes("AIGC") || text.includes("大模型") || text.includes("LLM")) seeds.unshift("大模型应用");
    if (text.includes("增长")) seeds.unshift("增长实验");
    if (text.includes("商业")) seeds.unshift("商业化策略");
    return [...new Set(seeds)].slice(0, 6);
  }

  function now() {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mi = String(date.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replaceAll("`", "&#96;");
  }
})();
