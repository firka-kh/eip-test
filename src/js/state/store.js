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
    if (!window.checkBeneficiaryDataComplete) {
        window.checkBeneficiaryDataComplete = function () { return true; };
    }
})();
