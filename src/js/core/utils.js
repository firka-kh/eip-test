(function initCoreUtils() {
    if (window.AppCore && window.AppCore.utils) return;

    function sanitizeText(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function sanitizeCsvField(value) {
        const raw = String(value == null ? '' : value).replace(/\r?\n/g, ' ').trim();
        const protectedValue = /^[=+\-@]/.test(raw) ? "'" + raw : raw;
        return protectedValue.replace(/"/g, '""');
    }

    function getCurrentDateTime() {
        return new Date().toLocaleDateString('ru-RU') + ', ' + new Date().toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function parseRuDate(value) {
        const raw = String(value == null ? '' : value).split(',')[0].trim();
        const m = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
        if (!m) return null;
        const day = parseInt(m[1], 10);
        const month = parseInt(m[2], 10) - 1;
        const year = parseInt(m[3], 10);
        const dt = new Date(year, month, day);
        if (isNaN(dt.getTime())) return null;
        return dt;
    }

    function toIsoDate(value) {
        if (!value) return '';
        const dt = value instanceof Date ? value : new Date(value);
        if (isNaN(dt.getTime())) return '';
        return dt.toISOString().slice(0, 10);
    }

    function addMonths(dateLike, months) {
        const dt = dateLike instanceof Date ? new Date(dateLike.getTime()) : new Date(dateLike);
        if (isNaN(dt.getTime())) return null;
        dt.setMonth(dt.getMonth() + months);
        return dt;
    }

    function formatIsoDateRu(isoDate) {
        const dt = new Date(isoDate);
        if (isNaN(dt.getTime())) return '—';
        return dt.toLocaleDateString('ru-RU');
    }

    function getPostponedUntilIso(app) {
        if (!app) return '';
        if (app.postponedUntilISO) return app.postponedUntilISO;

        const start = app.postponedAtISO
            ? new Date(app.postponedAtISO)
            : parseRuDate(app.date);
        if (!start || isNaN(start.getTime())) return '';

        const until = addMonths(start, 3);
        return until ? toIsoDate(until) : '';
    }

    function isPostponedUnlockReady(app) {
        if (!app || app.status !== 'postponed') return false;
        const untilIso = getPostponedUntilIso(app);
        if (!untilIso) return false;

        const until = new Date(untilIso + 'T00:00:00');
        const now = new Date();
        return now.getTime() >= until.getTime();
    }

    var NOTIFICATION_COPY = {
        notifications: {
            unlock: {
                confirm: {
                    title: 'Разблокировать заявку?',
                    message: 'Ариза ба ҳолати ислоҳ бармегардад. / Заявка будет переведена в режим редактирования.',
                    consequence: 'Тағйирот дар журнал сабт мешавад. / Действие будет зафиксировано в журнале.',
                    buttons: { cancel: 'Отмена', confirm: 'Да, разблокировать' }
                },
                success: {
                    title: 'Кушодашавӣ анҷом ёфт / Разблокировка выполнена',
                    message: 'Что произошло: заявка возвращена в режим редактирования. Маршрут: Отложена -> Фасилитатор. Следующий статус: На доработке у Фасилитатора.'
                },
                errorNotReady: {
                    title: 'Снятие блокировки пока недоступно',
                    message: 'Что произошло: срок блокировки еще не истек. Маршрут: без изменений. Следующий статус: Отложена.'
                }
            },
            submitToGmc: {
                confirm: {
                    title: 'Отправить заявку в КУГ?',
                    message: 'Ариза барои баррасӣ ба ШИГ фиристода мешавад. / Заявка будет отправлена в КУГ на рассмотрение.',
                    consequence: 'Баъд аз фиристодан, таҳрири баъзе майдонҳо маҳдуд мешавад. / После отправки часть полей станет недоступна для редактирования.',
                    buttons: { cancel: 'Отмена', confirm: 'Да, отправить' }
                },
                success: {
                    title: 'Ба ШИГ фиристода шуд / Отправлено в КУГ',
                    message: 'Что произошло: заявка передана в КУГ. Маршрут: Фасилитатор -> КУГ. Следующий статус: На рассмотрении КУГ.'
                },
                error: {
                    title: 'Не удалось отправить',
                    message: 'Проверьте обязательные поля и попробуйте снова.'
                }
            },
            returnForRevision: {
                confirm: {
                    title: 'Вернуть на доработку?',
                    message: 'Ариза ба фасилитатор барои ислоҳ бармегардад. / Заявка будет возвращена фасилитатору на доработку.',
                    consequence: 'Сабаби баргардониданро нишон диҳед. / Укажите причину возврата.',
                    buttons: { cancel: 'Отмена', confirm: 'Вернуть на доработку' }
                },
                success: {
                    title: 'Баргардонда шуд / Возвращено на доработку',
                    message: 'Что произошло: заявка возвращена на доработку. Маршрут: проверяющая роль -> Фасилитатор. Следующий статус: На доработке у Фасилитатора.'
                },
                warningCommentRequired: {
                    title: 'Сабаб ҳатмист / Причина обязательна',
                    message: 'Сабаби баргардониданро нишон диҳед. / Укажите причину возврата.'
                }
            },
            piuReturnToGmc: {
                confirm: {
                    title: 'Вернуть заявку в КУГ?',
                    message: 'Ариза аз ГРП ба ШИГ барои ислоҳ бармегардад. / Заявка будет возвращена из ГРП в КУГ на доработку.',
                    consequence: 'Что произойдет: возврат на доработку. Маршрут: ГРП -> КУГ. Следующий статус: На доработке в КУГ.',
                    buttons: { cancel: 'Отмена', confirm: 'Да, вернуть в КУГ' }
                },
                success: {
                    title: 'Ба ШИГ баргардонда шуд / Возвращено в КУГ',
                    message: 'Что произошло: заявка возвращена в КУГ. Маршрут: ГРП -> КУГ. Следующий статус: На доработке в КУГ.'
                }
            },
            validation: {
                error: {
                    title: 'Хатогии санҷиш / Ошибка валидации',
                    message: 'Некоторые обязательные поля не заполнены.'
                },
                errorDetailed: {
                    title: 'Исправьте поля формы',
                    message: 'Проверьте выделенные поля и заполните недостающие данные.'
                }
            },
            deadline: {
                warning: {
                    title: 'Амал дастнорас аст / Действие недоступно',
                    message: 'Срок для выполнения этого действия еще не наступил.'
                },
                unlockNotAvailableUntilDate: {
                    title: 'Снятие блокировки пока недоступно',
                    message: 'Что произошло: заявка остается отложенной до {date}. Маршрут: без изменений. Следующий статус: Отложена.'
                }
            }
        }
    };

    var notifyState = {
        initialized: false,
        toastHost: null,
        centerToastHost: null,
        modalHost: null,
        modalCard: null,
        modalTitle: null,
        modalMessage: null,
        modalConsequence: null,
        modalCancelBtn: null,
        modalConfirmBtn: null,
        confirmResolve: null,
        escHandler: null
    };

    function notifyTemplate(text, params) {
        var output = String(text == null ? '' : text);
        Object.keys(params || {}).forEach(function (k) {
            output = output.replace(new RegExp('\\{' + k + '\\}', 'g'), String(params[k] == null ? '' : params[k]));
        });
        return output;
    }

    function notifyGet(path) {
        var parts = String(path || '').split('.').filter(Boolean);
        var node = NOTIFICATION_COPY;
        for (var i = 0; i < parts.length; i++) {
            if (!node || typeof node !== 'object') return null;
            node = node[parts[i]];
        }
        return node || null;
    }

    function ensureNotifyUi() {
        if (notifyState.initialized) return;
        notifyState.initialized = true;

        var toastHost = document.createElement('div');
        toastHost.id = 'app-toast-host';
        toastHost.style.position = 'fixed';
        toastHost.style.right = '16px';
        toastHost.style.bottom = '16px';
        toastHost.style.zIndex = '9998';
        toastHost.style.display = 'flex';
        toastHost.style.flexDirection = 'column';
        toastHost.style.gap = '14px';
        toastHost.style.maxWidth = '560px';
        toastHost.style.pointerEvents = 'none';
        document.body.appendChild(toastHost);
        notifyState.toastHost = toastHost;

        var centerToastHost = document.createElement('div');
        centerToastHost.id = 'app-toast-host-center';
        centerToastHost.style.position = 'fixed';
        centerToastHost.style.inset = '0';
        centerToastHost.style.zIndex = '9998';
        centerToastHost.style.display = 'flex';
        centerToastHost.style.alignItems = 'center';
        centerToastHost.style.justifyContent = 'center';
        centerToastHost.style.padding = '16px';
        centerToastHost.style.pointerEvents = 'none';
        document.body.appendChild(centerToastHost);
        notifyState.centerToastHost = centerToastHost;

        var overlay = document.createElement('div');
        overlay.id = 'app-confirm-overlay';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '9999';
        overlay.style.background = 'rgba(15,23,42,0.45)';
        overlay.style.display = 'none';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.padding = '18px';

        var card = document.createElement('div');
        card.style.width = 'min(560px, 100%)';
        card.style.background = '#ffffff';
        card.style.border = '1px solid #e2e8f0';
        card.style.borderRadius = '16px';
        card.style.boxShadow = '0 12px 36px rgba(15,23,42,0.24)';
        card.style.padding = '18px 18px 14px';

        var title = document.createElement('h3');
        title.style.margin = '0 0 8px 0';
        title.style.fontSize = '18px';
        title.style.fontWeight = '700';
        title.style.color = '#0f172a';

        var msg = document.createElement('p');
        msg.style.margin = '0 0 10px 0';
        msg.style.fontSize = '14px';
        msg.style.color = '#334155';
        msg.style.lineHeight = '1.45';

        var cons = document.createElement('p');
        cons.style.margin = '0';
        cons.style.fontSize = '13px';
        cons.style.color = '#475569';
        cons.style.lineHeight = '1.45';
        cons.style.background = '#f8fafc';
        cons.style.border = '1px solid #e2e8f0';
        cons.style.borderRadius = '10px';
        cons.style.padding = '10px 12px';

        var actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.justifyContent = 'flex-end';
        actions.style.gap = '10px';
        actions.style.marginTop = '14px';

        var cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.style.padding = '8px 14px';
        cancelBtn.style.border = '1px solid #cbd5e1';
        cancelBtn.style.background = '#ffffff';
        cancelBtn.style.color = '#334155';
        cancelBtn.style.borderRadius = '10px';
        cancelBtn.style.fontWeight = '600';
        cancelBtn.style.cursor = 'pointer';

        var confirmBtn = document.createElement('button');
        confirmBtn.type = 'button';
        confirmBtn.style.padding = '8px 14px';
        confirmBtn.style.border = '1px solid #16a34a';
        confirmBtn.style.background = '#16a34a';
        confirmBtn.style.color = '#ffffff';
        confirmBtn.style.borderRadius = '10px';
        confirmBtn.style.fontWeight = '700';
        confirmBtn.style.cursor = 'pointer';

        actions.appendChild(cancelBtn);
        actions.appendChild(confirmBtn);
        card.appendChild(title);
        card.appendChild(msg);
        card.appendChild(cons);
        card.appendChild(actions);
        overlay.appendChild(card);
        document.body.appendChild(overlay);

        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeConfirm(false);
        });
        cancelBtn.addEventListener('click', function () { closeConfirm(false); });
        confirmBtn.addEventListener('click', function () { closeConfirm(true); });

        notifyState.modalHost = overlay;
        notifyState.modalCard = card;
        notifyState.modalTitle = title;
        notifyState.modalMessage = msg;
        notifyState.modalConsequence = cons;
        notifyState.modalCancelBtn = cancelBtn;
        notifyState.modalConfirmBtn = confirmBtn;
    }

    function closeConfirm(result) {
        if (!notifyState.modalHost) return;
        notifyState.modalHost.style.display = 'none';
        if (notifyState.escHandler) {
            document.removeEventListener('keydown', notifyState.escHandler);
            notifyState.escHandler = null;
        }
        var resolve = notifyState.confirmResolve;
        notifyState.confirmResolve = null;
        if (resolve) resolve(!!result);
    }

    function notifyConfirm(config) {
        ensureNotifyUi();
        var safe = config || {};
        notifyState.modalTitle.textContent = safe.title || 'Подтвердите действие';
        notifyState.modalMessage.textContent = safe.message || '';
        notifyState.modalConsequence.textContent = safe.consequence || '';
        notifyState.modalConsequence.style.display = safe.consequence ? 'block' : 'none';
        notifyState.modalCancelBtn.textContent = (safe.buttons && safe.buttons.cancel) || 'Отмена';
        notifyState.modalConfirmBtn.textContent = (safe.buttons && safe.buttons.confirm) || 'Подтвердить';
        notifyState.modalConfirmBtn.style.borderColor = safe.confirmColor || '#16a34a';
        notifyState.modalConfirmBtn.style.background = safe.confirmColor || '#16a34a';

        notifyState.modalHost.style.display = 'flex';
        notifyState.modalCancelBtn.focus();

        return new Promise(function (resolve) {
            notifyState.confirmResolve = resolve;
            notifyState.escHandler = function (e) {
                if (e.key === 'Escape') closeConfirm(false);
            };
            document.addEventListener('keydown', notifyState.escHandler);
        });
    }

    function notifyToast(kind, title, message, timeoutMs) {
        ensureNotifyUi();

        var tone = kind || 'info';
        var palette = {
            success: { accent: '#60a5fa', bd: '#dbeafe' },
            info: { accent: '#60a5fa', bd: '#dbeafe' },
            warning: { accent: '#93c5fd', bd: '#dbeafe' },
            error: { accent: '#93c5fd', bd: '#dbeafe' }
        };
        var ui = palette[tone] || palette.info;

        var isRouteMessage = String(message || '').indexOf('Маршрут:') !== -1;
        var host = isRouteMessage ? notifyState.centerToastHost : notifyState.toastHost;

        while (host.children.length >= (isRouteMessage ? 1 : 3)) {
            host.removeChild(host.children[0]);
        }

        var toast = document.createElement('div');
        toast.style.pointerEvents = 'auto';
        toast.style.position = 'relative';
        toast.style.overflow = 'hidden';
        toast.style.background = '#ffffff';
        toast.style.color = '#1e3a8a';
        toast.style.border = '1px solid ' + ui.bd;
        toast.style.borderRadius = '24px';
        toast.style.padding = '18px 20px';
        toast.style.width = 'min(520px, calc(100vw - 28px))';
        toast.style.boxShadow = '0 18px 42px rgba(30,58,138,0.12)';
        toast.style.transform = isRouteMessage ? 'scale(0.98)' : 'translateY(8px)';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 180ms ease, transform 180ms ease';

        var accent = document.createElement('div');
        accent.style.position = 'absolute';
        accent.style.left = '0';
        accent.style.top = '0';
        accent.style.bottom = '0';
        accent.style.width = '8px';
        accent.style.background = ui.accent;

        var topRow = document.createElement('div');
        topRow.style.display = 'flex';
        topRow.style.justifyContent = 'space-between';
        topRow.style.alignItems = 'flex-start';
        topRow.style.gap = '12px';
        topRow.style.paddingLeft = '10px';

        var titleEl = document.createElement('div');
        titleEl.style.fontSize = '16px';
        titleEl.style.fontWeight = '700';
        titleEl.style.lineHeight = '1.3';
        titleEl.textContent = title || '';

        var closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.textContent = '×';
        closeBtn.style.border = 'none';
        closeBtn.style.background = 'transparent';
        closeBtn.style.color = '#1e40af';
        closeBtn.style.fontSize = '24px';
        closeBtn.style.lineHeight = '1';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.padding = '0';
        closeBtn.style.marginTop = '-2px';

        var msgEl = document.createElement('div');
        msgEl.style.marginTop = '10px';
        msgEl.style.paddingLeft = '10px';
        msgEl.style.fontSize = '14px';
        msgEl.style.lineHeight = '1.6';
        msgEl.style.color = '#1e40af';
        msgEl.textContent = message || '';

        toast.appendChild(accent);
        topRow.appendChild(titleEl);
        topRow.appendChild(closeBtn);
        toast.appendChild(topRow);
        if (message) toast.appendChild(msgEl);
        host.appendChild(toast);

        requestAnimationFrame(function () {
            toast.style.opacity = '1';
            toast.style.transform = isRouteMessage ? 'scale(1)' : 'translateY(0)';
        });

        var timeout = timeoutMs;
        if (!timeout) {
            timeout = tone === 'error' ? 7000 : tone === 'warning' ? 5000 : 3500;
        }

        var timer = setTimeout(removeToast, timeout);
        closeBtn.addEventListener('click', removeToast);
        toast.addEventListener('mouseenter', function () { clearTimeout(timer); });
        toast.addEventListener('mouseleave', function () { timer = setTimeout(removeToast, 1400); });

        function removeToast() {
            if (!toast.parentNode) return;
            toast.style.opacity = '0';
            toast.style.transform = isRouteMessage ? 'scale(0.98)' : 'translateY(8px)';
            setTimeout(function () {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 170);
        }
    }

    function notifyFromKey(path, kind, params) {
        var entry = notifyGet('notifications.' + path);
        if (!entry) return;
        notifyToast(kind, notifyTemplate(entry.title, params), notifyTemplate(entry.message, params));
    }

    function notifyConfirmByKey(path, params) {
        var entry = notifyGet('notifications.' + path);
        if (!entry) return Promise.resolve(false);
        return notifyConfirm({
            title: notifyTemplate(entry.title, params),
            message: notifyTemplate(entry.message, params),
            consequence: notifyTemplate(entry.consequence || '', params),
            buttons: {
                cancel: notifyTemplate(entry.buttons && entry.buttons.cancel, params),
                confirm: notifyTemplate(entry.buttons && entry.buttons.confirm, params)
            }
        });
    }

    var AppNotify = {
        copy: NOTIFICATION_COPY,
        template: notifyTemplate,
        get: notifyGet,
        toast: notifyToast,
        confirm: notifyConfirm,
        successByKey: function (path, params) { notifyFromKey(path, 'success', params); },
        infoByKey: function (path, params) { notifyFromKey(path, 'info', params); },
        warningByKey: function (path, params) { notifyFromKey(path, 'warning', params); },
        errorByKey: function (path, params) { notifyFromKey(path, 'error', params); },
        confirmByKey: notifyConfirmByKey
    };

    function notifyMessage(kind, message, title) {
        if (AppNotify && typeof AppNotify.toast === 'function') {
            AppNotify.toast(kind || 'info', title || '', message || '');
            return;
        }
        alert((title ? (title + '\n') : '') + (message || ''));
    }

    function addLog(app, actor, action, actionRu, color, icon, comment) {
        if (!app.auditLog) app.auditLog = [];
        app.auditLog.push({
            date: getCurrentDateTime(),
            actor: sanitizeText(actor),
            action: sanitizeText(action),
            actionRu: sanitizeText(actionRu),
            color,
            icon,
            comment: sanitizeText(comment || '')
        });
    }

    function ensureDocumentBundle(app) {
        if (!app) return null;
        if (!app.documents) {
            app.documents = {
                wordVersions: [],
                currentWordVersion: 0,
                basePdf: null,
                basePhotos: []
            };
        }
        if (!Array.isArray(app.documents.wordVersions)) app.documents.wordVersions = [];
        if (!Array.isArray(app.documents.basePhotos)) app.documents.basePhotos = [];
        if (!app.documents.currentWordVersion) app.documents.currentWordVersion = app.documents.wordVersions.length || 0;
        return app.documents;
    }

    function registerBaseDocuments(app, payload) {
        var docs = ensureDocumentBundle(app);
        if (!docs || !payload) return;
        var now = getCurrentDateTime();

        if (payload.pdfName) {
            docs.basePdf = {
                name: sanitizeText(payload.pdfName),
                uploadedAt: now,
                uploadedByRole: sanitizeText(payload.uploadedByRole || 'Фасилитатор'),
                uploadedByName: sanitizeText(payload.uploadedByName || 'Фасилитатор')
            };
        }

        if (Array.isArray(payload.photoNames) && payload.photoNames.length > 0) {
            docs.basePhotos = payload.photoNames.map(function (name, index) {
                return {
                    slot: index + 1,
                    name: sanitizeText(name),
                    uploadedAt: now,
                    uploadedByRole: sanitizeText(payload.uploadedByRole || 'Фасилитатор'),
                    uploadedByName: sanitizeText(payload.uploadedByName || 'Фасилитатор')
                };
            });
        }
    }

    function registerWordVersion(app, payload) {
        var docs = ensureDocumentBundle(app);
        if (!docs || !payload || !payload.fileName) return 0;

        var nextVersion = (docs.currentWordVersion || 0) + 1;
        var entry = {
            version: nextVersion,
            name: sanitizeText(payload.fileName),
            uploadedAt: getCurrentDateTime(),
            uploadedByRole: sanitizeText(payload.uploadedByRole || ''),
            uploadedByName: sanitizeText(payload.uploadedByName || ''),
            sourceStage: sanitizeText(payload.sourceStage || '')
        };

        docs.wordVersions.push(entry);
        docs.currentWordVersion = nextVersion;
        return nextVersion;
    }

    function getCurrentWordVersionInfo(app) {
        var docs = ensureDocumentBundle(app);
        if (!docs || !docs.currentWordVersion) return null;
        var version = docs.currentWordVersion;
        for (var i = docs.wordVersions.length - 1; i >= 0; i--) {
            if (docs.wordVersions[i].version === version) return docs.wordVersions[i];
        }
        return null;
    }

    function ensureGrantAgreement(app) {
        if (!app) return null;
        if (!app.grantAgreement) {
            app.grantAgreement = {
                uploaded: false,
                fileName: '',
                mimeType: '',
                fileDataUrl: '',
                uploadedAt: '',
                uploadedByRole: '',
                uploadedByName: '',
                note: '',
                replaceCount: 0
            };
        }
        if (typeof app.grantAgreement.mimeType !== 'string') app.grantAgreement.mimeType = '';
        if (typeof app.grantAgreement.fileDataUrl !== 'string') app.grantAgreement.fileDataUrl = '';
        return app.grantAgreement;
    }

    function registerGrantAgreement(app, payload) {
        if (!app || !payload || !payload.fileName) return null;
        var agreement = ensureGrantAgreement(app);
        if (!agreement) return null;

        var isReplacing = !!agreement.uploaded;
        agreement.uploaded = true;
        agreement.fileName = sanitizeText(payload.fileName);
        agreement.mimeType = sanitizeText(payload.mimeType || '');
        agreement.fileDataUrl = sanitizeText(payload.fileDataUrl || '');
        agreement.uploadedAt = getCurrentDateTime();
        agreement.uploadedByRole = sanitizeText(payload.uploadedByRole || 'Фасилитатор');
        agreement.uploadedByName = sanitizeText(payload.uploadedByName || 'Фасилитатор');
        agreement.note = sanitizeText(payload.note || '');
        agreement.replaceCount = isReplacing ? (agreement.replaceCount || 0) + 1 : 0;
        return agreement;
    }

    function ensureGrantContractDraft(app) {
        if (!app) return null;
        if (!app.grantContractDraft) {
            app.grantContractDraft = {
                fields: {},
                updatedAt: '',
                updatedByRole: '',
                updatedByName: ''
            };
        }
        if (!app.grantContractDraft.fields || typeof app.grantContractDraft.fields !== 'object') {
            app.grantContractDraft.fields = {};
        }
        return app.grantContractDraft;
    }

    function registerGrantContractDraft(app, payload) {
        if (!app) return null;
        var draft = ensureGrantContractDraft(app);
        if (!draft) return null;

        var fields = payload && payload.fields && typeof payload.fields === 'object' ? payload.fields : {};
        draft.fields = fields;
        draft.updatedAt = getCurrentDateTime();
        draft.updatedByRole = sanitizeText((payload && payload.updatedByRole) || 'Фасилитатор');
        draft.updatedByName = sanitizeText((payload && payload.updatedByName) || 'Фасилитатор');
        return draft;
    }

    function downloadGrantAgreementFile(appId) {
        var app = typeof appId === 'string' ? (window.getApp ? window.getApp(appId) : null) : appId;
        if (!app) {
            notifyMessage('error', 'Заявка не найдена / Дархост ёфт нашуд');
            return;
        }

        var agreement = ensureGrantAgreement(app);
        if (!agreement || !agreement.uploaded || !agreement.fileName) {
            notifyMessage('warning', 'Подписанный договор еще не загружен / Шартномаи имзошуда ҳанӯз бор нашудааст');
            return;
        }

        if (agreement.fileDataUrl) {
            var linkFile = document.createElement('a');
            linkFile.setAttribute('href', agreement.fileDataUrl);
            linkFile.setAttribute('download', agreement.fileName || ('GrantAgreement_' + app.id + '.pdf'));
            document.body.appendChild(linkFile);
            linkFile.click();
            document.body.removeChild(linkFile);
            return;
        }

        var lines = [
            'SIGNED GRANT AGREEMENT / ПОДПИСАННЫЙ ДОГОВОР О ГРАНТЕ',
            'ID: ' + app.id,
            'Заявитель: ' + sanitizeText(app.name || ''),
            'Файл: ' + sanitizeText(agreement.fileName),
            'Загружен: ' + sanitizeText(agreement.uploadedAt || '—'),
            'Роль: ' + sanitizeText(agreement.uploadedByRole || '—'),
            'Пользователь: ' + sanitizeText(agreement.uploadedByName || '—')
        ];

        if (agreement.note) {
            lines.push('Комментарий: ' + sanitizeText(agreement.note));
        }

        var blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'GrantAgreement_' + app.id + '.txt');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function downloadBusinessPlanFile(appId) {
        var app = typeof appId === 'string' ? (window.getApp ? window.getApp(appId) : null) : appId;
        if (!app) {
            notifyMessage('error', 'Заявка не найдена / Дархост ёфт нашуд');
            return;
        }

        var docs = ensureDocumentBundle(app);
        var currentWord = getCurrentWordVersionInfo(app);
        var pdf = docs.basePdf ? docs.basePdf.name : '—';
        var photos = docs.basePhotos || [];

        var content = [
            'BUSINESS PLAN PACKAGE / ПАКЕТ БИЗНЕС-ПЛАНА',
            'ID: ' + app.id,
            'Заявитель: ' + sanitizeText(app.name || ''),
            'Текущая версия Word: ' + (currentWord ? ('V' + currentWord.version + ' (' + currentWord.name + ')') : '—'),
            'PDF (фиксированный): ' + pdf,
            'Фото (фиксированные): ' + (photos.length ? photos.map(function (p) { return p.name; }).join(', ') : '—'),
            '',
            'История версий Word:'
        ];

        if (!docs.wordVersions.length) {
            content.push('- Нет версий');
        } else {
            docs.wordVersions.forEach(function (v) {
                content.push('- V' + v.version + ': ' + v.name + ' [' + v.uploadedAt + ', ' + v.uploadedByRole + ']');
            });
        }

        var blob = new Blob([content.join('\n')], { type: 'text/plain;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.setAttribute('href', url);
        var versionSuffix = currentWord ? ('_V' + currentWord.version) : '';
        link.setAttribute('download', 'BusinessPlan_' + app.id + versionSuffix + '.txt');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function downloadBusinessPlanPdfFile(appId) {
        var app = typeof appId === 'string' ? (window.getApp ? window.getApp(appId) : null) : appId;
        if (!app) {
            notifyMessage('error', 'Заявка не найдена / Дархост ёфт нашуд');
            return;
        }

        var docs = ensureDocumentBundle(app);
        if (!docs.basePdf || !docs.basePdf.name) {
            notifyMessage('warning', 'PDF пока не загружен / PDF то ҳол бор нашудааст');
            return;
        }

        var content = [
            'FIXED PDF ATTACHMENT / ФИКСИРОВАННОЕ PDF-ВЛОЖЕНИЕ',
            'ID: ' + app.id,
            'Заявитель: ' + sanitizeText(app.name || ''),
            'Файл: ' + sanitizeText(docs.basePdf.name),
            'Загружен: ' + sanitizeText(docs.basePdf.uploadedAt || '—'),
            'Роль: ' + sanitizeText(docs.basePdf.uploadedByRole || '—')
        ];

        var blob = new Blob([content.join('\n')], { type: 'text/plain;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'BusinessPlanPDF_' + app.id + '.txt');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function downloadBusinessPlanPhotoPack(appId) {
        var app = typeof appId === 'string' ? (window.getApp ? window.getApp(appId) : null) : appId;
        if (!app) {
            notifyMessage('error', 'Заявка не найдена / Дархост ёфт нашуд');
            return;
        }

        var docs = ensureDocumentBundle(app);
        var photos = docs.basePhotos || [];
        if (!photos.length) {
            notifyMessage('warning', 'Фото-комплект пока не загружен / Маҷмӯи аксҳо то ҳол бор нашудааст');
            return;
        }

        var lines = [
            'FIXED PHOTO PACK / ФИКСИРОВАННЫЙ ФОТО-КОМПЛЕКТ',
            'ID: ' + app.id,
            'Заявитель: ' + sanitizeText(app.name || ''),
            'Количество фото: ' + photos.length,
            ''
        ];

        photos.forEach(function (p) {
            lines.push('Фото ' + p.slot + ': ' + sanitizeText(p.name) + ' [' + sanitizeText(p.uploadedAt || '—') + ']');
        });

        var blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'BusinessPlanPhotos_' + app.id + '.txt');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function getApplicationDocumentCompleteness(app) {
        if (!app) {
            return {
                hasWord: false,
                hasPdf: false,
                hasPhotos4: false,
                photosCount: 0,
                hasAgreement: false,
                isBasePackageComplete: false,
                isFullPackageComplete: false,
                missingItemsRu: ['Word', 'PDF', 'Фото (4)', 'Подписанный договор']
            };
        }

        var docs = ensureDocumentBundle(app);
        var agreement = ensureGrantAgreement(app);
        var photosCount = Array.isArray(docs.basePhotos) ? docs.basePhotos.length : 0;
        var hasWord = !!(docs.wordVersions && docs.wordVersions.length > 0);
        var hasPdf = !!(docs.basePdf && docs.basePdf.name);
        var hasPhotos4 = photosCount === 4;
        var hasAgreement = !!(agreement && agreement.uploaded && agreement.fileName);

        var missingItemsRu = [];
        if (!hasWord) missingItemsRu.push('Word');
        if (!hasPdf) missingItemsRu.push('PDF');
        if (!hasPhotos4) missingItemsRu.push('Фото (4)');
        if (!hasAgreement) missingItemsRu.push('Подписанный договор');

        var isBasePackageComplete = hasWord && hasPdf && hasPhotos4;
        return {
            hasWord: hasWord,
            hasPdf: hasPdf,
            hasPhotos4: hasPhotos4,
            photosCount: photosCount,
            hasAgreement: hasAgreement,
            isBasePackageComplete: isBasePackageComplete,
            isFullPackageComplete: isBasePackageComplete && hasAgreement,
            missingItemsRu: missingItemsRu
        };
    }

    window.AppCore = window.AppCore || {};
    window.AppCore.utils = {
        getCurrentDateTime,
        addLog,
        sanitizeText,
        sanitizeCsvField,
        parseRuDate,
        toIsoDate,
        addMonths,
        formatIsoDateRu,
        getPostponedUntilIso,
        isPostponedUnlockReady,
        ensureDocumentBundle,
        registerBaseDocuments,
        registerWordVersion,
        getCurrentWordVersionInfo,
        ensureGrantAgreement,
        registerGrantAgreement,
        ensureGrantContractDraft,
        registerGrantContractDraft,
        getApplicationDocumentCompleteness,
        AppNotify,
        downloadGrantAgreementFile,
        downloadBusinessPlanFile,
        downloadBusinessPlanPdfFile,
        downloadBusinessPlanPhotoPack
    };

    // Legacy compatibility while migrating code out of grant.html
    window.getCurrentDateTime = getCurrentDateTime;
    window.addLog = addLog;
    window.sanitizeText = sanitizeText;
    window.sanitizeCsvField = sanitizeCsvField;
    window.parseRuDate = parseRuDate;
    window.toIsoDate = toIsoDate;
    window.addMonths = addMonths;
    window.formatIsoDateRu = formatIsoDateRu;
    window.getPostponedUntilIso = getPostponedUntilIso;
    window.isPostponedUnlockReady = isPostponedUnlockReady;
    window.ensureDocumentBundle = ensureDocumentBundle;
    window.registerBaseDocuments = registerBaseDocuments;
    window.registerWordVersion = registerWordVersion;
    window.getCurrentWordVersionInfo = getCurrentWordVersionInfo;
    window.ensureGrantAgreement = ensureGrantAgreement;
    window.registerGrantAgreement = registerGrantAgreement;
    window.ensureGrantContractDraft = ensureGrantContractDraft;
    window.registerGrantContractDraft = registerGrantContractDraft;
    window.getApplicationDocumentCompleteness = getApplicationDocumentCompleteness;
    window.AppNotify = AppNotify;
    window.downloadGrantAgreementFile = downloadGrantAgreementFile;
    window.downloadBusinessPlanFile = downloadBusinessPlanFile;
    window.downloadBusinessPlanPdfFile = downloadBusinessPlanPdfFile;
    window.downloadBusinessPlanPhotoPack = downloadBusinessPlanPhotoPack;
})();
