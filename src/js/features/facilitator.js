(function initFacilitatorFeature() {
    window.AppFeatures = window.AppFeatures || {};
    if (window.AppFeatures.facilitator) return;

    function notifyMessage(kind, message, title) {
        if (window.AppNotify && typeof window.AppNotify.toast === 'function') {
            window.AppNotify.toast(kind || 'info', title || '', message || '');
            return;
        }
        alert((title ? (title + '\n') : '') + (message || ''));
    }

    function getSearchDatabase() {
        return window.beneficiarySearchDatabase || window.mockDatabase || {};
    }

    var REQUIRED_TRAINING_SESSIONS = [
        { key: 'infoSession', tj: 'Сессияи иттилоотӣ', ru: 'Информационная сессия' },
        { key: 'selfKnowledge', tj: 'Худшиносӣ', ru: 'Самопознание' },
        { key: 'entrepreneurshipBasics', tj: 'Асосҳои соҳибкорӣ', ru: 'Основы предпринимательства' },
        { key: 'softSkills', tj: 'Малакаҳои мулоим', ru: 'Мягкие навыки' }
    ];

    function normalizeValue(v) {
        return String(v == null ? '' : v).toLowerCase().replace(/\s+/g, ' ').trim();
    }

    function certStatusLabel(status) {
        if (status === 'certified') return 'Тасдиқшуда / Сертифицирован';
        if (status === 'pending') return 'Дар интизор / Ожидание';
        return String(status || '');
    }

    function getMissingFieldLabels(missingFields) {
        var fields = window.requiredBeneficiaryFields || [];
        return (missingFields || []).map(function (key) {
            var fieldDef = fields.find(function (f) { return f.key === key; });
            return (fieldDef && fieldDef.label) ? fieldDef.label : 'Майдони номаълум / Неизвестное поле';
        });
    }

    function getExistingAppProfiles(excludeAppId) {
        const db = getSearchDatabase();
        const fallbackDb = window.mockDatabase || {};
        return (window.state && window.state.applications ? window.state.applications : [])
            .filter(function (app) { return (!excludeAppId || app.id !== excludeAppId) && app.status !== 'incomplete_data'; })
            .map(function (app) {
                const beneficiaryId = app.beneficiaryId || app.id;
                const source = db[beneficiaryId] || fallbackDb[beneficiaryId] || {};
                return {
                    appId: String(app.id || ''),
                    beneficiaryId: String(beneficiaryId || ''),
                    name: normalizeValue(app.beneficiaryName || app.name || source['full-name']),
                    inn: normalizeValue(app.inn || source.inn),
                    contacts: normalizeValue(app.contacts || source.contacts)
                };
            });
    }

    function getDuplicateDetails(candidate, excludeAppId) {
        const cId = normalizeValue(candidate.id);
        const cName = normalizeValue(candidate.name);
        const cInn = normalizeValue(candidate.inn);
        const cContacts = normalizeValue(candidate.contacts);
        const fields = [];
        const matches = [];

        getExistingAppProfiles(excludeAppId).forEach(function (p) {
            const matchedFields = [];
            if (cId && p.beneficiaryId && cId === p.beneficiaryId) matchedFields.push('ID');
            if (cName && p.name && cName === p.name) matchedFields.push('ФИО');
            if (cInn && p.inn && cInn === p.inn) matchedFields.push('ИНН');
            if (cContacts && p.contacts && cContacts === p.contacts) matchedFields.push('Телефон');
            if (!matchedFields.length) return;
            matchedFields.forEach(function (f) {
                if (!fields.includes(f)) fields.push(f);
            });
            matches.push({ appId: p.appId, fields: matchedFields });
        });

        return { fields: fields, matches: matches };
    }

    function showDuplicateWarning(targetEl, details) {
        if (!targetEl) return;
        if (!details || !details.fields || details.fields.length === 0) {
            targetEl.classList.add('hidden');
            targetEl.classList.remove('bg-rose-50', 'border-rose-200', 'text-rose-800', 'bg-orange-50', 'border-orange-300', 'text-orange-800');
            targetEl.classList.add('bg-amber-50', 'border-amber-200', 'text-amber-800');
            targetEl.textContent = '';
            return;
        }
        const isHard = details.fields.includes('ИНН') || details.fields.includes('Телефон');
        const hitIds = details.matches.slice(0, 3).map(function (m) { return '#' + m.appId; });
        const tail = details.matches.length > 3 ? ' +' + (details.matches.length - 3) : '';
        targetEl.classList.toggle('bg-rose-50', isHard);
        targetEl.classList.toggle('border-rose-200', isHard);
        targetEl.classList.toggle('text-rose-800', isHard);
        targetEl.classList.toggle('bg-amber-50', !isHard);
        targetEl.classList.toggle('border-amber-200', !isHard);
        targetEl.classList.toggle('text-amber-800', !isHard);
        targetEl.textContent = (isHard ? 'Манъ / Блокировка: ' : '') + 'Такрор ёфт шуд / Найден дубль: ' + details.fields.join(', ') + '. Дар дархостҳо / Совпадение в заявках: ' + hitIds.join(', ') + tail + '.';
        targetEl.classList.remove('hidden');
    }

    function hasHardDuplicate(details) {
        if (!details || !details.fields) return false;
        return details.fields.includes('ИНН') || details.fields.includes('Телефон');
    }

    function hasHardDuplicateForBeneficiary(candidate, excludeAppId) {
        return hasHardDuplicate(getDuplicateDetails(candidate, excludeAppId));
    }

    function generateUniqueApplicationId() {
        const list = (window.state && window.state.applications) ? window.state.applications : [];
        let maxNumericId = 49999;
        list.forEach(function (app) {
            const id = String(app.id || '');
            if (!/^\d+$/.test(id)) return;
            const n = parseInt(id, 10);
            if (n > maxNumericId) maxNumericId = n;
        });
        return String(maxNumericId + 1);
    }

    function buildBeneficiarySnapshot(source) {
        source = source || {};
        return {
            fullName: source['full-name'] || '',
            birthDate: source['birth-date'] || '',
            gender: source.gender || '',
            contacts: source.contacts || '',
            address: source.address || '',
            inn: source.inn || '',
            category: source.category || '',
            education: source.education || '',
            course: source.course || '',
            trainingSessions: source.trainingSessions || null
        };
    }

    function getTrainingSessionsState(source) {
        var sessions = (source && source.trainingSessions) || {};
        var keys = ['infoSession', 'selfKnowledge', 'entrepreneurshipBasics', 'softSkills'];
        var hasExplicitSessions = keys.some(function (k) {
            return Object.prototype.hasOwnProperty.call(sessions, k);
        });

        // Fallback for legacy records: if DB session data is absent,
        // rely on cert status; if even that is missing, do not block.
        if (!hasExplicitSessions) {
            if (source && source.certStatus === 'certified') {
                sessions = { infoSession: true, selfKnowledge: true, entrepreneurshipBasics: true, softSkills: true };
            } else if (source && source.certStatus === 'pending') {
                sessions = { infoSession: false, selfKnowledge: false, entrepreneurshipBasics: false, softSkills: false };
            } else {
                sessions = { infoSession: true, selfKnowledge: true, entrepreneurshipBasics: true, softSkills: true };
            }
        }

        var items = REQUIRED_TRAINING_SESSIONS.map(function (s) {
            return {
                key: s.key,
                tj: s.tj,
                ru: s.ru,
                passed: !!sessions[s.key]
            };
        });
        var missing = items.filter(function (x) { return !x.passed; });
        return {
            items: items,
            isComplete: missing.length === 0,
            missingLabels: missing.map(function (x) { return x.ru; })
        };
    }

    function renderTrainingSessionsStatus(source) {
        var listEl = document.getElementById('fac-training-sessions-list');
        var warningEl = document.getElementById('facilitator-sessions-warning');
        var missingEl = document.getElementById('fac-training-sessions-missing');
        if (!listEl || !warningEl || !missingEl) return;

        var state = getTrainingSessionsState(source || {});
        listEl.innerHTML = state.items.map(function (item) {
            var base = item.passed
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800';
            var icon = item.passed ? '✔' : '✖';
            var statusText = item.passed
                ? 'Гузашт / Пройдена'
                : 'Нагузашт / Не пройдена';
            return '<div class="border rounded-lg px-3 py-2 text-[12px] font-medium ' + base + '"><div class="flex items-start justify-between gap-2"><div><span class="mr-1.5">' + icon + '</span>' + item.tj + ' <span class="ru">/ ' + item.ru + '</span></div><span class="text-[11px] font-semibold whitespace-nowrap">' + statusText + '</span></div></div>';
        }).join('');

        if (state.isComplete) {
            warningEl.classList.add('hidden');
            missingEl.textContent = '';
        } else {
            warningEl.classList.remove('hidden');
            missingEl.textContent = state.missingLabels.join(', ');
        }
    }

    function validateTrainingSessionsForGrant(source) {
        var state = getTrainingSessionsState(source || {});
        if (state.isComplete) return true;
        if (window.AppNotify && typeof window.AppNotify.errorByKey === 'function') {
            window.AppNotify.errorByKey('validation.errorDetailed');
        }
        return false;
    }

    function initPhotoPreview() {
        var photoInput = document.getElementById('fac-photo-upload');
        var previewContainer = document.getElementById('fac-photo-preview');
        if (!photoInput || !previewContainer) return;

        photoInput.addEventListener('change', function () {
            previewContainer.innerHTML = '';
            var files = photoInput.files || [];
            var fileArray = Array.prototype.slice.call(files);

            if (fileArray.length > 4) {
                // Limit to 4 files
                fileArray = fileArray.slice(0, 4);
                if (window.AppNotify && typeof window.AppNotify.toast === 'function') {
                    window.AppNotify.toast('warning', 'Внимание', 'Максимум 4 фото. Лишние будут отброшены.');
                }
            }

            fileArray.forEach(function (file, index) {
                if (!file.type.startsWith('image/')) return;

                var reader = new FileReader();
                reader.onload = function (e) {
                    var previewBox = document.createElement('div');
                    previewBox.className = 'relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100 aspect-square';
                    previewBox.style.position = 'relative';

                    var img = document.createElement('img');
                    img.src = e.target.result;
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';

                    var removeBtn = document.createElement('button');
                    removeBtn.type = 'button';
                    removeBtn.className = 'absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity';
                    removeBtn.textContent = '✕';
                    removeBtn.addEventListener('click', function (evt) {
                        evt.preventDefault();
                        evt.stopPropagation();
                        // Remove file from input
                        var dt = new DataTransfer();
                        var filesArray = Array.prototype.slice.call(photoInput.files);
                        filesArray.forEach(function (f, i) {
                            if (i !== index) dt.items.add(f);
                        });
                        photoInput.files = dt.files;
                        // Trigger change event to refresh preview
                        photoInput.dispatchEvent(new Event('change', { bubbles: true }));
                    });

                    previewBox.appendChild(img);
                    previewBox.appendChild(removeBtn);
                    previewContainer.appendChild(previewBox);
                };
                reader.readAsDataURL(file);
            });

            // Update counter
            updateUploadTextsFromInputs(window.currentFacilitatorAppId ? window.getApp(window.currentFacilitatorAppId) : null);
        });
    }

    function getSelectedFileNames(inputId) {
        var input = document.getElementById(inputId);
        if (!input || !input.files || !input.files.length) return [];
        return Array.prototype.map.call(input.files, function (f) { return f && f.name ? f.name : ''; }).filter(Boolean);
    }

    function updateUploadTextsFromInputs(app) {
        var wordNames = getSelectedFileNames('fac-word-upload');
        var pdfNames = getSelectedFileNames('fac-pdf-upload');
        var photoNames = getSelectedFileNames('fac-photo-upload');
        var docs = app && typeof window.ensureDocumentBundle === 'function' ? window.ensureDocumentBundle(app) : null;
        var currentWordInfo = app && typeof window.getCurrentWordVersionInfo === 'function' ? window.getCurrentWordVersionInfo(app) : null;

        var wordText = document.getElementById('fac-word-upload-text');
        var pdfText = document.getElementById('fac-pdf-upload-text');
        var photoText = document.getElementById('fac-photo-upload-text');

        if (wordText) wordText.textContent = wordNames[0] || (currentWordInfo && currentWordInfo.name) || 'Файл не выбран';
        if (pdfText) pdfText.textContent = pdfNames[0] || (docs && docs.basePdf && docs.basePdf.name) || 'Файл не выбран';
        if (photoText) {
            var total = photoNames.length > 0 ? photoNames.length : ((docs && docs.basePhotos && docs.basePhotos.length) || 0);
            photoText.textContent = String(total) + ' / 4';
        }
    }

    function applyRevisionDocumentMode(app) {
        var isRevision = !!(app && app.status === 'fac_revision');
        var pdfInput = document.getElementById('fac-pdf-upload');
        var photoInput = document.getElementById('fac-photo-upload');
        var revisionNote = document.getElementById('fac-revision-docs-note');

        [pdfInput, photoInput].forEach(function (input) {
            if (!input) return;
            input.disabled = isRevision;
            input.classList.toggle('opacity-60', isRevision);
            input.classList.toggle('cursor-not-allowed', isRevision);
            if (isRevision) input.value = '';
        });

        if (revisionNote) revisionNote.classList.toggle('hidden', !isRevision);
    }

    function getExistingDocumentState(app) {
        if (!app || typeof window.ensureDocumentBundle !== 'function') return { hasWord: false, hasPdf: false, photosCount: 0, currentVersion: 0 };
        var docs = window.ensureDocumentBundle(app);
        return {
            hasWord: !!(docs.wordVersions && docs.wordVersions.length > 0),
            hasPdf: !!docs.basePdf,
            photosCount: (docs.basePhotos || []).length,
            currentVersion: docs.currentWordVersion || 0
        };
    }

    function updateWordVersionBadge(app) {
        var badge = document.getElementById('fac-word-version-badge');
        if (!badge) return;
        var current = 0;
        if (app && typeof window.getCurrentWordVersionInfo === 'function') {
            var info = window.getCurrentWordVersionInfo(app);
            current = info ? info.version : 0;
        }
        badge.textContent = 'Word V' + current;
    }

    function validateRequiredDocumentSet(app) {
        var existing = getExistingDocumentState(app);
        var selectedWord = getSelectedFileNames('fac-word-upload');
        var selectedPdf = getSelectedFileNames('fac-pdf-upload');
        var selectedPhotos = getSelectedFileNames('fac-photo-upload');
        var isRevision = !!(app && app.status === 'fac_revision');

        if (isRevision) {
            // Word version is optional on revision; if provided, it will be versioned and logged.
            return true;
        }

        var hasPdf = existing.hasPdf || selectedPdf.length > 0;
        var photosCount = existing.photosCount > 0 ? existing.photosCount : selectedPhotos.length;

        if (!hasPdf) {
            notifyMessage('warning', 'Лутфан PDF-файли бизнес-планро замима кунед. / Пожалуйста, приложите PDF-файл бизнес-плана.');
            return false;
        }
        if (photosCount !== 4) {
            notifyMessage('warning', 'Лутфан маҳз 4 сурат замима кунед. / Пожалуйста, приложите ровно 4 фото.');
            return false;
        }
        return true;
    }

    function persistDocumentBundle(app, sourceStage) {
        if (!app || typeof window.ensureDocumentBundle !== 'function') return;

        var docs = window.ensureDocumentBundle(app);
        var wordNames = getSelectedFileNames('fac-word-upload');
        var pdfNames = getSelectedFileNames('fac-pdf-upload');
        var photoNames = getSelectedFileNames('fac-photo-upload');

        if (!docs.basePdf && pdfNames.length > 0 && typeof window.registerBaseDocuments === 'function') {
            window.registerBaseDocuments(app, {
                pdfName: pdfNames[0],
                photoNames: photoNames,
                uploadedByRole: 'Фасилитатор',
                uploadedByName: 'Фасилитатор'
            });
        }

        if ((!docs.basePhotos || docs.basePhotos.length === 0) && photoNames.length > 0 && typeof window.registerBaseDocuments === 'function') {
            window.registerBaseDocuments(app, {
                photoNames: photoNames,
                uploadedByRole: 'Фасилитатор',
                uploadedByName: 'Фасилитатор'
            });
        }

        var shouldRegisterWord = wordNames.length > 0
            && ((!docs.wordVersions || docs.wordVersions.length === 0) || app.status === 'fac_revision');
        if (shouldRegisterWord && typeof window.registerWordVersion === 'function') {
            var v = window.registerWordVersion(app, {
                fileName: wordNames[0],
                uploadedByRole: 'Фасилитатор',
                uploadedByName: 'Фасилитатор',
                sourceStage: sourceStage || 'facilitator'
            });
            window.addLog(app, 'Фасилитатор', 'Word версия V' + v + ' бор шуд', 'Загружена Word версия V' + v, 'indigo', 'file-up');
        }

        updateWordVersionBadge(app);
    }

    function fillFacilitatorForm(id) {
        const app = window.getApp(id);
        window.currentFacilitatorAppId = id;  // Store for photo preview handler
        const db = getSearchDatabase();
        const fallbackDb = window.mockDatabase || {};
        const beneficiaryId = app && app.beneficiaryId ? app.beneficiaryId : id;
        const source = db[beneficiaryId] || fallbackDb[beneficiaryId] || {};
        const snapshot = (app && app.beneficiarySnapshot) || {};

        const fullName = (app && (app.beneficiaryName || app.name)) || source['full-name'] || snapshot.fullName || '—';
        const inn = (app && app.inn) || source.inn || snapshot.inn || '—';
        const contacts = (app && app.contacts) || source.contacts || snapshot.contacts || '—';
        const applicationId = app ? String(app.id) : generateUniqueApplicationId();

        document.getElementById('id-input').value = applicationId;
        document.getElementById('display-application-number').textContent = applicationId;
        document.getElementById('beneficiary-id-input').value = beneficiaryId || '';
        document.getElementById('display-id').textContent = beneficiaryId || '—';
        document.getElementById('full-name').value = fullName;
        document.getElementById('display-fullname').textContent = fullName;
        document.getElementById('inn').value = inn;
        document.getElementById('display-inn').textContent = inn;
        document.getElementById('display-birthdate').textContent = source['birth-date'] || snapshot.birthDate || '—';
        document.getElementById('display-gender').textContent = source.gender || snapshot.gender || '—';
        document.getElementById('contacts-input').value = contacts;
        document.getElementById('display-contacts').textContent = contacts;
        document.getElementById('display-address').textContent = source.address || snapshot.address || '—';
        document.getElementById('display-category').textContent = source.category || snapshot.category || '—';
        document.getElementById('display-education').textContent = source.education || snapshot.education || '—';
        document.getElementById('course').value = '';
        document.getElementById('display-course').textContent = source.course || snapshot.course || '—';
        renderTrainingSessionsStatus(source);

        updateUploadTextsFromInputs(app);
        updateWordVersionBadge(app);
        applyRevisionDocumentMode(app);
        initPhotoPreview();

        // Check data completeness and highlight missing fields
        applyCompletenessCheck(source);
    }

    function applyCompletenessCheck(source) {
        var result = window.checkBeneficiaryDataComplete(source);
        var warningEl = document.getElementById('facilitator-incomplete-warning');
        var fieldsListEl = document.getElementById('incomplete-fields-list');
        var submitBtn = document.getElementById('btn-submit-facilitator');
        var fields = window.requiredBeneficiaryFields || [];

        // Reset all field highlights
        fields.forEach(function (f) {
            var el = document.querySelector(f.display);
            if (el) {
                el.classList.remove('text-red-600', 'font-bold');
                el.closest('.flex, div');
                var parent = el.parentElement;
                if (parent) parent.classList.remove('bg-red-50', 'rounded-lg', 'ring-2', 'ring-red-300', 'p-1.5');
            }
        });

        if (!result.isComplete) {
            // Show warning
            if (warningEl) warningEl.classList.remove('hidden');

            // Build missing fields list
            if (fieldsListEl) {
                var listHtml = '<span class="font-bold">Майдонҳо / Поля:</span> ';
                result.missingFields.forEach(function (key) {
                    var fieldDef = fields.find(function (f) { return f.key === key; });
                    if (fieldDef) listHtml += '<span class="inline-block bg-orange-200 text-orange-900 px-1.5 py-0.5 rounded mr-1 mb-1">' + fieldDef.label + '</span>';
                });
                fieldsListEl.innerHTML = listHtml;
            }

            // Highlight missing display fields red
            result.missingFields.forEach(function (key) {
                var fieldDef = fields.find(function (f) { return f.key === key; });
                if (!fieldDef) return;
                var el = document.querySelector(fieldDef.display);
                if (el) {
                    el.textContent = '❤ Маълумот нест / Данных нет';
                    el.classList.add('text-red-600', 'font-bold');
                    var parent = el.parentElement;
                    if (parent) parent.classList.add('bg-red-50', 'rounded-lg', 'ring-2', 'ring-red-300', 'p-1.5');
                }
            });

            // Disable submit button
            if (submitBtn) {
                submitBtn.classList.add('opacity-40', 'pointer-events-none');
                submitBtn.setAttribute('disabled', 'true');
            }
        } else {
            // Hide warning
            if (warningEl) warningEl.classList.add('hidden');
            if (fieldsListEl) fieldsListEl.innerHTML = '';

            // Enable submit button
            if (submitBtn) {
                submitBtn.classList.remove('opacity-40', 'pointer-events-none');
                submitBtn.removeAttribute('disabled');
            }
        }

        return result;
    }

    window.applyCompletenessCheck = applyCompletenessCheck;

    function saveToDraft() {
        const appId = document.getElementById('id-input').value;
        if (!appId) return;
        const beneficiaryId = document.getElementById('beneficiary-id-input').value;
        const sectorSelect = document.getElementById('sector-input');
        const sectorText = sectorSelect.options[sectorSelect.selectedIndex].text;
        const amount = document.getElementById('amount-input').value;
        const timestamp = window.getCurrentDateTime();
        const sanitize = window.sanitizeText || function (v) { return String(v == null ? '' : v); };
        var db = getSearchDatabase();
        var fallbackDb = window.mockDatabase || {};
        var source = db[beneficiaryId] || fallbackDb[beneficiaryId] || {};
        let app = window.getApp(appId);
        if (!app) {
            app = { id: appId, name: sanitize(document.getElementById('full-name').value), auditLog: [] };
            window.state.applications.push(app);
        }
        app.beneficiaryId = beneficiaryId || app.beneficiaryId || '';
        app.beneficiaryName = sanitize(document.getElementById('full-name').value);
        app.name = app.beneficiaryName;
        app.inn = sanitize(document.getElementById('inn').value);
        app.contacts = sanitize(document.getElementById('contacts-input').value);
        app.beneficiarySnapshot = buildBeneficiarySnapshot(source);
        app.sector = sectorText || 'Номаълум / Неизвестно';
        app.sectorValue = sectorSelect.value || app.sectorValue || '';
        app.amount = sanitize(amount || '0');
        app.date = timestamp;

        if (!validateTrainingSessionsForGrant(source)) return;

        // Register initial document set if files selected on this draft session
        persistDocumentBundle(app, 'facilitator_draft');

        // Check if beneficiary data is complete
        var completeness = window.checkBeneficiaryDataComplete(source);

        if (!completeness.isComplete) {
            app.status = 'incomplete_data';
            app.missingFields = completeness.missingFields;
            window.addLog(app, 'Фасилитатор', 'Дархост бо маълумоти нопурра захира шуд', 'Сохранено с неполными данными', 'amber', 'alert-triangle');
        } else {
            app.status = 'draft';
            delete app.missingFields;
            window.addLog(app, 'Фасилитатор', 'Сиёҳнавис захира шуд', 'Сохранен черновик', 'slate', 'edit-3');
        }
        window.renderAllCards();
        document.getElementById('applicationModal').classList.add('hidden');
        document.getElementById('toggleFormBtn').click();
    }

    async function submitToGmc() {
        const appId = document.getElementById('id-input').value;
        if (!appId) return;
        const beneficiaryId = document.getElementById('beneficiary-id-input').value;

        // Double-check data completeness
        var db = getSearchDatabase();
        var fallbackDb = window.mockDatabase || {};
        var source = db[beneficiaryId] || fallbackDb[beneficiaryId] || {};
        var completeness = window.checkBeneficiaryDataComplete(source);
        if (!completeness.isComplete) {
            if (window.AppNotify && typeof window.AppNotify.errorByKey === 'function') {
                window.AppNotify.errorByKey('validation.error');
            }
            return;
        }

        const hardDuplicate = hasHardDuplicateForBeneficiary({
            id: beneficiaryId,
            name: document.getElementById('full-name').value,
            inn: document.getElementById('inn').value,
            contacts: document.getElementById('contacts-input').value
        }, appId);
        if (hardDuplicate) {
            if (window.AppNotify && typeof window.AppNotify.errorByKey === 'function') {
                window.AppNotify.errorByKey('submitToGmc.error');
            }
            return;
        }
        const sectorSelect = document.getElementById('sector-input');
        const sectorText = sectorSelect.options[sectorSelect.selectedIndex].text;
        const sectorValue = sectorSelect.value;
        const amount = document.getElementById('amount-input').value;
        if (!sectorValue || !amount) {
            if (window.AppNotify && typeof window.AppNotify.errorByKey === 'function') {
                window.AppNotify.errorByKey('validation.error');
            }
            return;
        }

        const timestamp = window.getCurrentDateTime();
        const sanitize = window.sanitizeText || function (v) { return String(v == null ? '' : v); };
        let app = window.getApp(appId);
        if (!app) {
            app = { id: appId, name: sanitize(document.getElementById('full-name').value), auditLog: [] };
            window.state.applications.push(app);
        }
        app.beneficiaryId = beneficiaryId || app.beneficiaryId || '';
        app.beneficiaryName = sanitize(document.getElementById('full-name').value);
        app.name = app.beneficiaryName;
        app.inn = sanitize(document.getElementById('inn').value);
        app.contacts = sanitize(document.getElementById('contacts-input').value);
        app.beneficiarySnapshot = buildBeneficiarySnapshot(source);
        app.sector = sectorText;
        app.sectorValue = sectorValue || app.sectorValue || '';
        app.amount = sanitize(amount);
        app.date = timestamp;

        if (!validateTrainingSessionsForGrant(source)) return;

        persistDocumentBundle(app, 'facilitator_submit');
        if (!validateRequiredDocumentSet(app)) return;

        var confirmed = true;
        if (window.AppNotify && typeof window.AppNotify.confirmByKey === 'function') {
            confirmed = await window.AppNotify.confirmByKey('submitToGmc.confirm');
        }
        if (!confirmed) return;

        app.status = 'gmc_review';
        window.addLog(app, 'Фасилитатор', 'Ба ШИГ фиристода шуд', 'Отправлено в КУГ', 'blue', 'send');
        window.renderAllCards();
        document.getElementById('applicationModal').classList.add('hidden');
        document.getElementById('toggleFormBtn').click();
        if (window.AppNotify && typeof window.AppNotify.successByKey === 'function') {
            window.AppNotify.successByKey('submitToGmc.success');
        }
    }

    function openDraftFor(id) {
        window.currentOpenedAppId = id;
        window.setAvailableTabs(['pane-facilitator', 'pane-approved']);
        document.getElementById('applicationModal').classList.remove('hidden');
        document.querySelector('.tab-btn[data-target="pane-facilitator"]').click();
    }

    function openRevFor(id) {
        openDraftFor(id);
    }

    async function unlockPostponedApp(id) {
        const app = window.getApp(id);
        if (!app || app.status !== 'postponed') return;

        const isReady = typeof window.isPostponedUnlockReady === 'function'
            ? window.isPostponedUnlockReady(app)
            : false;
        const untilIso = typeof window.getPostponedUntilIso === 'function'
            ? window.getPostponedUntilIso(app)
            : '';
        const untilRu = typeof window.formatIsoDateRu === 'function'
            ? window.formatIsoDateRu(untilIso)
            : (untilIso || '—');

        if (!isReady) {
            if (window.AppNotify && typeof window.AppNotify.warningByKey === 'function') {
                window.AppNotify.warningByKey('deadline.unlockNotAvailableUntilDate', { date: untilRu });
            } else {
                notifyMessage('warning', 'Снятие блокировки пока недоступно. Срок блокировки до ' + untilRu + '.');
            }
            return;
        }

        var shouldUnlock = true;
        if (window.AppNotify && typeof window.AppNotify.confirmByKey === 'function') {
            shouldUnlock = await window.AppNotify.confirmByKey('unlock.confirm');
        } else {
            shouldUnlock = window.confirm(
                'Вы уверены, что хотите разблокировать заявку?\n\n' +
                'Пас аз кушодан, ариза ба ҳолати ислоҳ бармегардад.\n' +
                'После разблокировки заявка будет переведена в режим редактирования.'
            );
        }
        if (!shouldUnlock) return;

        app.status = 'fac_revision';
        app.revisionCount = 0;
        app.reactivated = true;
        app.reactivatedAtISO = (typeof window.toIsoDate === 'function') ? window.toIsoDate(new Date()) : new Date().toISOString().slice(0, 10);
        app.unlockedByRole = 'facilitator';
        app.unlockNoticeProcessedAtISO = app.reactivatedAtISO;
        app.date = window.getCurrentDateTime();

        window.addLog(
            app,
            'Фасилитатор',
            'Блокировка снята вручную, заявка возвращена в редактирование',
            'Блокировка снята вручную, заявка возвращена в редактирование',
            'purple',
            'unlock'
        );

        if (window.AppNotify && typeof window.AppNotify.successByKey === 'function') {
            window.AppNotify.successByKey('unlock.success');
        } else {
            notifyMessage('success', 'Что произошло: блокировка снята, заявка переведена в режим редактирования. Маршрут: Отложена -> Фасилитатор. Следующий статус: На доработке у Фасилитатора.');
        }
        if (typeof window.renderAllCards === 'function') window.renderAllCards();
    }

    function initializeFacilitatorSearch() {
        const toggleBtn = document.getElementById('toggleFormBtn');
        const formBlock = document.getElementById('createFormBlock');
        const clearSelectionBtn = document.getElementById('clearSelection');
        const searchInput = document.getElementById('beneficiarySearch');
        const searchDropdownList = document.getElementById('searchDropdownList');
        const selectedBeneficiary = document.getElementById('selectedBeneficiary');
        const submitApplicationBtn = document.getElementById('submitApplicationBtn');
        const duplicateWarning = document.getElementById('beneficiary-duplicate-warning');
        if (!toggleBtn || !formBlock || !clearSelectionBtn || !searchInput || !searchDropdownList || !selectedBeneficiary || !submitApplicationBtn || !duplicateWarning) return;

        var facWordInput = document.getElementById('fac-word-upload');
        var facPdfInput = document.getElementById('fac-pdf-upload');
        var facPhotoInput = document.getElementById('fac-photo-upload');

        [facWordInput, facPdfInput, facPhotoInput].forEach(function (input) {
            if (!input) return;
            input.addEventListener('change', function () {
                if (input === facPhotoInput && input.files && input.files.length > 4) {
                    notifyMessage('warning', 'Мумкин аст танҳо 4 сурат замима шавад. / Можно прикрепить только 4 фото.');
                    input.value = '';
                }
                var openedApp = window.getApp(window.currentOpenedAppId || document.getElementById('id-input').value);
                updateUploadTextsFromInputs(openedApp || null);
            });
        });

        let isFormVisible = false;
        let selectedBeneficiaryId = null;
        let selectedBeneficiaryData = null;
        let selectedHasHardDuplicate = false;

        function setSubmitEnabled(isEnabled) {
            if (isEnabled) {
                submitApplicationBtn.classList.remove('bg-[#A499F5]', 'pointer-events-none');
                submitApplicationBtn.classList.add('bg-primary', 'cursor-pointer');
                return;
            }
            submitApplicationBtn.className = 'bg-[#A499F5] text-white px-5 py-2.5 rounded-lg text-[13px] font-medium transition-colors pointer-events-none shadow-sm';
        }

        function updateSelectedDuplicateWarning() {
            if (!selectedBeneficiaryId || !selectedBeneficiaryData) {
                showDuplicateWarning(duplicateWarning, null);
                return;
            }
            const details = getDuplicateDetails({
                id: selectedBeneficiaryId,
                name: selectedBeneficiaryData['full-name'],
                inn: selectedBeneficiaryData.inn,
                contacts: selectedBeneficiaryData.contacts
            }, null);
            showDuplicateWarning(duplicateWarning, details);
        }

        function updateQueryDuplicateWarning(query) {
            const q = normalizeValue(query);
            if (!q || q.length < 3 || selectedBeneficiaryId) {
                if (!selectedBeneficiaryId) showDuplicateWarning(duplicateWarning, null);
                return;
            }
            const fields = [];
            const matches = [];
            getExistingAppProfiles(null).forEach(function (p) {
                const hit = [];
                if (p.beneficiaryId && p.beneficiaryId === q) hit.push('ID');
                if (p.inn && p.inn === q) hit.push('ИНН');
                if (p.contacts && p.contacts === q) hit.push('Телефон');
                if (p.name && p.name.includes(q)) hit.push('ФИО');
                if (!hit.length) return;
                hit.forEach(function (f) {
                    if (!fields.includes(f)) fields.push(f);
                });
                matches.push({ appId: p.appId, fields: hit });
            });
            showDuplicateWarning(duplicateWarning, { fields: fields, matches: matches });
        }

        function populateDropdown(query) {
            const q = query || '';
            const esc = window.sanitizeText || function (v) { return String(v == null ? '' : v); };
            searchDropdownList.innerHTML = '';
            var entries = Object.entries(getSearchDatabase());
            var itemsData = [];
            entries.forEach(function (entry) {
                const id = entry[0];
                const user = entry[1];
                const nq = q.toLowerCase();
                const name = String(user['full-name'] || '').toLowerCase();
                const inn = String(user.inn || '').toLowerCase();
                const contacts = String(user.contacts || '').toLowerCase();
                if (q && !name.includes(nq) && !id.toLowerCase().includes(nq) && !inn.includes(nq) && !contacts.includes(nq)) return;
                var completeness = window.checkBeneficiaryDataComplete ? window.checkBeneficiaryDataComplete(user) : { isComplete: true, missingFields: [] };
                itemsData.push({ id: id, user: user, completeness: completeness });
            });
            itemsData.sort(function (a, b) {
                if (!a.completeness.isComplete && b.completeness.isComplete) return -1;
                if (a.completeness.isComplete && !b.completeness.isComplete) return 1;
                return 0;
            });
            itemsData.forEach(function (data) {
                const id = data.id;
                const user = data.user;
                const completeness = data.completeness;
                const initials = user['full-name'].substring(0, 2).toUpperCase();
                const badgeColor = user.certStatus === 'certified' ? 'bg-emerald-100 text-emerald-600' : (user.certStatus === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600');
                var incompleteHtml = '';
                if (!completeness.isComplete) {
                    var missingLabelsForTitle = getMissingFieldLabels(completeness.missingFields);
                    incompleteHtml = '<span class="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-medium ml-1" title="' + esc(missingLabelsForTitle.join(', ')) + '">⚠ нопурра <span class="ru font-normal">/ неполные</span></span>';
                }
                var sessionsState = getTrainingSessionsState(user);
                if (!sessionsState.isComplete) {
                    incompleteHtml += '<span class="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-medium ml-1">⚠ сессияҳо нопурра <span class="ru font-normal">/ сессии не пройдены</span></span>';
                }
                const item = document.createElement('div');
                item.className = 'p-3 hover:bg-slate-50 cursor-pointer flex justify-between border-b border-slate-100 last:border-0 transition-colors' + (!completeness.isComplete ? ' bg-orange-50/40' : '');
                item.innerHTML = '<div class="flex gap-3"><div class="w-8 h-8 rounded-full ' + (!completeness.isComplete ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600') + ' flex items-center justify-center font-bold text-sm">' + esc(initials) + '</div><div class="flex flex-col"><span class="text-[13px] font-medium">' + esc(user['full-name']) + incompleteHtml + '</span><span class="text-[11px] text-gray-500">ID: ' + esc(id) + '</span></div></div><span class="' + badgeColor + ' px-2 py-1 rounded text-[10px] font-bold h-max">' + esc(certStatusLabel(user.certStatus)) + '</span>';
                item.addEventListener('click', function () {
                    selectedBeneficiaryId = id;
                    selectedBeneficiaryData = user;
                    document.getElementById('searchDropdown').classList.add('hidden');
                    searchInput.classList.add('hidden');
                    selectedBeneficiary.classList.remove('hidden');
                    selectedBeneficiary.classList.add('flex');
                    selectedBeneficiary.querySelector('.selected-name').textContent = user['full-name'];
                    selectedBeneficiary.querySelector('.avatar-initials').textContent = initials;
                    const selectedBadgeColor = user.certStatus === 'certified' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600';
                    selectedBeneficiary.querySelector('.selected-badge').className = selectedBadgeColor + ' px-1.5 py-0.5 rounded text-[10px] font-semibold w-max leading-none selected-badge';
                    selectedBeneficiary.querySelector('.selected-badge').textContent = certStatusLabel(user.certStatus);
                    const details = getDuplicateDetails({
                        id: selectedBeneficiaryId,
                        name: selectedBeneficiaryData['full-name'],
                        inn: selectedBeneficiaryData.inn,
                        contacts: selectedBeneficiaryData.contacts
                    }, null);
                    selectedHasHardDuplicate = hasHardDuplicate(details);
                    var selCompleteness = window.checkBeneficiaryDataComplete ? window.checkBeneficiaryDataComplete(user) : { isComplete: true, missingFields: [] };
                    var sessionsState = getTrainingSessionsState(user);
                    if (!selCompleteness.isComplete) {
                        var missingLabels = getMissingFieldLabels(selCompleteness.missingFields).join(', ');
                        duplicateWarning.classList.remove('hidden', 'bg-rose-50', 'border-rose-200', 'text-rose-800', 'bg-amber-50', 'border-amber-200', 'text-amber-800');
                        duplicateWarning.classList.add('bg-orange-50', 'border-orange-300', 'text-orange-800');
                        duplicateWarning.textContent = '⚠ Маълумоти бенефициар нопурра аст! / Данные бенефициара неполные: ' + missingLabels + '.';
                        if (details.fields.length > 0) {
                            var hitIds2 = details.matches.slice(0, 3).map(function (m) { return '#' + m.appId; });
                            duplicateWarning.textContent += ' Инчунин ёфт шуд такрор / Также найден дубль: ' + details.fields.join(', ') + ' дар дархостҳо / в заявках: ' + hitIds2.join(', ') + '.';
                        }
                    } else {
                        duplicateWarning.classList.remove('bg-orange-50', 'border-orange-300', 'text-orange-800');
                        showDuplicateWarning(duplicateWarning, details);
                    }
                    if (!sessionsState.isComplete) {
                        duplicateWarning.classList.remove('hidden', 'bg-rose-50', 'border-rose-200', 'text-rose-800', 'bg-amber-50', 'border-amber-200', 'text-amber-800', 'bg-orange-50', 'border-orange-300', 'text-orange-800');
                        duplicateWarning.classList.add('bg-red-50', 'border-red-300', 'text-red-800');
                        duplicateWarning.textContent = 'Заявитель не прошел обязательные сессии: ' + sessionsState.missingLabels.join(', ') + '. Включение в грантовую заявку запрещено.';
                    }
                    setSubmitEnabled(user.certStatus === 'certified' && !selectedHasHardDuplicate && sessionsState.isComplete);
                });
                searchDropdownList.appendChild(item);
            });
        }

        toggleBtn.addEventListener('click', function () {
            isFormVisible = !isFormVisible;
            if (isFormVisible) {
                formBlock.classList.remove('hidden');
                document.getElementById('btnIcon').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
                document.getElementById('btnText').innerHTML = 'Бекор кардан <span class="ru">/ Отмена</span>';
            } else {
                formBlock.classList.add('hidden');
                document.getElementById('btnIcon').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
                document.getElementById('btnText').innerHTML = 'Дархости нав <span class="ru">/ Новая заявка</span>';
                clearSelectionBtn.click();
                if (facWordInput) facWordInput.value = '';
                if (facPdfInput) facPdfInput.value = '';
                if (facPhotoInput) facPhotoInput.value = '';
                updateUploadTextsFromInputs();
            }
        });

        const cancelFormBtn = document.getElementById('cancelFormBtn');
        if (cancelFormBtn) {
            cancelFormBtn.addEventListener('click', function () {
                if (isFormVisible) toggleBtn.click();
            });
        }

        searchInput.addEventListener('focus', function () {
            populateDropdown(searchInput.value);
            document.getElementById('searchDropdown').classList.remove('hidden');
            updateQueryDuplicateWarning(searchInput.value);
        });
        searchInput.addEventListener('input', function (e) {
            populateDropdown(e.target.value);
            document.getElementById('searchDropdown').classList.remove('hidden');
            updateQueryDuplicateWarning(e.target.value);
        });

        clearSelectionBtn.addEventListener('click', function () {
            selectedBeneficiaryId = null;
            selectedBeneficiaryData = null;
            selectedHasHardDuplicate = false;
            selectedBeneficiary.classList.add('hidden');
            selectedBeneficiary.classList.remove('flex');
            searchInput.classList.remove('hidden');
            searchInput.value = '';
            if (facWordInput) facWordInput.value = '';
            if (facPdfInput) facPdfInput.value = '';
            if (facPhotoInput) facPhotoInput.value = '';
            updateUploadTextsFromInputs();
            setSubmitEnabled(false);
            showDuplicateWarning(duplicateWarning, null);
        });

        submitApplicationBtn.addEventListener('click', function () {
            if (!selectedBeneficiaryId) return;
            if (selectedHasHardDuplicate) {
                notifyMessage('error', 'Эҷод блок шуд: такрор аз рӯи ИНН ё телефон ёфт шуд. / Создание заблокировано: найден дубль по ИНН или телефону.');
                return;
            }
            if (!validateTrainingSessionsForGrant(selectedBeneficiaryData || {})) {
                return;
            }
            window.setAvailableTabs(['pane-facilitator']);
            document.getElementById('applicationModal').classList.remove('hidden');
            document.querySelector('.tab-btn[data-target="pane-facilitator"]').click();
            document.getElementById('facilitator-revision-block').classList.add('hidden');
            document.getElementById('amount-input').value = '';
            document.getElementById('sector-input').selectedIndex = 0;
            document.getElementById('experience').value = '';
            fillFacilitatorForm(selectedBeneficiaryId);
            if (window.lucide) window.lucide.createIcons();
        });
    }

    initializeFacilitatorSearch();

    window.AppFeatures.facilitator = {
        ready: true,
        fillFacilitatorForm,
        saveToDraft,
        submitToGmc,
        openDraftFor,
        openRevFor,
        unlockPostponedApp,
        initializeFacilitatorSearch
    };

    // Legacy compatibility while migrating code out of grant.html
    window.fillFacilitatorForm = fillFacilitatorForm;
    window.saveToDraft = saveToDraft;
    window.submitToGmc = submitToGmc;
    window.openDraftFor = openDraftFor;
    window.openRevFor = openRevFor;
    window.unlockPostponedApp = unlockPostponedApp;
})();
