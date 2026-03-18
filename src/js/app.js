// Modular bootstrap: initialize app only from extracted modules.
(function bootstrapApp() {
    if (window.__grantAppBootstrapped) return;
    window.__grantAppBootstrapped = true;
    const bootStartedAt = Date.now();

    const moduleScripts = [
        'src/js/core/utils.js',
        'src/js/state/seed-dictionaries.js',
        'src/js/state/seed-applications.js',
        'src/js/state/seed-monitoring.js',
        'src/js/state/seed-data.js',
        'src/js/state/store.js',
        'src/js/ui/render.js',
        'src/js/features/facilitator.js',
        'src/js/features/gmc.js',
        'src/js/features/committee.js',
        'src/js/features/monitoring.js'
    ];

    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            const tag = document.createElement('script');
            tag.src = src;
            tag.async = false;
            tag.onload = resolve;
            tag.onerror = function () {
                reject(new Error('Failed to load ' + src));
            };
            document.head.appendChild(tag);
        });
    }

    function loadScriptsSequentially(scripts) {
        return scripts.reduce(function (chain, src) {
            return chain.then(function () { return loadScript(src); });
        }, Promise.resolve());
    }

    function finishBoot(ok) {
        const loader = document.getElementById('app-init-loader');
        if (!loader) return;

        if (!ok) {
            const text = loader.querySelector('.filter-text');
            if (text) {
                text.innerHTML = '<span>Хато дар боргузорӣ</span><span class="ru-block">Ошибка инициализации</span>';
            }
            loader.style.background = '#fef2f2';
            loader.style.borderColor = '#fecaca';
            loader.style.color = '#991b1b';
            return;
        }

        const elapsed = Date.now() - bootStartedAt;
        const minVisibleMs = 300;
        const waitMs = Math.max(0, minVisibleMs - elapsed);
        setTimeout(function () {
            loader.classList.add('is-hidden');
            setTimeout(function () {
                if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
            }, 220);
        }, waitMs);
    }

    loadScriptsSequentially(moduleScripts)
        .then(function () {
            finishBoot(true);
        })
        .catch(function () {
            // Keep app usable even if a helper module fails to load.
            finishBoot(false);
        });
})();
