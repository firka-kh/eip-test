(function initStoreModule() {
    if (window.AppStore) return;

    function getState() {
        if (!window.state) {
            window.state = { applications: [], protocols: [], registryLists: [], monitoring: {} };
        }
        if (!Array.isArray(window.state.registryLists)) window.state.registryLists = [];
        return window.state;
    }

    function setState(nextState) {
        window.state = nextState;
        return window.state;
    }

    function getApp(id) {
        return getState().applications.find(function (a) { return a.id === id; });
    }

    function filterApps(statusArr) {
        return getState().applications.filter(function (a) { return statusArr.includes(a.status); });
    }

    window.AppStore = {
        getState,
        setState,
        getApp,
        filterApps
    };

    // Legacy compatibility while migrating code out of grant.html
    window.getApp = getApp;
    window.filterApps = filterApps;

    var requiredBeneficiaryFields = [
        { key: 'full-name', display: '#display-fullname', label: 'Номи пурра / ФИО' },
        { key: 'birth-date', display: '#display-birthdate', label: 'Санаи таваллуд / Дата рождения' },
        { key: 'gender', display: '#display-gender', label: 'Ҷинс / Пол' },
        { key: 'contacts', display: '#display-contacts', label: 'Тамос / Контакты' },
        { key: 'address', display: '#display-address', label: 'Суроғаи пурра / Адрес' },
        { key: 'inn', display: '#display-inn', label: 'РМА (ИНН)' },
        { key: 'category', display: '#display-category', label: 'Гурӯҳ / Категория' },
        { key: 'education', display: '#display-education', label: 'Таҳсилот / Образование' },
        { key: 'course', display: '#display-course', label: 'Ихтисос / Курс' }
    ];

    window.requiredBeneficiaryFields = requiredBeneficiaryFields;

    window.checkBeneficiaryDataComplete = function (sourceRecord) {
        if (!sourceRecord) return { isComplete: false, missingFields: requiredBeneficiaryFields.map(function (f) { return f.key; }) };
        var missing = [];
        requiredBeneficiaryFields.forEach(function (field) {
            var val = sourceRecord[field.key];
            if (val === undefined || val === null || String(val).trim() === '' || String(val).trim() === '—') {
                missing.push(field.key);
            }
        });
        return { isComplete: missing.length === 0, missingFields: missing };
    };
})();
