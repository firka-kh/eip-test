(function initHeaderRoleTabs() {
    function setActiveHeaderTab(filterName) {
        document.querySelectorAll('#header-role-tabs .role-tab').forEach(function (tab) {
            tab.classList.toggle('role-tab--active', tab.getAttribute('data-role-filter') === filterName);
        });
    }

    function syncHeaderTabCounts() {
        var map = {
            facilitator: 'dash-fac-badge',
            gmc: 'dash-gmc-badge',
            committee: 'dash-com-badge',
            statuses: 'dash-status-badge',
            finance_registry: 'dash-finance-badge'
        };
        var counts = {};
        var total = 0;

        Object.keys(map).forEach(function (key) {
            var source = document.getElementById(map[key]);
            var raw = source ? String(source.textContent || '').trim() : '0';
            var val = parseInt(raw, 10);
            if (!Number.isFinite(val)) val = 0;
            counts[key] = val;
            total += val;
        });

        document.querySelectorAll('#header-role-tabs .role-tab').forEach(function (tab) {
            var key = tab.getAttribute('data-role-filter');
            var count = counts[key] || 0;
            var badge = tab.querySelector('.role-tab__badge');
            var bar = tab.querySelector('.role-tab__bar');
            if (badge) {
                badge.textContent = String(count);
                if (key === 'finance_registry' && count === 0) {
                    badge.classList.add('hidden');
                } else {
                    badge.classList.remove('hidden');
                }
            }
            if (bar) {
                var width = total > 0 ? Math.max(0, Math.min(100, Math.round((count / total) * 100))) : 0;
                bar.style.width = width + '%';
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('#header-role-tabs .role-tab__bar').forEach(function (bar) {
            var initial = parseInt(bar.getAttribute('data-initial-width') || '0', 10);
            if (!Number.isFinite(initial)) initial = 0;
            bar.style.width = Math.max(0, Math.min(100, initial)) + '%';
        });

        document.querySelectorAll('#header-role-tabs .role-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                var filter = tab.getAttribute('data-role-filter');
                var target = document.querySelector('.filter-btn[data-filter=\"' + filter + '\"]');
                if (target) target.click();
                setActiveHeaderTab(filter);
            });
        });

        document.querySelectorAll('.filter-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var filter = btn.getAttribute('data-filter');
                setActiveHeaderTab(filter);
                syncHeaderTabCounts();
            });
        });

        var active = (window.activeMainFilter || '').trim();
        if (!active) {
            var current = document.querySelector('.filter-btn.bg-primary');
            active = current ? current.getAttribute('data-filter') : 'facilitator';
        }

        setActiveHeaderTab(active);
        syncHeaderTabCounts();
    });
})();
