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
        // toast modal
        toastOverlay: null,
        toastCard: null,
        toastIcon: null,
        toastTitle: null,
        toastText: null,
        toastCloseBtn: null,
        toastTimer: null,
        // confirm modal
        modalHost: null,
        modalCard: null,
        modalIcon: null,
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

    function makeModalOverlay(id, zIndex) {
        var el = document.createElement('div');
        el.id = id;
        el.style.position = 'fixed';
        el.style.top = '0';
        el.style.left = '0';
        el.style.width = '100%';
        el.style.height = '100%';
        el.style.background = 'rgba(0,0,0,0.4)';
        el.style.backdropFilter = 'blur(4px)';
        el.style.webkitBackdropFilter = 'blur(4px)';
        el.style.display = 'none';
        el.style.justifyContent = 'center';
        el.style.alignItems = 'center';
        el.style.zIndex = String(zIndex || 9998);
        el.style.padding = '18px';
        return el;
    }

    function makeModalCard() {
        var card = document.createElement('div');
        card.style.background = '#ffffff';
        card.style.width = '100%';
        card.style.maxWidth = '360px';
        card.style.padding = '28px 24px 22px';
        card.style.borderRadius = '20px';
        card.style.textAlign = 'center';
        card.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.2), 0 8px 10px -6px rgba(0,0,0,0.1)';
        card.style.border = '1px solid #e5e7eb';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
        card.style.transition = 'opacity 0.25s ease, transform 0.25s cubic-bezier(0.34,1.56,0.64,1)';
        return card;
    }

    function makeIconCircle() {
        var icon = document.createElement('div');
        icon.style.width = '60px';
        icon.style.height = '60px';
        icon.style.borderRadius = '50%';
        icon.style.display = 'flex';
        icon.style.justifyContent = 'center';
        icon.style.alignItems = 'center';
        icon.style.margin = '0 auto 18px';
        icon.style.fontSize = '28px';
        icon.style.fontWeight = 'bold';
        icon.style.flexShrink = '0';
        return icon;
    }

    function animateCardIn(card) {
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
            });
        });
    }

    function animateCardOut(card, done) {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.92)';
        setTimeout(done, 220);
    }

    function ensureNotifyUi() {
        if (notifyState.initialized) return;
        notifyState.initialized = true;

        // ── Toast modal ──────────────────────────────────────────────
        var toastOverlay = makeModalOverlay('app-toast-overlay', 9998);
        var toastCard = makeModalCard();
        var toastIcon = makeIconCircle();

        var toastTitle = document.createElement('h3');
        toastTitle.style.margin = '0 0 10px 0';
        toastTitle.style.fontSize = '17px';
        toastTitle.style.fontWeight = '700';
        toastTitle.style.color = '#0f172a';
        toastTitle.style.lineHeight = '1.3';

        var toastText = document.createElement('p');
        toastText.style.margin = '0 0 20px 0';
        toastText.style.fontSize = '14px';
        toastText.style.color = '#334155';
        toastText.style.lineHeight = '1.55';

        var toastCloseBtn = document.createElement('button');
        toastCloseBtn.type = 'button';
        toastCloseBtn.textContent = 'Понятно';
        toastCloseBtn.style.padding = '10px 32px';
        toastCloseBtn.style.border = 'none';
        toastCloseBtn.style.borderRadius = '12px';
        toastCloseBtn.style.fontWeight = '700';
        toastCloseBtn.style.fontSize = '15px';
        toastCloseBtn.style.cursor = 'pointer';
        toastCloseBtn.style.color = '#ffffff';

        toastCard.appendChild(toastIcon);
        toastCard.appendChild(toastTitle);
        toastCard.appendChild(toastText);
        toastCard.appendChild(toastCloseBtn);
        toastOverlay.appendChild(toastCard);
        document.body.appendChild(toastOverlay);

        toastOverlay.addEventListener('click', function (e) {
            if (e.target === toastOverlay) closeToast();
        });
        toastCloseBtn.addEventListener('click', closeToast);

        notifyState.toastOverlay = toastOverlay;
        notifyState.toastCard = toastCard;
        notifyState.toastIcon = toastIcon;
        notifyState.toastTitle = toastTitle;
        notifyState.toastText = toastText;
        notifyState.toastCloseBtn = toastCloseBtn;

        // ── Confirm modal ────────────────────────────────────────────
        var confirmOverlay = makeModalOverlay('app-confirm-overlay', 9999);
        var confirmCard = makeModalCard();
        var confirmIcon = makeIconCircle();

        var confirmTitle = document.createElement('h3');
        confirmTitle.style.margin = '0 0 10px 0';
        confirmTitle.style.fontSize = '17px';
        confirmTitle.style.fontWeight = '700';
        confirmTitle.style.color = '#0f172a';
        confirmTitle.style.lineHeight = '1.3';

        var confirmMsg = document.createElement('p');
        confirmMsg.style.margin = '0 0 10px 0';
        confirmMsg.style.fontSize = '14px';
        confirmMsg.style.color = '#334155';
        confirmMsg.style.lineHeight = '1.5';

        var confirmCons = document.createElement('p');
        confirmCons.style.margin = '0 0 4px 0';
        confirmCons.style.fontSize = '13px';
        confirmCons.style.color = '#475569';
        confirmCons.style.lineHeight = '1.45';
        confirmCons.style.background = '#f8fafc';
        confirmCons.style.border = '1px solid #e2e8f0';
        confirmCons.style.borderRadius = '10px';
        confirmCons.style.padding = '10px 12px';
        confirmCons.style.textAlign = 'left';

        var confirmActions = document.createElement('div');
        confirmActions.style.display = 'flex';
        confirmActions.style.justifyContent = 'center';
        confirmActions.style.gap = '10px';
        confirmActions.style.marginTop = '18px';

        var cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.style.padding = '10px 22px';
        cancelBtn.style.border = '1px solid #cbd5e1';
        cancelBtn.style.background = '#ffffff';
        cancelBtn.style.color = '#334155';
        cancelBtn.style.borderRadius = '12px';
        cancelBtn.style.fontWeight = '600';
        cancelBtn.style.fontSize = '14px';
        cancelBtn.style.cursor = 'pointer';

        var confirmBtn = document.createElement('button');
        confirmBtn.type = 'button';
        confirmBtn.style.padding = '10px 22px';
        confirmBtn.style.border = '1px solid #16a34a';
        confirmBtn.style.background = '#16a34a';
        confirmBtn.style.color = '#ffffff';
        confirmBtn.style.borderRadius = '12px';
        confirmBtn.style.fontWeight = '700';
        confirmBtn.style.fontSize = '14px';
        confirmBtn.style.cursor = 'pointer';

        confirmActions.appendChild(cancelBtn);
        confirmActions.appendChild(confirmBtn);
        confirmCard.appendChild(confirmIcon);
        confirmCard.appendChild(confirmTitle);
        confirmCard.appendChild(confirmMsg);
        confirmCard.appendChild(confirmCons);
        confirmCard.appendChild(confirmActions);
        confirmOverlay.appendChild(confirmCard);
        document.body.appendChild(confirmOverlay);

        confirmOverlay.addEventListener('click', function (e) {
            if (e.target === confirmOverlay) closeConfirm(false);
        });
        cancelBtn.addEventListener('click', function () { closeConfirm(false); });
        confirmBtn.addEventListener('click', function () { closeConfirm(true); });

        notifyState.modalHost = confirmOverlay;
        notifyState.modalCard = confirmCard;
        notifyState.modalIcon = confirmIcon;
        notifyState.modalTitle = confirmTitle;
        notifyState.modalMessage = confirmMsg;
        notifyState.modalConsequence = confirmCons;
        notifyState.modalCancelBtn = cancelBtn;
        notifyState.modalConfirmBtn = confirmBtn;
    }

    function closeConfirm(result) {
        if (!notifyState.modalHost) return;
        var overlay = notifyState.modalHost;
        animateCardOut(notifyState.modalCard, function () {
            overlay.style.display = 'none';
        });
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

        // Icon: question mark in amber
        notifyState.modalIcon.style.background = '#fef9c3';
        notifyState.modalIcon.style.color = '#d97706';
        notifyState.modalIcon.style.border = '1px solid #fde68a';
        notifyState.modalIcon.textContent = '?';

        notifyState.modalTitle.textContent = safe.title || 'Подтвердите действие';
        notifyState.modalMessage.textContent = safe.message || '';
        notifyState.modalConsequence.textContent = safe.consequence || '';
        notifyState.modalConsequence.style.display = safe.consequence ? 'block' : 'none';
        notifyState.modalCancelBtn.textContent = (safe.buttons && safe.buttons.cancel) || 'Отмена';
        notifyState.modalConfirmBtn.textContent = (safe.buttons && safe.buttons.confirm) || 'Подтвердить';
        notifyState.modalConfirmBtn.style.borderColor = safe.confirmColor || '#16a34a';
        notifyState.modalConfirmBtn.style.background = safe.confirmColor || '#16a34a';

        // Reset animation state
        notifyState.modalCard.style.opacity = '0';
        notifyState.modalCard.style.transform = 'scale(0.9)';
        notifyState.modalHost.style.display = 'flex';
        animateCardIn(notifyState.modalCard);
        notifyState.modalCancelBtn.focus();

        return new Promise(function (resolve) {
            notifyState.confirmResolve = resolve;
            notifyState.escHandler = function (e) {
                if (e.key === 'Escape') closeConfirm(false);
            };
            document.addEventListener('keydown', notifyState.escHandler);
        });
    }

    function closeToast() {
        if (!notifyState.toastOverlay) return;
        if (notifyState.toastTimer) {
            clearTimeout(notifyState.toastTimer);
            notifyState.toastTimer = null;
        }
        animateCardOut(notifyState.toastCard, function () {
            if (notifyState.toastOverlay) notifyState.toastOverlay.style.display = 'none';
        });
    }

    function notifyToast(kind, title, message, timeoutMs) {
        ensureNotifyUi();

        var tone = kind || 'info';
        var palette = {
            success: {
                bg: '#dcfce7', color: '#16a34a', border: '#bbf7d0', icon: '✓',
                defaultTitle: 'Успешно'
            },
            info: {
                bg: '#dbeafe', color: '#2563eb', border: '#bfdbfe', icon: 'i',
                defaultTitle: 'Информация'
            },
            warning: {
                bg: '#fef9c3', color: '#d97706', border: '#fde68a', icon: '!',
                defaultTitle: 'Внимание'
            },
            error: {
                bg: '#fee2e2', color: '#ef4444', border: '#fecaca', icon: '!',
                defaultTitle: 'Ошибка'
            }
        };
        var ui = palette[tone] || palette.info;

        // Cancel any pending auto-dismiss
        if (notifyState.toastTimer) {
            clearTimeout(notifyState.toastTimer);
            notifyState.toastTimer = null;
        }

        // Set icon
        notifyState.toastIcon.style.background = ui.bg;
        notifyState.toastIcon.style.color = ui.color;
        notifyState.toastIcon.style.border = '1px solid ' + ui.border;
        notifyState.toastIcon.textContent = ui.icon;

        // Set button color
        notifyState.toastCloseBtn.style.background = ui.color;

        // Format message: strip "Что произошло:" prefix, pull route into text
        var raw = String(message || '');
        var routeIndex = raw.indexOf('Маршрут:');
        var displayText;
        if (routeIndex !== -1) {
            var summary = raw.slice(0, routeIndex).trim().replace(/[.\s]+$/, '');
            summary = summary.replace(/^Что произошло:\s*/i, '').trim();
            var routeTail = raw.slice(routeIndex).trim();
            displayText = summary + (routeTail ? '\n\n' + routeTail : '');
        } else {
            displayText = raw.replace(/^Что произошло:\s*/i, '').trim();
        }

        notifyState.toastTitle.textContent = title || ui.defaultTitle;
        notifyState.toastText.textContent = displayText;
        notifyState.toastText.style.whiteSpace = routeIndex !== -1 ? 'pre-line' : 'normal';

        // Animate in
        notifyState.toastCard.style.opacity = '0';
        notifyState.toastCard.style.transform = 'scale(0.9)';
        notifyState.toastOverlay.style.display = 'flex';
        animateCardIn(notifyState.toastCard);

        // Auto-dismiss for success/info; error/warning require manual close
        if (tone === 'success' || tone === 'info') {
            var delay = timeoutMs || (tone === 'success' ? 4000 : 5000);
            notifyState.toastTimer = setTimeout(closeToast, delay);
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

    function isFullyCompletedApplication(app) {
        if (!app || app.status !== 'approved') return false;
        var agreement = ensureGrantAgreement(app);
        return !!(agreement && agreement.uploaded && agreement.fileName);
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
                missingItemsRu: ['PDF', 'Фото (4)', 'Подписанный договор']
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
        if (!hasPdf) missingItemsRu.push('PDF');
        if (!hasPhotos4) missingItemsRu.push('Фото (4)');
        if (!hasAgreement) missingItemsRu.push('Подписанный договор');

        var isBasePackageComplete = hasPdf && hasPhotos4;
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
        isFullyCompletedApplication,
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
    window.isFullyCompletedApplication = isFullyCompletedApplication;
    window.ensureGrantContractDraft = ensureGrantContractDraft;
    window.registerGrantContractDraft = registerGrantContractDraft;
    window.getApplicationDocumentCompleteness = getApplicationDocumentCompleteness;
    window.AppNotify = AppNotify;
    window.downloadGrantAgreementFile = downloadGrantAgreementFile;
    window.downloadBusinessPlanFile = downloadBusinessPlanFile;
    window.downloadBusinessPlanPdfFile = downloadBusinessPlanPdfFile;
    window.downloadBusinessPlanPhotoPack = downloadBusinessPlanPhotoPack;
})();
