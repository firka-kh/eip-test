(function initCommitteeFeature() {
    window.AppFeatures = window.AppFeatures || {};
    if (window.AppFeatures.committee) return;

    window.currentComAppId = null;
    window.currentComChoice = null;

    function getBusinessPlanButtonHtml(appId) {
        return '<button type="button" onclick="downloadCommitteeBusinessPlan(\'' + appId + '\')" class="bg-white border border-indigo-200 text-indigo-700 py-1.5 px-3 rounded-lg text-[11px] font-bold hover:bg-indigo-50 transition-colors inline-flex items-center gap-1.5"><i data-lucide="download" class="w-3.5 h-3.5"></i><span>Бизнес-план</span></button>';
    }

    function downloadCommitteeBusinessPlan(appId) {
        const app = window.getApp(appId);
        if (!app) {
            alert('Заявка не найдена / Дархост ёфт нашуд');
            return;
        }

        const cleanSector = String(app.sector || '').replace(/<[^>]*>?/gm, '').trim();
        const content = [
            'БИЗНЕС-ПЛАН',
            'ID: ' + app.id,
            'Заявитель: ' + app.name,
            'Сектор: ' + cleanSector,
            'Сумма: ' + app.amount + ' сом.',
            'Дата: ' + (app.date || ''),
            '',
            'Документ сформирован из системы.'
        ].join('\n');

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'Бизнес_план_' + app.id + '.txt');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function openCommitteeBatch(protocolId) {
        const targetProtocolId = protocolId || null;
        window.setAvailableTabs(['pane-committee-batch', 'pane-approved']);
        document.getElementById('applicationModal').classList.remove('hidden');

        const allTabs = ['pane-facilitator', 'pane-gmc', 'pane-piu', 'pane-committee', 'pane-approved', 'pane-monitoring', 'pane-committee-batch', 'pane-gmc-registry-preview'];
        allTabs.forEach(function (t) {
            const pane = document.getElementById(t);
            if (pane) pane.classList.add('hidden');
        });
        document.getElementById('pane-committee-batch').classList.remove('hidden');

        const tbody = document.getElementById('batch-tbody');
        const btnExport = document.getElementById('btn-export-protocol');
        tbody.innerHTML = '';

        if (targetProtocolId) {
            document.getElementById('modal-main-title').innerHTML = 'Рӯйхати Кумита № ' + targetProtocolId + ' <span class="ru">/ Список Комитета</span>';

            const prot = (window.state.protocols || []).find(function (p) { return p.id === targetProtocolId; });
            if (!prot) return;
            document.getElementById('batch-protocol-number').value = prot.id;
            document.getElementById('batch-protocol-date').value = prot.date.split('.').reverse().join('-');
            document.getElementById('batch-protocol-date').disabled = true;
            document.getElementById('submit-batch-btn').classList.add('hidden');

            window.currentViewedProtocolId = targetProtocolId;
            btnExport.classList.remove('hidden');
            btnExport.classList.add('flex');

            prot.apps.forEach(function (a) {
                const app = window.getApp(a.id);
                if (app) {
                    const isOk = a.decision === 'ok';
                    const tr = document.createElement('tr');
                    tr.className = 'hover:bg-slate-50 transition-colors opacity-70';
                    tr.innerHTML = '<td class="py-3 px-4 border-b border-gray-100 align-middle"><div class="font-bold text-gray-800 text-[13px]">' + app.name + '</div><div class="text-[11px] text-gray-400">#' + app.id + '</div></td><td class="py-3 px-4 border-b border-gray-100 align-middle"><div class="text-[12px] text-gray-600">' + app.sector + '</div><div class="font-black text-primary text-[12px] mt-0.5">' + app.amount + ' сом.</div></td><td class="py-3 px-4 border-b border-gray-100 align-middle text-center font-bold text-[12px] ' + (isOk ? 'text-emerald-600' : 'text-red-600') + '">' + (isOk ? '✅ Тасдиқ / Одобрено' : '❌ Рад шуд / Отклонено') + '</td><td class="py-3 px-4 border-b border-gray-100 align-middle">' + getBusinessPlanButtonHtml(app.id) + '</td>';
                    tbody.appendChild(tr);
                }
            });
        } else {
            document.getElementById('modal-main-title').innerHTML = 'Рӯйхати Кумита <span class="ru">/ Список Комитета</span>';
            document.getElementById('batch-protocol-date').disabled = false;
            document.getElementById('submit-batch-btn').classList.remove('hidden');

            window.currentViewedProtocolId = null;
            btnExport.classList.add('hidden');
            btnExport.classList.remove('flex');

            const autoNum = 'ПР-' + Math.floor(1000 + Math.random() * 9000);
            document.getElementById('batch-protocol-number').value = autoNum;
            document.getElementById('batch-protocol-date').value = new Date().toISOString().split('T')[0];

            const comApps = window.filterApps(['com_review']);
            if (comApps.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="py-10 text-center text-gray-500">Рӯйхат холӣ аст / Список пуст</td></tr>';
                return;
            }

            comApps.forEach(function (app) {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-slate-50 transition-colors';
                tr.innerHTML = '<td class="py-3 px-4 border-b border-gray-100 align-middle"><div class="font-bold text-gray-800 text-[13px]">' + app.name + '</div><div class="text-[11px] text-gray-400">#' + app.id + '</div></td><td class="py-3 px-4 border-b border-gray-100 align-middle"><div class="text-[12px] text-gray-600">' + app.sector + '</div><div class="font-black text-primary text-[12px] mt-0.5">' + app.amount + ' сом.</div></td><td class="py-3 px-4 border-b border-gray-100 align-middle"><select class="batch-decision border border-gray-300 rounded px-2 py-1.5 outline-none w-full text-[12px]" data-id="' + app.id + '"><option value="ok" selected>✅ Тасдиқ / Одобрить</option><option value="rej">❌ Рад кардан / Отклонить</option></select></td><td class="py-3 px-4 border-b border-gray-100 align-middle">' + getBusinessPlanButtonHtml(app.id) + '</td>';
                tbody.appendChild(tr);
            });
        }

        if (window.lucide) window.lucide.createIcons();
    }

    function toggleBatchComment(appId) {
        return appId;
    }

    function submitCommitteeBatch() {
        const comApps = window.filterApps(['com_review']);
        if (comApps.length === 0) {
            alert('Рӯйхат холӣ аст / Список пуст');
            return;
        }

        const protocolNum = document.getElementById('batch-protocol-number').value;
        const protocolDateInput = document.getElementById('batch-protocol-date').value;
        if (!protocolDateInput) {
            alert('Лутфан санаи рӯйхатро интихоб кунед! / Пожалуйста, выберите дату списка!');
            return;
        }

        const formattedProtocolDate = new Date(protocolDateInput).toLocaleDateString('ru-RU');
        const exactTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

        const protocolLabel = '№ ' + protocolNum + ' аз ' + formattedProtocolDate + ' (' + exactTime + ')';
        const protocolLabelRu = '№ ' + protocolNum + ' от ' + formattedProtocolDate + ' (' + exactTime + ')';

        const newProtocol = { id: protocolNum, date: formattedProtocolDate, exactTime: exactTime, apps: [], okCount: 0, rejCount: 0, totalAmount: 0 };

        comApps.forEach(function (app) {
            const decisionEl = document.querySelector('.batch-decision[data-id="' + app.id + '"]');
            const decision = decisionEl ? decisionEl.value : 'ok';
            let comment = '';
            if (decision === 'rej') {
                comment = window.prompt('Сабаби рад карданро ворид кунед / Укажите причину отклонения', '') || '';
            }

            app.date = window.getCurrentDateTime();
            app.protocolId = protocolNum;
            newProtocol.apps.push({ id: app.id, decision: decision, comment: comment });

            if (decision === 'ok') {
                app.status = 'approved';
                window.addLog(app, 'Кумита / Комитет', 'Грант тасдиқ шуд (Рӯйхат ' + protocolLabel + ')', 'Грант утвержден (Список ' + protocolLabelRu + ')', 'emerald', 'award');
                newProtocol.okCount++;
                newProtocol.totalAmount += parseInt(app.amount.replace(/\D/g, '') || 0, 10);
                window.generateMonitoringFor(app.id, protocolDateInput);
            } else if (decision === 'rej') {
                app.status = 'rejected';
                window.addLog(app, 'Кумита / Комитет', 'Грант рад шуд (Рӯйхат ' + protocolLabel + ')', 'Грант отклонен (Список ' + protocolLabelRu + ')', 'red', 'x-circle', comment);
                newProtocol.rejCount++;
            }
        });

        window.state.protocols = window.state.protocols || [];
        window.state.protocols.push(newProtocol);

        alert('Рӯйхат бомуваффақият тасдиқ шуд!\nСписок успешно утвержден!\n\nОдобрено: ' + newProtocol.okCount + '\nОтклонено: ' + newProtocol.rejCount);
        document.getElementById('applicationModal').classList.add('hidden');
        document.getElementById('modal-main-title').innerHTML = 'Дархост: Дастгирии грантии тиҷорат <span class="ru">/ Заявка: Грантовая поддержка бизнеса</span>';

        const approvedMainBtn = document.querySelector('.filter-btn[data-filter="approved_registry"]');
        if (approvedMainBtn) approvedMainBtn.click();
    }

    function exportProtocolToExcel() {
        if (!window.currentViewedProtocolId) return;

        const prot = (window.state.protocols || []).find(function (p) { return p.id === window.currentViewedProtocolId; });
        if (!prot || !prot.apps || prot.apps.length === 0) {
            alert('Рӯйхат холӣ аст / Список пуст');
            return;
        }

        let csvContent = '\uFEFF';
        csvContent += 'ID;Аризадиҳанда (Заявитель);Бахш (Сектор);Маблағ (Сумма);Қарор (Решение);Бизнес-план\n';

        prot.apps.forEach(function (a) {
            const app = window.getApp(a.id);
            if (app) {
                const cleanSector = app.sector.replace(/<[^>]*>?/gm, '').trim();
                const cleanAmount = app.amount.replace(/\s+/g, '');
                const decisionText = a.decision === 'ok' ? 'Тасдиқ / Одобрено' : 'Рад шуд / Отклонено';
                const toCsv = window.sanitizeCsvField || function (v) { return String(v == null ? '' : v).replace(/"/g, '""'); };
                const businessPlanFile = toCsv('Бизнес_план_' + app.id + '.txt');
                csvContent += toCsv(app.id) + ';"' + toCsv(app.name) + '";"' + toCsv(cleanSector) + '";' + toCsv(cleanAmount) + ';"' + toCsv(decisionText) + '";"' + businessPlanFile + '"\n';
            }
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'Список_' + prot.id + '_' + prot.date + '.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function loadComForm(id) {
        window.currentComAppId = id;
        const app = window.getApp(id);
        if (app) {
            document.getElementById('com-app-name').textContent = app.name;
            document.getElementById('com-app-id').textContent = app.id;
            document.getElementById('committee-evaluation-content').classList.remove('hidden');
            window.currentComChoice = null;
            document.getElementById('com-rejection-comment-block').classList.add('hidden');
            ['btn-com-approve', 'btn-com-reject'].forEach(function (btnId) {
                const btn = document.getElementById(btnId);
                if (btn) {
                    btn.className = 'w-full flex items-center px-4 py-3 rounded-lg text-[13px] font-medium border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors';
                }
            });
        }
    }

    function openComFor(id) {
        window.currentOpenedAppId = id;
        window.setAvailableTabs(['pane-committee', 'pane-approved']);
        document.getElementById('applicationModal').classList.remove('hidden');
        document.querySelector('.tab-btn[data-target="pane-committee"]').click();
    }

    function setComDecision(val) {
        window.currentComChoice = val;
        const bOk = document.getElementById('btn-com-approve');
        const bRej = document.getElementById('btn-com-reject');
        const baseClass = 'w-full flex items-center px-4 py-3 rounded-lg text-[13px] font-medium border-2 transition-colors ';

        bOk.className = baseClass + 'border-gray-200 text-gray-600 hover:bg-gray-50';
        bRej.className = baseClass + 'border-gray-200 text-gray-600 hover:bg-gray-50';

        if (val === 'ok') bOk.className = baseClass + 'border-[#41c79a] bg-[#e6f8f1] text-[#41c79a]';
        if (val === 'rej') bRej.className = baseClass + 'border-red-400 bg-red-50 text-red-600';

        if (val === 'rej') document.getElementById('com-rejection-comment-block').classList.remove('hidden');
        else document.getElementById('com-rejection-comment-block').classList.add('hidden');
    }

    function saveComDecision() {
        if (!window.currentComChoice) {
            alert('Қарорро интихоб кунед / Выберите решение');
            return;
        }

        const app = window.getApp(window.currentComAppId);
        if (!app) return;
        app.date = window.getCurrentDateTime();
        const comment = document.getElementById('com-comment').value || '';

        if (window.currentComChoice === 'ok') {
            app.status = 'approved';
            window.addLog(app, 'Кумита / Комитет', 'Грант тасдиқ шуд', 'Грант утвержден', 'emerald', 'award');
            window.generateMonitoringFor(app.id, new Date().toISOString().split('T')[0]);
        } else {
            app.status = 'rejected';
            window.addLog(app, 'Кумита / Комитет', 'Грант рад шуд', 'Грант отклонен', 'red', 'x-circle', comment);
        }
        document.getElementById('committee-evaluation-content').classList.add('hidden');
        window.renderAllCards();
        document.getElementById('applicationModal').classList.add('hidden');
    }

    window.AppFeatures.committee = {
        ready: true,
        openCommitteeBatch,
        toggleBatchComment,
        downloadCommitteeBusinessPlan,
        submitCommitteeBatch,
        exportProtocolToExcel,
        loadComForm,
        openComFor,
        setComDecision,
        saveComDecision
    };

    // Legacy compatibility while migrating code out of grant.html
    window.openCommitteeBatch = openCommitteeBatch;
    window.toggleBatchComment = toggleBatchComment;
    window.downloadCommitteeBusinessPlan = downloadCommitteeBusinessPlan;
    window.submitCommitteeBatch = submitCommitteeBatch;
    window.exportProtocolToExcel = exportProtocolToExcel;
    window.loadComForm = loadComForm;
    window.openComFor = openComFor;
    window.setComDecision = setComDecision;
    window.saveComDecision = saveComDecision;
})();
