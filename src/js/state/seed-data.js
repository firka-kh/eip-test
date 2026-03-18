(function initSeedData() {
    if (window.__grantSeedDataLoaded) return;

    if (!window.__grantSeedDictionariesLoaded) return;
    if (!window.__grantSeedApplicationsLoaded) return;
    if (!window.__grantSeedMonitoringLoaded) return;

    window.__grantSeedDataLoaded = true;

    if (!window.state || !Array.isArray(window.state.applications) || window.state.applications.length === 0) {
        window.state = {
            protocols: Array.isArray(window.seedProtocols) ? window.seedProtocols : [],
            applications: Array.isArray(window.seedApplications) ? window.seedApplications : [],
            registryLists: Array.isArray(window.seedRegistryLists) ? window.seedRegistryLists : [],
            monitoring: window.seedMonitoring || {}
        };
    }

    if (!Array.isArray(window.state.registryLists)) {
        window.state.registryLists = [];
    }

    if (window.state.registryLists.length === 0) {
        const pendingApps = (window.state.applications || []).filter(function (a) {
            return a.status === 'com_review';
        });
        if (pendingApps.length > 0) {
            const totalAmount = pendingApps.reduce(function (sum, app) {
                return sum + parseInt(String(app.amount || '').replace(/\D/g, '') || 0, 10);
            }, 0);
            window.state.registryLists.push({
                id: 'РЕЕСТР-GMS-1001',
                source: 'gms',
                status: 'pending',
                date: '12.03.2026',
                exactTime: '10:00',
                apps: pendingApps.map(function (app) { return app.id; }),
                totalAmount: totalAmount
            });
        }
    }

    if (typeof window.currentOpenedAppId === 'undefined') window.currentOpenedAppId = null;
    if (typeof window.currentApprovedAppId === 'undefined') window.currentApprovedAppId = null;

    // One-way migration: PIU stage removed, route legacy items to GMC preparation.
    (window.state.applications || []).forEach(function (app) {
        if (!app) return;
        if (app && app.status === 'piu_review') {
            app.status = 'gmc_preparation';
        }
        if (app && app.status === 'gmc_revision') {
            app.status = 'fac_revision';
            app.lastReturnSource = app.lastReturnSource || 'gmc';
        }

        // Drop removed PIU legacy fields from persisted records.
        if (Object.prototype.hasOwnProperty.call(app, 'piuStatus')) {
            delete app.piuStatus;
        }
        if (Object.prototype.hasOwnProperty.call(app, 'piuDecisions')) {
            delete app.piuDecisions;
        }
    });
    if (window.activeMainFilter === 'piu') {
        window.activeMainFilter = 'gmc';
    }

    if (!Array.isArray(window.seedGmcOperators) || window.seedGmcOperators.length === 0) {
        // Test operators for GMC questionnaire processing suggestions.
        window.seedGmcOperators = [
            'Алишер Каримов',
            'Мадина Рахимова',
            'Дилшод Норбоев',
            'Шахноза Юлдашева',
            'Азизбек Турсунов',
            'Феруза Ибрагимова'
        ];
    }
})();
