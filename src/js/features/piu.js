(function initPiuFeature() {
    window.AppFeatures = window.AppFeatures || {};
    if (window.AppFeatures.piu) return;

    function notifyMessage(kind, message, title) {
        if (window.AppNotify && typeof window.AppNotify.toast === 'function') {
            window.AppNotify.toast(kind || 'info', title || '', message || '');
            return;
        }
        alert((title ? (title + '\n') : '') + (message || ''));
    }

    window.currentPiuAppId = null;

    function loadPiuForm(id) {
        window.currentPiuAppId = id;
        const app = window.getApp(id);
        if (!app) return;

        document.getElementById('piu-app-name').textContent = app.name;
        document.getElementById('piu-app-id').textContent = app.id;
        document.getElementById('piu-evaluation-content').classList.remove('hidden');

        if (!app.piuDecisions) app.piuDecisions = { 1: null };
        if (!app.piuStatus) app.piuStatus = { 1: 'pending' };

        const isReadonly = ['gmc_preparation', 'gmc_ready_for_registry', 'com_review', 'approved'].includes(app.status);

        [1].forEach(function (i) {
            const okBtn = document.getElementById('btn-app-' + i);
            const revBtn = document.getElementById('btn-rev-' + i);
            const triggerBtn = document.getElementById('piu-trigger-' + i);
            const formContainer = document.getElementById('form-' + i);
            const commentBlock = document.getElementById('piu-comment-block-' + i);
            const saveBtn = document.getElementById('piu-save-btn-' + i);

            formContainer.classList.add('hidden');
            commentBlock.classList.add('hidden');
            okBtn.className = 'flex-1 py-2 border rounded-lg text-xs hover:bg-gray-50 flex flex-col items-center transition-colors';
            revBtn.className = 'flex-1 py-2 border rounded-lg text-xs hover:bg-gray-50 flex flex-col items-center transition-colors';

            if (app.piuStatus[i] === 'completed') {
                if (isReadonly) {
                    triggerBtn.classList.add('hidden');
                    formContainer.classList.remove('hidden');
                    if (saveBtn) saveBtn.classList.add('hidden');
                    okBtn.disabled = true;
                    revBtn.disabled = true;
                    document.getElementById('piu-comment-' + i).disabled = true;
                } else {
                    triggerBtn.classList.remove('hidden');
                    triggerBtn.className = 'text-slate-500 text-[12px] font-bold px-3 py-1 bg-slate-100 rounded hover:bg-slate-200 transition-colors';
                    triggerBtn.innerHTML = "Таҳрир <span class='ru'>/ Изменить</span>";
                    if (saveBtn) saveBtn.classList.remove('hidden');
                    okBtn.disabled = false;
                    revBtn.disabled = false;
                    document.getElementById('piu-comment-' + i).disabled = false;
                }

                if (app.piuDecisions[i] === 'approve') {
                    okBtn.className = 'flex-1 py-2 border rounded-lg text-xs border-[#41c79a] bg-[#e6f8f1] text-[#41c79a] font-bold flex flex-col items-center leading-tight transition-colors';
                } else if (app.piuDecisions[i] === 'resubmit') {
                    revBtn.className = 'flex-1 py-2 border rounded-lg text-xs border-amber-400 bg-amber-50 text-amber-700 font-bold flex flex-col items-center leading-tight transition-colors';
                    commentBlock.classList.remove('hidden');
                    document.getElementById('piu-comment-' + i).value = app.piuComment || '';
                }
            } else {
                document.getElementById('piu-comment-' + i).value = '';
                triggerBtn.classList.remove('hidden');
                triggerBtn.className = 'text-blue-600 text-[12px] font-bold px-3 py-1 bg-blue-50 rounded hover:bg-blue-100 transition-colors';
                triggerBtn.innerHTML = "Ворид кардан <span class='ru'>/ Внести</span>";
                if (saveBtn) saveBtn.classList.remove('hidden');
                okBtn.disabled = false;
                revBtn.disabled = false;
                document.getElementById('piu-comment-' + i).disabled = false;
            }
        });

        const count = Object.values(app.piuStatus).filter(function (s) { return s === 'completed'; }).length;
        document.getElementById('piu-counter').textContent = count + '/1';
        const showUpload = Object.values(app.piuDecisions).includes('resubmit');

        const finBtn = document.getElementById('finalize-piu-btn');
        if (isReadonly) {
            finBtn.classList.add('hidden');
            document.getElementById('piu-revision-files').classList.add('hidden');
        } else {
            finBtn.classList.remove('hidden');
            if (showUpload) document.getElementById('piu-revision-files').classList.remove('hidden');
            else document.getElementById('piu-revision-files').classList.add('hidden');

            if (count === 1) {
                finBtn.disabled = false;
                finBtn.className = 'w-full bg-[#5b4ef5] text-white py-3 rounded-lg text-[13px] font-bold hover:bg-[#4b3ed5] mt-4 cursor-pointer shadow-sm transition-colors flex flex-col items-center leading-tight';
            } else {
                finBtn.disabled = true;
                finBtn.className = 'w-full bg-gray-200 text-gray-500 py-3 rounded-lg text-[13px] font-bold cursor-not-allowed mt-4 flex flex-col items-center leading-tight shadow-sm';
            }
        }
    }

    function openPiuFor(id) {
        if (typeof window.canOpenInCurrentContext === 'function' && !window.canOpenInCurrentContext(id)) return;
        window.currentOpenedAppId = id;
        window.setAvailableTabs(['pane-piu', 'pane-approved']);
        document.getElementById('applicationModal').classList.remove('hidden');
        document.querySelector('.tab-btn[data-target="pane-piu"]').click();
    }

    function togglePiuForm(id) {
        const form = document.getElementById('form-' + id);
        if (form) form.classList.toggle('hidden');
    }

    function setPiuDecision(id, dec) {
        const app = window.getApp(window.currentPiuAppId);
        if (!app) return;
        app.piuDecisions[id] = dec;

        const okBtn = document.getElementById('btn-app-' + id);
        const revBtn = document.getElementById('btn-rev-' + id);
        const commentBlock = document.getElementById('piu-comment-block-' + id);
        okBtn.className = 'flex-1 py-2 border rounded-lg text-xs hover:bg-gray-50 flex flex-col items-center leading-tight transition-colors';
        revBtn.className = 'flex-1 py-2 border rounded-lg text-xs hover:bg-gray-50 flex flex-col items-center leading-tight transition-colors';

        if (dec === 'approve') {
            okBtn.className = 'flex-1 py-2 border rounded-lg text-xs border-[#41c79a] bg-[#e6f8f1] text-[#41c79a] font-bold flex flex-col items-center leading-tight transition-colors';
            commentBlock.classList.add('hidden');
        } else if (dec === 'resubmit') {
            revBtn.className = 'flex-1 py-2 border rounded-lg text-xs border-amber-400 bg-amber-50 text-amber-700 font-bold flex flex-col items-center leading-tight transition-colors';
            commentBlock.classList.remove('hidden');
        }

        const showUpload = Object.values(app.piuDecisions).includes('resubmit');
        if (showUpload) document.getElementById('piu-revision-files').classList.remove('hidden');
        else document.getElementById('piu-revision-files').classList.add('hidden');
    }

    function savePiuCard(id) {
        const app = window.getApp(window.currentPiuAppId);
        if (!app) return;
        if (!app.piuDecisions[id]) {
            if (window.AppNotify && typeof window.AppNotify.errorByKey === 'function') {
                window.AppNotify.errorByKey('validation.error');
            } else {
                notifyMessage('error', 'Лутфан қарорро интихоб кунед / Пожалуйста, выберите решение');
            }
            return;
        }
        if (app.piuDecisions[id] === 'resubmit' && !document.getElementById('piu-comment-' + id).value.trim()) {
            if (window.AppNotify && typeof window.AppNotify.warningByKey === 'function') {
                window.AppNotify.warningByKey('returnForRevision.warningCommentRequired');
            } else {
                notifyMessage('warning', 'Сабаби баргардониданро нишон диҳед! / Укажите причину возврата!');
            }
            return;
        }
        app.piuStatus[id] = 'completed';
        app.piuComment = document.getElementById('piu-comment-' + id).value;
        togglePiuForm(id);
        document.getElementById('piu-trigger-' + id).className = 'text-slate-500 text-[12px] font-bold px-3 py-1 bg-slate-100 rounded hover:bg-slate-200 transition-colors';
        document.getElementById('piu-trigger-' + id).innerHTML = "Таҳрир <span class='ru'>/ Изменить</span>";

        const count = Object.values(app.piuStatus).filter(function (s) { return s === 'completed'; }).length;
        document.getElementById('piu-counter').textContent = count + '/1';
        if (count === 1) {
            const btn = document.getElementById('finalize-piu-btn');
            btn.disabled = false;
            btn.className = 'w-full bg-[#5b4ef5] text-white py-3 rounded-lg text-[13px] font-bold hover:bg-[#4b3ed5] mt-4 cursor-pointer shadow-sm transition-colors flex flex-col items-center leading-tight';
        }
    }

    async function finalizePiu() {
        const app = window.getApp(window.currentPiuAppId);
        if (!app) return;
        app.date = window.getCurrentDateTime();

        const hasRev = Object.values(app.piuDecisions).includes('resubmit');
        const combinedComments = [];
        [1].forEach(function (i) {
            const c = document.getElementById('piu-comment-' + i).value.trim();
            if (c && app.piuDecisions[i] === 'resubmit') combinedComments.push(c);
        });
        const finalComment = combinedComments.join(' | ');

        if (hasRev && window.AppNotify && typeof window.AppNotify.confirmByKey === 'function') {
            var confirmed = await window.AppNotify.confirmByKey('piuReturnToGmc.confirm');
            if (!confirmed) return;
        }

        if (hasRev) {
            app.status = 'gmc_revision';
            window.addLog(app, 'ГТЛ / ГРП', 'Бо эродҳо ба ШИГ баргашт', 'Возвращено с комментариями в КУГ', 'amber', 'alert-triangle', finalComment);
            if (window.AppNotify && typeof window.AppNotify.successByKey === 'function') {
                window.AppNotify.successByKey('piuReturnToGmc.success');
            }
        } else {
            app.status = 'gmc_preparation';
            window.addLog(app, 'ГТЛ / ГРП', 'Баҳогузории иҷтимоӣ-экологӣ гузашт', 'Социально-экологическая оценка пройдена', 'emerald', 'check-circle');
            notifyMessage('success', 'Что произошло: заявка передана из ГРП в КУГ на подготовку реестра. Маршрут: ГРП -> КУГ. Следующий статус: Подготовка реестра в КУГ.');
        }
        document.getElementById('piu-evaluation-content').classList.add('hidden');
        window.renderAllCards();
        document.getElementById('applicationModal').classList.add('hidden');
    }

    window.AppFeatures.piu = {
        ready: true,
        loadPiuForm,
        openPiuFor,
        togglePiuForm,
        setPiuDecision,
        savePiuCard,
        finalizePiu
    };

    // Legacy compatibility while migrating code out of grant.html
    window.loadPiuForm = loadPiuForm;
    window.openPiuFor = openPiuFor;
    window.togglePiuForm = togglePiuForm;
    window.setPiuDecision = setPiuDecision;
    window.savePiuCard = savePiuCard;
    window.finalizePiu = finalizePiu;
})();
