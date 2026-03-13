(function initGmcFeature() {
    window.AppFeatures = window.AppFeatures || {};
    if (window.AppFeatures.gmc) return;

    window.currentGmcAppId = null;
    window.currentGmcChoice = null;

    function loadGmcForm(id) {
        const app = window.getApp(id);
        if (!app) return;

        window.currentGmcAppId = id;
        const beneficiaryId = app.beneficiaryId || id;
        const dbUser = (window.beneficiarySearchDatabase || {})[beneficiaryId]
            || (window.mockDatabase || {})[beneficiaryId]
            || app.beneficiarySnapshot
            || {};

        const evalContent = document.getElementById('gmc-evaluation-content');
        const prepContent = document.getElementById('gmc-preparation-content');
        const returnContent = document.getElementById('gmc-analyze-piu-return-content');

        evalContent.classList.add('hidden');
        returnContent.classList.add('hidden');
        prepContent.classList.add('hidden');

        document.getElementById('gmc-hdr-id').textContent = app.id;
        document.getElementById('gmc-hdr-name').textContent = app.name;
        document.getElementById('gmc-hdr-sector').innerHTML = app.sector;
        document.getElementById('gmc-hdr-amount').textContent = app.amount;
        document.getElementById('gmc-hdr-activity').innerHTML = dbUser.course || '—';
        document.getElementById('gmc-hdr-location').innerHTML = dbUser.address || '—';

        document.querySelectorAll('.gmc-score-input, .elig-radio, .elig-radio-no').forEach(function (el) {
            el.checked = false;
            el.disabled = false;
        });
        document.getElementById('gmc-comment').value = '';
        document.getElementById('gmc-comment').disabled = false;
        document.getElementById('gmc-decision-buttons').classList.remove('hidden');
        document.getElementById('gmc-save-action-btn').classList.remove('hidden');
        window.currentGmcChoice = null;
        document.getElementById('gmc-revision-files').classList.add('hidden');

        if (app.gmcEvaluation) {
            ['el1', 'el2', 'el3'].forEach(function (name) {
                const r = document.querySelector('input[name="' + name + '"][value="' + app.gmcEvaluation[name] + '"]');
                if (r) r.checked = true;
            });
            for (let i = 1; i <= 15; i++) {
                const r = document.querySelector('input[name="q' + i + '"][value="' + app.gmcEvaluation['q' + i] + '"]');
                if (r) r.checked = true;
            }
            document.getElementById('gmc-comment').value = app.gmcEvaluation.comment || '';
        }
        updateGmcScoreAndButtons();

        const makeReadonly = function () {
            document.querySelectorAll('.gmc-score-input, .elig-radio, .elig-radio-no').forEach(function (el) { el.disabled = true; });
            document.getElementById('gmc-comment').disabled = true;
            document.getElementById('gmc-decision-buttons').classList.add('hidden');
            document.getElementById('gmc-save-action-btn').classList.add('hidden');
        };

        if (app.status === 'gmc_preparation') {
            prepContent.classList.remove('hidden');
            prepContent.innerHTML = '<div class="bg-indigo-50 border border-indigo-200 rounded-xl p-6 text-center shadow-sm"><div class="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4"><i data-lucide="clipboard-check" class="w-8 h-8"></i></div><h3 class="text-[16px] font-bold text-indigo-900 mb-2">Санҷиши ГРП гузашт <span class="ru-block mt-1">Верификация ГРП пройдена</span></h3><p class="text-[13px] text-indigo-700 mb-6">Лутфан дархостро бори дигар аз назар гузаронед ва онро ба реестр барои Кумита илова кунед.<span class="ru-block mt-1">Пожалуйста, проверьте заявку еще раз и добавьте её в реестр для отправки в Комитет.</span></p><button onclick="markReadyForRegistry()" class="w-full sm:w-auto mx-auto bg-indigo-600 text-white px-8 py-3 rounded-xl text-[14px] font-bold hover:bg-indigo-700 transition-colors shadow-sm flex flex-col items-center leading-tight"><span>Ба реестр илова кардан</span><span class="ru">Добавить в реестр</span></button></div>';
            evalContent.classList.remove('hidden');
            makeReadonly();
        } else if (['gmc_ready_for_registry', 'com_review', 'approved'].includes(app.status)) {
            prepContent.classList.remove('hidden');
            prepContent.innerHTML = '<div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center shadow-sm flex items-center justify-center gap-3"><i data-lucide="check-circle-2" class="w-6 h-6 text-emerald-600"></i><span class="text-[14px] font-bold text-emerald-900">Дархост дар реестр қарор дорад / Заявка в реестре</span></div>';
            evalContent.classList.remove('hidden');
            makeReadonly();
        } else if (app.status === 'gmc_revision') {
            returnContent.classList.remove('hidden');
            const lastLog = app.auditLog.slice().reverse().find(function (l) { return l.comment; });
            const commentEl = document.getElementById('gmc-dynamic-comment');
            if (commentEl) commentEl.textContent = lastLog && lastLog.comment ? lastLog.comment : 'Бе эзоҳ / Без комментариев';
            const newCommentEl = document.getElementById('gmc-return-comment');
            if (newCommentEl) newCommentEl.value = '';
            const returnTitle = document.getElementById('gmc-return-title');
            const lastActor = app.auditLog[app.auditLog.length - 1] ? app.auditLog[app.auditLog.length - 1].actor : '';
            if (lastActor.includes('Кумита')) {
                returnTitle.innerHTML = 'Аз Кумита барои бозрасӣ баргардонида шуд <span class="ru-block mt-1">Возвращено из Комитета на доработку</span>';
            } else {
                returnTitle.innerHTML = 'Аз ГРП барои бозрасӣ баргардонида шуд <span class="ru-block mt-1">Возвращено из ГРП на доработку</span>';
            }
        } else if (app.status === 'piu_review') {
            evalContent.classList.remove('hidden');
            makeReadonly();
        } else {
            evalContent.classList.remove('hidden');
        }
    }

    function openGmcFor(id) {
        if (typeof window.canOpenInCurrentContext === 'function' && !window.canOpenInCurrentContext(id)) return;
        window.currentOpenedAppId = id;
        window.setAvailableTabs(['pane-gmc', 'pane-approved']);
        document.getElementById('applicationModal').classList.remove('hidden');
        document.querySelector('.tab-btn[data-target="pane-gmc"]').click();
    }

    function updateGmcScoreAndButtons() {
        let total = 0;
        document.querySelectorAll('.gmc-score-input:checked').forEach(function (r) { total += parseInt(r.value, 10); });
        document.getElementById('total-score').textContent = total;

        let hasNo = false;
        document.querySelectorAll('.elig-radio-no:checked').forEach(function () { hasNo = true; });
        const bOk = document.getElementById('btn-recommend');
        const bRev = document.getElementById('btn-resubmit-gmc');
        const bRej = document.getElementById('btn-reject');
        if (bOk) bOk.disabled = false;
        if (bRev) bRev.disabled = false;
        if (bRej) bRej.disabled = false;

        if (hasNo) {
            if (bOk) bOk.disabled = true;
            if (bRev) bRev.disabled = true;
        } else if (total >= 45) {
            if (bRev) bRev.disabled = true;
            if (bRej) bRej.disabled = true;
        } else if (total >= 30 && total <= 44) {
            if (bOk) bOk.disabled = true;
            if (bRej) bRej.disabled = true;
        } else if (total > 0) {
            if (bOk) bOk.disabled = true;
            if (bRev) bRev.disabled = true;
        }

        if (bOk && bOk.disabled && window.currentGmcChoice === 'ok') setGmcDecision(null);
        if (bRev && bRev.disabled && window.currentGmcChoice === 'rev') setGmcDecision(null);
        if (bRej && bRej.disabled && window.currentGmcChoice === 'rej') setGmcDecision(null);
    }

    function setGmcDecision(val) {
        const bOk = document.getElementById('btn-recommend');
        const bRev = document.getElementById('btn-resubmit-gmc');
        const bRej = document.getElementById('btn-reject');
        if (!bOk) return;
        if (val === 'ok' && bOk.disabled) return;
        if (val === 'rev' && bRev.disabled) return;
        if (val === 'rej' && bRej.disabled) return;

        window.currentGmcChoice = val;
        const baseClass = 'w-full flex items-center justify-between px-4 py-3 rounded-lg text-[13px] font-medium border-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ';
        bOk.className = baseClass + 'border-gray-200 text-gray-600 hover:bg-gray-50';
        bRev.className = baseClass + 'border-gray-200 text-gray-600 hover:bg-gray-50';
        bRej.className = baseClass + 'border-gray-200 text-gray-600 hover:bg-gray-50';
        if (val === 'ok') bOk.className = baseClass + 'border-[#41c79a] bg-[#e6f8f1] text-[#41c79a]';
        if (val === 'rev') bRev.className = baseClass + 'border-amber-400 bg-amber-50 text-amber-700';
        if (val === 'rej') bRej.className = baseClass + 'border-red-400 bg-red-50 text-red-600';
        if (val === 'rev') document.getElementById('gmc-revision-files').classList.remove('hidden');
        else document.getElementById('gmc-revision-files').classList.add('hidden');
    }

    function lockApplicationForThreeMonths(app, comment) {
        const now = new Date();
        const until = typeof window.addMonths === 'function' ? window.addMonths(now, 3) : new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        const toIso = typeof window.toIsoDate === 'function'
            ? window.toIsoDate
            : function (dt) { return new Date(dt).toISOString().slice(0, 10); };

        app.status = 'postponed';
        app.postponedAtISO = toIso(now);
        app.postponedUntilISO = toIso(until);
        delete app.unlockNoticeProcessedAtISO;
        app.date = window.getCurrentDateTime();

        window.addLog(
            app,
            'Система',
            '3-ю неодобрение: заявка заблокирована на 3 месяца',
            '3-е неодобрение: заявка заблокирована на 3 месяца',
            'red',
            'clock',
            comment
        );
    }

    function saveGmcDecision() {
        if (!window.currentGmcChoice) {
            alert('Қарорро интихоб кунед / Выберите решение');
            return;
        }

        const app = window.getApp(window.currentGmcAppId);
        if (!app) return;
        app.date = window.getCurrentDateTime();
        const comment = document.getElementById('gmc-comment').value || '';

        app.gmcEvaluation = { comment: comment };
        ['el1', 'el2', 'el3'].forEach(function (n) {
            const selected = document.querySelector('input[name="' + n + '"]:checked');
            app.gmcEvaluation[n] = selected ? selected.value : undefined;
        });
        for (let i = 1; i <= 15; i++) {
            const selected = document.querySelector('input[name="q' + i + '"]:checked');
            app.gmcEvaluation['q' + i] = selected ? selected.value : undefined;
        }

        if (window.currentGmcChoice === 'ok') {
            app.status = 'piu_review';
            window.addLog(app, 'ШИГ / КУГ', 'Тасдиқ шуд, ба ГРП равон шуд', 'Одобрено, направлено в ГРП', 'emerald', 'check');
            alert('Дархост тасдиқ шуд! Ҳуҷҷат бетағйир ба ГРП интиқол ёфт.\nЗаявка одобрена! Документ в неизменном состоянии передан в ГРП.');
        } else if (window.currentGmcChoice === 'rev') {
            app.revisionCount = (app.revisionCount || 0) + 1;
            if (app.revisionCount >= 3) {
                lockApplicationForThreeMonths(app, comment);
                const untilRu = typeof window.formatIsoDateRu === 'function' ? window.formatIsoDateRu(app.postponedUntilISO) : app.postponedUntilISO;
                alert('Лимит доработок исчерпан на 3-м неодобрении. Заявка заблокирована до ' + untilRu + '.');
            } else {
                app.status = 'fac_revision';
                window.addLog(app, 'ШИГ / КУГ', 'Барои такмил ба Фасилитатор баргашт (' + app.revisionCount + '/3)', 'Возвращено на доработку Фасилитатору (' + app.revisionCount + '/3)', 'amber', 'corner-down-left', comment);
                alert('Дархост бо файлҳои эроддор барои такмил ба Фасилитатор фиристода шуд (Кӯшиши ' + app.revisionCount + ' аз 3).\nЗаявка с комментариями направлена на доработку Фасилитатору (Попытка ' + app.revisionCount + ' из 3).');
            }
        } else {
            app.status = 'rejected';
            window.addLog(app, 'ШИГ / КУГ', 'Дархост рад шуд', 'Заявка отклонена', 'red', 'x-circle', comment);
            alert('Дархост рад карда шуд.\nЗаявка отклонена.');
        }

        document.getElementById('gmc-evaluation-content').classList.add('hidden');
        window.renderAllCards();
        document.getElementById('applicationModal').classList.add('hidden');
    }

    function sendGmcBackToPiu() {
        const app = window.getApp(window.currentGmcAppId);
        if (!app) return;
        app.status = 'piu_review';
        app.date = window.getCurrentDateTime();
        window.addLog(app, 'ШИГ / КУГ', 'Ислоҳот ворид шуд, бозгашт ба ГРП', 'Внесены исправления, возвращено в ГРП', 'blue', 'refresh-cw');
        window.renderAllCards();
        document.getElementById('applicationModal').classList.add('hidden');
    }

    function sendGmcToFacilitator() {
        const app = window.getApp(window.currentGmcAppId);
        if (!app) return;

        const commentEl = document.getElementById('gmc-return-comment');
        const comment = commentEl ? commentEl.value.trim() : '';
        if (!comment) {
            alert('Лутфан эзоҳи бозгардониданро нависед!\nПожалуйста, укажите комментарий для возврата!');
            return;
        }

        app.revisionCount = (app.revisionCount || 0) + 1;
        app.date = window.getCurrentDateTime();

        if (app.revisionCount >= 3) {
            lockApplicationForThreeMonths(app, comment);
            const untilRu = typeof window.formatIsoDateRu === 'function' ? window.formatIsoDateRu(app.postponedUntilISO) : app.postponedUntilISO;
            alert('Лимит доработок исчерпан на 3-м неодобрении. Заявка заблокирована до ' + untilRu + '.');
        } else {
            app.status = 'fac_revision';
            window.addLog(app, 'ШИГ / КУГ', 'Аз ГРП баргашт -> Ба Фасилитатор равон шуд (' + app.revisionCount + '/3)', 'Возврат из ГРП -> Направлено Фасилитатору (' + app.revisionCount + '/3)', 'amber', 'corner-down-left', comment);
            alert('Дархост барои такмил ба Фасилитатор фиристода шуд (Кӯшиши ' + app.revisionCount + ' аз 3)!\nЗаявка отправлена Фасилитатору на доработку (Попытка ' + app.revisionCount + ' из 3)!');
        }
        window.renderAllCards();
        document.getElementById('applicationModal').classList.add('hidden');
    }

    function markReadyForRegistry() {
        const app = window.getApp(window.currentGmcAppId);
        if (!app) return;
        app.status = 'gmc_ready_for_registry';
        app.date = window.getCurrentDateTime();
        window.addLog(app, 'ШИГ / КУГ', 'Барои реестри Комитет омода шуд', 'Заявка подготовлена для реестра Комитета', 'blue', 'list-checks');
        alert('Дархост ба реестр илова карда шуд!\nЗаявка успешно добавлена в реестр для отправки в Комитет!');
        window.renderAllCards();
        document.getElementById('applicationModal').classList.add('hidden');
    }

    function toggleRegistrySelection(id, el) {
        if (el.checked) window.selectedForRegistry.add(id);
        else window.selectedForRegistry.delete(id);

        const btn = document.getElementById('btn-create-registry');
        document.getElementById('reg-sel-count').textContent = window.selectedForRegistry.size;

        if (window.selectedForRegistry.size > 0) btn.classList.remove('opacity-50', 'pointer-events-none');
        else btn.classList.add('opacity-50', 'pointer-events-none');

        if (typeof window.updateAllBadges === 'function') window.updateAllBadges();
    }

    function toggleSelectAllReadyForRegistry() {
        const visibleIds = typeof window.getVisibleReadyRegistryIds === 'function'
            ? window.getVisibleReadyRegistryIds()
            : window.filterApps(['gmc_ready_for_registry']).map(function (a) { return a.id; });

        if (!visibleIds.length) return;

        const allSelected = visibleIds.every(function (id) {
            return window.selectedForRegistry.has(id);
        });

        visibleIds.forEach(function (id) {
            if (allSelected) window.selectedForRegistry.delete(id);
            else window.selectedForRegistry.add(id);
        });

        if (typeof window.renderAllCards === 'function') window.renderAllCards();
        else if (typeof window.updateAllBadges === 'function') window.updateAllBadges();
    }

    function openRegistryPreview() {
        if (!window.selectedForRegistry || window.selectedForRegistry.size === 0) {
            alert('Ҳадди аққал як дархостро интихоб кунед! / Выберите хотя бы одну заявку!');
            return;
        }

        window.setAvailableTabs(['pane-gmc-registry-preview']);
        document.getElementById('applicationModal').classList.remove('hidden');

        const allTabs = ['pane-facilitator', 'pane-gmc', 'pane-piu', 'pane-committee', 'pane-approved', 'pane-monitoring', 'pane-committee-batch', 'pane-gmc-registry-preview'];
        allTabs.forEach(function (t) {
            const pane = document.getElementById(t);
            if (pane) pane.classList.add('hidden');
        });
        document.getElementById('pane-gmc-registry-preview').classList.remove('hidden');
        document.getElementById('modal-main-title').innerHTML = 'Ташаккули реестр <span class="ru">/ Формирование реестра</span>';

        const tbody = document.getElementById('registry-preview-tbody');
        tbody.innerHTML = '';

        window.selectedForRegistry.forEach(function (id) {
            const app = window.getApp(id);
            if (app) {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-emerald-50 transition-colors';
                tr.innerHTML = '<td class="py-3 px-4 border-b border-emerald-100 align-middle"><div class="font-bold text-gray-800 text-[13px]">' + app.name + '</div><div class="text-[11px] text-gray-400">#' + app.id + '</div></td><td class="py-3 px-4 border-b border-emerald-100 align-middle"><div class="text-[12px] text-gray-600">' + app.sector + '</div><div class="font-black text-primary text-[12px] mt-0.5">' + app.amount + ' сом.</div></td><td class="py-3 px-4 border-b border-emerald-100 align-middle"><div class="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md text-[10px] font-bold w-max"><i data-lucide="list-checks" class="w-3 h-3 inline"></i> Дар реестр <span class="ru font-normal">/ В реестре</span></div></td>';
                tbody.appendChild(tr);
            }
        });
        if (window.lucide) window.lucide.createIcons();
    }

    function confirmAndSendRegistry() {
        if (!window.selectedForRegistry || window.selectedForRegistry.size === 0) return;

        window.state.registryLists = window.state.registryLists || [];
        const sentIds = Array.from(window.selectedForRegistry);
        const seq = window.state.registryLists.length + 1;
        const registryId = 'РЕЕСТР-GMS-' + String(1000 + seq);
        const now = new Date();
        const dateText = now.toLocaleDateString('ru-RU');
        const timeText = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        let totalAmount = 0;

        sentIds.forEach(function (id) {
            const app = window.getApp(id);
            if (app) {
                app.status = 'com_review';
                app.registryListId = registryId;
                app.date = window.getCurrentDateTime();
                window.addLog(app, 'ШИГ / КУГ', 'Ба Комитет дар ҳайати реестр ' + registryId + ' фиристода шуд', 'Отправлено в Комитет в составе реестра ' + registryId, 'blue', 'arrow-right');
                totalAmount += parseInt(String(app.amount || '').replace(/\D/g, '') || 0, 10);
            }
        });

        window.state.registryLists.push({
            id: registryId,
            source: 'gms',
            status: 'pending',
            date: dateText,
            exactTime: timeText,
            apps: sentIds,
            totalAmount: totalAmount
        });

        alert('Реестр бомуваффақият ба Кумита фиристода шуд!\nРеестр успешно отправлен в Комитет!');

        window.selectedForRegistry.clear();
        document.getElementById('reg-sel-count').textContent = '0';
        document.getElementById('btn-create-registry').classList.add('opacity-50', 'pointer-events-none');

        document.getElementById('applicationModal').classList.add('hidden');
        if (typeof window.renderAllCards === 'function') window.renderAllCards();

        const committeeMainBtn = document.querySelector('.filter-btn[data-filter="committee"]');
        if (committeeMainBtn) committeeMainBtn.click();
    }

    document.addEventListener('change', function (e) {
        if (e.target.classList.contains('gmc-score-input') || e.target.classList.contains('elig-radio') || e.target.classList.contains('elig-radio-no')) {
            updateGmcScoreAndButtons();
        }
    });

    window.AppFeatures.gmc = {
        ready: true,
        loadGmcForm,
        openGmcFor,
        updateGmcScoreAndButtons,
        setGmcDecision,
        saveGmcDecision,
        sendGmcBackToPiu,
        sendGmcToFacilitator,
        markReadyForRegistry,
        toggleRegistrySelection,
        toggleSelectAllReadyForRegistry,
        openRegistryPreview,
        confirmAndSendRegistry
    };

    // Legacy compatibility while migrating code out of grant.html
    window.loadGmcForm = loadGmcForm;
    window.openGmcFor = openGmcFor;
    window.updateGmcScoreAndButtons = updateGmcScoreAndButtons;
    window.setGmcDecision = setGmcDecision;
    window.saveGmcDecision = saveGmcDecision;
    window.sendGmcBackToPiu = sendGmcBackToPiu;
    window.sendGmcToFacilitator = sendGmcToFacilitator;
    window.markReadyForRegistry = markReadyForRegistry;
    window.toggleRegistrySelection = toggleRegistrySelection;
    window.toggleSelectAllReadyForRegistry = toggleSelectAllReadyForRegistry;
    window.openRegistryPreview = openRegistryPreview;
    window.confirmAndSendRegistry = confirmAndSendRegistry;
})();
