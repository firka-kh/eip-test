(function initCommitteeFeature() {
    window.AppFeatures = window.AppFeatures || {};
    if (window.AppFeatures.committee) return;

    function notifyMessage(kind, message, title) {
        if (window.AppNotify && typeof window.AppNotify.toast === 'function') {
            window.AppNotify.toast(kind || 'info', title || '', message || '');
            return;
        }
        alert((title ? (title + '\n') : '') + (message || ''));
    }

    window.currentComAppId = null;
    window.currentComChoice = null;

    function getBusinessPlanButtonHtml(appId) {
        return '<div class="flex flex-wrap gap-1.5"><button type="button" onclick="downloadCommitteeBusinessPlan(\'' + appId + '\')" class="bg-white border border-indigo-200 text-indigo-700 py-1.5 px-2.5 rounded-lg text-[11px] font-bold hover:bg-indigo-50 transition-colors inline-flex items-center gap-1.5"><i data-lucide="download" class="w-3.5 h-3.5"></i><span>Боргирии Word <span class="ru font-normal">/ Скачать Word</span></span></button><button type="button" onclick="downloadCommitteePdf(\'' + appId + '\')" class="bg-white border border-indigo-200 text-indigo-700 py-1.5 px-2.5 rounded-lg text-[11px] font-bold hover:bg-indigo-50 transition-colors inline-flex items-center gap-1.5"><i data-lucide="file" class="w-3.5 h-3.5"></i><span>Боргирии PDF <span class="ru font-normal">/ Скачать PDF</span></span></button><button type="button" onclick="downloadCommitteePhotos(\'' + appId + '\')" class="bg-white border border-indigo-200 text-indigo-700 py-1.5 px-2.5 rounded-lg text-[11px] font-bold hover:bg-indigo-50 transition-colors inline-flex items-center gap-1.5"><i data-lucide="images" class="w-3.5 h-3.5"></i><span>Боргирии фото <span class="ru font-normal">/ Скачать фото</span></span></button></div>';
    }

    function getBatchApplicantCellHtml(app) {
        return '<td class="py-3 px-4 border-b border-gray-100 align-middle"><button type="button" onclick="openApprovedFromCommitteeBatch(\'' + app.id + '\')" class="text-left group"><div class="font-bold text-gray-800 text-[13px] group-hover:text-indigo-700 group-hover:underline transition-colors">' + app.name + '</div><div class="text-[11px] text-gray-400">#' + app.id + '</div></button></td>';
    }

    function openApprovedFromCommitteeBatch(id) {
        if (!id) return;
        window.lastOpenedCommitteeListId = window.currentViewedProtocolId || window.currentCommitteeRegistryId || null;
        window.nextApprovedOpenSource = 'committee-batch';
        if (typeof window.openApprovedFor === 'function') {
            window.openApprovedFor(id);
        }
    }

    function returnToCommitteeBatchFromHistory() {
        window.currentApprovedOpenSource = null;
        openCommitteeBatch(window.lastOpenedCommitteeListId || null);
    }

    function downloadCommitteeBusinessPlan(appId) {
        if (typeof window.downloadBusinessPlanFile === 'function') {
            window.downloadBusinessPlanFile(appId);
            return;
        }
        notifyMessage('error', 'Функсияи боргирӣ дастрас нест. / Функция скачивания недоступна.');
    }

    function downloadCommitteePdf(appId) {
        if (typeof window.downloadBusinessPlanPdfFile === 'function') {
            window.downloadBusinessPlanPdfFile(appId);
            return;
        }
        notifyMessage('error', 'Функсияи боргирии PDF дастрас нест. / Функция скачивания PDF недоступна.');
    }

    function downloadCommitteePhotos(appId) {
        if (typeof window.downloadBusinessPlanPhotoPack === 'function') {
            window.downloadBusinessPlanPhotoPack(appId);
            return;
        }
        notifyMessage('error', 'Функсияи боргирии аксҳо дастрас нест. / Функция скачивания фото недоступна.');
    }

    function normalizeDecisionComment(value) {
        return String(value == null ? '' : value).trim();
    }

    function getBatchDecisionComment(appId) {
        var input = document.querySelector('.batch-comment-input[data-id="' + appId + '"]');
        return input ? normalizeDecisionComment(input.value) : '';
    }

    function toggleBatchCommentVisibility(selectEl) {
        if (!selectEl) return;
        var wrap = selectEl.parentElement ? selectEl.parentElement.querySelector('.batch-comment-wrap') : null;
        if (!wrap) return;
        var shouldShow = selectEl.value === 'rej';
        wrap.classList.toggle('hidden', !shouldShow);
    }

    function applyCommitteeRejection(app, protocolNum, formattedProtocolDate, exactTime, comment) {
        var cycle = (app.committeeReturnsCount || 0) + 1;
        var protocolTag = protocolNum || '—';
        var now = new Date();
        var until = typeof window.addMonths === 'function' ? window.addMonths(now, 3) : new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        var toIso = typeof window.toIsoDate === 'function'
            ? window.toIsoDate
            : function (dt) { return new Date(dt).toISOString().slice(0, 10); };
        var untilIso = toIso(until);
        var untilRu = typeof window.formatIsoDateRu === 'function' ? window.formatIsoDateRu(untilIso) : untilIso;

        app.committeeReturnsCount = cycle;
        app.revisionCount = 3;
        app.lastReturnSource = 'committee';
        app.lastCommitteeReturn = {
            cycle: cycle,
            protocolId: protocolTag,
            protocolDate: formattedProtocolDate || '—',
            protocolTime: exactTime || '—',
            returnedAt: app.date,
            returnedBy: 'Кумита / Комитет',
            comment: comment
        };
        app.status = 'postponed';
        app.postponedAtISO = toIso(now);
        app.postponedUntilISO = untilIso;
        delete app.unlockNoticeProcessedAtISO;

        window.addLog(
            app,
            'Кумита / Комитет',
            'Комитет рад кард: дархост 3 моҳ мавқуф шуд (то ' + untilRu + ')',
            'Комитет отклонил: заявка отложена на 3 месяца (до ' + untilRu + ')',
            'red',
            'clock',
            'Протокол: ' + protocolTag + '. ' + comment
        );
    }

    function openCommitteeBatch(protocolId) {
        let targetProtocolId = protocolId || null;
        if (!targetProtocolId) {
            const pending = (window.state.registryLists || []).filter(function (r) { return r && r.status !== 'processed'; });
            if (pending.length === 1) {
                targetProtocolId = pending[0].id;
            } else if (pending.length > 1) {
                notifyMessage('warning', 'Лутфан рӯйхати лозимро аз блоки Кумита интихоб кунед / Пожалуйста, выберите нужный список в блоке Комитета');
                return;
            }
        }
        window.setAvailableTabs(['pane-committee-batch', 'pane-approved']);
        document.getElementById('applicationModal').classList.remove('hidden');

        const allTabs = ['pane-facilitator', 'pane-gmc', 'pane-committee', 'pane-approved', 'pane-monitoring', 'pane-committee-batch', 'pane-gmc-registry-preview'];
        allTabs.forEach(function (t) {
            const pane = document.getElementById(t);
            if (pane) pane.classList.add('hidden');
        });
        document.getElementById('pane-committee-batch').classList.remove('hidden');

        const tbody = document.getElementById('batch-tbody');
        const btnExport = document.getElementById('btn-export-protocol');
        tbody.innerHTML = '';

        window.currentCommitteeRegistryId = null;
        window.lastOpenedCommitteeListId = targetProtocolId || null;

        if (targetProtocolId) {
            const prot = (window.state.protocols || []).find(function (p) { return p.id === targetProtocolId; });
            if (prot) {
                document.getElementById('modal-main-title').innerHTML = 'Рӯйхати Кумита № ' + targetProtocolId + ' <span class="ru">/ Список Комитета</span>';
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
                        tr.innerHTML = getBatchApplicantCellHtml(app) + '<td class="py-3 px-4 border-b border-gray-100 align-middle"><div class="text-[12px] text-gray-600">' + app.sector + '</div><div class="font-black text-primary text-[12px] mt-0.5">' + app.amount + ' сом.</div></td><td class="py-3 px-4 border-b border-gray-100 align-middle text-center font-bold text-[12px] ' + (isOk ? 'text-emerald-600' : 'text-red-600') + '">' + (isOk ? '✅ Тасдиқ / Одобрено' : '❌ Рад шуд / Отклонено') + '</td><td class="py-3 px-4 border-b border-gray-100 align-middle">' + getBusinessPlanButtonHtml(app.id) + '</td>';
                        tbody.appendChild(tr);
                    }
                });
            } else {
                const incoming = (window.state.registryLists || []).find(function (r) { return r.id === targetProtocolId; });
                if (!incoming) return;

                document.getElementById('modal-main-title').innerHTML = 'Рӯйхати воридшуда ' + incoming.id + ' <span class="ru">/ Входящий список</span>';
                document.getElementById('batch-protocol-date').disabled = false;
                document.getElementById('submit-batch-btn').classList.remove('hidden');

                window.currentViewedProtocolId = null;
                window.currentCommitteeRegistryId = incoming.id;
                btnExport.classList.add('hidden');
                btnExport.classList.remove('flex');

                const autoNum = 'ПР-' + Math.floor(1000 + Math.random() * 9000);
                document.getElementById('batch-protocol-number').value = autoNum;
                document.getElementById('batch-protocol-date').value = new Date().toISOString().split('T')[0];

                const comApps = (incoming.apps || []).map(function (id) { return window.getApp(id); }).filter(function (app) {
                    return app && app.status === 'com_review';
                });
                if (comApps.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" class="py-10 text-center text-gray-500">Рӯйхат холӣ аст / Список пуст</td></tr>';
                    return;
                }

                comApps.forEach(function (app) {
                    const tr = document.createElement('tr');
                    tr.className = 'hover:bg-slate-50 transition-colors';
                    tr.innerHTML = getBatchApplicantCellHtml(app) + '<td class="py-3 px-4 border-b border-gray-100 align-middle"><div class="text-[12px] text-gray-600">' + app.sector + '</div><div class="font-black text-primary text-[12px] mt-0.5">' + app.amount + ' сом.</div></td><td class="py-3 px-4 border-b border-gray-100 align-middle"><select class="batch-decision border border-gray-300 rounded px-2 py-1.5 outline-none w-full text-[12px]" data-id="' + app.id + '"><option value="ok" selected>✅ Тасдиқ / Одобрить</option><option value="rej">❌ Рад кардан / Отклонить</option></select><div class="batch-comment-wrap hidden mt-2"><textarea class="batch-comment-input w-full border border-red-200 rounded-lg px-2 py-1.5 text-[11px] text-red-700" rows="2" data-id="' + app.id + '" placeholder="Сабаби рад кардан / Причина отклонения"></textarea></div></td><td class="py-3 px-4 border-b border-gray-100 align-middle">' + getBusinessPlanButtonHtml(app.id) + '</td>';
                    tbody.appendChild(tr);
                });
            }
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
                tr.innerHTML = getBatchApplicantCellHtml(app) + '<td class="py-3 px-4 border-b border-gray-100 align-middle"><div class="text-[12px] text-gray-600">' + app.sector + '</div><div class="font-black text-primary text-[12px] mt-0.5">' + app.amount + ' сом.</div></td><td class="py-3 px-4 border-b border-gray-100 align-middle"><select class="batch-decision border border-gray-300 rounded px-2 py-1.5 outline-none w-full text-[12px]" data-id="' + app.id + '"><option value="ok" selected>✅ Тасдиқ / Одобрить</option><option value="rej">❌ Рад кардан / Отклонить</option></select><div class="batch-comment-wrap hidden mt-2"><textarea class="batch-comment-input w-full border border-red-200 rounded-lg px-2 py-1.5 text-[11px] text-red-700" rows="2" data-id="' + app.id + '" placeholder="Сабаби рад кардан / Причина отклонения"></textarea></div></td><td class="py-3 px-4 border-b border-gray-100 align-middle">' + getBusinessPlanButtonHtml(app.id) + '</td>';
                tbody.appendChild(tr);
            });
        }

        if (window.lucide) window.lucide.createIcons();
    }

    function toggleBatchComment(appId) {
        return appId;
    }

    function submitCommitteeBatch() {
        let comApps = window.filterApps(['com_review']);
        if (window.currentCommitteeRegistryId) {
            const incoming = (window.state.registryLists || []).find(function (r) { return r.id === window.currentCommitteeRegistryId; });
            if (incoming) {
                comApps = (incoming.apps || []).map(function (id) { return window.getApp(id); }).filter(function (app) {
                    return app && app.status === 'com_review';
                });
            }
        }
        if (comApps.length === 0) {
            notifyMessage('warning', 'Рӯйхат холӣ аст / Список пуст');
            return;
        }

        const protocolNum = document.getElementById('batch-protocol-number').value;
        const protocolDateInput = document.getElementById('batch-protocol-date').value;
        if (!protocolDateInput) {
            notifyMessage('warning', 'Лутфан санаи рӯйхатро интихоб кунед! / Пожалуйста, выберите дату списка!');
            return;
        }

        const formattedProtocolDate = new Date(protocolDateInput).toLocaleDateString('ru-RU');
        const exactTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

        const protocolLabel = '№ ' + protocolNum + ' аз ' + formattedProtocolDate + ' (' + exactTime + ')';
        const protocolLabelRu = '№ ' + protocolNum + ' от ' + formattedProtocolDate + ' (' + exactTime + ')';

        const newProtocol = { id: protocolNum, date: formattedProtocolDate, exactTime: exactTime, apps: [], okCount: 0, rejCount: 0, totalAmount: 0 };

        var decisions = [];
        for (var idx = 0; idx < comApps.length; idx++) {
            var appForValidation = comApps[idx];
            var decisionEl = document.querySelector('.batch-decision[data-id="' + appForValidation.id + '"]');
            var decision = decisionEl ? decisionEl.value : 'ok';
            var comment = decision === 'rej' ? getBatchDecisionComment(appForValidation.id) : '';

            if (decision === 'rej' && !comment) {
                if (window.AppNotify && typeof window.AppNotify.warningByKey === 'function') {
                    window.AppNotify.warningByKey('returnForRevision.warningCommentRequired');
                } else {
                    notifyMessage('warning', 'Сабаби рад карданро нишон диҳед / Укажите причину отклонения');
                }
                return;
            }
            decisions.push({ app: appForValidation, decision: decision, comment: comment });
        }

        decisions.forEach(function (entry) {
            var app = entry.app;
            var decision = entry.decision;
            var comment = entry.comment;
            const decisionEl = document.querySelector('.batch-decision[data-id="' + app.id + '"]');
            if (decisionEl) toggleBatchCommentVisibility(decisionEl);

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
                applyCommitteeRejection(app, protocolNum, formattedProtocolDate, exactTime, comment);
                newProtocol.rejCount++;
            }
        });

        window.state.protocols = window.state.protocols || [];
        window.state.protocols.push(newProtocol);

        if (window.currentCommitteeRegistryId) {
            const incoming = (window.state.registryLists || []).find(function (r) { return r.id === window.currentCommitteeRegistryId; });
            if (incoming) {
                incoming.status = 'processed';
                incoming.protocolId = protocolNum;
                incoming.processedAt = window.getCurrentDateTime();
            }
        }
        window.currentCommitteeRegistryId = null;

        notifyMessage('success', 'Что произошло: список Комитета утвержден. Одобрено: ' + newProtocol.okCount + ', отклонено: ' + newProtocol.rejCount + '. Маршрут: Комитет -> одобрение или отложение на 3 месяца. Следующий статус: Одобрена / Отложена по решению Комитета.');
        document.getElementById('applicationModal').classList.add('hidden');
        document.getElementById('modal-main-title').innerHTML = 'Дархост: Дастгирии грантии тиҷорат <span class="ru">/ Заявка: Грантовая поддержка бизнеса</span>';

        window.nextApprovedRegistrySourceRole = null;
        window.approvedRegistrySourceRole = null;
        const approvedMainBtn = document.querySelector('.filter-btn[data-filter="approved_registry"]');
        if (approvedMainBtn) approvedMainBtn.click();
    }

    function exportProtocolToExcel() {
        if (!window.currentViewedProtocolId) return;

        const prot = (window.state.protocols || []).find(function (p) { return p.id === window.currentViewedProtocolId; });
        if (!prot || !prot.apps || prot.apps.length === 0) {
            notifyMessage('warning', 'Рӯйхат холӣ аст / Список пуст');
            return;
        }

        const toCsv = window.sanitizeCsvField || function (v) { return String(v == null ? '' : v).replace(/"/g, '""'); };
        const cleanText = function (v) { return String(v == null ? '' : v).replace(/<[^>]*>?/gm, '').trim(); };

        const splitFullName = function (fullName) {
            const parts = cleanText(fullName).split(/\s+/).filter(Boolean);
            return {
                firstName: parts[1] || parts[0] || '',
                lastName: parts[0] || ''
            };
        };

        const parseAddress = function (address) {
            const addr = cleanText(address);
            if (!addr) return { city: '', district: '' };

            const items = addr
                .split(/[,;]+/)
                .map(function (x) { return x.trim(); })
                .filter(Boolean);

            const cityMarkers = [/^ш\.?\s*/i, /^г\.?\s*/i, /^шаҳр\s*/i, /^город\s*/i];
            const districtMarkers = [/^н\.?\s*/i, /^ноҳия\s*/i, /^район\s*/i, /^р-?н\.?\s*/i];

            let city = '';
            let district = '';

            const normalizeLocationPart = function (value, kind) {
                let v = cleanText(value)
                    .replace(/^[-,;:\s]+/, '')
                    .replace(/[-,;:\s]+$/, '');

                if (kind === 'city') {
                    v = v
                        .replace(/^ш\.?\s*/i, '')
                        .replace(/^г\.?\s*/i, '')
                        .replace(/^шаҳр\s*/i, '')
                        .replace(/^город\s*/i, '');
                }

                if (kind === 'district') {
                    v = v
                        .replace(/^н\.?\s*/i, '')
                        .replace(/^р-?н\.?\s*/i, '')
                        .replace(/^ноҳия\s*/i, '')
                        .replace(/^район\s*/i, '');
                }

                return v.replace(/\s{2,}/g, ' ').trim();
            };

            items.forEach(function (part) {
                if (!city && cityMarkers.some(function (rx) { return rx.test(part); })) {
                    city = part;
                    return;
                }
                if (!district && districtMarkers.some(function (rx) { return rx.test(part); })) {
                    district = part;
                    return;
                }
            });

            if (!city && items.length > 0) city = items[0];
            if (!district && items.length > 1) district = items[1];

            city = normalizeLocationPart(city, 'city');
            district = normalizeLocationPart(district, 'district');

            return { city: city, district: district };
        };

        const getEvaluatorName = function (app) {
            const logs = Array.isArray(app.auditLog) ? app.auditLog : [];
            for (let i = logs.length - 1; i >= 0; i--) {
                const actor = String((logs[i] && logs[i].actor) || '');
                if (actor.indexOf('ШИГ') !== -1 || actor.indexOf('КУГ') !== -1) {
                    return actor;
                }
            }
            return 'ШИГ / КУГ';
        };

        let csvContent = '\uFEFF';
        csvContent += 'Давр;Ном;Насаб;Рақами инфиродӣ;Шаҳр;Ноҳия;Номгӯйи тиҷорат;Санаи пешниҳоди НС;Маблағи грант (сомонӣ);Номи нархгузор;Тасдиқ гардида\n';

        prot.apps.forEach(function (a) {
            const app = window.getApp(a.id);
            if (!app) return;

            const beneficiaryId = app.beneficiaryId || app.id;
            const db = (window.beneficiarySearchDatabase || {})[beneficiaryId]
                || (window.mockDatabase || {})[beneficiaryId]
                || app.beneficiarySnapshot
                || {};

            const fullName = db['full-name'] || app.name || '';
            const names = splitFullName(fullName);
            const personalId = db.inn || app.inn || app.id || '';
            const addressParts = parseAddress(db.address || app.address || '');
            const businessName = cleanText(app.sector);
            const submittedDate = String((app.date || '').split(',')[0] || prot.date || '');
            const grantAmount = String(app.amount || '').replace(/\s+/g, '');
            const evaluatorName = getEvaluatorName(app);
            const approvedFlag = a.decision === 'ok' ? 'Ҳа' : 'Не';

            const row = [
                prot.id,
                names.firstName,
                names.lastName,
                personalId,
                addressParts.city,
                addressParts.district,
                businessName,
                submittedDate,
                grantAmount,
                evaluatorName,
                approvedFlag
            ];

            csvContent += row.map(function (v) { return '"' + toCsv(v) + '"'; }).join(';') + '\n';
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
        if (typeof window.canOpenInCurrentContext === 'function' && !window.canOpenInCurrentContext(id)) return;
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
            if (window.AppNotify && typeof window.AppNotify.errorByKey === 'function') {
                window.AppNotify.errorByKey('validation.error');
            } else {
                notifyMessage('error', 'Лутфан қарорро интихоб кунед / Пожалуйста, выберите решение');
            }
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
            notifyMessage('success', 'Что произошло: грант утвержден. Маршрут: Комитет -> Одобрена. Следующий статус: Одобрена (мониторинг активирован).');
        } else {
            if (!normalizeDecisionComment(comment)) {
                if (window.AppNotify && typeof window.AppNotify.warningByKey === 'function') {
                    window.AppNotify.warningByKey('returnForRevision.warningCommentRequired');
                } else {
                    notifyMessage('warning', 'Сабаби рад карданро нишон диҳед / Укажите причину отклонения');
                }
                return;
            }
            applyCommitteeRejection(app, app.protocolId || 'IND-' + app.id, app.date.split(',')[0], app.date.split(',')[1] || '', normalizeDecisionComment(comment));
            notifyMessage('warning', 'Что произошло: заявка отклонена решением Комитета и отложена на 3 месяца. Маршрут: Комитет -> Фасилитатор (отложенные). Следующий статус: Отложена.');
        }
        document.getElementById('committee-evaluation-content').classList.add('hidden');
        window.renderAllCards();
        document.getElementById('applicationModal').classList.add('hidden');
    }

    document.addEventListener('change', function (e) {
        if (e.target && e.target.classList && e.target.classList.contains('batch-decision')) {
            toggleBatchCommentVisibility(e.target);
        }
    });

    window.AppFeatures.committee = {
        ready: true,
        openCommitteeBatch,
        openApprovedFromCommitteeBatch,
        returnToCommitteeBatchFromHistory,
        toggleBatchComment,
        downloadCommitteeBusinessPlan,
        downloadCommitteePdf,
        downloadCommitteePhotos,
        submitCommitteeBatch,
        exportProtocolToExcel,
        loadComForm,
        openComFor,
        setComDecision,
        saveComDecision
    };

    // Legacy compatibility while migrating code out of grant.html
    window.openCommitteeBatch = openCommitteeBatch;
    window.openApprovedFromCommitteeBatch = openApprovedFromCommitteeBatch;
    window.returnToCommitteeBatchFromHistory = returnToCommitteeBatchFromHistory;
    window.toggleBatchComment = toggleBatchComment;
    window.downloadCommitteeBusinessPlan = downloadCommitteeBusinessPlan;
    window.downloadCommitteePdf = downloadCommitteePdf;
    window.downloadCommitteePhotos = downloadCommitteePhotos;
    window.submitCommitteeBatch = submitCommitteeBatch;
    window.exportProtocolToExcel = exportProtocolToExcel;
    window.loadComForm = loadComForm;
    window.openComFor = openComFor;
    window.setComDecision = setComDecision;
    window.saveComDecision = saveComDecision;
})();
