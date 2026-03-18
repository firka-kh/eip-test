(function initGmcFeature() {
    window.AppFeatures = window.AppFeatures || {};
    if (window.AppFeatures.gmc) return;

    function notifyMessage(kind, message, title) {
        if (window.AppNotify && typeof window.AppNotify.toast === 'function') {
            window.AppNotify.toast(kind || 'info', title || '', message || '');
            return;
        }
        alert((title ? (title + '\n') : '') + (message || ''));
    }

    window.currentGmcAppId = null;
    window.currentGmcChoice = null;

    function getGmcOperatorInputEl() {
        return document.getElementById('gmc-operator-name');
    }

    function getNormalizedGmcOperatorName(app) {
        var input = getGmcOperatorInputEl();
        var typed = input ? String(input.value || '').trim() : '';
        if (typed) return typed;
        if (app && app.gmcOperatorName) return String(app.gmcOperatorName).trim();
        return '';
    }

    function setGmcOperatorInputErrorState(hasError) {
        var input = getGmcOperatorInputEl();
        if (!input) return;
        input.classList.toggle('border-red-300', hasError);
        input.classList.toggle('bg-red-50', hasError);
        input.classList.toggle('text-red-800', hasError);
        input.classList.toggle('focus:ring-2', hasError);
        input.classList.toggle('focus:ring-red-100', hasError);
    }

    function validateGmcOperatorRequired(app, showMessage) {
        var input = getGmcOperatorInputEl();
        if (input && input.disabled) {
            setGmcOperatorInputErrorState(false);
            return true;
        }

        var name = getNormalizedGmcOperatorName(app);
        var isValid = !!name;
        setGmcOperatorInputErrorState(!isValid);

        if (!isValid && showMessage) {
            notifyMessage('warning', 'Лутфан ФИО оператори ШИГ/КУГ-ро ворид кунед. / Пожалуйста, укажите ФИО оператора ШИГ/КУГ.');
            if (input && typeof input.focus === 'function') input.focus();
        }

        if (isValid && app) app.gmcOperatorName = name;
        return isValid;
    }

    function getGmcOperatorName(app) {
        var name = getNormalizedGmcOperatorName(app);
        if (name) {
            if (app) app.gmcOperatorName = name;
            return name;
        }
        return 'ШИГ / КУГ';
    }

    function syncGmcOperatorNameInput(app, isEditable) {
        var input = getGmcOperatorInputEl();
        if (!input) return;
        var savedName = app && app.gmcOperatorName ? String(app.gmcOperatorName) : '';
        input.value = savedName;
        input.disabled = !isEditable;
        input.classList.toggle('bg-slate-100', !isEditable);
        input.classList.toggle('cursor-not-allowed', !isEditable);
        setGmcOperatorInputErrorState(false);
    }

    function updateGmcWordVersionLabel(app) {
        var labelEl = document.getElementById('gmc-word-download-label');
        if (!labelEl) return;
        var version = 0;
        if (app && typeof window.getCurrentWordVersionInfo === 'function') {
            var info = window.getCurrentWordVersionInfo(app);
            version = info ? info.version : 0;
        }
        labelEl.textContent = 'Боргирии Word (V' + version + ')';
    }

    function getGmcRevisionUploadFileName() {
        var input = document.getElementById('gmc-revision-upload');
        if (!input || !input.files || !input.files.length) return '';
        return input.files[0].name || '';
    }

    function isCommitteeReturn(app) {
        if (!app) return false;
        if (app.lastReturnSource === 'committee') return true;
        return !!(app.lastCommitteeReturn && app.status === 'gmc_revision');
    }

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
        updateGmcWordVersionLabel(app);
        syncGmcOperatorNameInput(app, true);

        document.querySelectorAll('.gmc-score-input, .elig-radio, .elig-radio-no').forEach(function (el) {
            el.checked = false;
            el.disabled = false;
        });
        clearGmcValidationErrors();
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
            prepContent.innerHTML = '<div class="bg-indigo-50 border border-indigo-200 rounded-xl p-6 text-center shadow-sm"><div class="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4"><i data-lucide="clipboard-check" class="w-8 h-8"></i></div><h3 class="text-[16px] font-bold text-indigo-900 mb-2">Санҷиши ГТЛ гузашт <span class="ru-block mt-1">Верификация ГРП пройдена</span></h3><p class="text-[13px] text-indigo-700 mb-6">Лутфан дархостро бори дигар аз назар гузаронед ва онро ба реестр барои Кумита илова кунед.<span class="ru-block mt-1">Пожалуйста, проверьте заявку еще раз и добавьте её в реестр для отправки в Комитет.</span></p><button onclick="markReadyForRegistry()" class="w-full sm:w-auto mx-auto bg-indigo-600 text-white px-8 py-3 rounded-xl text-[14px] font-bold hover:bg-indigo-700 transition-colors shadow-sm flex flex-col items-center leading-tight"><span>Ба реестр илова кардан</span><span class="ru">Добавить в реестр</span></button></div>';
            evalContent.classList.remove('hidden');
            makeReadonly();
        } else if (['gmc_ready_for_registry', 'com_review', 'approved'].includes(app.status)) {
            prepContent.classList.remove('hidden');
            prepContent.innerHTML = '<div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center shadow-sm flex items-center justify-center gap-3"><i data-lucide="check-circle-2" class="w-6 h-6 text-emerald-600"></i><span class="text-[14px] font-bold text-emerald-900">Дархост дар реестр қарор дорад / Заявка в реестре</span></div>';
            evalContent.classList.remove('hidden');
            syncGmcOperatorNameInput(app, false);
            makeReadonly();
        } else if (app.status === 'gmc_revision') {
            returnContent.classList.remove('hidden');
            var revisionUploadInput = document.getElementById('gmc-revision-upload');
            if (revisionUploadInput) revisionUploadInput.value = '';
            const lastLog = app.auditLog.slice().reverse().find(function (l) { return l.comment; });
            const commentEl = document.getElementById('gmc-dynamic-comment');
            const isFromCommittee = isCommitteeReturn(app);
            if (commentEl) {
                if (isFromCommittee && app.lastCommitteeReturn) {
                    var meta = app.lastCommitteeReturn;
                    var metaLine = 'Комитет: ' + (meta.protocolId || '—') + ', ' + (meta.protocolDate || '—') + ' ' + (meta.protocolTime || '');
                    var cycleLine = 'Цикл возврата: ' + (meta.cycle || app.committeeReturnsCount || 1);
                    var reason = meta.comment || (lastLog && lastLog.comment ? lastLog.comment : 'Бе эзоҳ / Без комментариев');
                    commentEl.textContent = metaLine + ' | ' + cycleLine + ' | ' + reason;
                } else {
                    commentEl.textContent = lastLog && lastLog.comment ? lastLog.comment : 'Бе эзоҳ / Без комментариев';
                }
            }
            const newCommentEl = document.getElementById('gmc-return-comment');
            if (newCommentEl) newCommentEl.value = '';
            const returnTitle = document.getElementById('gmc-return-title');
            if (isFromCommittee) {
                returnTitle.innerHTML = 'Аз Кумита барои бозрасӣ баргардонида шуд <span class="ru-block mt-1">Возвращено из Комитета на доработку</span>';
            } else {
                returnTitle.innerHTML = 'Аз ГТЛ барои бозрасӣ баргардонида шуд <span class="ru-block mt-1">Возвращено из ГРП на доработку</span>';
            }
        } else if (app.status === 'piu_review') {
            evalContent.classList.remove('hidden');
            syncGmcOperatorNameInput(app, false);
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

        var requiredNames = getGmcRequiredFieldNames();
        var isComplete = requiredNames.every(function (name) {
            return !!document.querySelector('#gmc-evaluation-content input[name="' + name + '"]:checked');
        });

        let hasNo = false;
        document.querySelectorAll('.elig-radio-no:checked').forEach(function () { hasNo = true; });
        const bOk = document.getElementById('btn-recommend');
        const bRev = document.getElementById('btn-resubmit-gmc');
        const bRej = document.getElementById('btn-reject');
        if (bOk) bOk.disabled = false;
        if (bRev) bRev.disabled = false;
        if (bRej) bRej.disabled = false;

        var app = window.getApp(window.currentGmcAppId);
        var hasOperatorName = validateGmcOperatorRequired(app, false);
        if (!hasOperatorName) {
            if (bOk) bOk.disabled = true;
            if (bRev) bRev.disabled = true;
            if (bRej) bRej.disabled = true;
            if (window.currentGmcChoice) setGmcDecision(null);
            return;
        }

        // Hard gate: no decision can be selected until all required answers are provided.
        if (!isComplete) {
            if (bOk) bOk.disabled = true;
            if (bRev) bRev.disabled = true;
            if (bRej) bRej.disabled = true;
            if (window.currentGmcChoice) setGmcDecision(null);
            return;
        }

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

    function getGmcRequiredFieldNames() {
        var names = ['el1', 'el2', 'el3'];
        for (var i = 1; i <= 15; i++) names.push('q' + i);
        return names;
    }

    function findGmcQuestionRowByName(name) {
        var input = document.querySelector('#gmc-evaluation-content input[name="' + name + '"]');
        if (!input) return null;
        var row = input.closest('div.flex.justify-between.items-center.p-3');
        return row || null;
    }

    function applyGmcRowError(row, hasError) {
        if (!row) return;
        if (hasError) {
            row.setAttribute('data-gmc-error', '1');
            row.style.background = '#fef2f2';
            row.style.boxShadow = 'inset 4px 0 0 #dc2626';
        } else {
            row.removeAttribute('data-gmc-error');
            row.style.background = '';
            row.style.boxShadow = '';
        }
    }

    function clearGmcValidationErrors() {
        document.querySelectorAll('#gmc-evaluation-content [data-gmc-error="1"]').forEach(function (row) {
            applyGmcRowError(row, false);
        });
    }

    function validateGmcQuestionnaire() {
        var missing = [];
        var firstRow = null;
        getGmcRequiredFieldNames().forEach(function (name) {
            var checked = document.querySelector('#gmc-evaluation-content input[name="' + name + '"]:checked');
            var row = findGmcQuestionRowByName(name);
            var hasError = !checked;
            applyGmcRowError(row, hasError);
            if (hasError) {
                missing.push(name);
                if (!firstRow && row) firstRow = row;
            }
        });

        return {
            isValid: missing.length === 0,
            missing: missing,
            firstRow: firstRow
        };
    }

    function setGmcDecision(val) {
        const bOk = document.getElementById('btn-recommend');
        const bRev = document.getElementById('btn-resubmit-gmc');
        const bRej = document.getElementById('btn-reject');
        if (!bOk) return;
        var app = window.getApp(window.currentGmcAppId);
        if (val && !validateGmcOperatorRequired(app, true)) return;
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
        const app = window.getApp(window.currentGmcAppId);
        if (!app) return;
        if (!validateGmcOperatorRequired(app, true)) return;

        var validation = validateGmcQuestionnaire();
        if (!validation.isValid) {
            if (validation.firstRow && typeof validation.firstRow.scrollIntoView === 'function') {
                validation.firstRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            notifyMessage(
                'error',
                'Опросник заполнен не полностью. Отметьте все обязательные пункты: неуказанные строки подсвечены красным.'
            );
            return;
        }

        if (!window.currentGmcChoice) {
            if (window.AppNotify && typeof window.AppNotify.errorByKey === 'function') {
                window.AppNotify.errorByKey('validation.error');
            } else {
                notifyMessage('error', 'Лутфан қарорро интихоб кунед / Пожалуйста, выберите решение');
            }
            return;
        }

        app.date = window.getCurrentDateTime();
        var gmcActor = getGmcOperatorName(app);
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
            window.addLog(app, gmcActor, 'Тасдиқ шуд, ба ГТЛ равон шуд', 'Одобрено, направлено в ГРП', 'emerald', 'check');
            notifyMessage('success', 'Что произошло: заявка одобрена и передана в ГРП. Маршрут: КУГ -> ГРП. Следующий статус: Проверка в ГРП.');
        } else if (window.currentGmcChoice === 'rev') {
            app.revisionCount = (app.revisionCount || 0) + 1;
            if (app.revisionCount >= 3) {
                lockApplicationForThreeMonths(app, comment);
                const untilRu = typeof window.formatIsoDateRu === 'function' ? window.formatIsoDateRu(app.postponedUntilISO) : app.postponedUntilISO;
                if (window.AppNotify && typeof window.AppNotify.warningByKey === 'function') {
                    window.AppNotify.warningByKey('deadline.unlockNotAvailableUntilDate', { date: untilRu });
                } else {
                    notifyMessage('warning', 'Что произошло: лимит доработок исчерпан, заявка заблокирована до ' + untilRu + '. Маршрут: без изменений. Следующий статус: Отложена.');
                }
            } else {
                app.status = 'fac_revision';
                window.addLog(app, gmcActor, 'Барои такмил ба Фасилитатор баргашт (' + app.revisionCount + '/3)', 'Возвращено на доработку Фасилитатору (' + app.revisionCount + '/3)', 'amber', 'corner-down-left', comment);
                notifyMessage('warning', 'Что произошло: заявка направлена на доработку Фасилитатору (попытка ' + app.revisionCount + ' из 3). Маршрут: КУГ -> Фасилитатор. Следующий статус: На доработке у Фасилитатора.');
            }
        } else {
            app.status = 'rejected';
            window.addLog(app, gmcActor, 'Дархост рад шуд', 'Заявка отклонена', 'red', 'x-circle', comment);
            notifyMessage('error', 'Что произошло: заявка отклонена. Маршрут: процесс остановлен. Следующий статус: Отклонена.');
        }

        document.getElementById('gmc-evaluation-content').classList.add('hidden');
        window.renderAllCards();
        document.getElementById('applicationModal').classList.add('hidden');
    }

    function sendGmcBackToPiu() {
        const app = window.getApp(window.currentGmcAppId);
        if (!app) return;
        if (!validateGmcOperatorRequired(app, true)) return;
        var gmcActor = getGmcOperatorName(app);

        var wordFileName = getGmcRevisionUploadFileName();
        if (!wordFileName) {
            if (window.AppNotify && typeof window.AppNotify.errorByKey === 'function') {
                window.AppNotify.errorByKey('validation.errorDetailed');
            } else {
                notifyMessage('error', 'Лутфан версияи нави Word-ҳуҷҷатро бор кунед. / Пожалуйста, загрузите новую версию Word-документа.');
            }
            return;
        }

        var nextVersion = 0;
        if (typeof window.registerWordVersion === 'function') {
            nextVersion = window.registerWordVersion(app, {
                fileName: wordFileName,
                uploadedByRole: 'ШИГ / КУГ',
                uploadedByName: gmcActor,
                sourceStage: 'gmc_revision'
            });
        }

        var fromCommittee = isCommitteeReturn(app);
        app.resubmitsToPiuCount = (app.resubmitsToPiuCount || 0) + 1;
        app.status = 'piu_review';
        app.lastReturnSource = 'gmc';
        app.date = window.getCurrentDateTime();
        var committeeSuffix = fromCommittee
            ? ' пас аз бозгашти Кумита'
            : '';
        var committeeSuffixRu = fromCommittee
            ? ' после возврата Комитета'
            : '';
        window.addLog(
            app,
            gmcActor,
            'Ислоҳот ворид шуд, Word V' + nextVersion + ' бор ва бозгашт ба ГТЛ' + committeeSuffix + ' (шумора: ' + app.resubmitsToPiuCount + ')',
            'Внесены исправления, загружен Word V' + nextVersion + ', возвращено в ГРП' + committeeSuffixRu + ' (счет: ' + app.resubmitsToPiuCount + ')',
            'blue',
            'refresh-cw'
        );
        notifyMessage('success', 'Что произошло: исправления сохранены, заявка возвращена в ГРП. Маршрут: КУГ -> ГРП. Следующий статус: Проверка в ГРП.');
        window.renderAllCards();
        document.getElementById('applicationModal').classList.add('hidden');
    }

    function sendGmcToFacilitator() {
        const app = window.getApp(window.currentGmcAppId);
        if (!app) return;
        if (!validateGmcOperatorRequired(app, true)) return;
        var gmcActor = getGmcOperatorName(app);

        const commentEl = document.getElementById('gmc-return-comment');
        const comment = commentEl ? commentEl.value.trim() : '';
        if (!comment) {
            if (window.AppNotify && typeof window.AppNotify.warningByKey === 'function') {
                window.AppNotify.warningByKey('returnForRevision.warningCommentRequired');
            } else {
                notifyMessage('warning', 'Сабаби бозгардониданро нишон диҳед! / Укажите причину возврата!');
            }
            return;
        }

        var fromCommittee = isCommitteeReturn(app);
        app.revisionCount = (app.revisionCount || 0) + 1;
        app.lastReturnSource = 'gmc';
        app.date = window.getCurrentDateTime();

        if (app.revisionCount >= 3) {
            lockApplicationForThreeMonths(app, comment);
            const untilRu = typeof window.formatIsoDateRu === 'function' ? window.formatIsoDateRu(app.postponedUntilISO) : app.postponedUntilISO;
            if (window.AppNotify && typeof window.AppNotify.warningByKey === 'function') {
                window.AppNotify.warningByKey('deadline.unlockNotAvailableUntilDate', { date: untilRu });
            } else {
                notifyMessage('warning', 'Что произошло: лимит доработок исчерпан, заявка заблокирована до ' + untilRu + '. Маршрут: без изменений. Следующий статус: Отложена.');
            }
        } else {
            app.status = 'fac_revision';
            var committeeCycle = fromCommittee && app.lastCommitteeReturn ? ' Комитет #' + app.lastCommitteeReturn.cycle : '';
            window.addLog(app, gmcActor, 'Аз ГТЛ баргашт -> Ба Фасилитатор равон шуд (' + app.revisionCount + '/3)' + committeeCycle, 'Возврат из ГРП -> Направлено Фасилитатору (' + app.revisionCount + '/3)' + committeeCycle, 'amber', 'corner-down-left', comment);
            notifyMessage('warning', 'Что произошло: заявка отправлена Фасилитатору на доработку (попытка ' + app.revisionCount + ' из 3). Маршрут: КУГ -> Фасилитатор. Следующий статус: На доработке у Фасилитатора.');
        }
        window.renderAllCards();
        document.getElementById('applicationModal').classList.add('hidden');
    }

    function markReadyForRegistry() {
        const app = window.getApp(window.currentGmcAppId);
        if (!app) return;
        if (!validateGmcOperatorRequired(app, true)) return;
        var gmcActor = getGmcOperatorName(app);
        app.status = 'gmc_ready_for_registry';
        app.date = window.getCurrentDateTime();
        window.addLog(app, gmcActor, 'Барои реестри Комитет омода шуд', 'Заявка подготовлена для реестра Комитета', 'blue', 'list-checks');
        notifyMessage('success', 'Что произошло: заявка добавлена в реестр для Комитета. Маршрут: КУГ (подготовка) -> КУГ (реестр). Следующий статус: Готова к отправке в Комитет.');
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
            notifyMessage('warning', 'Лутфан ҳадди аққал як дархостро интихоб кунед! / Пожалуйста, выберите хотя бы одну заявку!');
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
                var gmcActor = getGmcOperatorName(app);
                app.status = 'com_review';
                app.registryListId = registryId;
                app.date = window.getCurrentDateTime();
                window.addLog(app, gmcActor, 'Ба Комитет дар ҳайати реестр ' + registryId + ' фиристода шуд', 'Отправлено в Комитет в составе реестра ' + registryId, 'blue', 'arrow-right');
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

        notifyMessage('success', 'Что произошло: реестр отправлен в Комитет. Маршрут: Реестр КУГ -> Комитет. Следующий статус заявок: На рассмотрении Комитета.');

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
            var name = e.target.getAttribute('name');
            if (name) {
                var row = findGmcQuestionRowByName(name);
                var checked = document.querySelector('#gmc-evaluation-content input[name="' + name + '"]:checked');
                if (row && checked) applyGmcRowError(row, false);
            }
            updateGmcScoreAndButtons();
        }
    });

    document.addEventListener('input', function (e) {
        if (e.target && e.target.id === 'gmc-operator-name') {
            var app = window.getApp(window.currentGmcAppId);
            validateGmcOperatorRequired(app, false);
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
