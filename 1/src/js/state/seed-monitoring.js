(function initSeedMonitoring() {
    if (window.__grantSeedMonitoringLoaded) return;
    window.__grantSeedMonitoringLoaded = true;

    window.seedMonitoring = {
        '10010': [
            { id: 1, days: 30, status: 'completed', plannedDate: '27.03.2026', visitDate: '25.02.2026', equipment: 'not_used', business: 'suspended', income: 552, ecoCheck: false, note: '', photos: [1, 2] },
            { id: 2, days: 90, status: 'active', plannedDate: '27.05.2026', daysLeft: 77 },
            { id: 3, days: 180, status: 'pending', plannedDate: '24.08.2026' },
            { id: 4, days: 360, status: 'pending', plannedDate: '20.02.2027' }
        ]
    };
})();