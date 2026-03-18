(function initSeedApplications() {
    if (window.__grantSeedApplicationsLoaded) return;
    window.__grantSeedApplicationsLoaded = true;

    const perf = window.seedPerfTemplates || {};
    const perfGmc = perf.gmc || {};
    const perfPiu = perf.piuStatus || {};
    const perfPiuDec = perf.piuDecision || {};

    window.seedProtocols = [];

    window.seedApplications = [
        { id: '10050', beneficiaryId: '50081', name: 'Раҳимов Фирдавс Ҳамидович', inn: '', contacts: '+992 90 555 0081', sector: 'Хизматрасонӣ <span class="ru">/ Услуги</span>', amount: '12 000', date: '10.03.2026, 11:20', status: 'incomplete_data', missingFields: ['inn', 'address', 'education'], auditLog: [{ date: '10.03.2026, 11:20', actor: 'Фасилитатор', action: 'Дархост бо маълумоти нопурра захира шуд', actionRu: 'Сохранено с неполными данными', color: 'amber', icon: 'alert-triangle' }] },
        { id: '10051', beneficiaryId: '50082', name: 'Назарова Малика Ашуровна', inn: '9100009082', contacts: '+992 90 555 0082', sector: 'Савдо <span class="ru">/ Торговля</span>', amount: '8 500', date: '11.03.2026, 09:45', status: 'incomplete_data', missingFields: ['birth-date', 'category', 'course'], auditLog: [{ date: '11.03.2026, 09:45', actor: 'Фасилитатор', action: 'Дархост бо маълумоти нопурра захира шуд', actionRu: 'Сохранено с неполными данными', color: 'amber', icon: 'alert-triangle' }] },
        { id: '10002', name: 'Раҳмонов Далер Ҷамшедович', sector: 'Истеҳсолот <span class="ru">/ Производство</span>', amount: '20 000', date: '09.03.2026, 09:15', status: 'draft', auditLog: [{ date: '09.03.2026, 09:15', actor: 'Фасилитатор', action: 'Сиёҳнавис сохта шуд', actionRu: 'Создан черновик', color: 'slate', icon: 'edit-3' }] },
        { id: '10001', name: 'Саидова Мадина Алиевна', sector: 'Савдо <span class="ru">/ Торговля</span>', amount: '5 000', date: '09.03.2026, 10:20', status: 'gmc_review', auditLog: [{ date: '09.03.2026, 10:20', actor: 'Фасилитатор', action: 'Дархост бор карда шуд', actionRu: 'Заявка отправлена в КУГ', color: 'blue', icon: 'send' }] },
        { id: '10030', name: 'Расулов Умед', sector: 'Хизматрасонӣ <span class="ru">/ Услуги</span>', amount: '14 000', date: '12.03.2026, 09:30', status: 'gmc_review', auditLog: [{ date: '12.03.2026, 09:30', actor: 'Фасилитатор', action: 'Дархост бор карда шуд', actionRu: 'Заявка отправлена в КУГ', color: 'blue', icon: 'send' }] },
        {
            id: '10008', name: 'Азизова Зарина', sector: 'Ороишгар <span class="ru">/ Визажист</span>', amount: '7 500', date: '06.03.2026, 15:10', status: 'fac_revision', revisionCount: 2, auditLog: [
                { date: '01.03.2026, 10:00', actor: 'Фасилитатор', action: 'Дархост бор карда шуд', actionRu: 'Заявка отправлена в КУГ', color: 'blue', icon: 'send' },
                { date: '03.03.2026, 15:10', actor: 'ШИГ / КУГ', action: 'Барои такмил ба Фасилитатор баргашт (1/3)', actionRu: 'Возвращено на доработку Фасилитатору (1/3)', color: 'amber', icon: 'corner-down-left', comment: 'Лутфан ҳисоботи молиявиро дақиқ кунед.' },
                { date: '05.03.2026, 09:00', actor: 'Фасилитатор', action: 'Дархост бор карда шуд', actionRu: 'Заявка отправлена в КУГ', color: 'blue', icon: 'send' },
                { date: '06.03.2026, 15:10', actor: 'ШИГ / КУГ', action: 'Барои такмил ба Фасилитатор баргашт (2/3)', actionRu: 'Возвращено на доработку Фасилитатору (2/3)', color: 'amber', icon: 'corner-down-left', comment: 'Суратҳо нокифояанд.' }
            ]
        },
        {
            id: '10034', name: 'Умаров Фарҳод', sector: 'Хизматрасонӣ <span class="ru">/ Услуги</span>', amount: '6 000', date: '12.03.2026, 10:15', status: 'fac_revision', revisionCount: 1, auditLog: [
                { date: '11.03.2026, 09:00', actor: 'Фасилитатор', action: 'Дархост бор карда шуд', actionRu: 'Заявка отправлена в КУГ', color: 'blue', icon: 'send' },
                { date: '12.03.2026, 10:15', actor: 'ШИГ / КУГ', action: 'Барои такмил ба Фасилитатор баргашт (1/3)', actionRu: 'Возвращено на доработку Фасилитатору (1/3)', color: 'amber', icon: 'corner-down-left', comment: 'Хароҷотҳоро дақиқ нависед.' }
            ]
        },
        {
            id: '10020', name: 'Маҳмудов Алишер', sector: 'Хизматрасонӣ <span class="ru">/ Услуги</span>', amount: '12 000', date: '01.03.2026, 11:00', status: 'postponed', revisionCount: 3, auditLog: [
                { date: '25.02.2026, 10:00', actor: 'Фасилитатор', action: 'Дархост бор карда шуд', actionRu: 'Заявка отправлена в КУГ', color: 'blue', icon: 'send' },
                { date: '01.03.2026, 11:00', actor: 'Система', action: 'Лимити такмил ба охир расид. Ба таъхир гузошта шуд (3 моҳ)', actionRu: 'Лимит доработок исчерпан. Отложено на 3 месяца', color: 'red', icon: 'clock', comment: 'Идея тиҷоратӣ заиф аст.' }
            ]
        },
        {
            id: '10021', name: 'Ахмедов Тимур', sector: 'Истеҳсолот <span class="ru">/ Производство</span>', amount: '18 000', date: '11.03.2026, 09:00', status: 'fac_revision', revisionCount: 0, reactivated: true, auditLog: [
                { date: '11.12.2025, 10:00', actor: 'Система', action: 'Лимити такмил ба охир расид. Ба таъхир гузошта шуд (3 моҳ)', actionRu: 'Лимит доработок исчерпан. Отложено на 3 месяца', color: 'red', icon: 'clock' },
                { date: '11.03.2026, 09:00', actor: 'Система', action: 'Дархост дубора фаъол шуд', actionRu: 'Заявка снова активна для подачи', color: 'purple', icon: 'refresh-ccw' }
            ]
        },
        {
            id: '10004', name: 'Иванов Иван Иванович', sector: 'Хизматрасонӣ <span class="ru">/ Услуги</span>', amount: '8 000', date: '08.03.2026, 16:20', status: 'piu_review', gmcEvaluation: perfGmc, piuDecisions: { 1: null }, piuStatus: { 1: 'pending' }, auditLog: [
                { date: '06.03.2026, 11:00', actor: 'Фасилитатор', action: 'Дархост бор карда шуд', actionRu: 'Заявка отправлена в КУГ', color: 'blue', icon: 'send' },
                { date: '08.03.2026, 16:20', actor: 'ШИГ / КУГ', action: 'Тасдиқ шуд, ба ГТЛ равон шуд', actionRu: 'Одобрено КУГ, направлено в ГРП', color: 'emerald', icon: 'check' }
            ]
        },
        {
            id: '10035', name: 'Шарипова Лайло', sector: 'Хизматрасонӣ <span class="ru">/ Услуги</span>', amount: '9 500', date: '12.03.2026, 09:40', status: 'piu_review', gmcEvaluation: perfGmc, piuDecisions: { 1: null }, piuStatus: { 1: 'pending' }, auditLog: [
                { date: '10.03.2026, 11:00', actor: 'Фасилитатор', action: 'Дархост бор карда шуд', actionRu: 'Заявка отправлена в КУГ', color: 'blue', icon: 'send' },
                { date: '12.03.2026, 09:40', actor: 'ШИГ / КУГ', action: 'Тасдиқ шуд, ба ГТЛ равон шуд', actionRu: 'Одобрено КУГ, направлено в ГРП', color: 'emerald', icon: 'check' }
            ]
        },
        {
            id: '10031', name: 'Носирова Нигина', sector: 'Истеҳсолот <span class="ru">/ Производство</span>', amount: '16 000', date: '11.03.2026, 15:20', status: 'gmc_revision', gmcEvaluation: perfGmc, piuStatus: { 1: 'completed' }, piuDecisions: { 1: 'resubmit' }, piuComment: 'Хавфи экологӣ вуҷуд дорад', auditLog: [
                { date: '09.03.2026, 11:00', actor: 'Фасилитатор', action: 'Дархост бор карда шуд', actionRu: 'Заявка отправлена в КУГ', color: 'blue', icon: 'send' },
                { date: '10.03.2026, 14:00', actor: 'ШИГ / КУГ', action: 'Тасдиқ шуд, ба ГТЛ равон шуд', actionRu: 'Одобрено КУГ, направлено в ГРП', color: 'emerald', icon: 'check' },
                { date: '11.03.2026, 15:20', actor: 'ГТЛ / ГРП', action: 'Бо эродҳо ба ШИГ баргашт', actionRu: 'Возвращено с комментариями в КУГ', color: 'amber', icon: 'alert-triangle', comment: 'Хавфи экологӣ вуҷуд дорад' }
            ]
        },
        {
            id: '10010', name: 'Мирзоева Ситора', sector: 'Савдо <span class="ru">/ Торговля</span>', amount: '9 000', date: '01.03.2026, 11:00', status: 'approved', protocolId: 'СП-9001', gmcEvaluation: perfGmc, piuStatus: perfPiu, piuDecisions: perfPiuDec, auditLog: [
                { date: '20.02.2026, 09:15', actor: 'Фасилитатор', action: 'Дархост бор карда шуд', actionRu: 'Заявка отправлена в КУГ', color: 'blue', icon: 'send' },
                { date: '22.02.2026, 14:00', actor: 'ШИГ / КУГ', action: 'Тасдиқ шуд, ба ГТЛ равон шуд', actionRu: 'Одобрено КУГ, направлено в ГРП', color: 'emerald', icon: 'check' },
                { date: '25.02.2026, 16:30', actor: 'ГТЛ / ГРП', action: 'Баҳогузории иҷтимоӣ-экологӣ гузашт', actionRu: 'Социально-экологическая оценка пройдена', color: 'emerald', icon: 'check-circle' },
                { date: '26.02.2026, 09:00', actor: 'ШИГ / КУГ', action: 'Барои Комитет омода шуд', actionRu: 'Заявка подготовлена для реестра Комитета', color: 'blue', icon: 'list-checks' },
                { date: '01.03.2026, 11:00', actor: 'Кумита / Комитет', action: 'Грант тасдиқ шуд (Рӯйхат № СП-9001 аз 01.03.2026)', actionRu: 'Грант утвержден (Список № СП-9001 от 01.03.2026)', color: 'emerald', icon: 'award' }
            ]
        },
        {
            id: '10013', name: 'Фотимаи Зариф', sector: 'Савдо <span class="ru">/ Торговля</span>', amount: '10 000', date: '01.03.2026, 14:00', status: 'approved', protocolId: 'СП-9001', gmcEvaluation: perfGmc, piuStatus: perfPiu, piuDecisions: perfPiuDec, auditLog: [
                { date: '15.01.2026, 09:15', actor: 'Фасилитатор', action: 'Дархост бор карда шуд', actionRu: 'Заявка отправлена в КУГ', color: 'blue', icon: 'send' },
                { date: '18.01.2026, 14:00', actor: 'ШИГ / КУГ', action: 'Тасдиқ шуд, ба ГТЛ равон шуд', actionRu: 'Одобрено КУГ, направлено в ГРП', color: 'emerald', icon: 'check' },
                { date: '25.01.2026, 16:30', actor: 'ГТЛ / ГРП', action: 'Баҳогузории иҷтимоӣ-экологӣ гузашт', actionRu: 'Социально-экологическая оценка пройдена', color: 'emerald', icon: 'check-circle' },
                { date: '27.01.2026, 12:00', actor: 'ШИГ / КУГ', action: 'Барои Комитет омода шуд', actionRu: 'Заявка подготовлена для реестра Комитета', color: 'blue', icon: 'list-checks' },
                { date: '01.03.2026, 14:00', actor: 'Кумита / Комитет', action: 'Грант тасдиқ шуд (Рӯйхат № СП-9001 аз 01.03.2026)', actionRu: 'Грант утвержден (Список № СП-9001 от 01.03.2026)', color: 'emerald', icon: 'award' }
            ]
        },
        {
            id: '10007', name: 'Бобоев Али', sector: 'Истеҳсолот <span class="ru">/ Производство</span>', amount: '15 000', date: '11.03.2026, 12:45', status: 'gmc_preparation', gmcEvaluation: perfGmc, piuStatus: perfPiu, piuDecisions: perfPiuDec, auditLog: [
                { date: '01.03.2026, 09:30', actor: 'Фасилитатор', action: 'Дархост бор карда шуд', actionRu: 'Заявка отправлена в КУГ', color: 'blue', icon: 'send' },
                { date: '03.03.2026, 14:15', actor: 'ШИГ / КУГ', action: 'Тасдиқ шуд, ба ГТЛ равон шуд', actionRu: 'Одобрено КУГ, направлено в ГРП', color: 'emerald', icon: 'check' },
                { date: '11.03.2026, 12:45', actor: 'ГТЛ / ГРП', action: 'Баҳогузории иҷтимоӣ-экологӣ гузашт', actionRu: 'Социально-экологическая оценка пройдена', color: 'emerald', icon: 'check-circle' }
            ]
        },
        {
            id: '10032', name: 'Қодиров Зафар', sector: 'Савдо <span class="ru">/ Торговля</span>', amount: '12 500', date: '12.03.2026, 08:45', status: 'gmc_preparation', gmcEvaluation: perfGmc, piuStatus: perfPiu, piuDecisions: perfPiuDec, auditLog: [
                { date: '08.03.2026, 09:30', actor: 'Фасилитатор', action: 'Дархост бор карда шуд', actionRu: 'Заявка отправлена в КУГ', color: 'blue', icon: 'send' },
                { date: '10.03.2026, 14:15', actor: 'ШИГ / КУГ', action: 'Тасдиқ шуд, ба ГТЛ равон шуд', actionRu: 'Одобрено КУГ, направлено в ГРП', color: 'emerald', icon: 'check' },
                { date: '12.03.2026, 08:45', actor: 'ГТЛ / ГРП', action: 'Баҳогузории иҷтимоӣ-экологӣ гузашт', actionRu: 'Социально-экологическая оценка пройдена', color: 'emerald', icon: 'check-circle' }
            ]
        },
        {
            id: '10022', name: 'Сайфуллоев Олим', sector: 'Хизматрасонӣ <span class="ru">/ Услуги</span>', amount: '8 500', date: '12.03.2026, 09:10', status: 'gmc_ready_for_registry', gmcEvaluation: perfGmc, piuStatus: perfPiu, piuDecisions: perfPiuDec, auditLog: [
                { date: '05.03.2026, 09:30', actor: 'Фасилитатор', action: 'Дархост бор карда шуд', actionRu: 'Заявка отправлена в КУГ', color: 'blue', icon: 'send' },
                { date: '07.03.2026, 14:15', actor: 'ШИГ / КУГ', action: 'Тасдиқ шуд, ба ГТЛ равон шуд', actionRu: 'Одобрено КУГ, направлено в ГРП', color: 'emerald', icon: 'check' },
                { date: '10.03.2026, 12:45', actor: 'ГТЛ / ГРП', action: 'Баҳогузории иҷтимоӣ-экологӣ гузашт', actionRu: 'Социально-экологическая оценка пройдена', color: 'emerald', icon: 'check-circle' },
                { date: '12.03.2026, 09:10', actor: 'ШИГ / КУГ', action: 'Барои Комитет омода шуд', actionRu: 'Заявка подготовлена для реестра Комитета', color: 'blue', icon: 'list-checks' }
            ]
        },
        {
            id: '10017', name: 'Шарипов Сомон', sector: 'Хизматрасонӣ <span class="ru">/ Услуги</span>', amount: '11 000', date: '12.03.2026, 09:00', status: 'gmc_ready_for_registry', gmcEvaluation: perfGmc, piuStatus: perfPiu, piuDecisions: perfPiuDec, auditLog: [
                { date: '01.03.2026, 09:00', actor: 'Фасилитатор', action: 'Дархост бор карда шуд', actionRu: 'Заявка отправлена в КУГ', color: 'blue', icon: 'send' },
                { date: '03.03.2026, 10:00', actor: 'ШИГ / КУГ', action: 'Тасдиқ шуд, ба ГТЛ равон шуд', actionRu: 'Одобрено КУГ, направлено в ГРП', color: 'emerald', icon: 'check' },
                { date: '08.03.2026, 14:00', actor: 'ГТЛ / ГРП', action: 'Баҳогузории иҷтимоӣ-экологӣ гузашт', actionRu: 'Социально-экологическая оценка пройдена', color: 'emerald', icon: 'check-circle' },
                { date: '12.03.2026, 09:00', actor: 'ШИГ / КУГ', action: 'Барои Комитет омода шуд', actionRu: 'Заявка подготовлена для реестра Комитета', color: 'blue', icon: 'list-checks' }
            ]
        },
        {
            id: '10040', name: 'Тоиров Бахтиёр', sector: 'Савдо <span class="ru">/ Торговля</span>', amount: '10 500', date: '12.03.2026, 10:00', status: 'com_review', gmcEvaluation: perfGmc, piuStatus: perfPiu, piuDecisions: perfPiuDec, auditLog: [
                { date: '05.03.2026, 09:00', actor: 'Фасилитатор', action: 'Дархост бор карда шуд', actionRu: 'Заявка отправлена в КУГ', color: 'blue', icon: 'send' },
                { date: '06.03.2026, 10:00', actor: 'ШИГ / КУГ', action: 'Тасдиқ шуд, ба ГТЛ равон шуд', actionRu: 'Одобрено КУГ, направлено в ГРП', color: 'emerald', icon: 'check' },
                { date: '08.03.2026, 14:00', actor: 'ГТЛ / ГРП', action: 'Баҳогузории иҷтимоӣ-экологӣ гузашт', actionRu: 'Социально-экологическая оценка пройдена', color: 'emerald', icon: 'check-circle' },
                { date: '10.03.2026, 09:00', actor: 'ШИГ / КУГ', action: 'Барои Комитет омода шуд', actionRu: 'Заявка подготовлена для реестра Комитета', color: 'blue', icon: 'list-checks' },
                { date: '12.03.2026, 10:00', actor: 'ШИГ / КУГ', action: 'Ба Комитет дар ҳайати реестр фиристода шуд', actionRu: 'Отправлено в Комитет в составе реестра', color: 'blue', icon: 'arrow-right' }
            ]
        },
        {
            id: '10042', name: 'Неъматов Сӯҳроб', sector: 'Хизматрасонӣ <span class="ru">/ Услуги</span>', amount: '22 000', date: '10.03.2026, 11:30', status: 'rejected', auditLog: [
                { date: '09.03.2026, 09:00', actor: 'Фасилитатор', action: 'Дархост бор карда шуд', actionRu: 'Заявка отправлена в КУГ', color: 'blue', icon: 'send' },
                { date: '10.03.2026, 11:30', actor: 'ШИГ / КУГ', action: 'Дархост рад шуд', actionRu: 'Заявка отклонена', color: 'red', icon: 'x-circle', comment: 'Таҷрибаи корӣ тамоман мувофиқ нест.' }
            ]
        }
    ];

    const testStatuses = [
        'draft',
        'gmc_review',
        'fac_revision',
        'postponed',
        'piu_review',
        'gmc_revision',
        'gmc_preparation',
        'gmc_ready_for_registry',
        'com_review'
    ];
    const testSectors = [
        'Савдо <span class="ru">/ Торговля</span>',
        'Истеҳсолот <span class="ru">/ Производство</span>',
        'Хизматрасонӣ <span class="ru">/ Услуги</span>'
    ];

    for (let i = 1; i <= 100; i++) {
        const id = String(20000 + i);
        const status = testStatuses[(i - 1) % testStatuses.length];
        const hour = String(8 + (i % 10)).padStart(2, '0');
        const minute = String((i * 7) % 60).padStart(2, '0');
        const app = {
            id: id,
            name: (window.mockDatabase && window.mockDatabase[id]) ? window.mockDatabase[id]['full-name'] : 'Заявитель ' + i,
            sector: testSectors[i % testSectors.length],
            amount: (5000 + i * 350).toLocaleString('ru-RU'),
            date: '12.03.2026, ' + hour + ':' + minute,
            status: status,
            auditLog: [
                {
                    date: '12.03.2026, ' + hour + ':' + minute,
                    actor: 'Система',
                    action: 'Тестовая заявка создана',
                    actionRu: 'Создана тестовая заявка',
                    color: 'slate',
                    icon: 'flask-conical'
                }
            ]
        };

        if (status === 'fac_revision') {
            app.revisionCount = (i % 3) + 1;
        }
        if (status === 'postponed') {
            // Postponed status is reached only after the 3rd disapproval.
            app.revisionCount = 3;

            // Provide demo variants that are already unlock-ready for facilitator.
            if (i % 2 === 0) {
                app.postponedAtISO = '2025-10-15';
                app.postponedUntilISO = '2026-01-15';
            } else {
                app.postponedAtISO = '2026-03-01';
                app.postponedUntilISO = '2026-06-01';
            }
        }
        if (status === 'piu_review') {
            app.gmcEvaluation = perfGmc;
            app.piuDecisions = { 1: null };
            app.piuStatus = { 1: 'pending' };
        }
        if (status === 'gmc_revision') {
            app.gmcEvaluation = perfGmc;
            app.piuStatus = { 1: 'completed' };
            app.piuDecisions = { 1: 'resubmit' };
            app.piuComment = 'Тестовый возврат из PIU';
        }
        if (['gmc_preparation', 'gmc_ready_for_registry', 'com_review'].includes(status)) {
            app.gmcEvaluation = perfGmc;
            app.piuStatus = perfPiu;
            app.piuDecisions = perfPiuDec;
        }

        window.seedApplications.push(app);
    }

    const approvedListConfigs = [
        { id: 'СП-9001', date: '01.03.2026', exactTime: '10:03', baseAmount: 9000 },
        { id: 'СП-9002', date: '10.03.2026', exactTime: '11:25', baseAmount: 11000 },
        { id: 'СП-9003', date: '20.03.2026', exactTime: '15:40', baseAmount: 13000 }
    ];

    const fixedApprovedByList = {
        'СП-9001': ['10010', '10013']
    };

    const sectors = [
        'Савдо <span class="ru">/ Торговля</span>',
        'Истеҳсолот <span class="ru">/ Производство</span>',
        'Хизматрасонӣ <span class="ru">/ Услуги</span>'
    ];

    approvedListConfigs.forEach(function (cfg, listIndex) {
        const apps = [];
        let total = 0;

        const fixedIds = fixedApprovedByList[cfg.id] || [];
        fixedIds.forEach(function (fixedId) {
            const existing = window.seedApplications.find(function (a) { return a.id === fixedId && a.status === 'approved'; });
            if (!existing) return;
            const amount = parseInt(String(existing.amount || '').replace(/\D/g, '') || 0, 10);
            total += amount;
            apps.push({ id: fixedId, decision: 'ok' });
        });

        const generatedCount = 10 - fixedIds.length;
        for (let i = 1; i <= generatedCount; i++) {
            const serial = listIndex * 10 + fixedIds.length + i;
            const id = String(21000 + serial);
            const amount = cfg.baseAmount + i * 500;
            const amountText = amount.toLocaleString('ru-RU');
            total += amount;

            window.seedApplications.push({
                id: id,
                name: (window.mockDatabase && window.mockDatabase[id]) ? window.mockDatabase[id]['full-name'] : 'Заявитель ' + (100 + serial),
                sector: sectors[serial % sectors.length],
                amount: amountText,
                date: cfg.date + ', ' + cfg.exactTime,
                status: 'approved',
                protocolId: cfg.id,
                gmcEvaluation: perfGmc,
                piuStatus: perfPiu,
                piuDecisions: perfPiuDec,
                auditLog: [
                    {
                        date: cfg.date + ', ' + cfg.exactTime,
                        actor: 'Кумита / Комитет',
                        action: 'Грант тасдиқ шуд (Рӯйхат № ' + cfg.id + ' аз ' + cfg.date + ')',
                        actionRu: 'Грант утвержден (Список № ' + cfg.id + ' от ' + cfg.date + ')',
                        color: 'emerald',
                        icon: 'award'
                    }
                ]
            });

            apps.push({ id: id, decision: 'ok' });
        }

        window.seedProtocols.push({
            id: cfg.id,
            date: cfg.date,
            exactTime: cfg.exactTime,
            okCount: apps.length,
            rejCount: 0,
            revCount: 0,
            totalAmount: total,
            apps: apps
        });
    });

    function buildContractDraftForApproved(app, serial) {
        const beneficiaryId = app.beneficiaryId || app.id;
        const db = (window.beneficiarySearchDatabase && window.beneficiarySearchDatabase[beneficiaryId])
            || (window.mockDatabase && window.mockDatabase[beneficiaryId])
            || {};

        const approvalDate = String(app.date || '').split(',')[0] || '01.03.2026';
        const sectorPlain = String(app.sector || '').replace(/<[^>]*>?/gm, '').trim();
        const serialCode = String(serial).padStart(6, '0');
        const dateMatch = approvalDate.match(/^(\d{2})\.(\d{2})\.(\d{2,4})$/);
        const shortDate = dateMatch
            ? (dateMatch[1] + dateMatch[2] + String(dateMatch[3]).slice(-2))
            : '010126';
        const contractNumber = 'Ш-' + serialCode + '-' + shortDate;
        const baseAccount = String(40702810000000000000 + serial);
        const corrAccount = String(30101810100000000000 + serial);
        const bik = String(350101000 + (serial % 900)).slice(0, 9);

        return {
            fields: {
                contractNumber: contractNumber,
                grantIdentifier: String(app.id || ''),
                committeeGrantNumber: String(app.protocolId || ''),
                approvalDate: approvalDate,
                projectName: sectorPlain,
                grantAmount: String(app.amount || ''),
                organizerName: 'Вазорати меҳнат, муҳоҷират ва шуғли аҳолии Ҷумҳурии Тоҷикистон',
                donorEntityForText: 'Вазорати меҳнат, муҳоҷират ва шуғли аҳолии Ҷумҳурии Тоҷикистон',
                beneficiaryPassportNo: String(db.passport || ''),
                beneficiaryFullName: String(app.name || db['full-name'] || ''),
                granteeEntityForText: String(app.name || db['full-name'] || ''),
                beneficiaryRegAddress: String(db.address || 'ш. Душанбе'),
                beneficiaryProjectAddress: String(db.address || 'ш. Душанбе'),
                beneficiaryPhone: String(app.contacts || db.contacts || '+992 90 000 0000'),
                beneficiaryEmail: String(db.email || db['e-mail'] || db.mail || '—'),
                donorRepName: 'Муҳаммад Саидов',
                donorRepPosition: 'Ҳамоҳангсози грантҳо',
                donorAddress: 'ш. Душанбе, кӯч. Рӯдакӣ 42',
                donorPhone: '+992 37 221 00 00',
                donorEmail: 'grants@mehnat.tj',
                bankName: 'Амонатбонк',
                currentAccount: baseAccount,
                correspondentAccount: corrAccount,
                bik: bik,
                signDateDonor: approvalDate,
                signDateBeneficiary: approvalDate
            },
            updatedAt: app.date || (approvalDate + ', 10:00'),
            updatedByRole: 'Фасилитатор',
            updatedByName: 'Фасилитатор'
        };
    }

    // Prepare several approved applications with fully filled contract draft data.
    const approvedForContractSeed = window.seedApplications.filter(function (a) {
        return a && a.status === 'approved';
    }).slice(0, 8);

    approvedForContractSeed.forEach(function (app, idx) {
        app.grantContractDraft = buildContractDraftForApproved(app, idx + 1);
    });
})();