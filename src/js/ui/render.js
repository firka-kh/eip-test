(function initRenderModule() {
    if (window.AppUI) return;

    function loadHistoryForm(id) {
        const app = window.getApp(id) || { auditLog: [] };
        const revisionsCount = app.revisionCount || 0;
        const createDate = app.auditLog && app.auditLog.length > 0 ? app.auditLog[0].date.split(',')[0] : '—';
        let currentStatusName = 'Дар баррасӣ / В процессе';
        if (['approved', 'issued'].includes(app.status)) currentStatusName = 'Тасдиқшуда / Одобрена';
        if (app.status === 'rejected') currentStatusName = 'Радшуда / Отклонена';
        if (app.status === 'draft') currentStatusName = 'Сиёҳнавис / Черновик';
        if (app.status === 'postponed') currentStatusName = 'Мавқуф / Отложена';

        document.getElementById('summ-created').textContent = createDate;
        document.getElementById('summ-revs').textContent = revisionsCount + ' / 3';
        document.getElementById('summ-status').textContent = currentStatusName;

        const timelineContainer = document.getElementById('dynamic-timeline');
        if (timelineContainer) {
            timelineContainer.innerHTML = '';
            if (!app.auditLog || app.auditLog.length === 0) {
                timelineContainer.innerHTML = '<p class="text-[13px] text-gray-400 py-4 font-medium">Таърих холӣ аст / История пуста</p>';
                return;
            }
            let html = '';
            app.auditLog.forEach(function (log, index) {
                const isLast = index === app.auditLog.length - 1;
                const esc = window.sanitizeText || function (v) { return String(v == null ? '' : v); };
                const actor = esc(log.actor);
                const date = esc(log.date);
                const action = esc(log.action);
                const actionRu = esc(log.actionRu);
                const comment = esc(log.comment);
                html += '<div class="relative pl-6 pb-6 animate-fade-in" style="animation-delay: ' + (index * 0.05) + 's"><div class="absolute w-7 h-7 bg-' + log.color + '-100 text-' + log.color + '-600 rounded-full flex items-center justify-center -left-[14px] top-0 shadow-sm border-2 border-white z-10"><i data-lucide="' + log.icon + '" class="w-3.5 h-3.5"></i></div>' + (!isLast ? '<div class="absolute left-[0px] top-7 bottom-0 w-[2px] bg-slate-200"></div>' : '') + '<div class="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow relative top-[-4px]"><div class="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1.5 gap-1"><p class="text-[13px] font-bold text-gray-800">' + actor + '</p><p class="text-[11px] text-gray-400 font-medium whitespace-nowrap">' + date + '</p></div><p class="text-[12px] text-gray-700 leading-tight font-medium">' + action + ' <span class="ru-block mt-0.5 text-gray-500 font-normal">' + actionRu + '</span></p>' + (comment ? '<div class="mt-2 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 font-medium"><span class="block mb-0.5 font-bold text-amber-900">Эзоҳ / Комментарий:</span>' + comment + '</div>' : '') + '</div></div>';
            });
            timelineContainer.innerHTML = html;
        }
    }

    function openApprovedFor(id) {
        window.currentOpenedAppId = id;
        window.currentApprovedAppId = id;
        const app = window.getApp(id);
        let tabsToShow = ['pane-approved'];
        if (app.status === 'approved') {
            tabsToShow.push('pane-monitoring');
        }
        window.setAvailableTabs(tabsToShow);
        document.getElementById('applicationModal').classList.remove('hidden');
        document.querySelector('.tab-btn[data-target="pane-approved"]').click();
    }

    window.activeMainFilter = window.activeMainFilter || 'statuses';
    window.activeComFilter = window.activeComFilter || 'protocols';
    window.activeFacFilter = window.activeFacFilter || 'all_fac';
    window.activeStatFilter = window.activeStatFilter || 'all_stat';
    window.activeGmcFilter = window.activeGmcFilter || 'all_gmc';

    function setAvailableTabs(tabsToShow) {
        const allTabs = ['pane-facilitator', 'pane-gmc', 'pane-piu', 'pane-committee', 'pane-gmc-registry-preview', 'pane-committee-batch', 'pane-approved', 'pane-monitoring'];
        allTabs.forEach(function (target) {
            const btn = document.querySelector('.tab-btn[data-target="' + target + '"]');
            if (btn) {
                btn.classList.remove('hidden');
                if (tabsToShow.includes(target)) {
                    btn.classList.remove('opacity-40', 'cursor-not-allowed', 'pointer-events-none');
                    btn.classList.add('cursor-pointer', 'hover:text-slate-700');
                } else {
                    btn.classList.add('opacity-40', 'cursor-not-allowed', 'pointer-events-none');
                    btn.classList.remove('cursor-pointer', 'hover:text-slate-700', 'active', 'border-primary', 'text-primary', 'border-b-2');
                    btn.classList.add('border-transparent', 'text-slate-500');
                }
            }
        });
    }

    function setViewMode(mode) {
        window.currentViewMode = mode;
        const btnGrid = document.getElementById('btn-view-grid');
        const btnList = document.getElementById('btn-view-list');
        const gridContainer = document.getElementById('mainDashboardGrid');
        const listContainer = document.getElementById('mainDashboardList');
        if (mode === 'grid') {
            btnGrid.className = 'p-2 rounded-xl bg-white text-[#5b4ef5] shadow-sm transition-colors';
            btnList.className = 'p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white transition-colors';
            gridContainer.classList.remove('hidden');
            listContainer.classList.add('hidden');
        } else {
            btnList.className = 'p-2 rounded-xl bg-white text-[#5b4ef5] shadow-sm transition-colors';
            btnGrid.className = 'p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white transition-colors';
            gridContainer.classList.add('hidden');
            listContainer.classList.remove('hidden');
        }
        renderAllCards();
    }

    function renderAllCards() {
        document.getElementById('mainDashboardGrid').innerHTML = '';
        document.getElementById('list-tbody').innerHTML = '';

        if (window.activeMainFilter === 'approved_registry') {
            (window.state.protocols || []).forEach(function (p) { appendProtocolCard(p); });
        } else if (window.activeMainFilter === 'committee') {
            getPendingCommitteeRegistries().forEach(function (reg) { appendCommitteeRegistryCard(reg); });
        } else {
            window.state.applications.forEach(function (app) { appendCardAndRow(app.id, app.status, app); });
        }

        updateAllBadges();
        updateDashboardFilter();
        updateApprovedInsights();
        if (window.lucide) window.lucide.createIcons();
    }

    function getPendingCommitteeRegistries() {
        const stateLists = Array.isArray((window.state || {}).registryLists) ? window.state.registryLists : [];
        const pending = stateLists.filter(function (r) { return r && r.status !== 'processed'; });
        if (pending.length > 0) return pending;

        const comApps = window.filterApps(['com_review']);
        if (comApps.length === 0) return [];

        const totalAmount = comApps.reduce(function (sum, app) {
            return sum + parseInt(String(app.amount || '').replace(/\D/g, '') || 0, 10);
        }, 0);

        return [{
            id: 'РЕЕСТР-GMS-ВХОДЯЩИЙ',
            source: 'gms',
            status: 'pending',
            date: '-',
            exactTime: '-',
            apps: comApps.map(function (app) { return app.id; }),
            totalAmount: totalAmount,
            virtual: true
        }];
    }

    function appendCommitteeRegistryCard(reg) {
        const appIds = Array.isArray(reg.apps) ? reg.apps : [];
        const apps = appIds.map(function (id) { return window.getApp(id); }).filter(function (app) {
            return app && app.status === 'com_review';
        });
        const appCount = apps.length;
        const totalAmount = apps.reduce(function (sum, app) {
            return sum + parseInt(String(app.amount || '').replace(/\D/g, '') || 0, 10);
        }, 0).toLocaleString('ru-RU');

        const sectors = [];
        const searchParts = [String(reg.id || ''), String(reg.date || ''), String(reg.exactTime || ''), 'gms'];
        apps.forEach(function (app) {
            const cleanSector = String(app.sector || '').replace(/<[^>]*>?/gm, '').toLowerCase();
            if (cleanSector && sectors.indexOf(cleanSector) === -1) sectors.push(cleanSector);
            searchParts.push(String(app.id || ''));
            searchParts.push(String(app.name || ''));
            searchParts.push(String(app.sector || ''));
        });

        const listDate = String(reg.date || '-') + ((reg.exactTime && reg.exactTime !== '-') ? (' (' + reg.exactTime + ')') : '');

        const card = document.createElement('div');
        card.setAttribute('data-status', 'committee_registry');
        card.setAttribute('data-list-id', String(reg.id || ''));
        card.setAttribute('data-sector-values', sectors.join('|'));
        card.setAttribute('data-search', String(searchParts.join(' ')).toLowerCase());
        card.className = 'bg-teal-50 border border-teal-200 rounded-2xl p-5 shadow-sm transition-all duration-200 flex flex-col min-h-[160px] animate-fade-in cursor-pointer hover:border-teal-400 relative overflow-hidden';
        card.innerHTML = '<div class="absolute top-0 left-0 w-full h-1.5 bg-teal-500"></div><div class="flex justify-between items-start mb-2 mt-1"><h3 class="font-bold text-[15px] text-teal-900 leading-tight">Рӯйхати воридшуда <br/><span class="text-[13px] text-teal-700">' + reg.id + '</span></h3><div class="bg-teal-100 text-teal-800 px-2 py-1 rounded-md text-[10px] font-bold border border-teal-200"><i data-lucide="inbox" class="w-3 h-3 inline"></i> Аз GMS</div></div><div class="text-[11px] text-teal-600 font-medium mb-4 flex items-center gap-1.5"><i data-lucide="calendar" class="w-3.5 h-3.5"></i> Ворид шуд: ' + listDate + '</div><div class="grid grid-cols-2 gap-2 mb-4 bg-white/60 p-3 rounded-xl border border-teal-100"><div class="text-[11px] text-slate-600">Дар рӯйхат: <strong class="text-slate-700 text-[13px] block">' + appCount + '</strong></div><div class="text-[11px] text-slate-600">Маблағ: <strong class="text-teal-700 text-[13px] block">' + totalAmount + ' сом.</strong></div></div><div class="flex justify-end items-center mt-auto border-t border-teal-200/60 pt-4"><button onclick="openCommitteeBatch(\'' + reg.id + '\')" class="bg-white text-teal-700 border border-teal-300 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-teal-100 transition-colors shadow-sm">Интихоби рӯйхат <span class="ru font-normal">/ Выбрать список</span></button></div>';
        card.onclick = function (e) {
            if (!e.target.closest('button')) window.openCommitteeBatch(reg.id);
        };
        document.getElementById('mainDashboardGrid').appendChild(card);

        const row = document.createElement('tr');
        row.setAttribute('data-status', 'committee_registry');
        row.setAttribute('data-list-id', String(reg.id || ''));
        row.setAttribute('data-sector-values', sectors.join('|'));
        row.setAttribute('data-search', String(searchParts.join(' ')).toLowerCase());
        row.className = 'hover:bg-slate-50 transition-colors cursor-pointer group animate-fade-in bg-teal-50/30';
        row.innerHTML = '<td class="py-4 px-5 border-l-4 border-teal-500 align-middle"><div class="font-bold text-teal-900 text-[13px] mb-0.5">' + reg.id + '</div><div class="text-[11px] text-teal-600 font-medium flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3"></i> ' + listDate + '</div></td><td class="py-4 px-5 align-middle text-[12px] text-slate-600 font-medium">Воридшуда аз GMS / КУГ</td><td class="py-4 px-5 align-middle"><div class="font-black text-teal-700 text-[13px]">' + totalAmount + ' сомонӣ</div></td><td class="py-4 px-5 align-middle"><div class="bg-teal-100 text-teal-800 px-2 py-1 rounded-md text-[10px] font-bold w-max border border-teal-200"><i data-lucide="inbox" class="w-3 h-3 inline"></i> Дар баррасии Кумита</div></td><td class="py-4 px-5 align-middle text-right"><button onclick="openCommitteeBatch(\'' + reg.id + '\')" class="text-teal-600 text-[12px] font-bold hover:underline">Интихоб / Выбрать</button></td>';
        row.onclick = function (e) {
            if (!e.target.closest('button')) window.openCommitteeBatch(reg.id);
        };
        document.getElementById('list-tbody').appendChild(row);
    }

    function getVisibleReadyRegistryIds() {
        const selector = window.currentViewMode === 'list'
            ? '#list-tbody > tr[data-status="gmc_ready_for_registry"]'
            : '#mainDashboardGrid > div[data-status="gmc_ready_for_registry"]';

        const ids = [];
        document.querySelectorAll(selector).forEach(function (el) {
            if (el.style.display !== 'none') {
                const id = el.getAttribute('data-id');
                if (id) ids.push(id);
            }
        });
        return ids;
    }

    function appendProtocolCard(prot) {
        const clean = function (v) { return String(v || '').replace(/<[^>]*>?/gm, '').toLowerCase(); };
        const listApps = (prot.apps || []).map(function (a) { return window.getApp(a.id); }).filter(Boolean);
        const listCount = listApps.length;
        const approvedCount = (prot.apps || []).filter(function (a) { return a.decision === 'ok'; }).length;
        const rejectedCount = (prot.apps || []).filter(function (a) { return a.decision === 'rej'; }).length;
        const totalAmount = (prot.totalAmount || 0).toLocaleString('ru-RU');

        const sectorValues = [];
        const regionValues = [];
        const genderValues = [];
        const searchParts = [String(prot.id || ''), String(prot.date || ''), String(prot.exactTime || '')];

        listApps.forEach(function (app) {
            const sector = clean(app.sector);
            if (sector && !sectorValues.includes(sector)) sectorValues.push(sector);

            const db = (window.mockDatabase || {})[app.id] || {};
            const region = clean(db.address);
            const gender = clean(db.gender);
            if (region && !regionValues.includes(region)) regionValues.push(region);
            if (gender && !genderValues.includes(gender)) genderValues.push(gender);

            searchParts.push(String(app.id || ''));
            searchParts.push(String(app.name || ''));
            searchParts.push(String(app.sector || ''));
            searchParts.push(String(db['full-name'] || ''));
            searchParts.push(String(db.address || ''));
        });

        const card = document.createElement('div');
        card.setAttribute('data-status', 'approved_list');
        card.setAttribute('data-list-id', String(prot.id || ''));
        card.setAttribute('data-sector-values', sectorValues.join('|'));
        card.setAttribute('data-region-values', regionValues.join('|'));
        card.setAttribute('data-gender-values', genderValues.join('|'));
        card.setAttribute('data-search', clean(searchParts.join(' ')));
        card.className = 'bg-teal-50 border border-teal-200 rounded-2xl p-5 shadow-sm transition-all duration-200 flex flex-col min-h-[160px] animate-fade-in cursor-pointer hover:border-teal-400 relative overflow-hidden';
        card.innerHTML = '<div class="absolute top-0 left-0 w-full h-1.5 bg-teal-500"></div><div class="flex justify-between items-start mb-1 mt-1"><h3 class="font-bold text-[15px] text-teal-900 leading-tight">Рӯйхат <br/><span class="text-[13px] text-teal-700">' + prot.id + '</span></h3><div class="bg-teal-100 text-teal-800 px-2 py-1 rounded-md text-[10px] font-bold border border-teal-200"><i data-lucide="layers" class="w-3 h-3 inline"></i> Тасдиқшуда</div></div><div class="text-[11px] text-teal-600 font-medium mb-4 flex items-center gap-1.5"><i data-lucide="calendar" class="w-3.5 h-3.5"></i> Сформирован: ' + prot.date + ' (' + prot.exactTime + ')</div><div class="grid grid-cols-2 gap-2 mb-4 bg-white/60 p-3 rounded-xl border border-teal-100"><div class="text-[11px] text-slate-600">Дар рӯйхат: <strong class="text-slate-700 text-[13px] block">' + listCount + '</strong></div><div class="text-[11px] text-slate-600">Тасдиқ: <strong class="text-emerald-600 text-[13px] block">' + approvedCount + '</strong></div><div class="text-[11px] text-slate-600">Рад: <strong class="text-red-500 text-[13px] block">' + rejectedCount + '</strong></div><div class="text-[11px] text-slate-600">Маблағ: <strong class="text-teal-700 text-[13px] block">' + totalAmount + ' сом.</strong></div></div><div class="flex justify-end items-center mt-auto border-t border-teal-200/60 pt-4"><button onclick="openCommitteeBatch(\'' + prot.id + '\')" class="bg-white text-teal-700 border border-teal-300 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-teal-100 transition-colors shadow-sm">Кушодан <span class="ru font-normal">/ Открыть список</span></button></div>';
        card.onclick = function (e) {
            if (!e.target.closest('button')) {
                if (typeof window.openCommitteeBatch === 'function') window.openCommitteeBatch(prot.id);
            }
        };
        document.getElementById('mainDashboardGrid').appendChild(card);

        const row = document.createElement('tr');
        row.setAttribute('data-status', 'approved_list');
        row.setAttribute('data-list-id', String(prot.id || ''));
        row.setAttribute('data-sector-values', sectorValues.join('|'));
        row.setAttribute('data-region-values', regionValues.join('|'));
        row.setAttribute('data-gender-values', genderValues.join('|'));
        row.setAttribute('data-search', clean(searchParts.join(' ')));
        row.className = 'hover:bg-slate-50 transition-colors cursor-pointer group animate-fade-in bg-teal-50/30';
        row.innerHTML = '<td class="py-4 px-5 border-l-4 border-teal-500 align-middle"><div class="font-bold text-teal-900 text-[13px] mb-0.5">Рӯйхат ' + prot.id + '</div><div class="text-[11px] text-teal-600 font-medium flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3"></i> ' + prot.date + ' (' + prot.exactTime + ')</div></td><td class="py-4 px-5 align-middle text-[12px] text-slate-600 font-medium">Дар рӯйхат: <b class="text-slate-700">' + listCount + '</b><br>Тасдиқ: <b class="text-emerald-600">' + approvedCount + '</b>, Рад: <b class="text-red-500">' + rejectedCount + '</b></td><td class="py-4 px-5 align-middle"><div class="font-black text-teal-700 text-[13px]">' + totalAmount + ' сомонӣ</div></td><td class="py-4 px-5 align-middle"><div class="bg-teal-100 text-teal-800 px-2 py-1 rounded-md text-[10px] font-bold w-max border border-teal-200"><i data-lucide="layers" class="w-3 h-3 inline"></i> Тасдиқшуда</div></td><td class="py-4 px-5 align-middle text-right"><button onclick="openCommitteeBatch(\'' + prot.id + '\')" class="text-teal-600 text-[12px] font-bold hover:underline">Кушодан / Открыть</button></td>';
        row.onclick = function (e) {
            if (!e.target.closest('button') && typeof window.openCommitteeBatch === 'function') {
                window.openCommitteeBatch(prot.id);
            }
        };
        document.getElementById('list-tbody').appendChild(row);
    }

    function appendCardAndRow(id, status, app) {
        let bHtml = '';
        let aHtml = '';
        let bClass = '';
        let badgeHtmlList = '';
        const revisionText = (app.revisionCount && app.revisionCount > 0 && ['fac_revision', 'postponed'].includes(status)) ? '<div class="text-[10px] text-amber-600 font-bold mt-1"><i data-lucide="refresh-cw" class="w-3 h-3 inline"></i> Доработка: ' + app.revisionCount + '/3</div>' : '';
        const protocolHtml = app.protocolId ? '<span class="bg-teal-100 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded text-[10px] font-bold ml-2 whitespace-nowrap" title="Тасдиқшуда тариқи протокол / Утверждено протоколом"><i data-lucide="layers" class="w-3 h-3 inline mr-0.5"></i>' + app.protocolId + '</span>' : '';

        let checkboxHtmlCard = '';
        let checkboxHtmlRow = '';

        if (['gmc_review', 'gmc_revision', 'gmc_preparation', 'gmc_ready_for_registry'].includes(status)) {
            if (status === 'gmc_ready_for_registry') {
                bClass = 'bg-indigo-50 border-indigo-300';
                bHtml = '<div class="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md text-[10px] font-bold"><i data-lucide="list-checks" class="w-3 h-3 inline"></i> Дар реестр / В реестре</div>';
                badgeHtmlList = bHtml;
                aHtml = '<button onclick="openGmcFor(\'' + id + '\')" class="bg-white text-indigo-700 border border-indigo-300 text-[12px] font-bold px-3 py-1.5 rounded-lg">Дидан</button>';
                const isChecked = window.selectedForRegistry && window.selectedForRegistry.has(id) ? 'checked' : '';
                checkboxHtmlCard = '<input type="checkbox" class="w-4 h-4 mr-2.5 accent-[#059669] cursor-pointer" onclick="event.stopPropagation()" onchange="toggleRegistrySelection(\'' + id + '\', this)" ' + isChecked + '>';
                checkboxHtmlRow = '<input type="checkbox" class="w-4 h-4 mr-3 accent-[#059669] cursor-pointer inline-block align-middle" onclick="event.stopPropagation()" onchange="toggleRegistrySelection(\'' + id + '\', this)" ' + isChecked + '>';
            } else if (status === 'gmc_preparation') {
                bClass = 'bg-[#F4F7FF] border-[#C6D4FF]';
                bHtml = '<div class="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-[10px] font-bold"><i data-lucide="clipboard-check" class="w-3 h-3 inline"></i> Барои омодасозӣ</div>';
                badgeHtmlList = bHtml;
                aHtml = '<button onclick="openGmcFor(\'' + id + '\')" class="bg-white text-[#5B4AF0] border border-[#C6D4FF] text-[12px] font-bold px-3 py-1.5 rounded-lg">Омода кардан</button>';
            } else if (status === 'gmc_revision') {
                bClass = 'bg-amber-50 border-amber-300';
                bHtml = '<div class="bg-amber-100 text-amber-800 px-2 py-1 rounded-md text-[10px] font-bold"><i data-lucide="alert-triangle" class="w-3 h-3 inline"></i> Аз ГРП баргашт</div>';
                badgeHtmlList = bHtml;
                aHtml = '<button onclick="openGmcFor(\'' + id + '\')" class="bg-white text-amber-700 border border-amber-300 text-[12px] font-bold px-3 py-1.5 rounded-lg">Баррасӣ</button>';
            } else {
                bClass = 'bg-[#F4F7FF] border-[#C6D4FF]';
                bHtml = '<div class="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-[10px] font-bold">Ба ШИГ пешниҳод шуд</div>';
                badgeHtmlList = bHtml;
                aHtml = '<button onclick="openGmcFor(\'' + id + '\')" class="bg-white text-[#5B4AF0] border border-[#C6D4FF] text-[12px] font-bold px-3 py-1.5 rounded-lg">Баҳогузорӣ</button>';
            }
        } else if (status === 'piu_review') {
            bClass = 'bg-indigo-50 border-indigo-200';
            bHtml = '<div class="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-[10px] font-bold">Барои баррасӣ ба ГРП</div>';
            badgeHtmlList = bHtml;
            aHtml = '<span class="text-indigo-600 text-[12px] font-bold cursor-pointer" onclick="openPiuFor(\'' + id + '\')">Санҷиши ГРП</span>';
        } else if (status === 'com_review') {
            bClass = 'bg-teal-50 border-teal-200';
            bHtml = '<div class="bg-teal-100 text-teal-700 px-2 py-1 rounded-md text-[10px] font-bold">Қарори Кумита</div>';
            badgeHtmlList = bHtml;
            aHtml = '<span class="text-teal-600 text-[12px] font-bold cursor-pointer" onclick="openComFor(\'' + id + '\')">Тасдиқи ниҳоӣ</span>';
        } else if (status === 'approved') {
            bClass = 'bg-emerald-50 border-emerald-200';
            bHtml = '<div class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-[10px] font-bold">Тасдиқ шуд <span class="ru font-normal">/ Одобрена</span></div>';
            badgeHtmlList = bHtml;
            aHtml = '<span class="text-emerald-600 text-[12px] font-bold cursor-pointer" onclick="openApprovedFor(\'' + id + '\')">Кушодан</span>';
        } else if (status === 'rejected') {
            bClass = 'bg-red-50 border-red-200 opacity-70';
            bHtml = '<div class="bg-red-100 text-red-700 px-2 py-1 rounded-md text-[10px] font-bold">Рад карда шуд</div>';
            badgeHtmlList = bHtml;
            aHtml = '<span class="text-red-600 text-[12px] font-bold cursor-pointer" onclick="openApprovedFor(\'' + id + '\')">Таърих</span>';
        } else if (status === 'fac_revision') {
            bClass = 'bg-red-50 border-red-300';
            bHtml = '<div class="bg-red-100 text-red-800 px-2 py-1 rounded-md text-[10px] font-bold"><i data-lucide="alert-circle" class="w-3 h-3 inline"></i> Амали Фасилитатор</div>';
            badgeHtmlList = bHtml;
            aHtml = '<span class="text-red-600 text-[12px] font-bold cursor-pointer" onclick="openRevFor(\'' + id + '\')">Ислоҳ кардан</span>';
        } else if (status === 'postponed') {
            bClass = 'bg-slate-100 border-slate-300 opacity-80';
            bHtml = '<div class="bg-slate-200 text-slate-700 px-2 py-1 rounded-md text-[10px] font-bold"><i data-lucide="clock" class="w-3 h-3 inline"></i> Мавқуф (3 моҳ)</div>';
            badgeHtmlList = bHtml;
            aHtml = '<span class="text-slate-600 text-[12px] font-bold cursor-pointer" onclick="openApprovedFor(\'' + id + '\')">Таърих / История</span>';
        } else if (status === 'draft') {
            bClass = 'bg-white border-slate-200';
            bHtml = '<div class="bg-slate-100 text-slate-500 px-2 py-1 rounded-md text-[10px] font-medium">Сиёҳнавис</div>';
            badgeHtmlList = bHtml;
            aHtml = '<span class="text-slate-500 text-[12px] font-bold cursor-pointer" onclick="openDraftFor(\'' + id + '\')">Кушодан</span>';
        }

        const card = document.createElement('div');
        card.setAttribute('data-id', id);
        card.setAttribute('data-status', status);
        card.className = bClass + ' rounded-2xl p-5 border shadow-sm transition-all duration-200 flex flex-col min-h-[160px] animate-fade-in cursor-pointer';
        card.innerHTML = '<div class="flex justify-between items-start mb-1"><div class="flex items-center">' + checkboxHtmlCard + '<h3 class="font-bold text-[14px] text-slate-800">' + app.name + '</h3></div>' + bHtml + '</div><div class="text-[11px] text-slate-500 mb-auto flex items-center flex-wrap gap-y-1">#' + app.id + ' • ' + app.sector + protocolHtml + revisionText + '</div><div class="mt-4 mb-4 flex flex-col"><span class="text-primary font-bold text-[14px]">' + app.amount + ' сомонӣ</span></div><div class="flex justify-between items-center mt-auto border-t border-slate-200 pt-4"><span class="text-xs text-slate-400 font-medium">' + app.date.split(',')[0] + '</span>' + aHtml + '</div>';
        card.onclick = function (e) {
            if (!e.target.closest('input')) {
                const btn = card.querySelector('button, span[onclick]');
                if (btn) btn.click();
            }
        };
        document.getElementById('mainDashboardGrid').appendChild(card);

        const row = document.createElement('tr');
        row.setAttribute('data-id', id);
        row.setAttribute('data-status', status);
        row.className = 'hover:bg-slate-50 transition-colors cursor-pointer group animate-fade-in';
        row.innerHTML = '<td class="py-4 px-5 border-l-4 border-transparent align-middle"><div class="flex items-center">' + checkboxHtmlRow + '<div><div class="font-bold text-slate-800 text-[13px] mb-0.5">' + app.name + '</div><div class="text-[11px] text-slate-400 flex items-center gap-1">#' + app.id + ' • ' + app.date.split(',')[0] + ' ' + protocolHtml + '</div></div></div></td><td class="py-4 px-5 align-middle text-[12px] text-slate-600 font-medium">' + app.sector + revisionText + '</td><td class="py-4 px-5 align-middle"><div class="font-black text-primary text-[13px]">' + app.amount + ' сомонӣ</div></td><td class="py-4 px-5 align-middle">' + badgeHtmlList + '</td><td class="py-4 px-5 align-middle text-right"><div class="flex justify-end opacity-90 group-hover:opacity-100 transition-opacity">' + aHtml + '</div></td>';
        row.onclick = function (e) {
            if (!e.target.closest('button') && !e.target.closest('a') && !e.target.closest('svg') && !e.target.closest('select') && !e.target.closest('input')) {
                const btn = row.querySelector('button, span[onclick]');
                if (btn) btn.click();
            }
        };
        document.getElementById('list-tbody').appendChild(row);
    }

    function updateAllBadges() {
        const drafts = window.filterApps(['draft']);
        const facRevs = window.filterApps(['fac_revision']);
        const postponed = window.filterApps(['postponed']);
        const gmcNew = window.filterApps(['gmc_review']);
        const gmcReturned = window.filterApps(['gmc_revision']);
        const gmcPrep = window.filterApps(['gmc_preparation']);
        const gmcReg = window.filterApps(['gmc_ready_for_registry']);
        const pius = window.filterApps(['piu_review']);
        const coms = window.filterApps(['com_review']);
        const approved = window.filterApps(['approved']);
        const rejected = window.filterApps(['rejected']);
        const inReview = window.filterApps(['gmc_review', 'gmc_revision', 'gmc_preparation', 'gmc_ready_for_registry', 'piu_review', 'com_review']);
        const totalApps = (window.state && Array.isArray(window.state.applications)) ? window.state.applications.length : 0;
        const submitted = Math.max(totalApps - drafts.length, 0);

        const setB = function (id, count) {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = count;
                el.classList.toggle('hidden', count === 0);
            }
        };
        setB('dash-fac-badge', drafts.length + facRevs.length);
        setB('dash-approved-badge', approved.length);
        setB('dash-status-badge', totalApps);

        setB('sub-fac-all-badge', totalApps);
        setB('sub-draft-badge', drafts.length);
        setB('sub-rev-badge', facRevs.length);
        setB('sub-fac-sent-badge', inReview.length);
        setB('sub-fac-completed-badge', approved.length + rejected.length);
        setB('sub-pos-badge', postponed.length);
        setB('dash-gmc-badge', window.filterApps(['gmc_review', 'gmc_revision', 'gmc_preparation', 'gmc_ready_for_registry']).length);
        setB('dash-piu-badge', pius.length);
        setB('dash-com-badge', coms.length);

        setB('sub-gmc-all-badge', gmcNew.length + gmcReturned.length + gmcPrep.length + gmcReg.length);
        setB('sub-gmc-new-badge', gmcNew.length);
        setB('sub-gmc-returned-badge', gmcReturned.length);
        setB('sub-gmc-prep-badge', gmcPrep.length);
        setB('sub-gmc-reg-badge', gmcReg.length);

        setB('sub-stat-all-badge', totalApps);
        setB('sub-stat-draft-badge', drafts.length);
        setB('sub-stat-rev-badge', facRevs.length);
        setB('sub-stat-review-badge', inReview.length);
        setB('sub-stat-approved-badge', approved.length);
        setB('sub-stat-postponed-badge', postponed.length);
        setB('sub-stat-rejected-badge', rejected.length);

        const submittedEl = document.getElementById('menu-submitted-count');
        const approvedEl = document.getElementById('menu-approved-count');
        const rejectedEl = document.getElementById('menu-rejected-count');
        if (submittedEl) submittedEl.textContent = String(submitted);
        if (approvedEl) approvedEl.textContent = String(approved.length);
        if (rejectedEl) rejectedEl.textContent = String(rejected.length);

        const regBar = document.getElementById('gmc-registry-bar');
        const hasRegistrySelection = window.selectedForRegistry && window.selectedForRegistry.size > 0;
        const onReadyRegistryScreen = window.activeMainFilter === 'gmc' && window.activeGmcFilter === 'ready_registry';
        if (onReadyRegistryScreen || hasRegistrySelection) {
            regBar.classList.remove('hidden');
            regBar.classList.add('flex', 'flex-col', 'sm:flex-row');
            const btn = document.getElementById('btn-create-registry');
            const toggleBtn = document.getElementById('btn-toggle-select-registry');
            const visibleReadyIds = getVisibleReadyRegistryIds();
            const allVisibleSelected = visibleReadyIds.length > 0 && visibleReadyIds.every(function (id) {
                return window.selectedForRegistry.has(id);
            });

            document.getElementById('reg-sel-count').textContent = window.selectedForRegistry.size;
            if (window.selectedForRegistry.size > 0) btn.classList.remove('opacity-50', 'pointer-events-none');
            else btn.classList.add('opacity-50', 'pointer-events-none');

            if (toggleBtn) {
                if (visibleReadyIds.length === 0) {
                    toggleBtn.classList.add('opacity-50', 'pointer-events-none');
                } else {
                    toggleBtn.classList.remove('opacity-50', 'pointer-events-none');
                }

                toggleBtn.innerHTML = allVisibleSelected
                    ? '<span>Бекор кардани интихоб</span><span class="ru-block">Снять все</span>'
                    : '<span>Интихоби ҳама</span><span class="ru-block">Выбрать все</span>';
            }
        } else {
            regBar.classList.add('hidden');
            regBar.classList.remove('flex', 'flex-col', 'sm:flex-row');
        }

        const batchBar = document.getElementById('committee-batch-bar');
        if (window.activeMainFilter === 'committee') {
            const pendingRegs = getPendingCommitteeRegistries();
            const pendingIds = [];
            pendingRegs.forEach(function (reg) {
                (reg.apps || []).forEach(function (id) {
                    const app = window.getApp(id);
                    if (app && app.status === 'com_review') pendingIds.push(id);
                });
            });
            const uniquePendingIds = Array.from(new Set(pendingIds));
            const pendingApps = uniquePendingIds.map(function (id) { return window.getApp(id); }).filter(Boolean);

            batchBar.classList.remove('hidden');
            batchBar.classList.add('flex');
            document.getElementById('batch-count').textContent = pendingApps.length;
            document.getElementById('batch-total').textContent = pendingApps.reduce(function (sum, a) { return sum + parseInt(String(a.amount || '').replace(/\D/g, '') || 0, 10); }, 0).toLocaleString('ru-RU');
            if (pendingApps.length === 0) batchBar.classList.add('opacity-50', 'pointer-events-none');
            else batchBar.classList.remove('opacity-50', 'pointer-events-none');
        } else {
            batchBar.classList.add('hidden');
            batchBar.classList.remove('flex');
        }

        setB('sub-com-prot-badge', getPendingCommitteeRegistries().length);
    }

    function updateApprovedInsights() {
        const yearSel = document.getElementById('approved-stats-year');
        const monthSel = document.getElementById('approved-stats-month');
        const countEl = document.getElementById('approved-stats-count');
        const amountEl = document.getElementById('approved-stats-amount');
        const listSel = document.getElementById('approved-list-select');
        const openListBtn = document.getElementById('btn-open-approved-list');
        if (!yearSel || !monthSel || !countEl || !amountEl || !listSel || !openListBtn) return;

        const approvedApps = window.filterApps(['approved']);
        const toDateParts = function (app) {
            const raw = String((app.date || '').split(',')[0] || '');
            const m = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
            if (!m) return null;
            return { month: parseInt(m[2], 10), year: parseInt(m[3], 10) };
        };

        const years = [];
        approvedApps.forEach(function (app) {
            const parts = toDateParts(app);
            if (parts && !years.includes(parts.year)) years.push(parts.year);
        });
        years.sort(function (a, b) { return b - a; });

        const prevYear = yearSel.value || 'all';
        yearSel.innerHTML = '<option value="all">Ҳама / Все</option>';
        years.forEach(function (year) {
            const opt = document.createElement('option');
            opt.value = String(year);
            opt.textContent = String(year);
            yearSel.appendChild(opt);
        });
        yearSel.value = Array.from(yearSel.options).some(function (o) { return o.value === prevYear; }) ? prevYear : 'all';

        const selectedYear = yearSel.value;
        const selectedMonth = monthSel.value || 'all';
        const filtered = approvedApps.filter(function (app) {
            const parts = toDateParts(app);
            if (!parts) return false;
            if (selectedYear !== 'all' && parts.year !== parseInt(selectedYear, 10)) return false;
            if (selectedMonth !== 'all' && parts.month !== parseInt(selectedMonth, 10)) return false;
            return true;
        });

        const totalAmount = filtered.reduce(function (sum, app) {
            return sum + parseInt(String(app.amount || '').replace(/\D/g, '') || 0, 10);
        }, 0);
        countEl.textContent = String(filtered.length);
        amountEl.textContent = totalAmount.toLocaleString('ru-RU');

        const protocols = (window.state.protocols || []).slice().reverse();
        const prevList = listSel.value || '';
        listSel.innerHTML = '';
        if (protocols.length === 0) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'Списки отсутствуют';
            listSel.appendChild(opt);
            openListBtn.classList.add('opacity-50', 'pointer-events-none');
        } else {
            protocols.forEach(function (prot) {
                const opt = document.createElement('option');
                opt.value = prot.id;
                opt.textContent = prot.id + ' • ' + prot.date + ' • ' + (prot.apps ? prot.apps.length : 0);
                listSel.appendChild(opt);
            });
            listSel.value = Array.from(listSel.options).some(function (o) { return o.value === prevList; }) ? prevList : listSel.options[0].value;
            openListBtn.classList.remove('opacity-50', 'pointer-events-none');
        }
    }

    function openSelectedApprovedList() {
        const listSel = document.getElementById('approved-list-select');
        if (!listSel || !listSel.value) return;
        if (typeof window.openCommitteeBatch === 'function') {
            window.openCommitteeBatch(listSel.value);
        }
    }

    function updateDashboardFilter() {
        if (window.activeMainFilter === 'committee') {
            const searchInput = document.getElementById('filter-search-issued');
            const searchFilter = searchInput ? searchInput.value.toLowerCase().trim() : '';

            let visibleCount = 0;
            document.querySelectorAll('#mainDashboardGrid > div[data-status="committee_registry"], #list-tbody > tr[data-status="committee_registry"]').forEach(function (el) {
                const searchHaystack = String(el.getAttribute('data-search') || '');
                const show = !searchFilter || searchHaystack.includes(searchFilter);
                if (show) {
                    if (el.tagName === 'TR') el.style.display = 'table-row';
                    else el.style.display = 'flex';
                    visibleCount++;
                } else {
                    el.style.display = 'none';
                }
            });

            const esCommittee = document.getElementById('empty-state');
            if (esCommittee) {
                if (visibleCount === 0) {
                    esCommittee.classList.remove('hidden');
                    esCommittee.classList.add('flex');
                } else {
                    esCommittee.classList.add('hidden');
                    esCommittee.classList.remove('flex');
                }
            }
            return;
        }

        if (window.activeMainFilter === 'approved_registry') {
            const searchInput = document.getElementById('filter-search-issued');
            const searchFilter = searchInput ? searchInput.value.toLowerCase().trim() : '';
            const sectorFilter = (document.getElementById('filter-sector') || {}).value || '';
            const regionFilter = (document.getElementById('filter-region') || {}).value || '';
            const genderFilter = (document.getElementById('filter-gender') || {}).value || '';

            let visibleCount = 0;
            document.querySelectorAll('#mainDashboardGrid > div[data-status="approved_list"], #list-tbody > tr[data-status="approved_list"]').forEach(function (el) {
                const sectors = String(el.getAttribute('data-sector-values') || '');
                const regions = String(el.getAttribute('data-region-values') || '');
                const genders = String(el.getAttribute('data-gender-values') || '');
                const searchHaystack = String(el.getAttribute('data-search') || '');

                let show = true;
                if (sectorFilter && !sectors.includes(String(sectorFilter).toLowerCase())) show = false;
                if (regionFilter && !regions.includes(String(regionFilter).toLowerCase())) show = false;
                if (genderFilter && !genders.includes(String(genderFilter).toLowerCase())) show = false;
                if (searchFilter && !searchHaystack.includes(searchFilter)) show = false;

                if (show) {
                    if (el.tagName === 'TR') el.style.display = 'table-row';
                    else el.style.display = 'flex';
                    visibleCount++;
                } else {
                    el.style.display = 'none';
                }
            });

            const esApproved = document.getElementById('empty-state');
            if (visibleCount === 0) {
                esApproved.classList.remove('hidden');
                esApproved.classList.add('flex');
            } else {
                esApproved.classList.add('hidden');
                esApproved.classList.remove('flex');
            }
            return;
        }

        const searchInput = document.getElementById('filter-search-issued');
        const searchFilter = searchInput ? searchInput.value.toLowerCase() : '';
        let visibleCount = 0;

        document.querySelectorAll('#mainDashboardGrid > div, #list-tbody > tr').forEach(function (el) {
            const status = el.getAttribute('data-status');
            const appId = el.getAttribute('data-id');
            const appFullObj = (window.mockDatabase || {})[appId] || {};
            let show = false;

            if (window.activeMainFilter === 'facilitator') {
                if (window.activeFacFilter === 'all_fac') show = true;
                else if (window.activeFacFilter === 'draft' && status === 'draft') show = true;
                else if (window.activeFacFilter === 'fac_revision' && status === 'fac_revision') show = true;
                else if (window.activeFacFilter === 'postponed' && status === 'postponed') show = true;
                else if (window.activeFacFilter === 'sent' && ['gmc_review', 'gmc_revision', 'gmc_preparation', 'gmc_ready_for_registry', 'piu_review', 'com_review'].includes(status)) show = true;
                else if (window.activeFacFilter === 'completed' && ['approved', 'rejected'].includes(status)) show = true;
            } else if (window.activeMainFilter === 'statuses') {
                if (window.activeStatFilter === 'all_stat') show = true;
                else if (window.activeStatFilter === 'draft' && status === 'draft') show = true;
                else if (window.activeStatFilter === 'revision' && status === 'fac_revision') show = true;
                else if (window.activeStatFilter === 'review' && ['gmc_review', 'gmc_revision', 'gmc_preparation', 'gmc_ready_for_registry', 'piu_review', 'com_review'].includes(status)) show = true;
                else if (window.activeStatFilter === 'approved' && ['approved'].includes(status)) show = true;
                else if (window.activeStatFilter === 'rejected' && status === 'rejected') show = true;
                else if (window.activeStatFilter === 'postponed' && status === 'postponed') show = true;
            } else if (window.activeMainFilter === 'gmc') {
                if (['gmc_review', 'gmc_revision', 'gmc_preparation', 'gmc_ready_for_registry'].includes(status)) {
                    if (window.activeGmcFilter === 'all_gmc') show = true;
                    else if (window.activeGmcFilter === 'new' && status === 'gmc_review') show = true;
                    else if (window.activeGmcFilter === 'returned' && status === 'gmc_revision') show = true;
                    else if (window.activeGmcFilter === 'preparation' && status === 'gmc_preparation') show = true;
                    else if (window.activeGmcFilter === 'ready_registry' && status === 'gmc_ready_for_registry') show = true;
                }
            } else if (window.activeMainFilter === 'piu' && status === 'piu_review') show = true;
            else if (window.activeMainFilter === 'committee' && status === 'com_review') show = true;
            else if (window.activeMainFilter === 'approved_registry' && ['approved'].includes(status)) show = true;

            if (show && window.activeMainFilter === 'approved_registry') {
                const fullName = (appFullObj['full-name'] || '').toLowerCase();
                if (searchFilter && !fullName.includes(searchFilter) && !appId.includes(searchFilter)) show = false;
            }

            if (show) {
                if (el.tagName === 'TR') el.style.display = 'table-row';
                else el.style.display = 'flex';
                visibleCount++;
            } else {
                el.style.display = 'none';
            }
        });

        const es = document.getElementById('empty-state');
        if (visibleCount === 0) {
            es.classList.remove('hidden');
            es.classList.add('flex');
        } else {
            es.classList.add('hidden');
            es.classList.remove('flex');
        }
    }

    function setupSubFilters(cls) {
        document.querySelectorAll(cls).forEach(function (btn) {
            btn.addEventListener('click', function () {
                document.querySelectorAll(cls).forEach(function (b) {
                    b.classList.remove('bg-[#5b4ef5]', 'bg-primary', 'text-white', 'border-transparent', 'shadow-sm');
                    b.classList.add('bg-white', 'text-slate-600', 'border-slate-200');
                });
                btn.classList.add('bg-primary', 'text-white', 'border-transparent', 'shadow-sm');
                btn.classList.remove('bg-white', 'text-slate-600', 'border-slate-200');

                if (cls === '.fac-filter-btn') window.activeFacFilter = btn.getAttribute('data-fac-filter');
                if (cls === '.stat-filter-btn') window.activeStatFilter = btn.getAttribute('data-stat-filter');
                if (cls === '.gmc-filter-btn') window.activeGmcFilter = btn.getAttribute('data-gmc-filter');

                if (cls === '.com-filter-btn') {
                    window.activeComFilter = btn.getAttribute('data-com-filter');
                    renderAllCards();
                } else {
                    updateDashboardFilter();
                    updateAllBadges();
                }
            });
        });
    }

    function initializeDashboardFilters() {
        document.querySelectorAll('.filter-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.filter-btn').forEach(function (b) {
                    b.classList.remove('bg-[#5b4ef5]', 'bg-primary', 'text-white', 'shadow-sm');
                    b.classList.add('text-slate-600', 'hover:bg-slate-200');
                });
                btn.classList.add('bg-primary', 'text-white', 'shadow-sm');
                btn.classList.remove('text-slate-600', 'hover:bg-slate-200');
                window.activeMainFilter = btn.getAttribute('data-filter');

                const t = function (id, show) {
                    const el = document.getElementById(id);
                    if (el) el.classList.toggle('hidden', !show);
                    if (el && show) el.classList.add('flex');
                };
                t('approved-filters-bar', window.activeMainFilter === 'approved_registry');
                t('facilitator-filters-bar', window.activeMainFilter === 'facilitator');
                t('statuses-filters-bar', window.activeMainFilter === 'statuses');
                t('gmc-filters-bar', window.activeMainFilter === 'gmc');
                t('com-filters-bar', window.activeMainFilter === 'committee');

                if (window.activeMainFilter === 'committee') {
                    renderAllCards();
                } else {
                    updateAllBadges();
                    updateDashboardFilter();
                    updateApprovedInsights();
                }
            });
        });

        setupSubFilters('.fac-filter-btn');
        setupSubFilters('.stat-filter-btn');
        setupSubFilters('.gmc-filter-btn');
        setupSubFilters('.com-filter-btn');

        const searchIssued = document.getElementById('filter-search-issued');
        if (searchIssued) {
            searchIssued.addEventListener('input', updateDashboardFilter);
        }

        ['filter-sector', 'filter-region', 'filter-gender'].forEach(function (id) {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', updateDashboardFilter);
        });

        const approvedYear = document.getElementById('approved-stats-year');
        if (approvedYear) {
            approvedYear.addEventListener('change', updateApprovedInsights);
        }

        const approvedMonth = document.getElementById('approved-stats-month');
        if (approvedMonth) {
            approvedMonth.addEventListener('change', updateApprovedInsights);
        }
    }

    function initializeModalTabs() {
        document.querySelectorAll('.tab-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                if (btn.classList.contains('pointer-events-none')) return;

                document.querySelectorAll('.tab-btn').forEach(function (b) {
                    b.classList.remove('active', 'border-primary', 'text-primary', 'border-b-2');
                    b.classList.add('border-transparent', 'text-slate-500');
                });
                btn.classList.add('active', 'border-primary', 'text-primary', 'border-b-2');
                btn.classList.remove('border-transparent', 'text-slate-500');
                document.querySelectorAll('.tab-pane').forEach(function (p) { p.classList.add('hidden'); });
                const targetId = btn.getAttribute('data-target');
                const t = document.getElementById(targetId);
                if (t) t.classList.remove('hidden');

                if (targetId === 'pane-committee-batch') {
                    const protocolNum = document.getElementById('batch-protocol-number').value;
                    if (protocolNum && protocolNum.includes('ПР-')) document.getElementById('modal-main-title').innerHTML = 'Рӯйхати Кумита № ' + protocolNum + ' <span class="ru">/ Список Комитета</span>';
                    else document.getElementById('modal-main-title').innerHTML = 'Рӯйхати Кумита <span class="ru">/ Список Комитета</span>';
                    return;
                } else if (targetId === 'pane-gmc-registry-preview') {
                    document.getElementById('modal-main-title').innerHTML = 'Ташаккули реестр <span class="ru">/ Формирование реестра</span>';
                } else {
                    document.getElementById('modal-main-title').innerHTML = 'Дархост: Дастгирии грантии тиҷорат <span class="ru">/ Заявка: Грантовая поддержка бизнеса</span>';
                }

                const id = window.currentOpenedAppId;
                if (id) {
                    if (targetId === 'pane-facilitator') {
                        window.fillFacilitatorForm(id);
                        const app = window.getApp(id);
                        if (app) {
                            if (app.reactivated) document.getElementById('facilitator-reactivated-block').classList.remove('hidden');
                            else document.getElementById('facilitator-reactivated-block').classList.add('hidden');

                            if (app.status === 'fac_revision') {
                                document.getElementById('facilitator-revision-block').classList.remove('hidden');
                                const lastLog = app.auditLog.slice().reverse().find(function (l) { return l.comment || l.action.includes('баргашт'); });
                                const commentEl = document.getElementById('fac-dynamic-comment');
                                if (commentEl) commentEl.textContent = lastLog && lastLog.comment ? lastLog.comment : 'Бе эзоҳ / Без комментариев';
                                const returnTitle = document.getElementById('fac-return-title');
                                const lastActor = lastLog ? lastLog.actor : 'ШИГ / КУГ';
                                if (returnTitle) returnTitle.innerHTML = 'Аз ҷониби ' + lastActor + ' барои такмил баргардонида шуд <span class="ru-block mt-1">Заявка возвращена на доработку от ' + lastActor + '</span>';
                            } else {
                                document.getElementById('facilitator-revision-block').classList.add('hidden');
                            }

                            document.getElementById('amount-input').value = app.amount !== '0' ? app.amount.replace(/\D/g, '') : '';
                            const select = document.getElementById('sector-input');
                            for (let i = 0; i < select.options.length; i++) {
                                if (select.options[i].text === app.sector || app.sector.includes(select.options[i].value.split(' ')[0])) {
                                    select.selectedIndex = i;
                                    break;
                                }
                            }
                        }
                    } else if (targetId === 'pane-gmc') {
                        window.loadGmcForm(id);
                    } else if (targetId === 'pane-piu') {
                        window.loadPiuForm(id);
                    } else if (targetId === 'pane-committee') {
                        window.loadComForm(id);
                    } else if (targetId === 'pane-approved') {
                        window.loadHistoryForm(id);
                    } else if (targetId === 'pane-monitoring') {
                        window.currentApprovedAppId = id;
                        window.renderMonitoringList();
                    }
                }

                if (window.lucide) window.lucide.createIcons();
            });
        });
    }

    function initializeAppBootstrap() {
        const closeModalBtn = document.getElementById('closeModalBtn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', function () {
                document.getElementById('applicationModal').classList.add('hidden');
                window.currentOpenedAppId = null;
            });
        }

        const startInitialRender = function () {
            // First paint cards/rows so filters can immediately work on existing DOM.
            renderAllCards();
            const defaultMainBtn = document.querySelector('.filter-btn[data-filter="' + window.activeMainFilter + '"]');
            if (defaultMainBtn) defaultMainBtn.click();
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startInitialRender);
        } else {
            startInitialRender();
        }
    }

    initializeDashboardFilters();
    initializeModalTabs();
    initializeAppBootstrap();

    window.AppUI = {
        ready: true,
        loadHistoryForm,
        openApprovedFor,
        setViewMode,
        renderAllCards,
        updateAllBadges,
        updateDashboardFilter,
        updateApprovedInsights,
        openSelectedApprovedList,
        setAvailableTabs,
        initializeModalTabs
    };

    // Legacy compatibility while migrating code out of grant.html
    window.loadHistoryForm = loadHistoryForm;
    window.openApprovedFor = openApprovedFor;
    window.setViewMode = setViewMode;
    window.renderAllCards = renderAllCards;
    window.updateAllBadges = updateAllBadges;
    window.updateDashboardFilter = updateDashboardFilter;
    window.updateApprovedInsights = updateApprovedInsights;
    window.openSelectedApprovedList = openSelectedApprovedList;
    window.setAvailableTabs = setAvailableTabs;
    window.getVisibleReadyRegistryIds = getVisibleReadyRegistryIds;
})();
