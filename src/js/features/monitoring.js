(function initMonitoringFeature() {
    window.AppFeatures = window.AppFeatures || {};
    if (window.AppFeatures.monitoring) return;

    function notifyMessage(kind, message, title) {
        if (window.AppNotify && typeof window.AppNotify.toast === 'function') {
            window.AppNotify.toast(kind || 'info', title || '', message || '');
            return;
        }
        alert((title ? (title + '\n') : '') + (message || ''));
    }

    let editingMonitoringVisitId = null;

    function normalizeMonitoringSequence(visits) {
        if (!Array.isArray(visits)) return;
        let nextActiveIndex = -1;
        visits.forEach(function (visit, index) {
            if (visit.status !== 'completed' && nextActiveIndex === -1) {
                nextActiveIndex = index;
            }
        });
        visits.forEach(function (visit, index) {
            if (visit.status === 'completed') return;
            visit.status = index === nextActiveIndex ? 'active' : 'pending';
            if (visit.status === 'active' && typeof visit.daysLeft !== 'number') {
                visit.daysLeft = visit.days;
            }
        });
    }

    function generateMonitoringFor(appId, startDateStr) {
        if (!window.state) return;
        const app = typeof window.getApp === 'function' ? window.getApp(appId) : null;
        if (!app || app.status !== 'approved' || app.grantActive !== true) return;
        if (!window.state.monitoring) window.state.monitoring = {};
        if (!window.state.monitoring[appId]) {
            const pDate = new Date(startDateStr || new Date().toISOString().split('T')[0]);
            const addDays = function (d) {
                const nd = new Date(pDate);
                nd.setDate(nd.getDate() + d);
                return nd.toLocaleDateString('ru-RU');
            };
            window.state.monitoring[appId] = [
                { id: 1, days: 30, status: 'active', plannedDate: addDays(30), visitDate: '', fundsUsed: '', fundsUsedNote: '', activities: [], incomeStatus: '', continuePlan: '', score: null, note: '' },
                { id: 2, days: 90, status: 'pending', plannedDate: addDays(90), visitDate: '', businessStatus: '', businessStatusNote: '', grantImpact: '', grantImpactNote: '', incomeChange: '', incomeChangeNote: '', incomeRange: '', continuePlan2: '', score: null, note: '' },
                { id: 3, days: 180, status: 'pending', plannedDate: addDays(180) },
                { id: 4, days: 360, status: 'pending', plannedDate: addDays(360) }
            ];
        }
        normalizeMonitoringSequence(window.state.monitoring[appId]);
    }

    function getEqBadge(st) {
        if (st === 'in_stock') return '<span class="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> Дар мавҷудият <span class="ru font-normal">/ В наличии</span></span>';
        if (st === 'not_used') return '<span class="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-amber-500"></span> Истифода нашуд <span class="ru font-normal">/ Не используется</span></span>';
        if (st === 'sold') return '<span class="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-red-500"></span> Фурӯхта шуд <span class="ru font-normal">/ Продано</span></span>';
        return '';
    }

    function getBizBadge(st) {
        if (st === 'active') return '<span class="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Фаъол <span class="ru font-normal">/ Активен</span></span>';
        if (st === 'suspended') return '<span class="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Боздошташуда <span class="ru font-normal">/ Приостановлен</span></span>';
        if (st === 'closed') return '<span class="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Пӯшида <span class="ru font-normal">/ Закрыт</span></span>';
        return '';
    }

    // --- Первый месяц (Визит 1): бальная анкета освоения/запуска ---
    const FUNDS_OPTIONS = [
        { value: 'full', score: 2, label: 'Ҳа, пурра <span class="ru font-normal">/ Да, полностью</span>' },
        { value: 'partial', score: 1, label: 'Қисман <span class="ru font-normal">/ Частично</span>' },
        { value: 'none', score: 0, label: 'Не, ҳанӯз истифода накардаам <span class="ru font-normal">/ Нет, ещё не использовал(а)</span>' },
        { value: 'other', score: 0, label: 'Дигар <span class="ru font-normal">/ Другое</span>' }
    ];
    const ACTIVITY_OPTIONS = [
        { value: 'equipment', score: 1, label: 'Таҷҳизот / техника харидорӣ шуд <span class="ru font-normal">/ Закуплено оборудование/техника</span>' },
        { value: 'materials', score: 1, label: 'Ашё / маводи хом харидорӣ шуд <span class="ru font-normal">/ Закуплено сырьё/материалы</span>' },
        { value: 'rent', score: 1, label: 'Иҷора / таъмири ҷой <span class="ru font-normal">/ Арендовано/отремонтировано помещение</span>' },
        { value: 'training', score: 1, label: 'Таълим / машварат гирифта шуд <span class="ru font-normal">/ Пройдено обучение/консультации</span>' },
        { value: 'none', score: 0, label: 'Ҳанӯз чизе накардаам <span class="ru font-normal">/ Ничего ещё не сделано</span>' }
    ];
    const INCOME_OPTIONS = [
        { value: 'sales', score: 2, label: 'Ҳа, аллакай фурӯш / даромад ҳаст <span class="ru font-normal">/ Да, уже есть продажи/доход</span>' },
        { value: 'launched_no_income', score: 1, label: 'Даромад нест, вале тиҷорат оғоз шудааст <span class="ru font-normal">/ Дохода пока нет, но бизнес запущен</span>' },
        { value: 'not_launched', score: 0, label: 'Тиҷорат ҳанӯз оғоз нашудааст <span class="ru font-normal">/ Бизнес ещё не запущен</span>' }
    ];
    const CONTINUE_OPTIONS = [
        { value: 'yes', score: 1, label: 'Ҳа, албатта идома медиҳам <span class="ru font-normal">/ Да, точно продолжу</span>' },
        { value: 'unsure', score: 0, label: 'Ҳанӯз мутмаин нестам <span class="ru font-normal">/ Пока не уверен(а)</span>' },
        { value: 'no', score: 0, label: 'Не <span class="ru font-normal">/ Нет</span>' }
    ];
    const FIRST_MONTH_MAX_SCORE = Math.max.apply(null, FUNDS_OPTIONS.map(function (o) { return o.score; }))
        + 2 // активности ограничены максимум 2 баллами
        + Math.max.apply(null, INCOME_OPTIONS.map(function (o) { return o.score; }))
        + Math.max.apply(null, CONTINUE_OPTIONS.map(function (o) { return o.score; }));

    function findOption(list, value) {
        return list.find(function (o) { return o.value === value; }) || null;
    }

    function computeFirstMonthScore(fundsVal, activityVals, incomeVal, continueVal) {
        const fundsScore = findOption(FUNDS_OPTIONS, fundsVal) ? findOption(FUNDS_OPTIONS, fundsVal).score : 0;
        const activitiesScoreRaw = (activityVals || []).reduce(function (sum, val) {
            const opt = findOption(ACTIVITY_OPTIONS, val);
            return sum + (opt ? opt.score : 0);
        }, 0);
        const activitiesScore = Math.min(2, activitiesScoreRaw);
        const incomeScore = findOption(INCOME_OPTIONS, incomeVal) ? findOption(INCOME_OPTIONS, incomeVal).score : 0;
        const continueScore = findOption(CONTINUE_OPTIONS, continueVal) ? findOption(CONTINUE_OPTIONS, continueVal).score : 0;
        return fundsScore + activitiesScore + incomeScore + continueScore;
    }

    function getFirstMonthResultBadge(score) {
        if (score >= 4) return '<span class="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Муваффақ (оғоз) <span class="ru font-normal">/ Успешно (запуск)</span></span>';
        if (score >= 2) return '<span class="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Самараи қисман <span class="ru font-normal">/ Частичный эффект</span></span>';
        return '<span class="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Бе таъсир <span class="ru font-normal">/ Без эффекта</span></span>';
    }

    // --- Визит 2 (+90 дней): анкета устойчивости и влияния гранта ---
    const BIZ_STATUS_OPTIONS = [
        { value: 'active', score: 2, label: 'Ҳа, доимо кор мекунад <span class="ru font-normal">/ Да, работает постоянно</span>' },
        { value: 'seasonal', score: 1, label: 'Мавсимӣ / вақт ба вақт кор мекунад <span class="ru font-normal">/ Работает сезонно / время от времени</span>' },
        { value: 'paused', score: 0, label: 'Муваққатан кор намекунад <span class="ru font-normal">/ Временно не работает</span>' },
        { value: 'closed', score: 0, label: 'Пӯшида шуд <span class="ru font-normal">/ Закрылся</span>' },
        { value: 'other', score: 0, label: 'Дигар <span class="ru font-normal">/ Другое</span>' }
    ];
    const GRANT_IMPACT_OPTIONS = [
        { value: 'new_business', score: 2, label: 'Имкон дод тиҷорати нав кушода шавад <span class="ru font-normal">/ Позволил открыть новый бизнес</span>' },
        { value: 'expanded', score: 2, label: 'Имкон дод тиҷорати мавҷуда густариш ёбад <span class="ru font-normal">/ Позволил расширить действующий бизнес</span>' },
        { value: 'preserved', score: 1, label: 'Кӯмак кард тиҷорат нигоҳ дошта шавад <span class="ru font-normal">/ Помог сохранить бизнес</span>' },
        { value: 'no_effect', score: 0, label: 'Таъсири назаррас набуд <span class="ru font-normal">/ Существенного влияния не было</span>' },
        { value: 'other', score: 0, label: 'Дигар <span class="ru font-normal">/ Другое</span>' }
    ];
    const INCOME_CHANGE_OPTIONS = [
        { value: 'increased_much', score: 2, label: 'Хеле зиёд шуд <span class="ru font-normal">/ Значительно увеличился</span>' },
        { value: 'increased_little', score: 1, label: 'Каме зиёд шуд <span class="ru font-normal">/ Немного увеличился</span>' },
        { value: 'unchanged', score: 0, label: 'Тағйир наёфт <span class="ru font-normal">/ Не изменился</span>' },
        { value: 'decreased', score: 0, label: 'Кам шуд <span class="ru font-normal">/ Уменьшился</span>' },
        { value: 'hard_to_say', score: 0, label: 'Ҳанӯз баҳо додан душвор аст <span class="ru font-normal">/ Пока трудно оценить</span>' },
        { value: 'other', score: 0, label: 'Дигар <span class="ru font-normal">/ Другое</span>' }
    ];
    const INCOME_RANGE_OPTIONS = [
        { value: 'up_to_1000', label: 'То 1 000 сомонӣ <span class="ru font-normal">/ До 1 000 сомони</span>' },
        { value: '1001_3000', label: '1 001–3 000 сомонӣ <span class="ru font-normal">/ 1 001–3 000 сомони</span>' },
        { value: '3001_5000', label: '3 001–5 000 сомонӣ <span class="ru font-normal">/ 3 001–5 000 сомони</span>' },
        { value: '5001_10000', label: '5 001–10 000 сомонӣ <span class="ru font-normal">/ 5 001–10 000 сомони</span>' },
        { value: 'more_10000', label: 'Зиёда аз 10 000 сомонӣ <span class="ru font-normal">/ Более 10 000 сомони</span>' },
        { value: 'not_started', label: 'Оғоз нашудааст <span class="ru font-normal">/ Не начал</span>' },
        { value: 'undisclosed', label: 'Намехоҳам нишон диҳам <span class="ru font-normal">/ Не желаю указывать</span>' }
    ];
    const CONTINUE2_OPTIONS = [
        { value: 'expand', score: 1, label: 'Ҳа, густариш нақша дорам <span class="ru font-normal">/ Да, планирую расширение</span>' },
        { value: 'continue', score: 1, label: 'Ҳа, дар шакли ҳозира идома медиҳам <span class="ru font-normal">/ Да, продолжу в текущем виде</span>' },
        { value: 'unsure', score: 0, label: 'Ҳанӯз мутмаин нестам <span class="ru font-normal">/ Пока не уверен(а)</span>' },
        { value: 'no', score: 0, label: 'Не <span class="ru font-normal">/ Нет</span>' }
    ];
    const VISIT2_MAX_SCORE = Math.max.apply(null, BIZ_STATUS_OPTIONS.map(function (o) { return o.score; }))
        + Math.max.apply(null, GRANT_IMPACT_OPTIONS.map(function (o) { return o.score; }))
        + Math.max.apply(null, INCOME_CHANGE_OPTIONS.map(function (o) { return o.score; }))
        + Math.max.apply(null, CONTINUE2_OPTIONS.map(function (o) { return o.score; }));

    function computeVisit2Score(bizVal, impactVal, incomeChangeVal, continueVal) {
        const bizScore = findOption(BIZ_STATUS_OPTIONS, bizVal) ? findOption(BIZ_STATUS_OPTIONS, bizVal).score : 0;
        const impactScore = findOption(GRANT_IMPACT_OPTIONS, impactVal) ? findOption(GRANT_IMPACT_OPTIONS, impactVal).score : 0;
        const incomeChangeScore = findOption(INCOME_CHANGE_OPTIONS, incomeChangeVal) ? findOption(INCOME_CHANGE_OPTIONS, incomeChangeVal).score : 0;
        const continueScore = findOption(CONTINUE2_OPTIONS, continueVal) ? findOption(CONTINUE2_OPTIONS, continueVal).score : 0;
        return bizScore + impactScore + incomeChangeScore + continueScore;
    }

    function getVisit2ResultBadge(score) {
        if (score >= 6) return '<span class="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Муваффақ <span class="ru font-normal">/ Успешно</span></span>';
        if (score >= 3) return '<span class="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Самараи қисман <span class="ru font-normal">/ Частичный эффект</span></span>';
        return '<span class="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Бе таъсир <span class="ru font-normal">/ Без эффекта</span></span>';
    }

    function buildOptionsHtml(list, groupName, visitId, type, selectedValues) {
        return list.map(function (opt) {
            const inputType = type === 'checkbox' ? 'checkbox' : 'radio';
            const isSelected = type === 'checkbox'
                ? (selectedValues || []).indexOf(opt.value) > -1
                : selectedValues === opt.value;
            const changeAttr = groupName === 'act' ? ' onchange="handleActivityChange(' + visitId + ',\'' + opt.value + '\')"' : '';
            return '<label class="flex items-start gap-2 border border-white bg-white/60 rounded-lg p-2 cursor-pointer hover:bg-white text-[12px]"><input type="' + inputType + '" name="' + groupName + '-' + visitId + '" value="' + opt.value + '" class="mt-0.5 accent-indigo-500 w-3.5 h-3.5 flex-shrink-0"' + (isSelected ? ' checked' : '') + changeAttr + '><span>' + opt.label + '</span></label>';
        }).join('');
    }

    function handleActivityChange(visitId, value) {
        const group = document.querySelectorAll('input[name="act-' + visitId + '"]');
        if (!group.length) return;
        if (value === 'none') {
            const noneInput = document.querySelector('input[name="act-' + visitId + '"][value="none"]');
            if (noneInput && noneInput.checked) {
                group.forEach(function (input) { if (input.value !== 'none') input.checked = false; });
            }
        } else {
            const noneInput = document.querySelector('input[name="act-' + visitId + '"][value="none"]');
            if (noneInput) noneInput.checked = false;
        }
    }

    function toggleMonitoringForm(visitId) {
        const form = document.getElementById('mon-form-' + visitId);
        const btn = document.getElementById('btn-open-mon-' + visitId);
        if (!form || !btn) return;
        if (form.classList.contains('hidden')) {
            form.classList.remove('hidden');
            btn.innerHTML = 'Пӯшидан <span class="ru font-normal">/ Скрыть</span>';
        } else {
            if (editingMonitoringVisitId === visitId) {
                editingMonitoringVisitId = null;
                renderMonitoringList();
                return;
            }
            form.classList.add('hidden');
            btn.innerHTML = 'Пур кардан <span class="ru font-normal">/ Оформить</span>';
        }
    }

    function editMonitoringVisit(visitId) {
        editingMonitoringVisitId = visitId;
        renderMonitoringList();
    }

    function checkAlert(visitId) {
        const selected = document.querySelector('input[name="eq-' + visitId + '"]:checked');
        const eqVal = selected ? selected.value : '';
        const alertEl = document.getElementById('alert-eq-' + visitId);
        if (!alertEl) return;
        if (eqVal === 'sold') alertEl.classList.remove('hidden');
        else alertEl.classList.add('hidden');
    }

    function saveFirstMonthVisit(visitId, monData, visitIndex) {
        const fundsSelected = document.querySelector('input[name="funds-' + visitId + '"]:checked');
        const fundsVal = fundsSelected ? fundsSelected.value : '';
        const activityInputs = document.querySelectorAll('input[name="act-' + visitId + '"]:checked');
        const activityVals = Array.prototype.map.call(activityInputs, function (input) { return input.value; });
        const incomeSelected = document.querySelector('input[name="income-' + visitId + '"]:checked');
        const incomeVal = incomeSelected ? incomeSelected.value : '';
        const continueSelected = document.querySelector('input[name="continue-' + visitId + '"]:checked');
        const continueVal = continueSelected ? continueSelected.value : '';
        const fundsNoteInput = document.getElementById('funds-note-' + visitId);
        const fundsNoteVal = fundsNoteInput ? fundsNoteInput.value : '';
        const noteInput = document.getElementById('note-' + visitId);
        const noteVal = noteInput ? noteInput.value : '';

        if (!fundsVal || activityVals.length === 0 || !incomeVal || !continueVal) {
            notifyMessage('warning', 'Лутфан ҳамаи майдонҳои ҳатмиро пур кунед! / Пожалуйста, заполните все обязательные поля!');
            return false;
        }

        const isEditing = editingMonitoringVisitId === visitId;
        const score = computeFirstMonthScore(fundsVal, activityVals, incomeVal, continueVal);
        monData[visitIndex].status = 'completed';
        if (!isEditing || !monData[visitIndex].visitDate) {
            monData[visitIndex].visitDate = window.getCurrentDateTime().split(',')[0];
        }
        monData[visitIndex].fundsUsed = fundsVal;
        monData[visitIndex].fundsUsedNote = fundsVal === 'other' ? fundsNoteVal : '';
        monData[visitIndex].activities = activityVals;
        monData[visitIndex].incomeStatus = incomeVal;
        monData[visitIndex].continuePlan = continueVal;
        monData[visitIndex].note = noteVal;
        monData[visitIndex].score = score;

        const positiveResult = score >= 4;
        if (positiveResult && visitIndex + 1 < monData.length && monData[visitIndex + 1].status !== 'completed') {
            monData[visitIndex + 1].status = 'active';
            monData[visitIndex + 1].daysLeft = monData[visitIndex + 1].days;
        }
        if (!positiveResult) {
            monData.slice(visitIndex + 1).forEach(function (visit) {
                if (visit.status !== 'completed') visit.status = 'pending';
            });
        }
        return true;
    }

    function saveStandardVisit(visitId, monData, visitIndex) {
        const eqSelected = document.querySelector('input[name="eq-' + visitId + '"]:checked');
        const eqVal = eqSelected ? eqSelected.value : '';
        const bizInput = document.getElementById('biz-' + visitId);
        const noteInput = document.getElementById('note-' + visitId);
        const bizVal = bizInput ? bizInput.value : '';
        const noteVal = noteInput ? noteInput.value : '';

        if (!eqVal || !bizVal) {
            notifyMessage('warning', 'Лутфан ҳамаи майдонҳои ҳатмиро пур кунед! / Пожалуйста, заполните все обязательные поля!');
            return false;
        }

        const isEditing = editingMonitoringVisitId === visitId;
        monData[visitIndex].status = 'completed';
        if (!isEditing || !monData[visitIndex].visitDate) {
            monData[visitIndex].visitDate = window.getCurrentDateTime().split(',')[0];
        }
        monData[visitIndex].equipment = eqVal;
        monData[visitIndex].business = bizVal;
        monData[visitIndex].note = noteVal;
        const positiveResult = eqVal === 'in_stock' && bizVal === 'active';
        if (positiveResult && visitIndex + 1 < monData.length && monData[visitIndex + 1].status !== 'completed') {
            monData[visitIndex + 1].status = 'active';
            monData[visitIndex + 1].daysLeft = monData[visitIndex + 1].days;
        }
        if (!positiveResult) {
            monData.slice(visitIndex + 1).forEach(function (visit) {
                if (visit.status !== 'completed') visit.status = 'pending';
            });
        }
        if (eqVal === 'sold') {
            notifyMessage('warning', 'Что произошло: зафиксирована продажа оборудования, уведомление отправлено Администратору. Маршрут: Мониторинг -> Администратор. Следующий статус заявки: без изменений.');
        }
        return true;
    }

    function saveVisit2(visitId, monData, visitIndex) {
        const bizSelected = document.querySelector('input[name="biz2-' + visitId + '"]:checked');
        const bizVal = bizSelected ? bizSelected.value : '';
        const bizNoteInput = document.getElementById('biz2-note-' + visitId);
        const bizNoteVal = bizNoteInput ? bizNoteInput.value : '';
        const impactSelected = document.querySelector('input[name="impact-' + visitId + '"]:checked');
        const impactVal = impactSelected ? impactSelected.value : '';
        const impactNoteInput = document.getElementById('impact-note-' + visitId);
        const impactNoteVal = impactNoteInput ? impactNoteInput.value : '';
        const incomeChangeSelected = document.querySelector('input[name="incchange-' + visitId + '"]:checked');
        const incomeChangeVal = incomeChangeSelected ? incomeChangeSelected.value : '';
        const incomeChangeNoteInput = document.getElementById('incchange-note-' + visitId);
        const incomeChangeNoteVal = incomeChangeNoteInput ? incomeChangeNoteInput.value : '';
        const incomeRangeSelected = document.querySelector('input[name="incrange-' + visitId + '"]:checked');
        const incomeRangeVal = incomeRangeSelected ? incomeRangeSelected.value : '';
        const continueSelected = document.querySelector('input[name="continue2-' + visitId + '"]:checked');
        const continueVal = continueSelected ? continueSelected.value : '';
        const noteInput = document.getElementById('note-' + visitId);
        const noteVal = noteInput ? noteInput.value : '';

        if (!bizVal || !impactVal || !incomeChangeVal || !incomeRangeVal || !continueVal) {
            notifyMessage('warning', 'Лутфан ҳамаи майдонҳои ҳатмиро пур кунед! / Пожалуйста, заполните все обязательные поля!');
            return false;
        }

        const isEditing = editingMonitoringVisitId === visitId;
        const score = computeVisit2Score(bizVal, impactVal, incomeChangeVal, continueVal);
        monData[visitIndex].status = 'completed';
        if (!isEditing || !monData[visitIndex].visitDate) {
            monData[visitIndex].visitDate = window.getCurrentDateTime().split(',')[0];
        }
        monData[visitIndex].businessStatus = bizVal;
        monData[visitIndex].businessStatusNote = bizVal === 'other' ? bizNoteVal : '';
        monData[visitIndex].grantImpact = impactVal;
        monData[visitIndex].grantImpactNote = impactVal === 'other' ? impactNoteVal : '';
        monData[visitIndex].incomeChange = incomeChangeVal;
        monData[visitIndex].incomeChangeNote = incomeChangeVal === 'other' ? incomeChangeNoteVal : '';
        monData[visitIndex].incomeRange = incomeRangeVal;
        monData[visitIndex].continuePlan2 = continueVal;
        monData[visitIndex].note = noteVal;
        monData[visitIndex].score = score;

        const positiveResult = score >= 6;
        if (positiveResult && visitIndex + 1 < monData.length && monData[visitIndex + 1].status !== 'completed') {
            monData[visitIndex + 1].status = 'active';
            monData[visitIndex + 1].daysLeft = monData[visitIndex + 1].days;
        }
        if (!positiveResult) {
            monData.slice(visitIndex + 1).forEach(function (visit) {
                if (visit.status !== 'completed') visit.status = 'pending';
            });
        }
        return true;
    }

    function saveMonitoringVisit(visitId) {
        if (!window.state || !window.state.monitoring || !window.currentApprovedAppId) return;
        const monData = window.state.monitoring[window.currentApprovedAppId] || [];
        const visitIndex = monData.findIndex(function (v) { return v.id === visitId; });
        if (visitIndex === -1) return;

        let saved;
        if (visitId === 1) {
            saved = saveFirstMonthVisit(visitId, monData, visitIndex);
        } else if (visitId === 2) {
            saved = saveVisit2(visitId, monData, visitIndex);
        } else {
            saved = saveStandardVisit(visitId, monData, visitIndex);
        }

        if (saved) {
            editingMonitoringVisitId = null;
            renderMonitoringList();
        }
    }

    function buildCompletedStandardCard(v) {
        return '<div class="flex items-start justify-between border-b border-gray-100 pb-3 mb-3"><div class="flex items-center gap-3"><div class="bg-emerald-400 text-white rounded-lg w-8 h-8 flex items-center justify-center flex-shrink-0 shadow-sm"><i data-lucide="check" class="w-5 h-5"></i></div><div><p class="font-bold text-[13px] text-gray-800 leading-tight">Боздиди / Визит ' + v.id + ' (+' + v.days + ' рӯз / дн.)</p><p class="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3"></i> ' + v.plannedDate + '</p></div></div><div class="text-[11px] text-gray-400 flex items-center gap-1"><i data-lucide="check" class="w-3 h-3"></i> ' + v.visitDate + '</div></div>'
            + '<div class="grid grid-cols-2 gap-y-3 gap-x-4 mb-4"><div class="flex items-center gap-2 text-[11px] text-gray-600">Таҷҳизот <span class="ru font-normal">/ Оборуд.</span>: ' + getEqBadge(v.equipment) + '</div><div class="flex items-center gap-2 text-[11px] text-gray-600">Тиҷорат <span class="ru font-normal">/ Бизнес</span>: ' + getBizBadge(v.business) + '</div></div>'
            + (v.note ? '<div class="bg-slate-50 rounded-lg p-3 text-[11px] text-gray-600 mb-4 border border-slate-100 flex gap-2 items-start"><i data-lucide="file-text" class="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-400"></i><span>' + v.note + '</span></div>' : '')
            + '<button onclick="editMonitoringVisit(' + v.id + ')" class="self-end border border-indigo-200 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-[11px] font-bold">Ислоҳ кардан / Изменить ответы</button>';
    }

    function buildCompletedFirstMonthCard(v) {
        const fundsOpt = findOption(FUNDS_OPTIONS, v.fundsUsed);
        const activityLabels = (v.activities || []).map(function (val) {
            const opt = findOption(ACTIVITY_OPTIONS, val);
            return opt ? '<span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold">' + opt.label.split(' <span')[0] + '</span>' : '';
        }).join(' ');
        const incomeOpt = findOption(INCOME_OPTIONS, v.incomeStatus);
        const continueOpt = findOption(CONTINUE_OPTIONS, v.continuePlan);
        const score = typeof v.score === 'number' ? v.score : 0;
        return '<div class="flex items-start justify-between border-b border-gray-100 pb-3 mb-3"><div class="flex items-center gap-3"><div class="bg-emerald-400 text-white rounded-lg w-8 h-8 flex items-center justify-center flex-shrink-0 shadow-sm"><i data-lucide="check" class="w-5 h-5"></i></div><div><p class="font-bold text-[13px] text-gray-800 leading-tight">Боздиди / Визит ' + v.id + ' (+' + v.days + ' рӯз / дн.) — оғози тиҷорат <span class="ru font-normal">/ запуск бизнеса</span></p><p class="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3"></i> ' + v.plannedDate + '</p></div></div><div class="text-[11px] text-gray-400 flex items-center gap-1"><i data-lucide="check" class="w-3 h-3"></i> ' + v.visitDate + '</div></div>'
            + '<div class="space-y-2 mb-4">'
            + '<div class="flex items-center gap-2 text-[11px] text-gray-600">Истифодаи маблағ <span class="ru font-normal">/ Использование средств</span>: <span class="font-bold text-gray-800">' + (fundsOpt ? fundsOpt.label.split(' <span')[0] : '—') + '</span></div>'
            + (activityLabels ? '<div class="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-600">Иҷрошуда <span class="ru font-normal">/ Сделано</span>: ' + activityLabels + '</div>' : '')
            + '<div class="flex items-center gap-2 text-[11px] text-gray-600">Даромад <span class="ru font-normal">/ Доход</span>: <span class="font-bold text-gray-800">' + (incomeOpt ? incomeOpt.label.split(' <span')[0] : '—') + '</span></div>'
            + '<div class="flex items-center gap-2 text-[11px] text-gray-600">Идома <span class="ru font-normal">/ Продолжение</span>: <span class="font-bold text-gray-800">' + (continueOpt ? continueOpt.label.split(' <span')[0] : '—') + '</span></div>'
            + '</div>'
            + '<div class="flex items-center gap-2 mb-4"><span class="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Балл <span class="ru font-normal">/ Баллы</span>: ' + score + '/' + FIRST_MONTH_MAX_SCORE + '</span>' + getFirstMonthResultBadge(score) + '</div>'
            + (v.note ? '<div class="bg-slate-50 rounded-lg p-3 text-[11px] text-gray-600 mb-4 border border-slate-100 flex gap-2 items-start"><i data-lucide="file-text" class="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-400"></i><span>' + v.note + '</span></div>' : '')
            + '<button onclick="editMonitoringVisit(' + v.id + ')" class="self-end border border-indigo-200 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-[11px] font-bold">Ислоҳ кардан / Изменить ответы</button>';
    }

    function buildCompletedVisit2Card(v) {
        const bizOpt = findOption(BIZ_STATUS_OPTIONS, v.businessStatus);
        const impactOpt = findOption(GRANT_IMPACT_OPTIONS, v.grantImpact);
        const incomeChangeOpt = findOption(INCOME_CHANGE_OPTIONS, v.incomeChange);
        const incomeRangeOpt = findOption(INCOME_RANGE_OPTIONS, v.incomeRange);
        const continueOpt = findOption(CONTINUE2_OPTIONS, v.continuePlan2);
        const score = typeof v.score === 'number' ? v.score : 0;
        return '<div class="flex items-start justify-between border-b border-gray-100 pb-3 mb-3"><div class="flex items-center gap-3"><div class="bg-emerald-400 text-white rounded-lg w-8 h-8 flex items-center justify-center flex-shrink-0 shadow-sm"><i data-lucide="check" class="w-5 h-5"></i></div><div><p class="font-bold text-[13px] text-gray-800 leading-tight">Боздиди / Визит ' + v.id + ' (+' + v.days + ' рӯз / дн.) — устуворӣ <span class="ru font-normal">/ устойчивость</span></p><p class="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3"></i> ' + v.plannedDate + '</p></div></div><div class="text-[11px] text-gray-400 flex items-center gap-1"><i data-lucide="check" class="w-3 h-3"></i> ' + v.visitDate + '</div></div>'
            + '<div class="space-y-2 mb-4">'
            + '<div class="flex items-center gap-2 text-[11px] text-gray-600">Ҳолати тиҷорат <span class="ru font-normal">/ Работа бизнеса</span>: <span class="font-bold text-gray-800">' + (bizOpt ? bizOpt.label.split(' <span')[0] : '—') + '</span></div>'
            + '<div class="flex items-center gap-2 text-[11px] text-gray-600">Таъсири грант <span class="ru font-normal">/ Влияние гранта</span>: <span class="font-bold text-gray-800">' + (impactOpt ? impactOpt.label.split(' <span')[0] : '—') + '</span></div>'
            + '<div class="flex items-center gap-2 text-[11px] text-gray-600">Тағйири даромад <span class="ru font-normal">/ Изменение дохода</span>: <span class="font-bold text-gray-800">' + (incomeChangeOpt ? incomeChangeOpt.label.split(' <span')[0] : '—') + '</span></div>'
            + '<div class="flex items-center gap-2 text-[11px] text-gray-600">Даромади миёна <span class="ru font-normal">/ Средний доход</span>: <span class="font-bold text-gray-800">' + (incomeRangeOpt ? incomeRangeOpt.label.split(' <span')[0] : '—') + '</span></div>'
            + '<div class="flex items-center gap-2 text-[11px] text-gray-600">Идома <span class="ru font-normal">/ Продолжение</span>: <span class="font-bold text-gray-800">' + (continueOpt ? continueOpt.label.split(' <span')[0] : '—') + '</span></div>'
            + '</div>'
            + '<div class="flex items-center gap-2 mb-4"><span class="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Балл <span class="ru font-normal">/ Баллы</span>: ' + score + '/' + VISIT2_MAX_SCORE + '</span>' + getVisit2ResultBadge(score) + '</div>'
            + (v.note ? '<div class="bg-slate-50 rounded-lg p-3 text-[11px] text-gray-600 mb-4 border border-slate-100 flex gap-2 items-start"><i data-lucide="file-text" class="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-400"></i><span>' + v.note + '</span></div>' : '')
            + '<button onclick="editMonitoringVisit(' + v.id + ')" class="self-end border border-indigo-200 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-[11px] font-bold">Ислоҳ кардан / Изменить ответы</button>';
    }

    function buildStandardForm(v) {
        return '<div id="mon-form-' + v.id + '" class="hidden mt-4 pt-4 border border-amber-200 rounded-lg p-4"><div class="space-y-4">'
            + '<div><label class="block text-[11px] font-bold text-gray-700 mb-2">1. Ҳолати таҷҳизот <span class="ru font-normal">/ Сост. оборуд.</span> *</label><div class="flex flex-col sm:flex-row gap-2"><label class="flex-1 border border-white bg-white/50 rounded-lg p-2 cursor-pointer hover:bg-white flex items-center gap-2"><input type="radio" name="eq-' + v.id + '" value="in_stock" class="accent-emerald-500 w-3.5 h-3.5" onchange="checkAlert(' + v.id + ')"><span class="text-[12px]"><span class="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1"></span>Дар мавҷудият <span class="ru font-normal">/ В наличии</span></span></label><label class="flex-1 border border-white bg-white/50 rounded-lg p-2 cursor-pointer hover:bg-white flex items-center gap-2"><input type="radio" name="eq-' + v.id + '" value="not_used" class="accent-amber-500 w-3.5 h-3.5" onchange="checkAlert(' + v.id + ')"><span class="text-[12px]"><span class="w-2 h-2 rounded-full bg-amber-500 inline-block mr-1"></span>Истифода намешавад <span class="ru font-normal">/ Не исп.</span></span></label><label class="flex-1 border border-white bg-white/50 rounded-lg p-2 cursor-pointer hover:bg-white flex items-center gap-2"><input type="radio" name="eq-' + v.id + '" value="sold" class="accent-red-500 w-3.5 h-3.5" onchange="checkAlert(' + v.id + ')"><span class="text-[12px]"><span class="w-2 h-2 rounded-full bg-red-500 inline-block mr-1"></span>Фурӯхта шуд <span class="ru font-normal">/ Продано</span></span></label></div><div id="alert-eq-' + v.id + '" class="hidden mt-2 text-[10px] text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg flex gap-1.5 items-center font-bold shadow-sm"><i data-lucide="alert-triangle" class="w-4 h-4"></i> Огоҳӣ ба Админ фиристода мешавад! <span class="ru font-normal">/ Уведомление Админу!</span></div></div>'
            + '<div><label class="block text-[11px] font-bold text-gray-700 mb-2">2. Ҳолати тиҷорат <span class="ru font-normal">/ Сост. бизнеса</span> *</label><select id="biz-' + v.id + '" class="w-full border border-gray-300 rounded-md px-3 py-2 text-[12px] bg-white"><option value="">- Интихоб кунед / Выберите -</option><option value="active">Фаъол / Активен</option><option value="suspended">Боздошташуда / Приостановлен</option><option value="closed">Пӯшида / Закрыт</option></select></div>'
            + '<div><label class="block text-[11px] font-bold text-gray-700 mb-2">Эзоҳ / Примечания</label><textarea id="note-' + v.id + '" rows="2" class="w-full border border-gray-300 rounded-md px-3 py-2 text-[12px] bg-white"></textarea></div>'
            + '<div class="pt-3 flex justify-end gap-2 border-t border-amber-200/50"><button onclick="toggleMonitoringForm(' + v.id + ')" class="px-4 py-2 border border-amber-300 text-amber-700 rounded-lg text-[12px] font-bold bg-amber-50">Бекор кардан <span class="ru font-normal">/ Отмена</span></button><button onclick="saveMonitoringVisit(' + v.id + ')" class="bg-[#5b4ef5] text-white px-5 py-2 rounded-lg text-[12px] font-bold shadow-sm">Захира <span class="ru font-normal">/ Сохранить</span></button></div>'
            + '</div></div>';
    }

    function buildFirstMonthForm(v) {
        return '<div id="mon-form-' + v.id + '" class="hidden mt-4 pt-4 border border-amber-200 rounded-lg p-4"><div class="space-y-4">'
            + '<div><label class="block text-[11px] font-bold text-gray-700 mb-2">1. Оё маблағи грант тибқи мақсад истифода шуд? <span class="ru font-normal">/ Использованы ли средства гранта по назначению?</span> *</label><div class="flex flex-col gap-1.5">' + buildOptionsHtml(FUNDS_OPTIONS, 'funds', v.id, 'radio', v.fundsUsed) + '</div><input type="text" id="funds-note-' + v.id + '" placeholder="Тавзеҳ (агар «Дигар» интихоб шуда бошад) / Пояснение (если «Другое»)" class="w-full mt-2 border border-gray-300 rounded-md px-3 py-2 text-[12px] bg-white"></div>'
            + '<div><label class="block text-[11px] font-bold text-gray-700 mb-2">2. Дар асоси маблағи грант чӣ иҷро шуд? <span class="ru font-normal">/ Что уже сделано на средства гранта?</span> *</label><div class="flex flex-col gap-1.5">' + buildOptionsHtml(ACTIVITY_OPTIONS, 'act', v.id, 'checkbox', v.activities) + '</div></div>'
            + '<div><label class="block text-[11px] font-bold text-gray-700 mb-2">3. Оё тиҷорат ба даромад расид? <span class="ru font-normal">/ Начал ли бизнес приносить доход?</span> *</label><div class="flex flex-col gap-1.5">' + buildOptionsHtml(INCOME_OPTIONS, 'income', v.id, 'radio', v.incomeStatus) + '</div></div>'
            + '<div><label class="block text-[11px] font-bold text-gray-700 mb-2">4. Оё шумо тиҷоратро дар 6 моҳи оянда идома медиҳед? <span class="ru font-normal">/ Планируете ли вы продолжать бизнес в ближайшие 6 месяцев?</span> *</label><div class="flex flex-col gap-1.5">' + buildOptionsHtml(CONTINUE_OPTIONS, 'continue', v.id, 'radio', v.continuePlan) + '</div></div>'
            + '<div><label class="block text-[11px] font-bold text-gray-700 mb-2">Эзоҳ / Примечания</label><textarea id="note-' + v.id + '" rows="2" class="w-full border border-gray-300 rounded-md px-3 py-2 text-[12px] bg-white"></textarea></div>'
            + '<div class="pt-3 flex justify-end gap-2 border-t border-amber-200/50"><button onclick="toggleMonitoringForm(' + v.id + ')" class="px-4 py-2 border border-amber-300 text-amber-700 rounded-lg text-[12px] font-bold bg-amber-50">Бекор кардан <span class="ru font-normal">/ Отмена</span></button><button onclick="saveMonitoringVisit(' + v.id + ')" class="bg-[#5b4ef5] text-white px-5 py-2 rounded-lg text-[12px] font-bold shadow-sm">Захира <span class="ru font-normal">/ Сохранить</span></button></div>'
            + '</div></div>';
    }

    function buildVisit2Form(v) {
        return '<div id="mon-form-' + v.id + '" class="hidden mt-4 pt-4 border border-amber-200 rounded-lg p-4"><div class="space-y-4">'
            + '<div><label class="block text-[11px] font-bold text-gray-700 mb-2">1. Оё тиҷорати шумо ҳоло кор мекунад? <span class="ru font-normal">/ Работает ли ваш бизнес сейчас?</span> *</label><div class="flex flex-col gap-1.5">' + buildOptionsHtml(BIZ_STATUS_OPTIONS, 'biz2', v.id, 'radio', v.businessStatus) + '</div><input type="text" id="biz2-note-' + v.id + '" placeholder="Тавзеҳ (агар «Дигар» интихоб шуда бошад) / Пояснение (если «Другое»)" class="w-full mt-2 border border-gray-300 rounded-md px-3 py-2 text-[12px] bg-white"></div>'
            + '<div><label class="block text-[11px] font-bold text-gray-700 mb-2">2. Грант ба тиҷорати шумо чӣ гуна таъсир расонд? <span class="ru font-normal">/ Как грант повлиял на ваш бизнес?</span> *</label><div class="flex flex-col gap-1.5">' + buildOptionsHtml(GRANT_IMPACT_OPTIONS, 'impact', v.id, 'radio', v.grantImpact) + '</div><input type="text" id="impact-note-' + v.id + '" placeholder="Тавзеҳ (агар «Дигар» интихоб шуда бошад) / Пояснение (если «Другое»)" class="w-full mt-2 border border-gray-300 rounded-md px-3 py-2 text-[12px] bg-white"></div>'
            + '<div><label class="block text-[11px] font-bold text-gray-700 mb-2">3. Оё даромади тиҷорат пас аз гирифтани грант тағйир ёфт? <span class="ru font-normal">/ Изменился ли доход от бизнеса после получения гранта?</span> *</label><div class="flex flex-col gap-1.5">' + buildOptionsHtml(INCOME_CHANGE_OPTIONS, 'incchange', v.id, 'radio', v.incomeChange) + '</div><input type="text" id="incchange-note-' + v.id + '" placeholder="Тавзеҳ (агар «Дигар» интихоб шуда бошад) / Пояснение (если «Другое»)" class="w-full mt-2 border border-gray-300 rounded-md px-3 py-2 text-[12px] bg-white"></div>'
            + '<div><label class="block text-[11px] font-bold text-gray-700 mb-2">4. Даромади миёнаи моҳонаи тиҷорат ҳоло чӣ қадар аст? <span class="ru font-normal">/ Какой сейчас средний ежемесячный доход от бизнеса?</span> * <span class="font-normal text-gray-400">(танҳо барои омор / только для статистики)</span></label><div class="flex flex-col gap-1.5">' + buildOptionsHtml(INCOME_RANGE_OPTIONS, 'incrange', v.id, 'radio', v.incomeRange) + '</div></div>'
            + '<div><label class="block text-[11px] font-bold text-gray-700 mb-2">5. Оё шумо тиҷоратро дар 12 моҳи оянда идома дода, густариш медиҳед? <span class="ru font-normal">/ Планируете ли вы продолжать и развивать бизнес в ближайшие 12 месяцев?</span> *</label><div class="flex flex-col gap-1.5">' + buildOptionsHtml(CONTINUE2_OPTIONS, 'continue2', v.id, 'radio', v.continuePlan2) + '</div></div>'
            + '<div><label class="block text-[11px] font-bold text-gray-700 mb-2">Эзоҳ / Примечания</label><textarea id="note-' + v.id + '" rows="2" class="w-full border border-gray-300 rounded-md px-3 py-2 text-[12px] bg-white"></textarea></div>'
            + '<div class="pt-3 flex justify-end gap-2 border-t border-amber-200/50"><button onclick="toggleMonitoringForm(' + v.id + ')" class="px-4 py-2 border border-amber-300 text-amber-700 rounded-lg text-[12px] font-bold bg-amber-50">Бекор кардан <span class="ru font-normal">/ Отмена</span></button><button onclick="saveMonitoringVisit(' + v.id + ')" class="bg-[#5b4ef5] text-white px-5 py-2 rounded-lg text-[12px] font-bold shadow-sm">Захира <span class="ru font-normal">/ Сохранить</span></button></div>'
            + '</div></div>';
    }

    function renderMonitoringList() {
        const container = document.getElementById('monitoringListContainer');
        if (!container) return;
        container.innerHTML = '';

        const currentApp = window.currentApprovedAppId && typeof window.getApp === 'function'
            ? window.getApp(window.currentApprovedAppId)
            : null;
        if (!currentApp || currentApp.grantActive !== true) {
            container.innerHTML = '<div class="text-center text-amber-700 bg-amber-50 border border-amber-200 rounded-xl py-8 px-4 text-sm">Грант еще не активирован финансистом.<span class="ru-block">Грант еще не активирован финансистом.</span></div>';
            return;
        }

        const monData = window.state && window.state.monitoring && window.currentApprovedAppId
            ? (window.state.monitoring[window.currentApprovedAppId] || [])
            : [];

        if (monData.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-400 py-10 text-sm">Шабакаи мониторинг ба наздикӣ тавлид мешавад...<span class="ru-block">Мониторинг будет сформирован...</span></div>';
            return;
        }

        monData.forEach(function (v) {
            const el = document.createElement('div');
            if (v.status === 'completed' && editingMonitoringVisitId !== v.id) {
                el.className = 'bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative overflow-hidden animate-fade-in flex flex-col';
                if (v.id === 1) {
                    el.innerHTML = buildCompletedFirstMonthCard(v);
                } else if (v.id === 2) {
                    el.innerHTML = buildCompletedVisit2Card(v);
                } else {
                    el.innerHTML = buildCompletedStandardCard(v);
                }
            } else if (v.status === 'active' || editingMonitoringVisitId === v.id) {
                el.className = 'bg-[#FFFAEB] border border-[#FDE68A] rounded-xl p-4 shadow-sm flex flex-col transition-colors animate-fade-in';
                const headerHtml = '<div class="flex items-center gap-3 cursor-pointer" onclick="toggleMonitoringForm(' + v.id + ')"><div class="bg-indigo-100 text-indigo-500 rounded-lg w-8 h-8 flex items-center justify-center flex-shrink-0 shadow-sm border border-indigo-200"><i data-lucide="calendar" class="w-4 h-4"></i></div><div class="flex-1"><p class="font-bold text-[13px] text-gray-800 leading-tight">Боздиди / Визит ' + v.id + ' (+' + v.days + ' рӯз / дн.)</p><p class="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5"><i data-lucide="calendar" class="w-3 h-3"></i> ' + v.plannedDate + ' <span class="text-amber-600 font-bold ml-1">— пас аз ' + (v.daysLeft || 0) + ' рӯз <span class="ru font-normal">/ через ' + (v.daysLeft || 0) + ' дн.</span></span></p></div><button class="bg-white border border-amber-300 text-amber-700 px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-sm whitespace-nowrap" id="btn-open-mon-' + v.id + '">Пур кардан / Оформить</button></div>';
                let formHtml;
                if (v.id === 1) formHtml = buildFirstMonthForm(v);
                else if (v.id === 2) formHtml = buildVisit2Form(v);
                else formHtml = buildStandardForm(v);
                el.innerHTML = headerHtml + formHtml;
                if (v.id === 1) {
                    const firstForm = el.querySelector('#mon-form-' + v.id);
                    if (firstForm) firstForm.classList.remove('hidden');
                }
                if (editingMonitoringVisitId === v.id) {
                    const editForm = el.querySelector('#mon-form-' + v.id);
                    if (v.id === 1) {
                        const noteField = el.querySelector('#note-' + v.id);
                        const fundsNoteField = el.querySelector('#funds-note-' + v.id);
                        if (noteField) noteField.value = v.note || '';
                        if (fundsNoteField) fundsNoteField.value = v.fundsUsedNote || '';
                    } else if (v.id === 2) {
                        const noteField = el.querySelector('#note-' + v.id);
                        const bizNoteField = el.querySelector('#biz2-note-' + v.id);
                        const impactNoteField = el.querySelector('#impact-note-' + v.id);
                        const incChangeNoteField = el.querySelector('#incchange-note-' + v.id);
                        if (noteField) noteField.value = v.note || '';
                        if (bizNoteField) bizNoteField.value = v.businessStatusNote || '';
                        if (impactNoteField) impactNoteField.value = v.grantImpactNote || '';
                        if (incChangeNoteField) incChangeNoteField.value = v.incomeChangeNote || '';
                    } else {
                        const selectedEq = editForm && editForm.querySelector('input[name="eq-' + v.id + '"][value="' + v.equipment + '"]');
                        if (selectedEq) selectedEq.checked = true;
                        const bizField = el.querySelector('#biz-' + v.id);
                        const noteField = el.querySelector('#note-' + v.id);
                        if (bizField) bizField.value = v.business || '';
                        if (noteField) noteField.value = v.note || '';
                    }
                    if (editForm) editForm.classList.remove('hidden');
                }
            } else {
                el.className = 'bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3 opacity-70 animate-fade-in';
                el.innerHTML = '<div class="bg-slate-200 text-slate-400 rounded-lg w-8 h-8 flex items-center justify-center flex-shrink-0"><i data-lucide="hourglass" class="w-4 h-4"></i></div><div><p class="font-bold text-[13px] text-gray-800 leading-tight">Боздиди / Визит ' + v.id + ' (+' + v.days + ' рӯз / дн.)</p><p class="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5"><i data-lucide="calendar" class="w-3 h-3"></i> ' + v.plannedDate + ' <span class="text-slate-400 ml-1">— мунтазири боздиди қаблӣ <span class="ru font-normal">/ ожидание предыдущего визита</span></span></p></div>';
            }
            container.appendChild(el);
        });

        if (window.lucide) window.lucide.createIcons();
    }

    window.AppFeatures.monitoring = {
        ready: true,
        generateMonitoringFor,
        getEqBadge,
        getBizBadge,
        toggleMonitoringForm,
        checkAlert,
        saveMonitoringVisit,
        editMonitoringVisit,
        renderMonitoringList,
        handleActivityChange
    };

    // Legacy compatibility while migrating code out of grant.html
    window.generateMonitoringFor = generateMonitoringFor;
    window.getEqBadge = getEqBadge;
    window.getBizBadge = getBizBadge;
    window.toggleMonitoringForm = toggleMonitoringForm;
    window.checkAlert = checkAlert;
    window.saveMonitoringVisit = saveMonitoringVisit;
    window.editMonitoringVisit = editMonitoringVisit;
    window.renderMonitoringList = renderMonitoringList;
    window.handleActivityChange = handleActivityChange;
})();
