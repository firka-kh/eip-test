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

    function generateMonitoringFor(appId, startDateStr) {
        if (!window.state) return;
        if (!window.state.monitoring) window.state.monitoring = {};
        if (!window.state.monitoring[appId]) {
            const pDate = new Date(startDateStr || new Date().toISOString().split('T')[0]);
            const addDays = function (d) {
                const nd = new Date(pDate);
                nd.setDate(nd.getDate() + d);
                return nd.toLocaleDateString('ru-RU');
            };
            window.state.monitoring[appId] = [
                { id: 1, days: 30, status: 'active', plannedDate: addDays(30), visitDate: '', equipment: '', business: '', income: '', ecoCheck: false, note: '', photos: [] },
                { id: 2, days: 90, status: 'pending', plannedDate: addDays(90) },
                { id: 3, days: 180, status: 'pending', plannedDate: addDays(180) },
                { id: 4, days: 360, status: 'pending', plannedDate: addDays(360) }
            ];
        }
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

    function toggleMonitoringForm(visitId) {
        const form = document.getElementById('mon-form-' + visitId);
        const btn = document.getElementById('btn-open-mon-' + visitId);
        if (!form || !btn) return;
        if (form.classList.contains('hidden')) {
            form.classList.remove('hidden');
            btn.innerHTML = 'Пӯшидан <span class="ru font-normal">/ Скрыть</span>';
        } else {
            form.classList.add('hidden');
            btn.innerHTML = 'Пур кардан <span class="ru font-normal">/ Оформить</span>';
        }
    }

    function checkAlert(visitId) {
        const selected = document.querySelector('input[name="eq-' + visitId + '"]:checked');
        const eqVal = selected ? selected.value : '';
        const alertEl = document.getElementById('alert-eq-' + visitId);
        if (!alertEl) return;
        if (eqVal === 'sold') alertEl.classList.remove('hidden');
        else alertEl.classList.add('hidden');
    }

    function saveMonitoringVisit(visitId) {
        const eqSelected = document.querySelector('input[name="eq-' + visitId + '"]:checked');
        const eqVal = eqSelected ? eqSelected.value : '';
        const bizInput = document.getElementById('biz-' + visitId);
        const incInput = document.getElementById('inc-' + visitId);
        const ecoSelected = document.querySelector('input[name="eco-' + visitId + '"]:checked');
        const noteInput = document.getElementById('note-' + visitId);
        const bizVal = bizInput ? bizInput.value : '';
        const incVal = incInput ? incInput.value : '';
        const ecoVal = ecoSelected ? ecoSelected.value : '';
        const noteVal = noteInput ? noteInput.value : '';

        if (!eqVal || !bizVal || !incVal || !ecoVal) {
            notifyMessage('warning', 'Лутфан ҳамаи майдонҳои ҳатмиро пур кунед! / Пожалуйста, заполните все обязательные поля!');
            return;
        }

        if (!window.state || !window.state.monitoring || !window.currentApprovedAppId) return;
        const monData = window.state.monitoring[window.currentApprovedAppId] || [];
        const visitIndex = monData.findIndex(function (v) { return v.id === visitId; });

        if (visitIndex > -1) {
            monData[visitIndex].status = 'completed';
            monData[visitIndex].visitDate = window.getCurrentDateTime().split(',')[0];
            monData[visitIndex].equipment = eqVal;
            monData[visitIndex].business = bizVal;
            monData[visitIndex].income = incVal;
            monData[visitIndex].ecoCheck = (ecoVal === 'yes');
            monData[visitIndex].note = noteVal;
            monData[visitIndex].photos = [1, 2];
            if (visitIndex + 1 < monData.length) {
                monData[visitIndex + 1].status = 'active';
                monData[visitIndex + 1].daysLeft = 90;
            }
            if (eqVal === 'sold') {
                notifyMessage('warning', 'Что произошло: зафиксирована продажа оборудования, уведомление отправлено Администратору. Маршрут: Мониторинг -> Администратор. Следующий статус заявки: без изменений.');
            }
            renderMonitoringList();
        }
    }

    function renderMonitoringList() {
        const container = document.getElementById('monitoringListContainer');
        if (!container) return;
        container.innerHTML = '';

        const monData = window.state && window.state.monitoring && window.currentApprovedAppId
            ? (window.state.monitoring[window.currentApprovedAppId] || [])
            : [];

        if (monData.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-400 py-10 text-sm">Шабакаи мониторинг ба наздикӣ тавлид мешавад...<span class="ru-block">Мониторинг будет сформирован...</span></div>';
            return;
        }

        monData.forEach(function (v) {
            const el = document.createElement('div');
            if (v.status === 'completed') {
                const photosHtml = v.photos.length > 0
                    ? '<div class="flex gap-2 mt-2">' + v.photos.map(function () { return '<div class="w-14 h-14 bg-gray-200 rounded flex items-center justify-center border border-gray-300 text-gray-400"><i data-lucide="image" class="w-5 h-5"></i></div>'; }).join('') + '</div>'
                    : '';
                el.className = 'bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative overflow-hidden animate-fade-in';
                el.innerHTML = '<div class="flex items-start justify-between border-b border-gray-100 pb-3 mb-3"><div class="flex items-center gap-3"><div class="bg-emerald-400 text-white rounded-lg w-8 h-8 flex items-center justify-center flex-shrink-0 shadow-sm"><i data-lucide="check" class="w-5 h-5"></i></div><div><p class="font-bold text-[13px] text-gray-800 leading-tight">Боздиди / Визит ' + v.id + ' (+' + v.days + ' рӯз / дн.)</p><p class="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3"></i> ' + v.plannedDate + '</p></div></div><div class="text-[11px] text-gray-400 flex items-center gap-1"><i data-lucide="check" class="w-3 h-3"></i> ' + v.visitDate + '</div></div><div class="grid grid-cols-2 gap-y-3 gap-x-4 mb-4"><div class="flex items-center gap-2 text-[11px] text-gray-600">Таҷҳизот <span class="ru font-normal">/ Оборуд.</span>: ' + getEqBadge(v.equipment) + '</div><div class="flex items-center gap-2 text-[11px] text-gray-600">Тиҷорат <span class="ru font-normal">/ Бизнес</span>: ' + getBizBadge(v.business) + '</div><div class="text-[11px] text-gray-600">Даромад <span class="ru font-normal">/ Доход</span>: <strong class="text-gray-800">' + v.income + ' сом./мес.</strong></div><div class="flex items-center gap-2 text-[11px] text-gray-600">Эко-санҷиш <span class="ru font-normal">/ Эко-проверка</span>: <strong class="' + (v.ecoCheck ? 'text-emerald-600' : 'text-red-600 flex items-center gap-1') + '">' + (v.ecoCheck ? 'Ҳа / Да' : '<i data-lucide="x" class="w-3 h-3"></i> Не / Нет') + '</strong></div></div>' + (v.note ? '<div class="bg-slate-50 rounded-lg p-3 text-[11px] text-gray-600 mb-4 border border-slate-100 flex gap-2 items-start"><i data-lucide="file-text" class="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-400"></i><span>' + v.note + '</span></div>' : '') + '<div class="border-t border-gray-100 pt-3"><p class="text-[11px] text-gray-500 font-bold flex items-center gap-1.5"><i data-lucide="camera" class="w-3 h-3"></i> Суратҳо <span class="ru font-normal">/ Фото</span> (' + v.photos.length + ')</p>' + photosHtml + '</div>';
            } else if (v.status === 'active') {
                el.className = 'bg-[#FFFAEB] border border-[#FDE68A] rounded-xl p-4 shadow-sm flex flex-col transition-colors animate-fade-in';
                el.innerHTML = '<div class="flex items-center gap-3 cursor-pointer" onclick="toggleMonitoringForm(' + v.id + ')"><div class="bg-indigo-100 text-indigo-500 rounded-lg w-8 h-8 flex items-center justify-center flex-shrink-0 shadow-sm border border-indigo-200"><i data-lucide="calendar" class="w-4 h-4"></i></div><div class="flex-1"><p class="font-bold text-[13px] text-gray-800 leading-tight">Боздиди / Визит ' + v.id + ' (+' + v.days + ' рӯз / дн.)</p><p class="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5"><i data-lucide="calendar" class="w-3 h-3"></i> ' + v.plannedDate + ' <span class="text-amber-600 font-bold ml-1">— пас аз ' + (v.daysLeft || 0) + ' рӯз <span class="ru font-normal">/ через ' + (v.daysLeft || 0) + ' дн.</span></span></p></div><button class="bg-white border border-amber-300 text-amber-700 px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-sm whitespace-nowrap" id="btn-open-mon-' + v.id + '">Пур кардан / Оформить</button></div><div id="mon-form-' + v.id + '" class="hidden mt-4 pt-4 border-t border-amber-200/50"><div class="space-y-4"><div><label class="block text-[11px] font-bold text-gray-700 mb-2">1. Ҳолати таҷҳизот <span class="ru font-normal">/ Сост. оборуд.</span> *</label><div class="flex flex-col sm:flex-row gap-2"><label class="flex-1 border border-white bg-white/50 rounded-lg p-2 cursor-pointer hover:bg-white flex items-center gap-2"><input type="radio" name="eq-' + v.id + '" value="in_stock" class="accent-emerald-500 w-3.5 h-3.5" onchange="checkAlert(' + v.id + ')"><span class="text-[12px]"><span class="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1"></span>Дар мавҷудият <span class="ru font-normal">/ В наличии</span></span></label><label class="flex-1 border border-white bg-white/50 rounded-lg p-2 cursor-pointer hover:bg-white flex items-center gap-2"><input type="radio" name="eq-' + v.id + '" value="not_used" class="accent-amber-500 w-3.5 h-3.5" onchange="checkAlert(' + v.id + ')"><span class="text-[12px]"><span class="w-2 h-2 rounded-full bg-amber-500 inline-block mr-1"></span>Истифода намешавад <span class="ru font-normal">/ Не исп.</span></span></label><label class="flex-1 border border-white bg-white/50 rounded-lg p-2 cursor-pointer hover:bg-white flex items-center gap-2"><input type="radio" name="eq-' + v.id + '" value="sold" class="accent-red-500 w-3.5 h-3.5" onchange="checkAlert(' + v.id + ')"><span class="text-[12px]"><span class="w-2 h-2 rounded-full bg-red-500 inline-block mr-1"></span>Фурӯхта шуд <span class="ru font-normal">/ Продано</span></span></label></div><div id="alert-eq-' + v.id + '" class="hidden mt-2 text-[10px] text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg flex gap-1.5 items-center font-bold shadow-sm"><i data-lucide="alert-triangle" class="w-4 h-4"></i> Огоҳӣ ба Админ фиристода мешавад! <span class="ru font-normal">/ Уведомление Админу!</span></div></div><div><label class="block text-[11px] font-bold text-gray-700 mb-2">2. Ҳолати тиҷорат <span class="ru font-normal">/ Сост. бизнеса</span> *</label><select id="biz-' + v.id + '" class="w-full border border-gray-300 rounded-md px-3 py-2 text-[12px] bg-white"><option value="">- Интихоб кунед / Выберите -</option><option value="active">Фаъол / Активен</option><option value="suspended">Боздошташуда / Приостановлен</option><option value="closed">Пӯшида / Закрыт</option></select></div><div><label class="block text-[11px] font-bold text-gray-700 mb-2">3. Даромади миёнаи моҳона <span class="ru font-normal">/ Средний доход</span> *</label><input type="number" id="inc-' + v.id + '" placeholder="0" class="w-full border border-gray-300 rounded-md px-3 py-2 text-[12px] bg-white"></div><div><label class="block text-[11px] font-bold text-gray-700 mb-2">4. Стандартҳои экологӣ ва иҷтимоӣ риоя шудаанд? <span class="ru font-normal">/ Эко-стандарты соблюдены?</span> *</label><div class="flex gap-6"><label class="flex items-center gap-1.5 text-[12px] cursor-pointer"><input type="radio" name="eco-' + v.id + '" value="yes" class="accent-emerald-500 w-4 h-4"> Ҳа / Да</label><label class="flex items-center gap-1.5 text-[12px] cursor-pointer"><input type="radio" name="eco-' + v.id + '" value="no" class="accent-red-500 w-4 h-4"> Не / Нет</label></div></div><div><label class="block text-[11px] font-bold text-gray-700 mb-2">5. Аксҳо <span class="ru font-normal">/ Фото</span> (ҳадди аққал 2 / мин. 2) *</label><input type="file" id="photo-' + v.id + '" multiple class="block w-full text-[11px] text-gray-500 file:mr-3 file:py-2 file:px-4 border border-gray-200 rounded-md bg-white"></div><div><label class="block text-[11px] font-bold text-gray-700 mb-2">Эзоҳ / Примечания</label><textarea id="note-' + v.id + '" rows="2" class="w-full border border-gray-300 rounded-md px-3 py-2 text-[12px] bg-white"></textarea></div><div class="pt-3 flex justify-end gap-2 border-t border-amber-200/50"><button onclick="toggleMonitoringForm(' + v.id + ')" class="px-4 py-2 border border-amber-300 text-amber-700 rounded-lg text-[12px] font-bold bg-amber-50">Бекор кардан <span class="ru font-normal">/ Отмена</span></button><button onclick="saveMonitoringVisit(' + v.id + ')" class="bg-[#5b4ef5] text-white px-5 py-2 rounded-lg text-[12px] font-bold shadow-sm">Захира <span class="ru font-normal">/ Сохранить</span></button></div></div></div>';
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
        renderMonitoringList
    };

    // Legacy compatibility while migrating code out of grant.html
    window.generateMonitoringFor = generateMonitoringFor;
    window.getEqBadge = getEqBadge;
    window.getBizBadge = getBizBadge;
    window.toggleMonitoringForm = toggleMonitoringForm;
    window.checkAlert = checkAlert;
    window.saveMonitoringVisit = saveMonitoringVisit;
    window.renderMonitoringList = renderMonitoringList;
})();
