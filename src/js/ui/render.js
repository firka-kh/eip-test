(function initRenderModule() {
    if (window.AppUI) return;

    function notifyMessage(kind, message, title) {
        if (window.AppNotify && typeof window.AppNotify.toast === 'function') {
            window.AppNotify.toast(kind || 'info', title || '', message || '');
            return;
        }
        alert((title ? (title + '\n') : '') + (message || ''));
    }

    function isFullyCompletedApp(app) {
        if (typeof window.isFullyCompletedApplication === 'function') {
            return window.isFullyCompletedApplication(app);
        }
        if (!app || app.status !== 'approved') return false;
        var agreement = typeof window.ensureGrantAgreement === 'function' ? window.ensureGrantAgreement(app) : null;
        return !!(agreement && agreement.uploaded && agreement.fileName);
    }

    function getFullyCompletedApps() {
        return window.filterApps(['approved']).filter(function (app) { return isFullyCompletedApp(app); });
    }

    function exportFinanceCompletedStatement() {
        var apps = getFullyCompletedApps();
        if (!apps.length) {
            notifyMessage('warning', 'Нет полностью завершенных заявок для выгрузки.');
            return;
        }

        var esc = typeof window.sanitizeCsvField === 'function'
            ? window.sanitizeCsvField
            : function (v) {
                var raw = String(v == null ? '' : v);
                if (/[";,\n]/.test(raw)) return '"' + raw.replace(/"/g, '""') + '"';
                return raw;
            };

        var rows = [
            [
                'ID заявки',
                'ФИО заявителя',
                'Сектор',
                'Сумма (текст)',
                'Сумма (число)',
                'Протокол Комитета',
                'Дата загрузки договора',
                'Файл договора',
                'Кто загрузил договор'
            ]
        ];

        apps.forEach(function (app) {
            var agreement = typeof window.ensureGrantAgreement === 'function' ? window.ensureGrantAgreement(app) : null;
            var amountNumber = parseInt(String(app.amount || '').replace(/\D/g, ''), 10) || 0;
            rows.push([
                String(app.id || ''),
                String(app.name || ''),
                String(app.sector || ''),
                String(app.amount || ''),
                String(amountNumber),
                String(app.protocolId || ''),
                String((agreement && agreement.uploadedAt) || ''),
                String((agreement && agreement.fileName) || ''),
                String((agreement && (agreement.uploadedByName || agreement.uploadedByRole)) || '')
            ]);
        });

        var csv = rows.map(function (line) {
            return line.map(esc).join(';');
        }).join('\n');

        var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'finance_completed_apps_' + (new Date().toISOString().slice(0, 10)) + '.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        notifyMessage('success', 'Выписка для финансового отдела сформирована и скачана.');
    }

    function loadHistoryForm(id) {
        const app = window.getApp(id) || { auditLog: [] };
        const backWrap = document.getElementById('committee-history-back-wrap');
        if (backWrap) {
            backWrap.classList.toggle('hidden', window.currentApprovedOpenSource !== 'committee-batch');
        }
        const revisionsCount = app.revisionCount || 0;
        const committeeReturnsCount = app.committeeReturnsCount || 0;
        const resubmitsToPiuCount = app.resubmitsToPiuCount || 0;
        const createDate = app.auditLog && app.auditLog.length > 0 ? app.auditLog[0].date.split(',')[0] : '—';
        let currentStatusName = 'Дар баррасӣ / В процессе';
        if (['approved', 'issued'].includes(app.status)) currentStatusName = 'Тасдиқшуда / Одобрена';
        if (isFullyCompletedApp(app)) currentStatusName = 'Пурра анҷом ёфт / Полностью завершена';
        if (app.status === 'rejected') currentStatusName = 'Радшуда / Отклонена';
        if (app.status === 'draft') currentStatusName = 'Сиёҳнавис / Черновик';
        if (app.status === 'incomplete_data') currentStatusName = 'Нопурра / Неполные данные';
        if (app.status === 'postponed') currentStatusName = 'Мавқуф / Отложена';

        document.getElementById('summ-created').textContent = createDate;
        document.getElementById('summ-revs').textContent = revisionsCount + ' / 3';
        document.getElementById('summ-status').textContent = currentStatusName;

        const versionsEl = document.getElementById('history-word-versions-list');
        if (versionsEl) {
            var docs = (typeof window.ensureDocumentBundle === 'function') ? window.ensureDocumentBundle(app) : null;
            var versions = docs && docs.wordVersions ? docs.wordVersions.slice() : [];
            if (!versions.length) {
                versionsEl.innerHTML = '<div class="text-[11px] text-slate-500">Версий Word пока нет.</div>';
            } else {
                versionsEl.innerHTML = versions.map(function (v) {
                    return '<div class="text-[11px] text-slate-700 py-1 border-b border-slate-100 last:border-b-0">V' + v.version + ': ' + v.name + ' <span class="text-slate-400">(' + v.uploadedAt + ', ' + v.uploadedByRole + ')</span></div>';
                }).join('');
            }
        }

        renderGrantAgreementPanel(app);
        renderGrantContractDraftPanel(app);
        collapseGrantContractDraftPanel();
        syncGrantContractPanelUi(app);

        const timelineContainer = document.getElementById('dynamic-timeline');
        if (timelineContainer) {
            timelineContainer.innerHTML = '';
            if (!app.auditLog || app.auditLog.length === 0) {
                timelineContainer.innerHTML = '<p class="text-[13px] text-gray-400 py-4 font-medium">Таърих холӣ аст / История пуста</p>';
                return;
            }
            let html = '<div class="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl"><div class="text-[11px] text-slate-700 font-medium">Доработки Фасилитатора: <b>' + revisionsCount + '/3</b> • Возвраты Комитета: <b>' + committeeReturnsCount + '</b> • Повторные циклы доработки: <b>' + resubmitsToPiuCount + '</b></div></div>';
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

    function downloadCurrentBusinessPlanFromModal() {
        const id = window.currentOpenedAppId || window.currentApprovedAppId;
        if (!id) {
            notifyMessage('warning', 'Сначала откройте заявку / Аввал дархостро кушоед');
            return;
        }
        if (typeof window.downloadBusinessPlanFile === 'function') {
            window.downloadBusinessPlanFile(id);
            return;
        }
        notifyMessage('error', 'Функсияи боргирӣ дастрас нест. / Функция скачивания недоступна.');
    }

    function downloadCurrentPdfFromModal() {
        const id = window.currentOpenedAppId || window.currentApprovedAppId;
        if (!id) {
            notifyMessage('warning', 'Сначала откройте заявку / Аввал дархостро кушоед');
            return;
        }
        if (typeof window.downloadBusinessPlanPdfFile === 'function') {
            window.downloadBusinessPlanPdfFile(id);
            return;
        }
        notifyMessage('error', 'Функсияи боргирии PDF дастрас нест. / Функция скачивания PDF недоступна.');
    }

    function downloadCurrentPhotoPackFromModal() {
        const id = window.currentOpenedAppId || window.currentApprovedAppId;
        if (!id) {
            notifyMessage('warning', 'Сначала откройте заявку / Аввал дархостро кушоед');
            return;
        }
        if (typeof window.downloadBusinessPlanPhotoPack === 'function') {
            window.downloadBusinessPlanPhotoPack(id);
            return;
        }
        notifyMessage('error', 'Функсияи боргирии аксҳо дастрас нест. / Функция скачивания фото недоступна.');
    }

    function isValidAgreementFile(file) {
        if (!file) return false;
        var allowed = ['pdf', 'jpg', 'jpeg', 'png'];
        var ext = String(file.name || '').split('.').pop().toLowerCase();
        if (!allowed.includes(ext)) return false;
        var maxBytes = 10 * 1024 * 1024;
        if (file.size > maxBytes) return false;
        return true;
    }

    function canUploadAgreementForApp(app) {
        if (!app || app.status !== 'approved') return false;
        return getActiveRoleContext() === 'facilitator';
    }

    function renderGrantAgreementPanel(app) {
        var inputEl = document.getElementById('grant-agreement-upload');
        var uploadBtn = document.getElementById('btn-upload-grant-agreement');
        var downloadBtn = document.getElementById('btn-download-grant-agreement');
        var metaEl = document.getElementById('grant-agreement-meta');
        var noteEl = document.getElementById('grant-agreement-note');
        var hintEl = document.getElementById('grant-agreement-hint');
        if (!inputEl || !uploadBtn || !downloadBtn || !metaEl || !noteEl || !hintEl) return;

        var agreement = typeof window.ensureGrantAgreement === 'function' ? window.ensureGrantAgreement(app) : null;
        var canUpload = canUploadAgreementForApp(app);
        var hasAgreement = !!(agreement && agreement.uploaded && agreement.fileName);

        inputEl.value = '';
        inputEl.disabled = !canUpload;
        noteEl.disabled = !canUpload;
        uploadBtn.disabled = !canUpload;
        uploadBtn.classList.toggle('opacity-50', !canUpload);
        uploadBtn.classList.toggle('pointer-events-none', !canUpload);

        downloadBtn.disabled = !hasAgreement;
        downloadBtn.classList.toggle('opacity-50', !hasAgreement);
        downloadBtn.classList.toggle('pointer-events-none', !hasAgreement);

        if (hasAgreement) {
            metaEl.innerHTML = '<div class="text-[12px] text-emerald-700 font-bold">' + agreement.fileName + '</div><div class="text-[11px] text-slate-500 mt-1">' + agreement.uploadedAt + ' • ' + agreement.uploadedByRole + '</div>';
        } else {
            metaEl.innerHTML = '<div class="text-[12px] text-slate-500">Файл не загружен / Файл бор нашудааст</div>';
        }

        if (canUpload) {
            hintEl.textContent = 'Фасилитатор метавонад скани шартномаи имзошударо бор кунад. / Фасилитатор может загрузить скан подписанного договора.';
        } else {
            hintEl.textContent = 'Боркунӣ танҳо барои Фасилитатор ва танҳо барои дархости тасдиқшуда дастрас аст. / Загрузка доступна только Фасилитатору и только для одобренной заявки.';
        }

        renderDocumentPackageSummary(app);
    }

    function renderDocumentPackageSummary(app) {
        var summaryEl = document.getElementById('grant-doc-pack-status');
        if (!summaryEl) return;

        var details = typeof window.getApplicationDocumentCompleteness === 'function'
            ? window.getApplicationDocumentCompleteness(app)
            : null;
        if (!details) {
            summaryEl.innerHTML = '';
            return;
        }

        var statusClass = details.isFullPackageComplete
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-amber-50 border-amber-200 text-amber-800';
        var title = details.isFullPackageComplete
            ? 'Пакети ҳуҷҷатҳо пурра аст / Пакет документов полный'
            : 'Пакети ҳуҷҷатҳо нопурра аст / Пакет документов неполный';

        var checks = [
            { label: 'Word', ok: details.hasWord },
            { label: 'PDF', ok: details.hasPdf },
            { label: 'Фото (4)', ok: details.hasPhotos4 },
            { label: 'Подписанный договор', ok: details.hasAgreement }
        ];

        summaryEl.innerHTML = '<div class="mt-3 border rounded-lg p-2.5 ' + statusClass + '"><div class="text-[11px] font-bold mb-1">' + title + '</div><div class="flex flex-wrap gap-1.5">' + checks.map(function (c) {
            var chipClass = c.ok ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200';
            var icon = c.ok ? '✔' : '✖';
            return '<span class="text-[10px] px-1.5 py-0.5 rounded border font-medium ' + chipClass + '">' + icon + ' ' + c.label + '</span>';
        }).join('') + '</div></div>';
    }

    function getContractAppContext(app) {
        var beneficiaryId = (app && (app.beneficiaryId || app.id)) || '';
        var db = (window.beneficiarySearchDatabase || {})[beneficiaryId]
            || (window.mockDatabase || {})[beneficiaryId]
            || (app && app.beneficiarySnapshot)
            || {};
        return { beneficiaryId: beneficiaryId, db: db };
    }

    function parseContractNumber(value) {
        var m = String(value || '').trim().toUpperCase().match(/^Ш-(\d{6})-(\d{6})$/);
        if (!m) return null;
        return { serial: m[1], datePart: m[2] };
    }

    function getMaxExistingContractSerial() {
        var apps = (window.state && Array.isArray(window.state.applications)) ? window.state.applications : [];
        var maxSerial = 0;
        apps.forEach(function (item) {
            var value = item
                && item.grantContractDraft
                && item.grantContractDraft.fields
                ? item.grantContractDraft.fields.contractNumber
                : '';
            var parsed = parseContractNumber(value);
            if (!parsed) return;
            var serialNum = parseInt(parsed.serial, 10);
            if (!isNaN(serialNum) && serialNum > maxSerial) maxSerial = serialNum;
        });
        return maxSerial;
    }

    function buildSystemContractNumber(serialNumber, approvalDate) {
        var serial = String(Math.max(1, parseInt(serialNumber, 10) || 1)).padStart(6, '0').slice(0, 6);
        return 'Ш-' + serial + '-' + getContractShortDateDigits(approvalDate);
    }

    function getSystemGeneratedContractNumber(app, approvalDate, candidateValue) {
        var candidateParsed = parseContractNumber(candidateValue);
        if (candidateParsed) return 'Ш-' + candidateParsed.serial + '-' + candidateParsed.datePart;

        var appDraftValue = app && app.grantContractDraft && app.grantContractDraft.fields
            ? app.grantContractDraft.fields.contractNumber
            : '';
        var appDraftParsed = parseContractNumber(appDraftValue);
        if (appDraftParsed) return 'Ш-' + appDraftParsed.serial + '-' + appDraftParsed.datePart;

        var nextSerial = getMaxExistingContractSerial() + 1;
        return buildSystemContractNumber(nextSerial, approvalDate);
    }

    function getDefaultGrantContractFields(app) {
        var ctx = getContractAppContext(app);
        var db = ctx.db;
        var appDate = String((app && app.date) || '').split(',')[0] || '';
        var grantAmount = String((app && app.amount) || '').trim();
        var grantAmountWords = numberToTajikWords(grantAmount);
        var contractNoDefault = getSystemGeneratedContractNumber(app, appDate, '');
        var headerDate = getContractHeaderDateParts(appDate);

        return {
            contractNumber: contractNoDefault,
            approvalDate: appDate,
            contractDateDay: headerDate.day,
            contractDateMonth: headerDate.month,
            contractDateYear: headerDate.year,
            contractCity: 'Душанбе',
            grantAmount: grantAmount,
            grantAmountWords: grantAmountWords,
            donorEntityForText: '',
            beneficiaryPassportNo: String(db.passport || db['passport-number'] || db.passportNumber || db.passportNo || ''),
            beneficiaryFullName: String((app && app.name) || db['full-name'] || ''),
            granteeEntityForText: String((app && app.name) || db['full-name'] || ''),
            beneficiaryRegAddress: '',
            beneficiaryProjectAddress: '',
            beneficiaryPhone: String((app && app.contacts) || db.contacts || ''),
            beneficiaryEmail: String(db.email || db['e-mail'] || db.mail || '—'),
            donorRepName: '',
            donorRepPosition: '',
            donorAddress: '',
            donorPhone: '',
            donorEmail: '',
            bankName: '',
            currentAccount: '',
            correspondentAccount: '',
            bik: ''
        };
    }

    function ensureMergedContractFields(app) {
        var defaults = getDefaultGrantContractFields(app);
        var draft = typeof window.ensureGrantContractDraft === 'function' ? window.ensureGrantContractDraft(app) : null;
        var existing = draft && draft.fields ? draft.fields : {};
        var merged = {};
        Object.keys(defaults).forEach(function (key) {
            merged[key] = (existing[key] == null || existing[key] === '') ? defaults[key] : String(existing[key]);
        });

        // Backward compatibility for previously saved drafts.
        if (!String(merged.beneficiaryFullName || '').trim() && String(existing.beneficiaryStatusOrName || '').trim()) {
            merged.beneficiaryFullName = String(existing.beneficiaryStatusOrName || '');
        }
        return merged;
    }

    function renderGrantContractDraftPanel(app) {
        var panel = document.getElementById('grant-contract-draft-panel');
        var summary = document.getElementById('grant-contract-draft-summary');
        var noData = document.getElementById('grant-contract-draft-empty');
        if (!panel || !summary || !noData) return;

        var canEdit = !!(app && app.status === 'approved' && getActiveRoleContext() === 'facilitator');
        var fields = ensureMergedContractFields(app || {});
        fields.contractNumber = getSystemGeneratedContractNumber(app, fields.approvalDate, fields.contractNumber);

        Object.keys(fields).forEach(function (key) {
            var el = document.getElementById('contract-' + key);
            if (!el) return;
            el.value = fields[key];
            el.disabled = !canEdit;
            el.classList.toggle('bg-slate-100', !canEdit);
            el.classList.toggle('cursor-not-allowed', !canEdit);

            // Amount is always sourced from approved application and cannot be edited manually.
            if (key === 'grantAmount') {
                el.readOnly = true;
                el.classList.add('bg-emerald-50');
            }

            // Contract number is generated by system only.
            if (key === 'contractNumber') {
                el.readOnly = true;
                el.classList.add('bg-emerald-50');
            }

            // Section VII beneficiary identity/contact block is sourced from DB.
            if (['beneficiaryPassportNo', 'beneficiaryFullName', 'beneficiaryPhone', 'beneficiaryEmail'].includes(key)) {
                el.readOnly = true;
                el.classList.add('bg-emerald-50');
            }
        });

        var wordsInput = document.getElementById('contract-grantAmountWords');
        var amountInput = document.getElementById('contract-grantAmount');
        if (wordsInput && amountInput) {
            var sourceAmount = String(amountInput.value || '').trim();
            var currentWords = String(wordsInput.value || '').trim();
            var autoWords = numberToTajikWords(sourceAmount);
            if (!currentWords || currentWords === wordsInput.getAttribute('data-auto-generated')) {
                wordsInput.value = autoWords;
            }
            wordsInput.setAttribute('data-auto-generated', autoWords);
        }

        var draft = typeof window.ensureGrantContractDraft === 'function' ? window.ensureGrantContractDraft(app) : null;
        if (draft && draft.updatedAt) {
            summary.textContent = 'Черновик обновлен: ' + draft.updatedAt + ' • ' + (draft.updatedByRole || 'Фасилитатор');
            noData.classList.add('hidden');
        } else {
            summary.textContent = 'Черновик еще не сохранен. Автополя подтянуты из заявки и базы.';
            noData.classList.remove('hidden');
        }

        var saveBtn = document.getElementById('btn-save-grant-contract-draft');
        if (saveBtn) {
            saveBtn.disabled = !canEdit;
            saveBtn.classList.toggle('opacity-50', !canEdit);
            saveBtn.classList.toggle('pointer-events-none', !canEdit);
        }

    }

    function canEditGrantContract(app) {
        return !!(app && app.status === 'approved' && getActiveRoleContext() === 'facilitator');
    }

    function collapseGrantContractDraftPanel() {
        var shell = document.getElementById('grant-contract-form-shell');
        if (!shell) return;
        shell.classList.add('hidden');
    }

    function syncGrantContractPanelUi(app) {
        var shell = document.getElementById('grant-contract-form-shell');
        var btn = document.getElementById('btn-toggle-grant-contract-panel');
        var hint = document.getElementById('grant-contract-collapsed-hint');
        if (!shell || !btn || !hint) return;

        var canEdit = canEditGrantContract(app);
        var expanded = !shell.classList.contains('hidden');
        var draft = typeof window.ensureGrantContractDraft === 'function' ? window.ensureGrantContractDraft(app) : null;
        var hasDraft = !!(draft && draft.updatedAt);

        btn.disabled = !canEdit;
        btn.classList.toggle('opacity-50', !canEdit);
        btn.classList.toggle('pointer-events-none', !canEdit);

        if (!canEdit) {
            btn.textContent = 'Создание договора недоступно';
            hint.textContent = 'Форма договора доступна только Фасилитатору для одобренной заявки.';
            hint.classList.remove('hidden');
            shell.classList.add('hidden');
            return;
        }

        if (expanded) {
            btn.textContent = 'Свернуть форму договора';
            hint.classList.add('hidden');
        } else {
            btn.textContent = hasDraft ? 'Редактировать договор' : 'Создать договор';
            hint.textContent = 'Нажмите "Создать договор", чтобы раскрыть форму заполнения.';
            hint.classList.remove('hidden');
        }
    }

    function toggleGrantContractDraftPanelFromModal() {
        var id = window.currentOpenedAppId || window.currentApprovedAppId;
        if (!id) return;
        var app = window.getApp(id);
        if (!app) return;

        if (!canEditGrantContract(app)) {
            notifyMessage('warning', 'Форма договора доступна только Фасилитатору для одобренной заявки.');
            return;
        }

        var shell = document.getElementById('grant-contract-form-shell');
        if (!shell) return;
        shell.classList.toggle('hidden');
        syncGrantContractPanelUi(app);
    }

    function collectGrantContractFieldsFromForm() {
        var keys = [
            'contractNumber', 'approvalDate', 'contractDateDay', 'contractDateMonth', 'contractDateYear', 'contractCity',
            'grantAmount', 'grantAmountWords', 'beneficiaryPassportNo', 'beneficiaryFullName', 'beneficiaryRegAddress',
            'donorEntityForText', 'granteeEntityForText',
            'beneficiaryProjectAddress', 'beneficiaryPhone', 'beneficiaryEmail', 'donorRepName', 'donorRepPosition',
            'donorAddress', 'donorPhone', 'donorEmail', 'bankName', 'currentAccount', 'correspondentAccount', 'bik'
        ];
        var out = {};
        keys.forEach(function (key) {
            var el = document.getElementById('contract-' + key);
            out[key] = el ? String(el.value || '').trim() : '';
        });

        // Force amount from approved application source, not manual input.
        var id = window.currentOpenedAppId || window.currentApprovedAppId;
        var app = id ? window.getApp(id) : null;
        out.contractNumber = getSystemGeneratedContractNumber(app, out.approvalDate, out.contractNumber);
        if (app) {
            out.grantAmount = String(app.amount || '').trim();
            if (!String(out.grantAmountWords || '').trim()) {
                out.grantAmountWords = numberToTajikWords(out.grantAmount);
            }
        }
        return out;
    }

    function getGrantContractAutoFieldKeys() {
        return [
            'approvalDate',
            'contractDateDay',
            'contractDateMonth',
            'contractDateYear',
            'contractCity',
            'grantAmount',
            'grantAmountWords',
            'beneficiaryPassportNo',
            'beneficiaryFullName',
            'beneficiaryPhone',
            'beneficiaryEmail'
        ];
    }

    function numberToTajikWords(rawAmount) {
        var digits = String(rawAmount || '').replace(/\s+/g, '').replace(/[^\d]/g, '');
        if (!digits) return '';
        var n = parseInt(digits, 10);
        if (!isFinite(n)) return '';
        if (n === 0) return 'сифр';

        var ones = ['', 'як', 'ду', 'се', 'чор', 'панҷ', 'шаш', 'ҳафт', 'ҳашт', 'нӯҳ'];
        var teens = ['даҳ', 'ёздаҳ', 'дувоздаҳ', 'сездаҳ', 'чордаҳ', 'понздаҳ', 'шонздаҳ', 'ҳабдаҳ', 'ҳаждаҳ', 'нуздаҳ'];
        var tens = ['', '', 'бист', 'сӣ', 'чил', 'панҷоҳ', 'шаст', 'ҳафтод', 'ҳаштод', 'навад'];
        var hundreds = ['', 'яксад', 'дусад', 'сесад', 'чорсад', 'панҷсад', 'шашсад', 'ҳафтсад', 'ҳаштсад', 'нӯҳсад'];
        var scales = [
            { value: 1000000000, label: 'миллиард' },
            { value: 1000000, label: 'миллион' },
            { value: 1000, label: 'ҳазор' }
        ];

        function triadToWords(num) {
            var out = [];
            var h = Math.floor(num / 100);
            var rest = num % 100;
            if (h) out.push(hundreds[h]);
            if (rest >= 10 && rest <= 19) {
                out.push(teens[rest - 10]);
            } else {
                var t = Math.floor(rest / 10);
                var o = rest % 10;
                if (t) out.push(tens[t]);
                if (o) out.push(ones[o]);
            }
            return out.filter(Boolean).join(' ');
        }

        var words = [];
        var value = n;
        scales.forEach(function (s) {
            if (value >= s.value) {
                var chunk = Math.floor(value / s.value);
                value = value % s.value;
                var chunkWords = triadToWords(chunk);
                if (chunkWords) words.push(chunkWords + ' ' + s.label);
            }
        });

        if (value > 0) words.push(triadToWords(value));
        return words.join(' ').replace(/\s+/g, ' ').trim();
    }

    function getContractHeaderDateParts(rawDate) {
        var value = String(rawDate || '').trim();
        var m = value.match(/^(\d{2})\.(\d{2})\.(\d{2,4})$/);
        var now = new Date();
        var day = String(now.getDate()).padStart(2, '0');
        var monthNum = String(now.getMonth() + 1).padStart(2, '0');
        var yyyy = String(now.getFullYear());
        if (m) {
            day = m[1];
            monthNum = m[2];
            var yRaw = String(m[3]);
            yyyy = yRaw.length === 2 ? ('20' + yRaw) : yRaw;
        }
        var monthNamesTj = {
            '01': 'январ',
            '02': 'феврал',
            '03': 'март',
            '04': 'апрел',
            '05': 'май',
            '06': 'июн',
            '07': 'июл',
            '08': 'август',
            '09': 'сентябр',
            '10': 'октябр',
            '11': 'ноябр',
            '12': 'декабр'
        };
        return {
            day: day,
            month: monthNamesTj[monthNum] || monthNum,
            year: yyyy
        };
    }

    function getContractShortDateDigits(rawDate) {
        var value = String(rawDate || '').trim();
        var m = value.match(/^(\d{2})\.(\d{2})\.(\d{2,4})$/);
        if (m) {
            var yy = String(m[3]).slice(-2);
            return m[1] + m[2] + yy;
        }

        var now = new Date();
        var dd = String(now.getDate()).padStart(2, '0');
        var mm = String(now.getMonth() + 1).padStart(2, '0');
        var yyNow = String(now.getFullYear()).slice(-2);
        return dd + mm + yyNow;
    }

    function formatContractNumberValue(raw, approvalDate) {
        var value = String(raw || '').trim().toUpperCase().replace(/[\u2012\u2013\u2014\u2015]/g, '-');
        if (!value) return '';

        var strict = value.match(/^Ш-(\d{6})-(\d{6})$/);
        if (strict) return 'Ш-' + strict[1] + '-' + strict[2];

        var digits = value.replace(/\D/g, '');
        if (!digits) return '';

        var serial = digits.slice(0, 6).padStart(6, '0');
        var datePart = digits.length >= 12 ? digits.slice(6, 12) : getContractShortDateDigits(approvalDate);
        return 'Ш-' + serial + '-' + datePart;
    }

    function clearGrantContractValidationUi() {
        var box = document.getElementById('grant-contract-validation-errors');
        if (box) {
            box.classList.add('hidden');
            box.innerHTML = '';
        }

        var keys = [
            'contractNumber', 'contractDateDay', 'contractDateMonth', 'contractDateYear', 'contractCity', 'grantAmount', 'grantAmountWords',
            'beneficiaryPassportNo', 'beneficiaryFullName', 'beneficiaryRegAddress', 'beneficiaryPhone', 'beneficiaryEmail',
            'donorRepName', 'donorRepPosition', 'donorEntityForText', 'granteeEntityForText'
        ];
        keys.forEach(function (k) {
            var el = document.getElementById('contract-' + k);
            if (!el) return;
            el.classList.remove('border-red-400', 'bg-red-50');
            if (k === 'grantAmount' || k === 'beneficiaryPassportNo' || k === 'beneficiaryFullName' || k === 'beneficiaryPhone' || k === 'beneficiaryEmail') {
                el.classList.add('border-emerald-300', 'bg-emerald-50');
            }
        });
    }

    function validateGrantContractFields(fields, strictMode) {
        clearGrantContractValidationUi();

        var checks = [
            { key: 'contractNumber', label: 'Номер договора' },
            { key: 'contractDateDay', label: 'День договора' },
            { key: 'contractDateMonth', label: 'Месяц договора' },
            { key: 'contractDateYear', label: 'Год договора' },
            { key: 'contractCity', label: 'Город договора' },
            { key: 'donorEntityForText', label: 'Грантдиҳанда (в тексте)' },
            { key: 'granteeEntityForText', label: 'Грантгир (в тексте)' },
            { key: 'grantAmount', label: 'Сумма гранта' },
            { key: 'grantAmountWords', label: 'Сумма прописью (тадж.)' },
            { key: 'beneficiaryPassportNo', label: 'Рақами паспорт' },
            { key: 'beneficiaryFullName', label: 'Ному насаби баҳрагир' },
            { key: 'beneficiaryRegAddress', label: 'Адрес регистрации' },
            { key: 'beneficiaryPhone', label: 'Телефон грантополучателя' },
            { key: 'beneficiaryEmail', label: 'E-mail грантополучателя' },
            { key: 'donorRepName', label: 'Представитель грантодателя' },
            { key: 'donorRepPosition', label: 'Должность представителя' }
        ];

        var errors = [];
        checks.forEach(function (c) {
            if (!String(fields[c.key] || '').trim()) {
                errors.push('Заполните поле: ' + c.label);
                var el = document.getElementById('contract-' + c.key);
                if (el) {
                    el.classList.remove('border-emerald-300', 'bg-emerald-50');
                    el.classList.add('border-red-400', 'bg-red-50');
                }
            }
        });

        var contractNumber = String(fields.contractNumber || '');
        if (contractNumber && !/^Ш-\d{6}-\d{6}$/.test(contractNumber)) {
            errors.push('Номер договора должен быть в формате Ш-******-ДДММГГ');
            var noEl = document.getElementById('contract-contractNumber');
            if (noEl) {
                noEl.classList.remove('border-emerald-300', 'bg-emerald-50');
                noEl.classList.add('border-red-400', 'bg-red-50');
            }
        }

        if (strictMode && errors.length) {
            var box = document.getElementById('grant-contract-validation-errors');
            if (box) {
                box.classList.remove('hidden');
                box.innerHTML = errors.map(function (e) {
                    return '<div>• ' + e + '</div>';
                }).join('');
            }
        }

        return { ok: errors.length === 0, errors: errors };
    }

    function getGrantContractBodyHtml(fields) {
        var esc = window.sanitizeText || function (v) { return String(v == null ? '' : v); };
        var get = function (k) { return esc(fields[k] || ''); };
        var val = function (k, fallback) {
            var x = get(k);
            return x || (fallback || '____________________________');
        };
        var lineValue = function (k, fallback, extraClass) {
            var x = get(k);
            var hasValue = !!String(x || '').trim();
            var cls = 'line-fill' + (hasValue ? '' : ' line-empty') + (extraClass ? (' ' + extraClass) : '');
            return '<span class="' + cls + '">' + (x || (fallback || '')) + '</span>';
        };
        var lineLabel = function (label, key) {
            return '<li><b>' + label + ':</b> ' + lineValue(key, ' ') + '</li>';
        };

        return '' +
            '<div class="contract-doc">' +
            '<section class="paper-page page-1">' +
            '<h1 class="contract-head-title">ШАРТНОМА ДАР БОРАИ ГРАНТ № ' + lineValue('contractNumber', ' ', 'lf-contract-no') + '</h1>' +
            '<p class="contract-place-date"><span class="meta-left"><b>Аз «' + val('contractDateDay', '__') + '» ' + val('contractDateMonth', '____') + ' соли ' + val('contractDateYear', '____') + '</b></span><span class="meta-right"><b>ш. ' + val('contractCity', 'Душанбе') + '</b></span></p>' +
            '<h3 class="contract-first-section-title">I. МАВЗӮИ ШАРТНОМА</h3>' +
            '<p>Шартномаи мазкур байни Вазорати меҳнат, муҳоҷират ва шуғли аҳолии Ҷумҳурии Тоҷикистон / Лоиҳаи навсозии ҳифзи иҷтимоӣ ва ҳамгироии иқтисодӣ, ки аз ҷониби <b>' + val('donorEntityForText') + '</b>, минбаъд «Грантдиҳанда» номида мешавад ва <b>' + val('granteeEntityForText') + '</b>, минбаъд «Грантгир» номида мешавад, дар алоҳидагӣ «Тараф» ё якҷоя «Тарафҳо» номида мешаванд, дар доираи «Лоиҳаи навсозии ҳифзи иҷтимоӣ ва ҳамгироии иқтисодӣ», ки минбаъд «Лоиҳа» номида мешавад, амал мекунанд, ба мазмуни зерин ба имзо расониданд:</p>' +
            '<h3>II. ӮҲДАДОРИҲОИ ТАРАФҲО</h3>' +
            '<p><b>2.1. Грантгиранда ӯҳдадор аст:</b></p>' +
            '<p class="subpoint">а) Лоиҳаро дар мутобиқат бо шартҳои Шартномаи мазкур бомулоҳиза ва самаранок амалӣ намояд.</p>' +
            '<p class="subpoint">б) Танҳо маҳсулот ва хизматрасониҳоеро харидорӣ намояд, ки дар нақшаҳои соҳибкорӣ нишон дода шудаанд. Барои харидҳо ҳисобнома-фактураҳо ва квитансияҳо пешниҳод кунад.</p>' +
            '<p class="subpoint">в) Ягон ашёи бо маблағҳои грант харидашударо нафурӯшад, интиқол надиҳад, ба иҷора надиҳад ва ба шахси сеюм иҷозат надиҳад, ки онҳоро истифода барад.</p>' +
            '<p class="subpoint">г) Ҳама намуди маълумотро дар бораи татбиқ, ки Грантдиҳанда ё шахси ваколатдори он асоснок талаб мекунад, пешниҳод намояд.</p>' +
            '<p class="subpoint">д) Хариди ҳама гуна намуди молҳо/таҷҳизот/хизматрасониҳоро бо иштироки намояндаи Грантдиҳанда анҷом диҳад.</p>' +
            '<p><b>2.2. Грантдиҳанда ӯҳдадор аст:</b></p>' +
            '<p class="subpoint">а) Мувофиқи тартиби пардохт, ки дар дастури Барномаи фарогирии иқтисодӣ (БФИ) муқаррар шудааст, пардохтҳоро сари вақт анҷом диҳад.</p>' +
            '<p class="subpoint">б) Дар доираи салоҳияти худ ба Грантгир барои татбиқи бомуваффақияти лоиҳа кӯмак расонад.</p>' +
            '<div class="page-no">1</div>' +
            '</section>' +

            '<section class="paper-page page-2">' +
            '<h3>III. МАБЛАҒГУЗОРӢ</h3>' +
            '<p>3.1. Грантгир дар доираи Лоиҳа барои гирифтани грант ба маблағи ' + lineValue('grantAmount', ' ') + ' (' + lineValue('grantAmountWords', ' ') + ') сомонӣ (минбаъд – Грант) дархост пешниҳод кардааст.</p>' +
            '<p>3.2. Ӯҳдадориҳо ва масъулияти Грантдиҳанда тибқи Шартномаи мазкур танҳо бо пардохти Грант маҳдуд аст. Грантгир масъулияти пурраи молиявиро барои татбиқи Лоиҳа ба дӯш мегирад.</p>' +
            '<h3>IV. ИСТИФОДАИ МАБЛАҒГУЗОРӢ</h3>' +
            '<p>4.1. Маблағгузорӣ аз ҷониби Грантгир барои харидани молҳо / таҷҳизот / хизматрасонӣ / гардиши пули нақд, ки дар Нақшаи соҳибкорӣ тавсиф шудааст, истифода мешавад. Дигар харидҳо бе розигии пешакии хаттии Грантдиҳанда манъ аст.</p>' +
            '<h3>V. ТАРТИБИ ПАРДОХТИ ГРАНТ</h3>' +
            '<p>5.1. Грантгиранда бояд дар давоми 10 рӯз пас аз имзои Шартномаи грантӣ аз ҷониби ҳарду тараф маблағҳои грантиро гирад.</p>' +
            '<p>5.2. Грант мустақиман ба суратҳисоби бонкии Грантгиранда пардохт карда мешавад:</p>' +
            '<ul class="line-list">' +
            lineLabel('Номи бонк', 'bankName') +
            lineLabel('Суратҳисоби ҷорӣ', 'currentAccount') +
            lineLabel('Суратҳисоби муросилотӣ', 'correspondentAccount') +
            lineLabel('БИК', 'bik') +
            '</ul>' +
            '<p>5.3. Интиқоли маблағҳои грантӣ ба Грантгиранда бо пули миллӣ — сомонӣ сурат мегирад.</p>' +
            '<h3>VI. ТАРТИБИ ВОРИД НАМУДАНИ ТАҒЙИРОТ</h3>' +
            '<p class="subpoint">а) Ҳама гуна дархост оид ба тағйир додани Шартномаи мазкур бояд аз ҷониби Тарафҳо дар шакли хаттӣ пешниҳод карда шавад.</p>' +
            '<p class="subpoint">б) Пас аз гирифтани дархост, тарафи дигар дар давоми 20 рӯзи корӣ ҷавоби худро (тасдиқ ё рад) пешниҳод менамояд.</p>' +
            '<p class="subpoint">в) Ҳангоми тасдиқ, замимаи дахлдори Шартнома бо дарҷи тағйирот тартиб дода шуда, имзо карда мешавад, ки он қисми ҷудонашавандаи ҳамин Шартнома мегардад.</p>' +
            '<div class="page-no">2</div>' +
            '</section>' +

            '<section class="paper-page page-3">' +
            '<h3>VII. ИМЗОҲОИ ТАРАФҲО</h3>' +
            '<p><b>1. ГРАНТГИРАНДА:</b></p>' +
            '<ul class="line-list">' +
            lineLabel('Рақами паспорт', 'beneficiaryPassportNo') +
            lineLabel('Ному насаби баҳрагир', 'beneficiaryFullName') +
            lineLabel('Суроғаи ҷойи бақайдгирӣ', 'beneficiaryRegAddress') +
            lineLabel('Суроғаи ҷойи татбиқи лоиҳа', 'beneficiaryProjectAddress') +
            lineLabel('Телефон', 'beneficiaryPhone') +
            lineLabel('E-mail', 'beneficiaryEmail') +
            '</ul>' +
            '<p>Имзо: ' + lineValue('', ' ') + '</p>' +
            '<p>Сана: ' + lineValue('', ' ') + '</p>' +
            '<p><i>(ҷойи мӯҳр)</i></p>' +
            '<p class="signature-gap"><b>2. ГРАНТДИҲАНДА (намояндаи ваколатдор):</b></p>' +
            '<ul class="line-list">' +
            lineLabel('Ному насаб', 'donorRepName') +
            lineLabel('Вазифа', 'donorRepPosition') +
            lineLabel('Суроға', 'donorAddress') +
            lineLabel('Телефон', 'donorPhone') +
            lineLabel('E-mail', 'donorEmail') +
            '</ul>' +
            '<p>Имзо: ' + lineValue('', ' ') + '</p>' +
            '<p>Сана: ' + lineValue('', ' ') + '</p>' +
            '<p><i>(ҷойи мӯҳр)</i></p>' +
            '<div class="page-no">3</div>' +
            '</section>' +
            '</div>';
    }

    function getGrantContractLegalTextTemplateHtml(val) {
        return '';
    }

    function resetGrantContractAutoFieldsFromModal() {
        var id = window.currentOpenedAppId || window.currentApprovedAppId;
        if (!id) return;
        var app = window.getApp(id);
        if (!app) return;

        if (!(app.status === 'approved' && getActiveRoleContext() === 'facilitator')) {
            notifyMessage('warning', 'Сброс автополей доступен только Фасилитатору для одобренной заявки.');
            return;
        }

        var defaults = getDefaultGrantContractFields(app);
        getGrantContractAutoFieldKeys().forEach(function (k) {
            var el = document.getElementById('contract-' + k);
            if (!el) return;
            el.value = defaults[k] || '';
        });
        clearGrantContractValidationUi();
        window.addLog(app, 'Фасилитатор', 'Автополя договора сброшены', 'Автополя договора сброшены', 'slate', 'rotate-ccw');
    }

    function openGrantContractPreviewWindow(fields, title, autoPrint, showPdfHint) {
        var bodyHtml = getGrantContractBodyHtml(fields);
        var popup = window.open('', '_blank');
        if (!popup) {
            notifyMessage('warning', 'Поп-ап баста аст. / Всплывающее окно заблокировано.');
            return;
        }

        var previewCss = '' +
            '@page{size:A4;margin:15mm 16mm 18mm 20mm}' +
            'html,body{margin:0;padding:0;color:#111}' +
            'body{font-family:"Times New Roman",serif;font-size:12pt;line-height:1.32;background:#e5e7eb}' +
            '.hint{font-size:10pt;color:#555;margin:12px auto 10px;padding:7px 10px;border:1px dashed #cbd5e1;border-radius:8px;background:#f8fafc;max-width:210mm}' +
            '.contract-doc{max-width:220mm;margin:0 auto;padding:10mm 0 14mm}' +
            '.paper-page{position:relative;box-sizing:border-box;width:210mm;min-height:297mm;margin:0 auto 10mm;padding:15mm 16mm 18mm 20mm;background:#fff;border:1px solid #d1d5db;box-shadow:0 10px 30px rgba(15,23,42,.16);page-break-inside:avoid}' +
            '.paper-page+.paper-page{page-break-before:always}' +
            '.contract-doc .contract-head-title{font-size:15pt;text-align:center;margin:0 0 7.6mm 0;line-height:1.2;font-weight:700}' +
            '.contract-doc .contract-place-date{margin:0 0 7mm 0;display:flex;align-items:flex-end;justify-content:space-between;gap:6mm;font-weight:700}' +
            '.contract-doc .meta-left,.contract-doc .meta-right{display:inline-block;white-space:nowrap}' +
            '.contract-doc h3{font-size:12pt;margin:0 0 4mm 0;line-height:1.2;page-break-after:avoid;text-align:center;font-weight:700}' +
            '.page-1 .contract-first-section-title{margin-top:5mm}' +
            '.contract-doc p{margin:0 0 3.2mm 0;text-align:justify;text-wrap:pretty}' +
            '.contract-doc .subpoint{margin-left:4mm;text-indent:-4mm}' +
            '.contract-doc ul{margin:2mm 0 4mm 7mm;padding:0}' +
            '.contract-doc li{margin:0 0 2.3mm 0}' +
            '.line-list{list-style:disc}' +
            '.line-fill{display:inline-block;line-height:1.05;vertical-align:baseline;word-break:break-word}' +
            '.line-fill.line-empty{border-bottom:0.7pt solid #111}' +
            '.lf-contract-no{min-width:40mm}.lf-day{min-width:11mm;text-align:center}.lf-month{min-width:42mm}.lf-year{min-width:18mm;text-align:center}.lf-city{min-width:38mm}' +
            '.signature-gap{margin-top:10mm}' +
            '.page-no{position:absolute;right:0;bottom:0;font-size:10pt;color:#555}' +
            '@media print{.hint{display:none}body{font-size:12pt;background:#fff}.contract-doc{max-width:none;margin:0;padding:0}.paper-page{width:auto;min-height:261mm;margin:0;padding:0;border:none;box-shadow:none;page-break-after:always}.paper-page:last-child{page-break-after:auto}.contract-doc .contract-head-title,.contract-doc h3,.contract-doc p,.contract-doc li{orphans:3;widows:3}}';

        popup.document.open();
        popup.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + (title || 'Grant Contract Preview') + '</title><style>' + previewCss + '</style></head><body>' + (showPdfHint ? '<div class="hint">Для экспорта в PDF выберите в окне печати: Save as PDF / Сохранить как PDF.</div>' : '') + bodyHtml + '</body></html>');
        popup.document.close();

        if (autoPrint) {
            popup.focus();
            setTimeout(function () { popup.print(); }, 120);
        }
    }

    function saveGrantContractDraftFromModal() {
        var id = window.currentOpenedAppId || window.currentApprovedAppId;
        if (!id) return;
        var app = window.getApp(id);
        if (!app) return;
        if (!(app.status === 'approved' && getActiveRoleContext() === 'facilitator')) {
            notifyMessage('warning', 'Сохранение доступно только Фасилитатору для одобренной заявки.');
            return;
        }

        var fields = collectGrantContractFieldsFromForm();
        var result = validateGrantContractFields(fields, false);
        if (!result.ok) {
            notifyMessage('warning', 'Черновик сохранен, но часть обязательных полей не заполнена. Их можно заполнить позже.');
        }
        if (typeof window.registerGrantContractDraft === 'function') {
            window.registerGrantContractDraft(app, {
                fields: fields,
                updatedByRole: 'Фасилитатор',
                updatedByName: 'Фасилитатор'
            });
        }
        window.addLog(app, 'Фасилитатор', 'Черновик договора сохранен', 'Сохранен черновик договора', 'teal', 'file-edit');
        renderGrantContractDraftPanel(app);
        window.renderAllCards();
    }

    function previewGrantContractDraftFromModal() {
        var id = window.currentOpenedAppId || window.currentApprovedAppId;
        if (!id) return;
        var app = window.getApp(id);
        if (!app) return;
        var fields = collectGrantContractFieldsFromForm();
        var result = validateGrantContractFields(fields, true);
        if (!result.ok) {
            if (window.AppNotify && typeof window.AppNotify.errorByKey === 'function') window.AppNotify.errorByKey('validation.error');
            else notifyMessage('error', 'Заполните обязательные поля договора перед предпросмотром.');
            return;
        }
        openGrantContractPreviewWindow(fields, 'Демо договор', false, false);
        window.addLog(app, 'Фасилитатор', 'Открыт предпросмотр договора', 'Открыт предпросмотр договора', 'slate', 'eye');
    }

    function printGrantContractDraftFromModal() {
        var id = window.currentOpenedAppId || window.currentApprovedAppId;
        if (!id) return;
        var app = window.getApp(id);
        if (!app) return;
        var fields = collectGrantContractFieldsFromForm();
        var result = validateGrantContractFields(fields, true);
        if (!result.ok) {
            if (window.AppNotify && typeof window.AppNotify.errorByKey === 'function') window.AppNotify.errorByKey('validation.error');
            else notifyMessage('error', 'Заполните обязательные поля договора перед печатью.');
            return;
        }
        openGrantContractPreviewWindow(fields, 'Печать договора', true, false);
        window.addLog(app, 'Фасилитатор', 'Договор отправлен на печать', 'Договор отправлен на печать', 'blue', 'printer');
    }

    function exportGrantContractPdfFromModal() {
        var id = window.currentOpenedAppId || window.currentApprovedAppId;
        if (!id) return;
        var app = window.getApp(id);
        if (!app) return;
        var fields = collectGrantContractFieldsFromForm();
        var result = validateGrantContractFields(fields, true);
        if (!result.ok) {
            if (window.AppNotify && typeof window.AppNotify.errorByKey === 'function') window.AppNotify.errorByKey('validation.error');
            else notifyMessage('error', 'Заполните обязательные поля договора перед экспортом PDF.');
            return;
        }
        openGrantContractPreviewWindow(fields, 'Экспорт договора в PDF', true, true);
        window.addLog(app, 'Фасилитатор', 'Договор экспортирован в PDF (через печать)', 'Договор экспортирован в PDF (через печать)', 'indigo', 'file-down');
    }

    function openGrantAgreementPicker() {
        var inputEl = document.getElementById('grant-agreement-upload');
        if (!inputEl || inputEl.disabled) return;
        inputEl.click();
    }

    function uploadGrantAgreementFromModal() {
        var id = window.currentOpenedAppId || window.currentApprovedAppId;
        if (!id) {
            notifyMessage('warning', 'Сначала откройте заявку / Аввал дархостро кушоед');
            return;
        }
        var app = window.getApp(id);
        if (!app) return;
        if (!canUploadAgreementForApp(app)) {
            notifyMessage('warning', 'Ин амал танҳо барои Фасилитатор дастрас аст. / Это действие доступно только Фасилитатору.');
            return;
        }

        var inputEl = document.getElementById('grant-agreement-upload');
        if (!inputEl || !inputEl.files || !inputEl.files.length) {
            notifyMessage('warning', 'Лутфан файлро интихоб кунед / Пожалуйста, выберите файл');
            return;
        }
        var file = inputEl.files[0];
        if (!isValidAgreementFile(file)) {
            notifyMessage('error', 'Фақат PDF/JPG/PNG то 10MB қабул мешавад. / Допустимы только PDF/JPG/PNG до 10MB.');
            return;
        }

        var noteEl = document.getElementById('grant-agreement-note');
        var note = noteEl ? String(noteEl.value || '').trim() : '';
        var reader = new FileReader();
        reader.onerror = function () {
            notifyMessage('error', 'Хониши файл хато дод. / Ошибка чтения файла.');
        };
        reader.onload = function () {
            var agreement = null;
            if (typeof window.registerGrantAgreement === 'function') {
                agreement = window.registerGrantAgreement(app, {
                    fileName: file.name,
                    mimeType: file.type || '',
                    fileDataUrl: String(reader.result || ''),
                    uploadedByRole: 'Фасилитатор',
                    uploadedByName: 'Фасилитатор',
                    note: note
                });
            }
            if (!agreement) return;

            var actionTj = agreement.replaceCount > 0
                ? 'Шартномаи имзошуда аз нав бор шуд (' + agreement.fileName + ')'
                : 'Шартномаи имзошуда бор шуд (' + agreement.fileName + ')';
            var actionRu = agreement.replaceCount > 0
                ? 'Подписанный договор обновлен (' + agreement.fileName + ')'
                : 'Загружен подписанный договор (' + agreement.fileName + ')';
            window.addLog(app, 'Фасилитатор', actionTj, actionRu, 'emerald', 'file-signature', note);

            renderGrantAgreementPanel(app);
            window.renderAllCards();
        };
        reader.readAsDataURL(file);
    }

    function downloadCurrentGrantAgreementFromModal() {
        var id = window.currentOpenedAppId || window.currentApprovedAppId;
        if (!id) {
            notifyMessage('warning', 'Сначала откройте заявку / Аввал дархостро кушоед');
            return;
        }
        if (typeof window.downloadGrantAgreementFile === 'function') {
            window.downloadGrantAgreementFile(id);
            return;
        }
        notifyMessage('error', 'Функсияи боргирии шартнома дастрас нест. / Функция скачивания договора недоступна.');
    }

    function openApprovedFor(id) {
        if (typeof window.canOpenInCurrentContext === 'function' && !window.canOpenInCurrentContext(id)) return;
        window.currentApprovedOpenSource = window.nextApprovedOpenSource || null;
        window.nextApprovedOpenSource = null;
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

    window.activeMainFilter = window.activeMainFilter || 'facilitator';
    window.activeComFilter = window.activeComFilter || 'protocols';
    window.activeFacFilter = window.activeFacFilter || 'draft';
    if (window.activeFacFilter === 'all_fac') window.activeFacFilter = 'draft';
    if (window.activeFacFilter === 'sent') window.activeFacFilter = 'draft';
    window.activeStatFilter = window.activeStatFilter || 'all_stat';
    window.activeGmcFilter = window.activeGmcFilter || 'new';
    if (window.activeGmcFilter === 'all_gmc') window.activeGmcFilter = 'new';
    window.facilitatorCompletedViewMode = window.facilitatorCompletedViewMode || 'both';
    window.approvedRegistrySourceRole = window.approvedRegistrySourceRole || null;
    window.nextApprovedRegistrySourceRole = window.nextApprovedRegistrySourceRole || null;

    const roleRules = {
        facilitator: {
            label: 'Фасилитатор',
            ownedStatuses: ['draft', 'fac_revision', 'postponed', 'incomplete_data', 'approved']
        },
        gmc: {
            label: 'ШИГ / КУГ',
            ownedStatuses: ['gmc_review', 'gmc_preparation', 'gmc_ready_for_registry']
        },
        committee: {
            label: 'Кумита / Комитет',
            ownedStatuses: ['com_review']
        }
    };

    function getRoleRule(role) {
        return roleRules[role] || null;
    }

    function getActiveRoleContext() {
        const roleByMainFilter = {
            facilitator: 'facilitator',
            gmc: 'gmc',
            committee: 'committee',
            approved_registry: window.approvedRegistrySourceRole || null
        };
        return roleByMainFilter[window.activeMainFilter] || null;
    }

    function isRoleOwnedStatus(status, role) {
        const rule = getRoleRule(role);
        if (!rule) return true;
        return rule.ownedStatuses.includes(status);
    }

    function isReadOnlyOpenAllowed(status) {
        return ['approved', 'rejected', 'postponed'].includes(status);
    }

    function canOpenInCurrentContext(appOrId) {
        const app = typeof appOrId === 'string' ? window.getApp(appOrId) : appOrId;
        if (!app) return false;

        const activeRole = getActiveRoleContext();
        const rule = getRoleRule(activeRole);
        if (!rule) return true;
        if (isRoleOwnedStatus(app.status, activeRole)) return true;
        if (isReadOnlyOpenAllowed(app.status)) return true;

        notifyMessage('warning', 'Ин марҳила кори ' + rule.label + ' нест. Танҳо дидан мумкин аст. / Это не зона работы роли ' + rule.label + '. Открытие недоступно.');
        return false;
    }

    function getPostponedUntilText(app) {
        const untilIso = typeof window.getPostponedUntilIso === 'function'
            ? window.getPostponedUntilIso(app)
            : '';
        if (!untilIso) return '—';
        if (typeof window.formatIsoDateRu === 'function') return window.formatIsoDateRu(untilIso);
        return untilIso;
    }

    function isPostponedUnlockReadyApp(app) {
        if (typeof window.isPostponedUnlockReady === 'function') return window.isPostponedUnlockReady(app);
        return false;
    }

    function isUnlockNoticeProcessed(app) {
        return !!(app && app.unlockNoticeProcessedAtISO);
    }

    function getUnlockNotifications() {
        const apps = window.filterApps(['postponed']);
        return apps
            .filter(function (app) {
                return isPostponedUnlockReadyApp(app) && !isUnlockNoticeProcessed(app);
            })
            .map(function (app) {
                return {
                    id: app.id,
                    name: app.name,
                    untilText: getPostponedUntilText(app)
                };
            });
    }

    function markUnlockNotificationProcessed(id, skipRender) {
        const app = window.getApp(id);
        if (!app) return;
        app.unlockNoticeProcessedAtISO = (typeof window.toIsoDate === 'function')
            ? window.toIsoDate(new Date())
            : new Date().toISOString().slice(0, 10);
        if (!skipRender) renderAllCards();
    }

    function markAllUnlockNotificationsProcessed() {
        getUnlockNotifications().forEach(function (n) {
            markUnlockNotificationProcessed(n.id, true);
        });
        renderAllCards();
    }

    function setUnlockPanelVisible(visible) {
        const panel = document.getElementById('unlock-notifications-panel');
        if (!panel) return;
        panel.classList.toggle('hidden', !visible);
        if (visible) renderUnlockNotificationsPanel();
    }

    function renderUnlockNotificationsPanel() {
        const list = document.getElementById('unlock-notifications-list');
        if (!list) return;

        const notifications = getUnlockNotifications();
        if (notifications.length === 0) {
            list.innerHTML = '<div class="p-4 text-[12px] text-slate-500">Новых уведомлений нет.</div>';
            return;
        }

        let html = '';
        notifications.forEach(function (n) {
            html += '<div class="p-3 border-b border-slate-100 last:border-b-0"><div class="flex items-start justify-between gap-2"><div><div class="text-[12px] font-bold text-slate-800">#' + n.id + ' • ' + n.name + '</div><div class="text-[11px] text-slate-500 mt-0.5">Доступна к ручной разблокировке. Блокировка до: ' + n.untilText + '</div></div><div class="flex flex-col gap-1.5 items-end"><button onclick="markUnlockNotificationProcessed(\'' + n.id + '\')" class="text-[11px] text-slate-600 hover:text-slate-800 font-medium">Обработано</button><button onclick="unlockPostponedApp(\'' + n.id + '\')" class="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold">Разблокировать</button></div></div></div>';
        });
        list.innerHTML = html;
    }

    function setAvailableTabs(tabsToShow) {
        const allTabs = ['pane-facilitator', 'pane-gmc', 'pane-committee', 'pane-gmc-registry-preview', 'pane-committee-batch', 'pane-approved', 'pane-monitoring'];
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

    function isApprovedRegistryApplicantView() {
        return window.activeMainFilter === 'approved_registry'
            && ['facilitator', 'gmc'].includes(window.approvedRegistrySourceRole);
    }

    function renderAllCards() {
        document.getElementById('mainDashboardGrid').innerHTML = '';
        document.getElementById('list-tbody').innerHTML = '';
        const isFacilitatorCompletedMode = window.activeMainFilter === 'facilitator' && window.activeFacFilter === 'completed';
        const isGmcApprovedCommitteeMode = window.activeMainFilter === 'gmc' && window.activeGmcFilter === 'approved_committee';

        if (isFacilitatorCompletedMode || isGmcApprovedCommitteeMode) {
            (window.state.protocols || []).forEach(function (p) { appendProtocolCard(p); });
            window.filterApps(['approved']).forEach(function (app) { appendApprovedApplicantCard(app); });
        } else if (window.activeMainFilter === 'approved_registry') {
            (window.state.protocols || []).forEach(function (p) { appendProtocolCard(p); });
            window.filterApps(['approved']).forEach(function (app) { appendApprovedApplicantCard(app); });
        } else if (window.activeMainFilter === 'finance_registry') {
            getFullyCompletedApps().forEach(function (app) { appendApprovedApplicantCard(app); });
        } else if (window.activeMainFilter === 'committee') {
            getPendingCommitteeRegistries().forEach(function (reg) { appendCommitteeRegistryCard(reg); });
        } else {
            window.state.applications.forEach(function (app) { appendCardAndRow(app.id, app.status, app); });
        }

        updateAllBadges();
        updateDashboardFilter();
        updateCompletedSummaryBar();
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
        card.innerHTML = '<div class="absolute top-0 left-0 w-full h-1.5 bg-teal-500"></div><div class="flex justify-between items-start mb-2 mt-1"><h3 class="font-bold text-[15px] text-teal-900 leading-tight">Рӯйхати воридшуда <span class="ru font-normal">/ Входящий список</span> <br/><span class="text-[13px] text-teal-700">' + reg.id + '</span></h3><div class="bg-teal-100 text-teal-800 px-2 py-1 rounded-md text-[10px] font-bold border border-teal-200"><i data-lucide="inbox" class="w-3 h-3 inline"></i> Аз GMS <span class="ru font-normal">/ Из GMS</span></div></div><div class="text-[11px] text-teal-600 font-medium mb-4 flex items-center gap-1.5"><i data-lucide="calendar" class="w-3.5 h-3.5"></i> Ворид шуд / Получено: ' + listDate + '</div><div class="grid grid-cols-2 gap-2 mb-4 bg-white/60 p-3 rounded-xl border border-teal-100"><div class="text-[11px] text-slate-600">Дар рӯйхат / В списке: <strong class="text-slate-700 text-[13px] block">' + appCount + '</strong></div><div class="text-[11px] text-slate-600">Маблағ / Сумма: <strong class="text-teal-700 text-[13px] block">' + totalAmount + ' сом.</strong></div></div><div class="flex justify-end items-center mt-auto border-t border-teal-200/60 pt-4"><button onclick="openCommitteeBatch(\'' + reg.id + '\')" class="bg-white text-teal-700 border border-teal-300 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-teal-100 transition-colors shadow-sm">Интихоби рӯйхат <span class="ru font-normal">/ Выбрать список</span></button></div>';
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
        row.innerHTML = '<td class="py-4 px-5 border-l-4 border-teal-500 align-middle"><div class="font-bold text-teal-900 text-[13px] mb-0.5">' + reg.id + '</div><div class="text-[11px] text-teal-600 font-medium flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3"></i> ' + listDate + '</div></td><td class="py-4 px-5 align-middle text-[12px] text-slate-600 font-medium">Воридшуда аз GMS / КУГ</td><td class="py-4 px-5 align-middle"><div class="font-black text-teal-700 text-[13px]">' + totalAmount + ' сомонӣ / сом.</div></td><td class="py-4 px-5 align-middle"><div class="bg-teal-100 text-teal-800 px-2 py-1 rounded-md text-[10px] font-bold w-max border border-teal-200"><i data-lucide="inbox" class="w-3 h-3 inline"></i> Дар баррасии Кумита <span class="ru font-normal">/ На рассмотрении</span></div></td><td class="py-4 px-5 align-middle text-right"><button onclick="openCommitteeBatch(\'' + reg.id + '\')" class="text-teal-600 text-[12px] font-bold hover:underline">Интихоб / Выбрать</button></td>';
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

            const beneficiaryId = app.beneficiaryId || app.id;
            const db = (window.beneficiarySearchDatabase || {})[beneficiaryId]
                || (window.mockDatabase || {})[beneficiaryId]
                || app.beneficiarySnapshot
                || {};
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
        card.innerHTML = '<div class="absolute top-0 left-0 w-full h-1.5 bg-teal-500"></div><div class="flex justify-between items-start mb-1 mt-1"><h3 class="font-bold text-[15px] text-teal-900 leading-tight">Рӯйхат <span class="ru font-normal">/ Список</span> <br/><span class="text-[13px] text-teal-700">' + prot.id + '</span></h3><div class="bg-teal-100 text-teal-800 px-2 py-1 rounded-md text-[10px] font-bold border border-teal-200"><i data-lucide="layers" class="w-3 h-3 inline"></i> Тасдиқшуда <span class="ru font-normal">/ Утв.</span></div></div><div class="text-[11px] text-teal-600 font-medium mb-4 flex items-center gap-1.5"><i data-lucide="calendar" class="w-3.5 h-3.5"></i> Тартибшуда / Сформирован: ' + prot.date + ' (' + prot.exactTime + ')</div><div class="grid grid-cols-2 gap-2 mb-4 bg-white/60 p-3 rounded-xl border border-teal-100"><div class="text-[11px] text-slate-600">Дар рӯйхат / В списке: <strong class="text-slate-700 text-[13px] block">' + listCount + '</strong></div><div class="text-[11px] text-slate-600">Тасдиқ / Одобр.: <strong class="text-emerald-600 text-[13px] block">' + approvedCount + '</strong></div><div class="text-[11px] text-slate-600">Рад / Откл.: <strong class="text-red-500 text-[13px] block">' + rejectedCount + '</strong></div><div class="text-[11px] text-slate-600">Маблағ / Сумма: <strong class="text-teal-700 text-[13px] block">' + totalAmount + ' сом.</strong></div></div><div class="flex justify-end items-center mt-auto border-t border-teal-200/60 pt-4"><button onclick="openCommitteeBatch(\'' + prot.id + '\')" class="bg-white text-teal-700 border border-teal-300 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-teal-100 transition-colors shadow-sm">Кушодан <span class="ru font-normal">/ Открыть список</span></button></div>';
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
        row.innerHTML = '<td class="py-4 px-5 border-l-4 border-teal-500 align-middle"><div class="font-bold text-teal-900 text-[13px] mb-0.5">Рӯйхат / Список ' + prot.id + '</div><div class="text-[11px] text-teal-600 font-medium flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3"></i> ' + prot.date + ' (' + prot.exactTime + ')</div></td><td class="py-4 px-5 align-middle text-[12px] text-slate-600 font-medium">Дар рӯйхат / В сп.: <b class="text-slate-700">' + listCount + '</b><br>Тасдиқ / Од.: <b class="text-emerald-600">' + approvedCount + '</b>, Рад / Откл.: <b class="text-red-500">' + rejectedCount + '</b></td><td class="py-4 px-5 align-middle"><div class="font-black text-teal-700 text-[13px]">' + totalAmount + ' сомонӣ / сом.</div></td><td class="py-4 px-5 align-middle"><div class="bg-teal-100 text-teal-800 px-2 py-1 rounded-md text-[10px] font-bold w-max border border-teal-200"><i data-lucide="layers" class="w-3 h-3 inline"></i> Тасдиқшуда <span class="ru font-normal">/ Утв.</span></div></td><td class="py-4 px-5 align-middle text-right"><button onclick="openCommitteeBatch(\'' + prot.id + '\')" class="text-teal-600 text-[12px] font-bold hover:underline">Кушодан / Открыть</button></td>';
        row.onclick = function (e) {
            if (!e.target.closest('button') && typeof window.openCommitteeBatch === 'function') {
                window.openCommitteeBatch(prot.id);
            }
        };
        document.getElementById('list-tbody').appendChild(row);
    }

    function appendApprovedApplicantCard(app) {
        if (!app || app.status !== 'approved') return;

        const clean = function (v) { return String(v || '').replace(/<[^>]*>?/gm, '').toLowerCase(); };
        const beneficiaryId = app.beneficiaryId || app.id;
        const db = (window.beneficiarySearchDatabase || {})[beneficiaryId]
            || (window.mockDatabase || {})[beneficiaryId]
            || app.beneficiarySnapshot
            || {};

        const sectorValue = clean(app.sector);
        const regionValue = clean(db.address);
        const genderValue = clean(db.gender);
        const searchHaystack = clean([
            app.id,
            app.name,
            db['full-name'],
            db.inn || app.inn,
            db.address,
            app.sector
        ].join(' '));

        const protocolBadge = app.protocolId
            ? '<span class="bg-teal-100 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded text-[10px] font-bold ml-2 whitespace-nowrap"><i data-lucide="layers" class="w-3 h-3 inline mr-0.5"></i>' + app.protocolId + '</span>'
            : '';
        const protocolOpenAction = app.protocolId
            ? '<button onclick="event.stopPropagation(); openCommitteeBatch(\'' + app.protocolId + '\')" class="bg-white text-teal-700 border border-teal-300 text-[11px] font-bold px-2.5 py-1 rounded-lg hover:bg-teal-50 transition-colors">Рӯйхат <span class="ru font-normal">/ Список</span></button>'
            : '';
        const docs = (typeof window.ensureDocumentBundle === 'function') ? window.ensureDocumentBundle(app) : null;
        const currentWordVersion = docs && docs.currentWordVersion ? docs.currentWordVersion : 0;
        const wordVersionBadge = '<span class="bg-indigo-100 text-indigo-800 border border-indigo-200 px-1.5 py-0.5 rounded text-[10px] font-bold ml-2 whitespace-nowrap" title="Current Word Version: V' + currentWordVersion + '"><i data-lucide="file-text" class="w-3 h-3 inline mr-0.5"></i>Word V' + currentWordVersion + '</span>';
        const agreement = typeof window.ensureGrantAgreement === 'function' ? window.ensureGrantAgreement(app) : null;
        const docsPack = typeof window.getApplicationDocumentCompleteness === 'function' ? window.getApplicationDocumentCompleteness(app) : null;
        const isFullyCompleted = isFullyCompletedApp(app);
        const completionStamp = agreement && agreement.uploadedAt ? agreement.uploadedAt : '—';
        const completionBadge = isFullyCompleted
            ? '<span class="bg-emerald-700 text-white border border-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold ml-2 whitespace-nowrap"><i data-lucide="badge-check" class="w-3 h-3 inline mr-0.5"></i>Полностью завершена</span>'
            : '<span class="bg-emerald-100 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-bold ml-2 whitespace-nowrap"><i data-lucide="clock-3" class="w-3 h-3 inline mr-0.5"></i>Одобрена, идет закрытие</span>';
        const agreementBadge = agreement && agreement.uploaded
            ? '<span class="bg-emerald-100 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-bold ml-2 whitespace-nowrap"><i data-lucide="file-signature" class="w-3 h-3 inline mr-0.5"></i>Договор загружен</span>'
            : '<span class="bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-bold ml-2 whitespace-nowrap"><i data-lucide="file-warning" class="w-3 h-3 inline mr-0.5"></i>Бе шартнома / Без договора</span>';
        const packageBadge = docsPack && docsPack.isFullPackageComplete
            ? '<span class="bg-emerald-100 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-bold ml-2 whitespace-nowrap"><i data-lucide="file-check" class="w-3 h-3 inline mr-0.5"></i>Пакет: полный</span>'
            : '<span class="bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-bold ml-2 whitespace-nowrap"><i data-lucide="file-warning" class="w-3 h-3 inline mr-0.5"></i>Пакет: неполный</span>';

        const card = document.createElement('div');
        card.setAttribute('data-status', 'approved_item');
        card.setAttribute('data-id', String(app.id || ''));
        card.setAttribute('data-list-id', String(app.protocolId || ''));
        card.setAttribute('data-sector-values', sectorValue);
        card.setAttribute('data-region-values', regionValue);
        card.setAttribute('data-gender-values', genderValue);
        card.setAttribute('data-search', searchHaystack);
        card.className = isFullyCompleted
            ? 'bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-5 shadow-md shadow-emerald-100/70 transition-all duration-200 flex flex-col min-h-[160px] animate-fade-in cursor-pointer hover:border-emerald-500'
            : 'bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm transition-all duration-200 flex flex-col min-h-[160px] animate-fade-in cursor-pointer hover:border-emerald-400';
        card.innerHTML = '<div class="flex justify-between items-start mb-1 gap-3"><h3 class="font-bold text-[14px] text-slate-800">' + app.name + '</h3><div class="' + (isFullyCompleted ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-700') + ' px-2 py-1 rounded-md text-[10px] font-bold">' + (isFullyCompleted ? 'Пурра анҷом ёфт <span class="ru font-normal">/ Полностью завершена</span>' : 'Тасдиқ шуд <span class="ru font-normal">/ Одобрена</span>') + '</div></div><div class="text-[11px] text-slate-500 mb-auto flex items-center flex-wrap gap-y-1">#' + app.id + ' • ' + app.sector + protocolBadge + wordVersionBadge + completionBadge + agreementBadge + packageBadge + '</div>' + (isFullyCompleted ? '<div class="mt-2 text-[11px] text-emerald-800 font-semibold">Закрыта: ' + completionStamp + '</div>' : '') + '<div class="mt-4 mb-4 flex flex-col"><span class="text-emerald-700 font-bold text-[14px]">' + app.amount + ' сомонӣ / сом.</span></div><div class="flex justify-between items-center mt-auto border-t border-slate-200 pt-4"><span class="text-xs text-slate-400 font-medium">' + String((app.date || '').split(',')[0] || '—') + '</span><div class="flex items-center gap-2">' + protocolOpenAction + '<span class="text-emerald-600 text-[12px] font-bold cursor-pointer" onclick="event.stopPropagation(); openApprovedFor(\'' + app.id + '\')">Кушодан <span class="ru font-normal">/ Открыть</span></span></div></div>';
        card.onclick = function (e) {
            if (e.target.closest('button, a, svg, select, input, span[onclick]')) return;
            window.openApprovedFor(app.id);
        };
        document.getElementById('mainDashboardGrid').appendChild(card);

        const row = document.createElement('tr');
        row.setAttribute('data-status', 'approved_item');
        row.setAttribute('data-id', String(app.id || ''));
        row.setAttribute('data-list-id', String(app.protocolId || ''));
        row.setAttribute('data-sector-values', sectorValue);
        row.setAttribute('data-region-values', regionValue);
        row.setAttribute('data-gender-values', genderValue);
        row.setAttribute('data-search', searchHaystack);
        row.className = 'hover:bg-slate-50 transition-colors cursor-pointer group animate-fade-in ' + (isFullyCompleted ? 'bg-emerald-50/70' : 'bg-emerald-50/40');
        row.innerHTML = '<td class="py-4 px-5 border-l-4 ' + (isFullyCompleted ? 'border-emerald-600' : 'border-emerald-500') + ' align-middle"><div class="font-bold text-slate-800 text-[13px] mb-0.5">' + app.name + '</div><div class="text-[11px] text-slate-400">#' + app.id + ' • ' + String((app.date || '').split(',')[0] || '—') + '</div><div class="mt-1">' + wordVersionBadge + completionBadge + agreementBadge + packageBadge + '</div>' + (isFullyCompleted ? '<div class="mt-1 text-[10px] text-emerald-800 font-semibold">Закрыта: ' + completionStamp + '</div>' : '') + '</td><td class="py-4 px-5 align-middle text-[12px] text-slate-600 font-medium leading-tight">' + app.sector + '</td><td class="py-4 px-5 align-middle"><div class="font-black text-emerald-700 text-[13px]">' + app.amount + ' сомонӣ / сом.</div></td><td class="py-4 px-5 align-middle"><div class="' + (isFullyCompleted ? 'bg-emerald-700 text-white border border-emerald-700' : 'bg-emerald-100 text-emerald-700 border border-emerald-200') + ' px-2 py-1 rounded-md text-[10px] font-bold w-max">' + (isFullyCompleted ? 'Пурра анҷом ёфт <span class="ru font-normal">/ Полностью завершена</span>' : 'Тасдиқ шуд <span class="ru font-normal">/ Одобрена</span>') + '</div></td><td class="py-4 px-5 align-middle text-right"><div class="flex items-center justify-end gap-3">' + (app.protocolId ? '<button onclick="openCommitteeBatch(\'' + app.protocolId + '\')" class="text-teal-700 text-[12px] font-bold hover:underline">Список</button>' : '') + '<button onclick="openApprovedFor(\'' + app.id + '\')" class="text-emerald-600 text-[12px] font-bold hover:underline">Кушодан / Открыть</button></div></td>';
        row.onclick = function (e) {
            if (e.target.closest('button, a, svg, select, input, span[onclick]')) return;
            window.openApprovedFor(app.id);
        };
        document.getElementById('list-tbody').appendChild(row);
    }

    function appendCardAndRow(id, status, app) {
        // Backward compatibility: old data with PIU stage is mapped to GMC preparation.
        if (status === 'piu_review') {
            status = 'gmc_preparation';
        }
        // Legacy GMC revision path is removed; route old records to facilitator revision.
        if (status === 'gmc_revision') {
            status = 'fac_revision';
        }

        let bHtml = '';
        let aHtml = '';
        let bClass = '';
        let badgeHtmlList = '';
        const displayRevisionCount = status === 'postponed'
            ? Math.max(parseInt(String(app.revisionCount || 0), 10) || 0, 3)
            : (parseInt(String(app.revisionCount || 0), 10) || 0);
        const revisionText = (displayRevisionCount > 0 && ['fac_revision', 'postponed'].includes(status)) ? '<span class="bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-bold ml-2 whitespace-nowrap" title="Миқдори такмил / Доработка: ' + displayRevisionCount + '/3"><i data-lucide="refresh-cw" class="w-3 h-3 inline mr-0.5"></i>' + displayRevisionCount + '/3</span>' : '';
        const revisionBadgeCard = (displayRevisionCount > 0 && ['fac_revision', 'postponed'].includes(status)) ? '<span class="bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap" title="Миқдори такмил / Доработка: ' + displayRevisionCount + '/3"><i data-lucide="refresh-cw" class="w-3 h-3 inline mr-0.5"></i>' + displayRevisionCount + '/3</span>' : '';
        const protocolHtml = app.protocolId ? '<span class="bg-teal-100 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded text-[10px] font-bold ml-2 whitespace-nowrap" title="Тасдиқшуда тариқи протокол / Утверждено протоколом"><i data-lucide="layers" class="w-3 h-3 inline mr-0.5"></i>' + app.protocolId + '</span>' : '';
        const protocolBadgeCard = app.protocolId ? '<span class="bg-teal-100 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap" title="Тасдиқшуда тариқи протокол / Утверждено протоколом"><i data-lucide="layers" class="w-3 h-3 inline mr-0.5"></i>' + app.protocolId + '</span>' : '';
        const postLockBadge = app.reactivated ? '<span class="bg-purple-100 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded text-[10px] font-bold ml-2 whitespace-nowrap" title="Возвращена после 3-месячной блокировки"><i data-lucide="history" class="w-3 h-3 inline mr-0.5"></i>Пас аз 3 моҳ / После 3 мес.</span>' : '';
        const postLockBadgeCard = app.reactivated ? '<span class="bg-purple-100 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap" title="Возвращена после 3-месячной блокировки"><i data-lucide="history" class="w-3 h-3 inline mr-0.5"></i>Пас аз 3 моҳ / После 3 мес.</span>' : '';
        const docs = (typeof window.ensureDocumentBundle === 'function') ? window.ensureDocumentBundle(app) : null;
        const currentWordVersion = docs && docs.currentWordVersion ? docs.currentWordVersion : 0;
        const wordVersionBadge = '<span class="bg-indigo-100 text-indigo-800 border border-indigo-200 px-1.5 py-0.5 rounded text-[10px] font-bold ml-2 whitespace-nowrap" title="Current Word Version: V' + currentWordVersion + '"><i data-lucide="file-text" class="w-3 h-3 inline mr-0.5"></i>Word V' + currentWordVersion + '</span>';
        const wordVersionBadgeRow = '<span class="bg-indigo-100 text-indigo-800 border border-indigo-200 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap" title="Current Word Version: V' + currentWordVersion + '"><i data-lucide="file-text" class="w-3 h-3 inline mr-0.5"></i>Word V' + currentWordVersion + '</span>';
        const protocolBadgeRow = app.protocolId ? '<span class="bg-teal-100 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap" title="Тасдиқшуда тариқи протокол / Утверждено протоколом"><i data-lucide="layers" class="w-3 h-3 inline mr-0.5"></i>' + app.protocolId + '</span>' : '';
        const postLockBadgeRow = app.reactivated ? '<span class="bg-purple-100 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap" title="Возвращена после 3-месячной блокировки"><i data-lucide="history" class="w-3 h-3 inline mr-0.5"></i>Пас аз 3 моҳ</span>' : '';
        const revisionBadgeRow = (displayRevisionCount > 0 && ['fac_revision', 'postponed'].includes(status)) ? '<span class="bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap" title="Миқдори такмил / Доработка: ' + displayRevisionCount + '/3"><i data-lucide="refresh-cw" class="w-3 h-3 inline mr-0.5"></i>' + displayRevisionCount + '/3</span>' : '';
        const wordVersionBadgeCard = '<span class="bg-indigo-100 text-indigo-800 border border-indigo-200 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap" title="Current Word Version: V' + currentWordVersion + '"><i data-lucide="file-text" class="w-3 h-3 inline mr-0.5"></i>Word V' + currentWordVersion + '</span>';
        const agreementMeta = typeof window.ensureGrantAgreement === 'function' ? window.ensureGrantAgreement(app) : null;
        const docsPackMeta = typeof window.getApplicationDocumentCompleteness === 'function' ? window.getApplicationDocumentCompleteness(app) : null;
        const isApprovedCompleted = status === 'approved' && isFullyCompletedApp(app);
        const completionBadgeCard = isApprovedCompleted
            ? '<span class="bg-emerald-700 text-white border border-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap"><i data-lucide="badge-check" class="w-3 h-3 inline mr-0.5"></i>Полностью завершена</span>'
            : '';
        const agreementBadgeCard = status === 'approved'
            ? (agreementMeta && agreementMeta.uploaded
                ? '<span class="bg-emerald-100 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap"><i data-lucide="file-signature" class="w-3 h-3 inline mr-0.5"></i>Договор загружен</span>'
                : '<span class="bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap"><i data-lucide="file-warning" class="w-3 h-3 inline mr-0.5"></i>Без договора</span>')
            : '';
        const packageBadgeCard = status === 'approved'
            ? (docsPackMeta && docsPackMeta.isFullPackageComplete
                ? '<span class="bg-emerald-100 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap"><i data-lucide="file-check" class="w-3 h-3 inline mr-0.5"></i>Пакет полный</span>'
                : '<span class="bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap"><i data-lucide="file-warning" class="w-3 h-3 inline mr-0.5"></i>Пакет неполный</span>')
            : '';
        const agreementBadgeRow = agreementBadgeCard;
        const packageBadgeRow = packageBadgeCard;
        const completionBadgeRow = completionBadgeCard;
        const committeeMeta = app.lastCommitteeReturn || null;
        const committeeCycleBadge = committeeMeta && committeeMeta.cycle ? '<span class="bg-rose-100 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap" title="Возврат из Комитета">Кумита #' + committeeMeta.cycle + ' <span class="ru font-normal">/ Комитет</span></span>' : '';
        const committeeInfoLine = committeeMeta ? '<div class="mt-1 text-[10px] text-rose-700 font-medium">Кумита: ' + (committeeMeta.protocolId || '—') + ' • ' + (committeeMeta.protocolDate || '—') + ' ' + (committeeMeta.protocolTime || '') + '</div>' : '';

        let checkboxHtmlCard = '';
        let checkboxHtmlRow = '';

        if (['gmc_review', 'gmc_preparation', 'gmc_ready_for_registry'].includes(status)) {
            if (status === 'gmc_ready_for_registry') {
                bClass = 'bg-indigo-50 border-indigo-300';
                bHtml = '<div class="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md text-[10px] font-bold"><i data-lucide="list-checks" class="w-3 h-3 inline"></i> Дар реестр / В реестре</div>';
                badgeHtmlList = bHtml;
                aHtml = '<button onclick="openGmcFor(\'' + id + '\')" class="bg-white text-indigo-700 border border-indigo-300 text-[12px] font-bold px-3 py-1.5 rounded-lg">Дидан <span class="ru font-normal">/ Просмотр</span></button>';
                const isChecked = window.selectedForRegistry && window.selectedForRegistry.has(id) ? 'checked' : '';
                checkboxHtmlCard = '<input type="checkbox" class="w-4 h-4 mr-2.5 accent-[#059669] cursor-pointer" onclick="event.stopPropagation()" onchange="toggleRegistrySelection(\'' + id + '\', this)" ' + isChecked + '>';
                checkboxHtmlRow = '<input type="checkbox" class="w-4 h-4 mr-3 accent-[#059669] cursor-pointer inline-block align-middle" onclick="event.stopPropagation()" onchange="toggleRegistrySelection(\'' + id + '\', this)" ' + isChecked + '>';
            } else if (status === 'gmc_preparation') {
                bClass = 'bg-[#F4F7FF] border-[#C6D4FF]';
                bHtml = '<div class="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-[10px] font-bold"><i data-lucide="clipboard-check" class="w-3 h-3 inline"></i> Барои омодасозӣ <span class="ru font-normal">/ На подготовке</span></div>';
                badgeHtmlList = bHtml;
                aHtml = '<button onclick="openGmcFor(\'' + id + '\')" class="bg-white text-[#5B4AF0] border border-[#C6D4FF] text-[12px] font-bold px-3 py-1.5 rounded-lg">Омода кардан <span class="ru font-normal">/ Подготовить</span></button>';
            } else {
                bClass = 'bg-[#F4F7FF] border-[#C6D4FF]';
                bHtml = '<div class="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-[10px] font-bold">Ба ШИГ пешниҳод шуд <span class="ru font-normal">/ В КУГ</span></div>';
                badgeHtmlList = bHtml;
                aHtml = '<button onclick="openGmcFor(\'' + id + '\')" class="bg-white text-[#5B4AF0] border border-[#C6D4FF] text-[12px] font-bold px-3 py-1.5 rounded-lg">Баҳогузорӣ <span class="ru font-normal">/ Оценить</span></button>';
            }
        } else if (status === 'com_review') {
            bClass = 'bg-teal-50 border-teal-200';
            bHtml = '<div class="bg-teal-100 text-teal-700 px-2 py-1 rounded-md text-[10px] font-bold">Қарори Кумита <span class="ru font-normal">/ Решение Комитета</span></div>';
            badgeHtmlList = bHtml;
            aHtml = '<span class="text-teal-600 text-[12px] font-bold cursor-pointer" onclick="openComFor(\'' + id + '\')">Тасдиқи ниҳоӣ <span class="ru font-normal">/ Утвердить</span></span>';
        } else if (status === 'approved') {
            bClass = isApprovedCompleted ? 'bg-emerald-50 border-emerald-400 shadow-sm' : 'bg-emerald-50 border-emerald-200';
            bHtml = isApprovedCompleted
                ? '<div class="bg-emerald-700 text-white px-2 py-1 rounded-md text-[10px] font-bold">Пурра анҷом ёфт <span class="ru font-normal">/ Полностью завершена</span></div>'
                : '<div class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-[10px] font-bold">Тасдиқ шуд <span class="ru font-normal">/ Одобрена</span></div>';
            badgeHtmlList = bHtml;
            aHtml = '<span class="text-emerald-600 text-[12px] font-bold cursor-pointer" onclick="openApprovedFor(\'' + id + '\')">Кушодан <span class="ru font-normal">/ Открыть</span></span>';
        } else if (status === 'rejected') {
            bClass = 'bg-red-50 border-red-200 opacity-70';
            bHtml = '<div class="bg-red-100 text-red-700 px-2 py-1 rounded-md text-[10px] font-bold">Рад карда шуд <span class="ru font-normal">/ Отклонена</span></div>';
            badgeHtmlList = bHtml;
            aHtml = '<span class="text-red-600 text-[12px] font-bold cursor-pointer" onclick="openApprovedFor(\'' + id + '\')">Таърих <span class="ru font-normal">/ История</span></span>';
        } else if (status === 'fac_revision') {
            bClass = 'bg-red-50 border-red-300';
            bHtml = '<div class="bg-red-100 text-red-800 px-2 py-1 rounded-md text-[10px] font-bold"><i data-lucide="alert-circle" class="w-3 h-3 inline"></i> Амали Фасилитатор <span class="ru font-normal">/ Действие Фас.</span></div>';
            badgeHtmlList = bHtml;
            aHtml = '<span class="text-red-600 text-[12px] font-bold cursor-pointer" onclick="openRevFor(\'' + id + '\')">Ислоҳ <span class="ru font-normal">/ Исправить</span></span>';
        } else if (status === 'postponed') {
            const untilText = getPostponedUntilText(app);
            const isReadyForUnlock = isPostponedUnlockReadyApp(app);
            const sourceBadge = app.lastReturnSource === 'committee'
                ? '<div class="mt-1 bg-rose-100 text-rose-800 px-2 py-1 rounded-md text-[10px] font-bold"><i data-lucide="corner-down-left" class="w-3 h-3 inline"></i> Аз Кумита баргашт <span class="ru font-normal">/ Вернул Комитет</span></div>'
                : (app.lastReturnSource === 'gmc'
                    ? '<div class="mt-1 bg-amber-100 text-amber-800 px-2 py-1 rounded-md text-[10px] font-bold"><i data-lucide="corner-down-left" class="w-3 h-3 inline"></i> Аз ШИГ / КУГ баргашт <span class="ru font-normal">/ Вернул КУГ</span></div>'
                    : '');
            bClass = isReadyForUnlock ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-100 border-slate-300 opacity-80';
            bHtml = isReadyForUnlock
                ? '<div class="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md text-[10px] font-bold"><i data-lucide="bell-ring" class="w-3 h-3 inline"></i> Омода барои кушодан / Готова к разблокировке</div>'
                : '<div class="bg-slate-200 text-slate-700 px-2 py-1 rounded-md text-[10px] font-bold"><i data-lucide="clock" class="w-3 h-3 inline"></i> Мавқуф то ' + untilText + ' <span class="ru font-normal">/ Отложено до ' + untilText + '</span></div>';
            bHtml += sourceBadge;
            badgeHtmlList = bHtml;
            if (getActiveRoleContext() === 'facilitator' && isReadyForUnlock) {
                aHtml = '<button onclick="unlockPostponedApp(\'' + id + '\')" class="bg-white text-emerald-700 border border-emerald-300 text-[12px] font-bold px-3 py-1.5 rounded-lg">Кушодан <span class="ru font-normal">/ Разблокировать</span></button>';
            } else {
                aHtml = '<span class="text-slate-600 text-[12px] font-bold cursor-pointer" onclick="openApprovedFor(\'' + id + '\')">Таърих / История</span>';
            }
        } else if (status === 'incomplete_data') {
            bClass = 'bg-orange-50 border-orange-300';
            bHtml = '<div class="bg-orange-100 text-orange-800 px-2 py-1 rounded-md text-[10px] font-bold"><i data-lucide="alert-triangle" class="w-3 h-3 inline"></i> Нопурра <span class="ru font-normal">/ Неполные</span></div>';
            badgeHtmlList = bHtml;
            aHtml = '<span class="text-orange-600 text-[12px] font-bold cursor-pointer" onclick="openDraftFor(\'' + id + '\')">Пурра кардан <span class="ru font-normal">/ Дополнить</span></span>';
        } else if (status === 'draft') {
            bClass = 'bg-white border-slate-200';
            bHtml = '<div class="bg-slate-100 text-slate-500 px-2 py-1 rounded-md text-[10px] font-medium">Сиёҳнавис <span class="ru font-normal">/ Черновик</span></div>';
            badgeHtmlList = bHtml;
            aHtml = '<span class="text-slate-500 text-[12px] font-bold cursor-pointer" onclick="openDraftFor(\'' + id + '\')">Кушодан <span class="ru font-normal">/ Открыть</span></span>';
        }

        if (window.activeMainFilter === 'statuses') {
            checkboxHtmlCard = '';
            checkboxHtmlRow = '';
            const facilitatorOwnedInStatuses = ['draft', 'fac_revision', 'incomplete_data', 'postponed'];
            if (!facilitatorOwnedInStatuses.includes(status)) {
                aHtml = '<span class="text-slate-600 text-[12px] font-bold cursor-pointer" onclick="openApprovedFor(\'' + id + '\')">Намоиш / Просмотр</span>';
            }
        }

        const activeRole = getActiveRoleContext();
        if (activeRole && !isRoleOwnedStatus(status, activeRole)) {
            checkboxHtmlCard = '';
            checkboxHtmlRow = '';
            if (isReadOnlyOpenAllowed(status)) {
                aHtml = '<span class="text-slate-600 text-[12px] font-bold cursor-pointer" onclick="openApprovedFor(\'' + id + '\')">Танҳо дидан / Только просмотр</span>';
            } else {
                aHtml = '<span class="text-slate-400 text-[11px] font-bold">Танҳо дидан / Только просмотр</span>';
            }
        }

        const card = document.createElement('div');
        card.setAttribute('data-id', id);
        card.setAttribute('data-status', status);
        card.className = bClass + ' rounded-2xl p-5 border shadow-sm transition-all duration-200 flex flex-col min-h-[160px] animate-fade-in cursor-pointer';
        card.innerHTML = '<div class="flex justify-between items-start gap-2 mb-2"><div class="flex items-center min-w-0">' + checkboxHtmlCard + '<h3 class="font-bold text-[14px] text-slate-800 leading-tight">' + app.name + '</h3></div>' + bHtml + '</div><div class="text-[11px] text-slate-500 leading-tight">#' + app.id + ' • ' + app.sector + '</div>' + (status === 'gmc_revision' ? committeeInfoLine : '') + '<div class="mt-2 flex flex-wrap items-center gap-1.5">' + protocolBadgeCard + wordVersionBadgeCard + revisionBadgeCard + postLockBadgeCard + (status === 'gmc_revision' ? committeeCycleBadge : '') + completionBadgeCard + agreementBadgeCard + packageBadgeCard + '</div>' + (isApprovedCompleted && agreementMeta && agreementMeta.uploadedAt ? '<div class="mt-2 text-[11px] text-emerald-800 font-semibold">Закрыта: ' + agreementMeta.uploadedAt + '</div>' : '') + '<div class="mt-5 mb-5 flex flex-col"><span class="text-primary font-bold text-[14px]">' + app.amount + ' сомонӣ / сом.</span></div><div class="flex justify-between items-center mt-auto border-t border-slate-200 pt-4"><span class="text-xs text-slate-400 font-medium">' + app.date.split(',')[0] + '</span>' + aHtml + '</div>';
        card.onclick = function (e) {
            if (e.target.closest('button, a, svg, select, input, span[onclick]')) return;
            const btn = card.querySelector('button, span[onclick]');
            if (btn) btn.click();
            else if (!isRoleOwnedStatus(status, getActiveRoleContext())) canOpenInCurrentContext(id);
        };
        document.getElementById('mainDashboardGrid').appendChild(card);

        const row = document.createElement('tr');
        row.setAttribute('data-id', id);
        row.setAttribute('data-status', status);
        row.className = 'hover:bg-slate-50 transition-colors cursor-pointer group animate-fade-in';
        row.innerHTML = '<td class="py-4 px-5 border-l-4 ' + (isApprovedCompleted ? 'border-emerald-500' : 'border-transparent') + ' align-middle"><div class="flex items-start">' + checkboxHtmlRow + '<div><div class="font-bold text-slate-800 text-[13px] mb-0.5">' + app.name + '</div><div class="text-[11px] text-slate-400">#' + app.id + ' • ' + app.date.split(',')[0] + '</div>' + (status === 'gmc_revision' ? '<div class="text-[10px] text-rose-700 mt-1">Кумита: ' + (committeeMeta && committeeMeta.protocolId ? committeeMeta.protocolId : '—') + ' • ' + (committeeMeta && committeeMeta.protocolDate ? committeeMeta.protocolDate : '—') + '</div>' : '') + '<div class="mt-1 flex flex-wrap items-center gap-1.5">' + protocolBadgeRow + wordVersionBadgeRow + revisionBadgeRow + postLockBadgeRow + (status === 'gmc_revision' ? committeeCycleBadge : '') + completionBadgeRow + agreementBadgeRow + packageBadgeRow + '</div>' + (isApprovedCompleted && agreementMeta && agreementMeta.uploadedAt ? '<div class="mt-1 text-[10px] text-emerald-800 font-semibold">Закрыта: ' + agreementMeta.uploadedAt + '</div>' : '') + '</div></div></td><td class="py-4 px-5 align-middle text-[12px] text-slate-600 font-medium leading-tight">' + app.sector + '</td><td class="py-4 px-5 align-middle"><div class="font-black text-primary text-[13px]">' + app.amount + ' сомонӣ / сом.</div></td><td class="py-4 px-5 align-middle">' + badgeHtmlList + '</td><td class="py-4 px-5 align-middle text-right"><div class="flex justify-end opacity-90 group-hover:opacity-100 transition-opacity">' + aHtml + '</div></td>';
        row.onclick = function (e) {
            if (e.target.closest('button, a, svg, select, input, span[onclick]')) return;
            const btn = row.querySelector('button, span[onclick]');
            if (btn) btn.click();
            else if (!isRoleOwnedStatus(status, getActiveRoleContext())) canOpenInCurrentContext(id);
        };
        document.getElementById('list-tbody').appendChild(row);
    }

    function updateAllBadges() {
        const drafts = window.filterApps(['draft']);
        const incomplete = window.filterApps(['incomplete_data']);
        const facRevs = window.filterApps(['fac_revision']);
        const postponed = window.filterApps(['postponed']);
        const postponedReady = postponed.filter(function (app) { return isPostponedUnlockReadyApp(app); });
        const unlockNotifications = getUnlockNotifications();
        const gmcNew = window.filterApps(['gmc_review']);
        const gmcPostponedView = window.filterApps(['postponed']);
        const gmcPrep = window.filterApps(['gmc_preparation']);
        const gmcReg = window.filterApps(['gmc_ready_for_registry']);
        const coms = window.filterApps(['com_review']);
        const approved = window.filterApps(['approved']);
        const fullyCompleted = getFullyCompletedApps();
        const approvedActive = approved.filter(function (app) { return !isFullyCompletedApp(app); });
        const rejected = window.filterApps(['rejected']);
        const inReview = window.filterApps(['gmc_review', 'gmc_preparation', 'gmc_ready_for_registry', 'com_review']);
        const totalApps = (window.state && Array.isArray(window.state.applications)) ? window.state.applications.length : 0;
        const setB = function (id, count) {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = count;
                el.classList.toggle('hidden', count === 0);
            }
        };
        setB('dash-fac-badge', drafts.length + incomplete.length + facRevs.length + postponedReady.length);
        setB('dash-approved-badge', approved.length);
        setB('dash-finance-badge', fullyCompleted.length);
        setB('dash-status-badge', totalApps);

        setB('sub-fac-all-badge', totalApps);
        setB('sub-draft-badge', drafts.length);
        setB('sub-incomplete-badge', incomplete.length);
        setB('sub-rev-badge', facRevs.length);
        setB('sub-fac-completed-badge', approved.length);
        setB('sub-pos-badge', postponed.length);
        setB('sub-pos-ready-badge', postponedReady.length);
        setB('dash-gmc-badge', window.filterApps(['gmc_review', 'gmc_preparation', 'gmc_ready_for_registry']).length);
        setB('dash-com-badge', coms.length);

        setB('sub-gmc-new-badge', gmcNew.length);
        setB('sub-gmc-returned-badge', gmcPostponedView.length);
        setB('sub-gmc-prep-badge', gmcPrep.length);
        setB('sub-gmc-reg-badge', gmcReg.length);
        setB('sub-gmc-approved-badge', approved.length);

        setB('sub-stat-all-badge', totalApps);
        setB('sub-stat-draft-badge', drafts.length);
        setB('sub-stat-rev-badge', facRevs.length);
        setB('sub-stat-review-badge', inReview.length);
        setB('sub-stat-approved-badge', approvedActive.length);
        setB('sub-stat-completed-badge', fullyCompleted.length);
        setB('sub-stat-postponed-badge', postponed.length);
        setB('sub-stat-rejected-badge', rejected.length);

        const unlockNotice = document.getElementById('facilitator-unlock-notice');
        const unlockNoticeCount = document.getElementById('facilitator-unlock-ready-count');
        const unlockNoticeCountRu = document.getElementById('facilitator-unlock-ready-count-ru');
        if (unlockNotice) {
            if (unlockNoticeCount) unlockNoticeCount.textContent = String(postponedReady.length);
            if (unlockNoticeCountRu) unlockNoticeCountRu.textContent = String(postponedReady.length);
            if (postponedReady.length > 0 && window.activeMainFilter === 'facilitator') unlockNotice.classList.remove('hidden');
            else unlockNotice.classList.add('hidden');
        }

        const bellBadge = document.getElementById('unlock-notifications-badge');
        if (bellBadge) {
            bellBadge.textContent = String(unlockNotifications.length);
            if (unlockNotifications.length > 0) bellBadge.classList.remove('hidden');
            else bellBadge.classList.add('hidden');
        }

        renderUnlockNotificationsPanel();

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
            opt.textContent = 'Рӯйхат нест / Списки отсутствуют';
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

    function updateCompletedSummaryBar() {
        const bar = document.getElementById('completed-summary-bar');
        const countEl = document.getElementById('completed-summary-count');
        const descEl = document.getElementById('completed-summary-desc');
        const exportBtn = document.getElementById('btn-export-finance-statement');
        if (!bar || !countEl || !descEl) return;

        const isStatusesCompleted = window.activeMainFilter === 'statuses' && window.activeStatFilter === 'completed';
        const isFinanceRegistry = window.activeMainFilter === 'finance_registry';
        const shouldShow = isStatusesCompleted || isFinanceRegistry;

        bar.classList.toggle('hidden', !shouldShow);
        if (!shouldShow) return;

        const total = getFullyCompletedApps().length;
        countEl.textContent = String(total);
        descEl.textContent = isFinanceRegistry
            ? 'Список для бухгалтерии: только заявки, одобренные Комитетом и закрытые загрузкой подписанного договора.'
            : 'Показаны только полностью завершенные заявки: одобрены Комитетом и с загруженным подписанным договором.';

        if (exportBtn) exportBtn.classList.toggle('hidden', !isFinanceRegistry);
    }

    function updateActiveModeIndicator() {
        const titleEl = document.getElementById('active-mode-title');
        const descEl = document.getElementById('active-mode-desc');
        if (!titleEl || !descEl) return;

        const mainLabels = {
            facilitator: 'Фасилитатор',
            gmc: 'ШИГ / КУГ',
            committee: 'Кумита / Комитет',
            approved_registry: 'Аз Кумита тасдиқшуда / Одобрено Комитетом',
            finance_registry: 'Молия / Финансы',
            statuses: 'Аз рӯи статус / По статусам'
        };

        const facLabels = {
            draft: 'Сиёҳнавис / Черновики',
            incomplete_data: 'Нопурра / Неполные данные',
            fac_revision: 'Дар ҳоли такмил / На доработке',
            completed: 'Аз Кумита тасдиқшуда / Одобрено Комитетом',
            postponed: 'Мавқуф / Отложенные'
        };

        const statLabels = {
            all_stat: 'Ҳама / Все',
            draft: 'Сиёҳнавис / Черновики',
            revision: 'Дар ҳоли такмил / На доработке',
            review: 'Дар баррасӣ / На рассмотрении',
            approved: 'Тасдиқшуда / Одобренные',
            completed: 'Пурра анҷом ёфт / Полностью завершенные',
            postponed: 'Мавқуф / Отложенные',
            rejected: 'Радшуда / Отклоненные'
        };

        const gmcLabels = {
            new: 'Аз Фасилитатор / От Фасилитатора',
            returned: 'Мавқуф / Отложенные',
            preparation: 'Барои омодасозӣ / На подготовку',
            ready_registry: 'Омода барои реестр / Готовы для реестра',
            approved_committee: 'Аз Кумита тасдиқшуда / Одобрено Комитетом'
        };

        const mainFilter = window.activeMainFilter || 'statuses';
        let subLabel = '';
        if (mainFilter === 'facilitator') subLabel = facLabels[window.activeFacFilter] || facLabels.draft;
        if (mainFilter === 'statuses') subLabel = statLabels[window.activeStatFilter] || statLabels.all_stat;
        if (mainFilter === 'gmc') subLabel = gmcLabels[window.activeGmcFilter] || gmcLabels.new;
        if (mainFilter === 'committee') subLabel = 'Рӯйхат / Список';
        if (mainFilter === 'finance_registry') subLabel = 'Пурра анҷом ёфт / Полностью завершенные';

        const mainLabel = mainLabels[mainFilter] || mainLabels.statuses;
        titleEl.textContent = 'Режим / Режим: ' + mainLabel + (subLabel ? ' • ' + subLabel : '');
        if (mainFilter === 'finance_registry') {
            descEl.textContent = 'Режим бухгалтерии: список идентичен одобренным Комитетом, но включает только заявки с прикрепленным подписанным договором.';
        } else if (mainFilter === 'gmc' && window.activeGmcFilter === 'returned') {
            descEl.textContent = 'Здесь ШИГ/КУГ видит отложенные заявки так же, как Фасилитатор, но только для просмотра. Действия по разблокировке и дальнейшему маршруту выполняет только Фасилитатор.';
        } else {
            descEl.textContent = 'Дархостҳо мувофиқи филтри интихобшуда намоиш дода мешаванд / Показываются заявки согласно выбранному фильтру.';
        }

        updateCompletedSummaryBar();
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

        if (
            window.activeMainFilter === 'approved_registry'
            || window.activeMainFilter === 'finance_registry'
            || (window.activeMainFilter === 'facilitator' && window.activeFacFilter === 'completed')
            || (window.activeMainFilter === 'gmc' && window.activeGmcFilter === 'approved_committee')
        ) {
            const searchInput = document.getElementById('filter-search-issued');
            const searchFilter = searchInput ? searchInput.value.toLowerCase().trim() : '';
            const sectorFilter = (document.getElementById('filter-sector') || {}).value || '';
            const regionFilter = (document.getElementById('filter-region') || {}).value || '';
            const genderFilter = (document.getElementById('filter-gender') || {}).value || '';

            const listEls = document.querySelectorAll('#mainDashboardGrid > div[data-status="approved_list"], #list-tbody > tr[data-status="approved_list"]');
            const itemEls = document.querySelectorAll('#mainDashboardGrid > div[data-status="approved_item"], #list-tbody > tr[data-status="approved_item"]');
            const isFinanceMode = window.activeMainFilter === 'finance_registry';
            const isFacilitatorCompletedMode = window.activeMainFilter === 'facilitator' && window.activeFacFilter === 'completed';
            const isGmcApprovedCommitteeMode = window.activeMainFilter === 'gmc' && window.activeGmcFilter === 'approved_committee';
            const facCompletedViewMode = window.facilitatorCompletedViewMode || 'both';

            const passesCommonFilters = function (el) {
                const sectors = String(el.getAttribute('data-sector-values') || '');
                const regions = String(el.getAttribute('data-region-values') || '');
                const genders = String(el.getAttribute('data-gender-values') || '');
                const searchHaystack = String(el.getAttribute('data-search') || '');

                let show = true;
                if (sectorFilter && !sectors.includes(String(sectorFilter).toLowerCase())) show = false;
                if (regionFilter && !regions.includes(String(regionFilter).toLowerCase())) show = false;
                if (genderFilter && !genders.includes(String(genderFilter).toLowerCase())) show = false;
                if (searchFilter && !searchHaystack.includes(searchFilter)) show = false;
                return show;
            };

            let applicantMatches = 0;
            itemEls.forEach(function (el) {
                if (passesCommonFilters(el)) applicantMatches++;
            });

            let showApplicantCards;
            let showApprovalLists;

            if (isFinanceMode) {
                showApplicantCards = true;
                showApprovalLists = false;
            } else if (isFacilitatorCompletedMode) {
                showApplicantCards = facCompletedViewMode !== 'lists';
                showApprovalLists = facCompletedViewMode !== 'apps';
            } else if (isGmcApprovedCommitteeMode) {
                showApplicantCards = true;
                showApprovalLists = true;
            } else if (isApprovedRegistryApplicantView()) {
                showApplicantCards = true;
                showApprovalLists = true;
            } else {
                showApplicantCards = !!searchFilter && applicantMatches > 0;
                showApprovalLists = !showApplicantCards;
            }
            let visibleCount = 0;

            listEls.forEach(function (el) {
                const show = showApprovalLists && passesCommonFilters(el);
                if (show) {
                    if (el.tagName === 'TR') el.style.display = 'table-row';
                    else el.style.display = 'flex';
                    visibleCount++;
                } else {
                    el.style.display = 'none';
                }
            });

            itemEls.forEach(function (el) {
                const show = showApplicantCards && passesCommonFilters(el);
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
            updateCompletedSummaryBar();
            return;
        }

        const searchInput = document.getElementById('filter-search-issued');
        const searchFilter = searchInput ? searchInput.value.toLowerCase() : '';
        let visibleCount = 0;

        document.querySelectorAll('#mainDashboardGrid > div, #list-tbody > tr').forEach(function (el) {
            const status = el.getAttribute('data-status');
            const appId = el.getAttribute('data-id');
            const appObj = window.getApp(appId) || {};
            const beneficiaryId = appObj.beneficiaryId || appId;
            const appFullObj = (window.beneficiarySearchDatabase || {})[beneficiaryId]
                || (window.mockDatabase || {})[beneficiaryId]
                || appObj.beneficiarySnapshot
                || {};
            let show = false;

            if (window.activeMainFilter === 'facilitator') {
                if (window.activeFacFilter === 'draft' && status === 'draft') show = true;
                else if (window.activeFacFilter === 'incomplete_data' && status === 'incomplete_data') show = true;
                else if (window.activeFacFilter === 'fac_revision' && status === 'fac_revision') show = true;
                else if (window.activeFacFilter === 'postponed' && status === 'postponed') show = true;
                else if (window.activeFacFilter === 'completed' && status === 'approved') show = true;
            } else if (window.activeMainFilter === 'statuses') {
                if (window.activeStatFilter === 'all_stat') show = true;
                else if (window.activeStatFilter === 'draft' && status === 'draft') show = true;
                else if (window.activeStatFilter === 'revision' && status === 'fac_revision') show = true;
                else if (window.activeStatFilter === 'review' && ['gmc_review', 'gmc_preparation', 'gmc_ready_for_registry', 'com_review'].includes(status)) show = true;
                else if (window.activeStatFilter === 'approved' && status === 'approved' && !isFullyCompletedApp(appObj)) show = true;
                else if (window.activeStatFilter === 'completed' && isFullyCompletedApp(appObj)) show = true;
                else if (window.activeStatFilter === 'rejected' && status === 'rejected') show = true;
                else if (window.activeStatFilter === 'postponed' && status === 'postponed') show = true;
            } else if (window.activeMainFilter === 'gmc') {
                if (['gmc_review', 'gmc_preparation', 'gmc_ready_for_registry'].includes(status)) {
                    if (window.activeGmcFilter === 'new' && status === 'gmc_review') show = true;
                    else if (window.activeGmcFilter === 'preparation' && status === 'gmc_preparation') show = true;
                    else if (window.activeGmcFilter === 'ready_registry' && status === 'gmc_ready_for_registry') show = true;
                }
                if (window.activeGmcFilter === 'returned' && status === 'postponed') show = true;
            } else if (window.activeMainFilter === 'committee' && status === 'com_review') show = true;
            else if (window.activeMainFilter === 'approved_registry' && ['approved'].includes(status)) show = true;
            else if (window.activeMainFilter === 'finance_registry' && isFullyCompletedApp(appObj)) show = true;

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
        updateCompletedSummaryBar();
    }

    function applyMainFilter(filterValue) {
        if (!filterValue) return;

        const activeBtn = document.querySelector('.filter-btn[data-filter="' + filterValue + '"]');
        if (!activeBtn) return;

        document.querySelectorAll('.filter-btn').forEach(function (b) {
            b.classList.remove('bg-[#5b4ef5]', 'bg-primary', 'text-white', 'shadow-sm');
            b.classList.add('text-slate-600', 'hover:bg-slate-200');
        });
        activeBtn.classList.add('bg-primary', 'text-white', 'shadow-sm');
        activeBtn.classList.remove('text-slate-600', 'hover:bg-slate-200');

        window.activeMainFilter = filterValue;
        if (window.activeMainFilter === 'approved_registry') {
            window.approvedRegistrySourceRole = window.nextApprovedRegistrySourceRole || window.approvedRegistrySourceRole || null;
            window.nextApprovedRegistrySourceRole = null;
        } else {
            window.nextApprovedRegistrySourceRole = null;
        }

        const t = function (id, show) {
            const el = document.getElementById(id);
            if (!el) return;
            if (show) el.classList.remove('hidden');
            else el.classList.add('hidden');
        };
        t('approved-filters-bar', window.activeMainFilter === 'approved_registry' || window.activeMainFilter === 'finance_registry');
        t('facilitator-filters-bar', window.activeMainFilter === 'facilitator');
        t('statuses-filters-bar', window.activeMainFilter === 'statuses');
        t('gmc-filters-bar', window.activeMainFilter === 'gmc');
        t('com-filters-bar', window.activeMainFilter === 'committee');
        updateCompletedSummaryBar();

        // Actions on cards depend on the active main filter.
        // Rebuild cards each time to avoid stale "view-only" actions from previous mode.
        renderAllCards();
        updateActiveModeIndicator();
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
                } else if (cls === '.fac-filter-btn') {
                    // Facilitator "completed" uses a different card dataset (approved lists + approved items),
                    // so always rebuild cards when switching facilitator subfilters.
                    renderAllCards();
                } else if (cls === '.gmc-filter-btn') {
                    // GMC "approved_committee" uses approved lists + approved items dataset.
                    renderAllCards();
                } else {
                    updateDashboardFilter();
                    updateAllBadges();
                }
                updateCompletedSummaryBar();
                updateActiveModeIndicator();
            });
        });
    }

    function initializeDashboardFilters() {
        document.querySelectorAll('.filter-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                applyMainFilter(btn.getAttribute('data-filter'));
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

        const exportBtn = document.getElementById('btn-export-finance-statement');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportFinanceCompletedStatement);
        }

        const approvedYear = document.getElementById('approved-stats-year');
        if (approvedYear) {
            approvedYear.addEventListener('change', updateApprovedInsights);
        }

        const approvedMonth = document.getElementById('approved-stats-month');
        if (approvedMonth) {
            approvedMonth.addEventListener('change', updateApprovedInsights);
        }

        const openApprovedListsBtn = document.getElementById('btn-open-approved-lists-mode');
        if (openApprovedListsBtn) {
            openApprovedListsBtn.addEventListener('click', function () {
                window.facilitatorCompletedViewMode = 'lists';
                const mainBtn = document.querySelector('.filter-btn[data-filter="facilitator"]');
                if (mainBtn) mainBtn.click();
                const subBtn = document.querySelector('.fac-filter-btn[data-fac-filter="completed"]');
                if (subBtn) subBtn.click();
            });
        }

        const openApprovedAppsBtn = document.getElementById('btn-open-approved-apps-mode');
        if (openApprovedAppsBtn) {
            openApprovedAppsBtn.addEventListener('click', function () {
                window.facilitatorCompletedViewMode = 'apps';
                const mainBtn = document.querySelector('.filter-btn[data-filter="facilitator"]');
                if (mainBtn) mainBtn.click();
                const subBtn = document.querySelector('.fac-filter-btn[data-fac-filter="completed"]');
                if (subBtn) subBtn.click();
            });
        }

        const bellBtn = document.getElementById('btn-unlock-notifications');
        if (bellBtn) {
            bellBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                const panel = document.getElementById('unlock-notifications-panel');
                const isHidden = !panel || panel.classList.contains('hidden');
                setUnlockPanelVisible(isHidden);
            });
        }

        const bellCloseBtn = document.getElementById('btn-close-unlock-notifications');
        if (bellCloseBtn) {
            bellCloseBtn.addEventListener('click', function () {
                setUnlockPanelVisible(false);
            });
        }

        const markAllBtn = document.getElementById('btn-mark-all-unlock-processed');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', function () {
                markAllUnlockNotificationsProcessed();
            });
        }

        document.addEventListener('click', function (e) {
            const panel = document.getElementById('unlock-notifications-panel');
            const bell = document.getElementById('btn-unlock-notifications');
            if (!panel || panel.classList.contains('hidden')) return;
            const insidePanel = panel.contains(e.target);
            const insideBell = bell && bell.contains(e.target);
            if (!insidePanel && !insideBell) setUnlockPanelVisible(false);
        });
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

                            const amountInput = document.getElementById('amount-input');
                            amountInput.value = app.amount !== '0' ? app.amount.replace(/\D/g, '') : '';
                            const select = document.getElementById('sector-input');
                            if (app.sectorValue) {
                                select.value = app.sectorValue;
                            }
                            if (!select.value) {
                                for (let i = 0; i < select.options.length; i++) {
                                    if (select.options[i].text === app.sector || app.sector.includes(select.options[i].value.split(' ')[0])) {
                                        select.selectedIndex = i;
                                        break;
                                    }
                                }
                            }

                            const lockBusinessFields = app.status === 'fac_revision';
                            amountInput.readOnly = lockBusinessFields;
                            select.disabled = lockBusinessFields;
                            amountInput.classList.toggle('bg-slate-100', lockBusinessFields);
                            amountInput.classList.toggle('cursor-not-allowed', lockBusinessFields);
                            select.classList.toggle('bg-slate-100', lockBusinessFields);
                            select.classList.toggle('cursor-not-allowed', lockBusinessFields);
                        }
                    } else if (targetId === 'pane-gmc') {
                        window.loadGmcForm(id);
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
                if (window.currentApprovedOpenSource === 'committee-batch' && typeof window.returnToCommitteeBatchFromHistory === 'function') {
                    window.returnToCommitteeBatchFromHistory();
                    return;
                }
                document.getElementById('applicationModal').classList.add('hidden');
                window.currentOpenedAppId = null;
                window.currentApprovedOpenSource = null;
                window.nextApprovedOpenSource = null;
            });
        }

        const startInitialRender = function () {
            // First paint cards/rows so filters can immediately work on existing DOM.
            renderAllCards();
            const defaultMainBtn = document.querySelector('.filter-btn[data-filter="' + window.activeMainFilter + '"]');
            if (defaultMainBtn) defaultMainBtn.click();
            updateActiveModeIndicator();
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
        updateActiveModeIndicator,
        updateApprovedInsights,
        openSelectedApprovedList,
        setAvailableTabs,
        initializeModalTabs
        ,
        markUnlockNotificationProcessed,
        markAllUnlockNotificationsProcessed,
        downloadCurrentBusinessPlanFromModal,
        downloadCurrentPdfFromModal,
        downloadCurrentPhotoPackFromModal,
        openGrantAgreementPicker,
        uploadGrantAgreementFromModal,
        downloadCurrentGrantAgreementFromModal,
        saveGrantContractDraftFromModal,
        previewGrantContractDraftFromModal,
        printGrantContractDraftFromModal,
        exportGrantContractPdfFromModal,
        resetGrantContractAutoFieldsFromModal,
        toggleGrantContractDraftPanelFromModal,
        exportFinanceCompletedStatement
    };

    // Legacy compatibility while migrating code out of grant.html
    window.loadHistoryForm = loadHistoryForm;
    window.openApprovedFor = openApprovedFor;
    window.setViewMode = setViewMode;
    window.renderAllCards = renderAllCards;
    window.updateAllBadges = updateAllBadges;
    window.updateDashboardFilter = updateDashboardFilter;
    window.updateActiveModeIndicator = updateActiveModeIndicator;
    window.updateApprovedInsights = updateApprovedInsights;
    window.openSelectedApprovedList = openSelectedApprovedList;
    window.setAvailableTabs = setAvailableTabs;
    window.getVisibleReadyRegistryIds = getVisibleReadyRegistryIds;
    window.canOpenInCurrentContext = canOpenInCurrentContext;
    window.markUnlockNotificationProcessed = markUnlockNotificationProcessed;
    window.markAllUnlockNotificationsProcessed = markAllUnlockNotificationsProcessed;
    window.downloadCurrentBusinessPlanFromModal = downloadCurrentBusinessPlanFromModal;
    window.downloadCurrentPdfFromModal = downloadCurrentPdfFromModal;
    window.downloadCurrentPhotoPackFromModal = downloadCurrentPhotoPackFromModal;
    window.openGrantAgreementPicker = openGrantAgreementPicker;
    window.uploadGrantAgreementFromModal = uploadGrantAgreementFromModal;
    window.downloadCurrentGrantAgreementFromModal = downloadCurrentGrantAgreementFromModal;
    window.saveGrantContractDraftFromModal = saveGrantContractDraftFromModal;
    window.previewGrantContractDraftFromModal = previewGrantContractDraftFromModal;
    window.printGrantContractDraftFromModal = printGrantContractDraftFromModal;
    window.exportGrantContractPdfFromModal = exportGrantContractPdfFromModal;
    window.resetGrantContractAutoFieldsFromModal = resetGrantContractAutoFieldsFromModal;
    window.toggleGrantContractDraftPanelFromModal = toggleGrantContractDraftPanelFromModal;
    window.exportFinanceCompletedStatement = exportFinanceCompletedStatement;
})();
