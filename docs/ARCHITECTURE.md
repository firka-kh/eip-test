# Архитектура системы / System Architecture

## Актуализация от 17.03.2026

- **Унифицированная система уведомлений**: все сообщения (toast + confirm) переработаны в единый дизайн: центр экрана, размытый фон (`backdrop-filter: blur`), круглая иконка-индикатор (✓ / ! / i / ?), анимация `scale(0.9 → 1)`.
- **Поле ФИО оператора ШИГ/КУГ**: добавлено в форму GMC форма, обязательно для всех действий оператора (блокирует кнопки решений до заполнения), используется в аудит-логе вместо обобщённого `'ШИГ / КУГ'`.
- **Меню фильтров**: выровнено по `flex: 1 1 0` (равные ширины для всех 7 кнопок), удалены KPI-блоки (135/30/1) из правой части шапки, все кнопки одной высоты (74px), бейджи имеют меньше padding и шрифт (9px, 0 vertical padding).
- **Система уведомлений полностью заменена**: старые toast в нижнем-правом углу и базовые confirm-диалоги удалены; все сообщения через `AppNotify.toast()` и `AppNotify.confirm()`.
- Фича-модули используют локальные `notifyMessage`-обертки и вызывают `AppNotify` как основной канал, сохраняя `alert` только как fallback.
- В блоке черновика договора (pane approved) в UI добавлена нижняя кнопка закрытия `Бекор кардан / Отмена`.

## Обзор

Система представляет собой **одностраничное веб-приложение** (SPA), работающее полностью на клиенте без серверной части. Все данные хранятся в памяти браузера (`window.state`).

### Ключевые принципы:
- **IIFE-модули** с guard-паттерном для предотвращения повторной инициализации
- **Глобальная область** через `window.*` для межмодульной коммуникации
- **Двуязычный интерфейс**: все надписи на таджикском (крупнее) + русском (мельче) через CSS-классы `.ru`, `.ru-block`, `.ru.font-normal`
- **XSS-защита**: санитизация через `sanitizeText()` для всех пользовательских вводов

---

## Диаграмма компонентов (UML Component Diagram)

```mermaid
graph TB
    subgraph "Browser — grant.html"
        subgraph "Entry Point"
            APP[app.js<br/>Загрузчик модулей]
        end

        subgraph "Core Layer"
            UTILS[core/utils.js<br/>sanitizeText, addLog,<br/>getCurrentDateTime,<br/>sanitizeCsvField,<br/>ensureDocumentBundle,<br/>registerWordVersion,<br/>downloadBusinessPlan*]
            NOTIFY[core/utils.js<br/>AppNotify:<br/>toast, confirmByKey,<br/>successByKey/warningByKey]
        end

        subgraph "State Layer"
            DICT[seed-dictionaries.js<br/>mockDatabase,<br/>beneficiarySearchDatabase,<br/>selectedForRegistry]
            SEED_APP[seed-applications.js<br/>seedApplications,<br/>seedProtocols]
            SEED_MON[seed-monitoring.js<br/>seedMonitoring]
            SEED_DATA[seed-data.js<br/>Сборка window.state]
            STORE[store.js<br/>getApp, filterApps,<br/>getState, setState,<br/>checkBeneficiaryDataComplete]
        end

        subgraph "UI Layer"
            RENDER[ui/render.js<br/>renderAllCards,<br/>updateAllBadges,<br/>updateDashboardFilter,<br/>initializeDashboardFilters]
        end

        subgraph "Feature Layer"
            FAC[facilitator.js<br/>fillFacilitatorForm,<br/>saveToDraft,<br/>submitToGmc,<br/>applyCompletenessCheck]
            GMC[gmc.js<br/>loadGmcForm,<br/>saveGmcDecision,<br/>markReadyForRegistry]
            COM[committee.js<br/>openCommitteeBatch,<br/>submitCommitteeBatch,<br/>exportProtocolToExcel]
            MON[monitoring.js<br/>generateMonitoringFor,<br/>saveMonitoringVisit,<br/>renderMonitoringList]
        end
    end

    APP -->|1. load| UTILS
    APP -->|2. load| NOTIFY
    APP -->|3. load| DICT
    APP -->|4. load| SEED_APP
    APP -->|5. load| SEED_MON
    APP -->|6. load| SEED_DATA
    APP -->|7. load| STORE
    APP -->|8. load| RENDER
    APP -->|9. load| FAC
    APP -->|10. load| GMC
    APP -->|11. load| COM
    APP -->|12. load| MON

    SEED_DATA --> DICT
    SEED_DATA --> SEED_APP
    SEED_DATA --> SEED_MON
    STORE --> SEED_DATA

    FAC --> STORE
    FAC --> UTILS
    FAC --> NOTIFY
    FAC --> RENDER
    GMC --> STORE
    GMC --> UTILS
    GMC --> NOTIFY
    GMC --> RENDER
    COM --> STORE
    COM --> UTILS
    COM --> NOTIFY
    COM --> RENDER
    MON --> STORE
    MON --> UTILS
    MON --> NOTIFY
    MON --> RENDER
```

---

## Порядок загрузки модулей

Модули загружаются **строго последовательно** через `app.js`:

```mermaid
sequenceDiagram
    participant Browser
    participant app.js
    participant Modules

    Browser->>app.js: DOMContentLoaded
    app.js->>Modules: 1. core/utils.js
    app.js->>Modules: 2. state/seed-dictionaries.js
    app.js->>Modules: 3. state/seed-applications.js
    app.js->>Modules: 4. state/seed-monitoring.js
    app.js->>Modules: 5. state/seed-data.js
    app.js->>Modules: 6. state/store.js
    app.js->>Modules: 7. ui/render.js
    app.js->>Modules: 8. features/facilitator.js
    app.js->>Modules: 9. features/gmc.js
    app.js->>Modules: 10. features/committee.js
    app.js->>Modules: 11. features/monitoring.js
    Modules-->>app.js: Все модули загружены
    app.js->>Browser: Скрыть лоадер, показать UI
```

Каждый модуль обернут в **IIFE** (`(function init...() { ... })()`) с guard-проверкой повторной инициализации.

---

## Паттерн модульности

```
┌──────────────────────────────────────────┐
│  (function initModuleName() {            │
│      if (window.ModuleName) return;  ◄── guard от повторной загрузки
│                                          │
│      function privateFunc() { ... }      │
│                                          │
│      // Public API через namespace       │
│      window.AppFeatures.moduleName = {   │
│          ready: true,                    │
│          publicFunc: privateFunc         │
│      };                                  │
│                                          │
│      // Legacy compatibility             │
│      window.publicFunc = privateFunc; ◄── прямой доступ через window
│  })();                                   │
└──────────────────────────────────────────┘
```

---

## Управление состоянием (State Management)

```mermaid
graph LR
    subgraph "window.state"
        A["applications[]<br/>Массив всех заявок"]
        P["protocols[]<br/>Утвержденные протоколы"]
        R["registryLists[]<br/>Входящие реестры"]
        M["monitoring{}<br/>Данные мониторинга<br/>по app ID"]
    end

    subgraph "Store API (store.js)"
        GA[getApp id]
        FA[filterApps statusArr]
        GS[getState]
    end

    GA --> A
    FA --> A
    GS --> A
    GS --> P
    GS --> R
    GS --> M
```

### Поток данных (Data Flow)

```mermaid
flowchart LR
    UI["UI Event<br/>(клик кнопки)"] --> FEATURE["Feature Module<br/>(facilitator/gmc/com)"]
    FEATURE --> STATE["window.state<br/>(мутация объекта)"]
    FEATURE --> LOG["addLog()<br/>(аудит)"]
    STATE --> RENDER["renderAllCards()<br/>(перерисовка)"]
    RENDER --> DOM["DOM<br/>(обновление карточек,<br/>бейджей, фильтров)"]
```

### Поток фильтрации в разделе одобренных

```mermaid
flowchart LR
    A[activeMainFilter = approved_registry] --> B[renderAllCards]
    B --> C[Карточки списков: approved_list]
    B --> D[Карточки заявителей: approved_item]

    E[Поиск: #filter-search-issued] --> F{Есть совпадения по заявителям?}
    F -->|Да| G[Показать approved_item]
    F -->|Нет| H[Показать approved_list]

    I[Сектор/регион/пол] --> J[Применяются в обоих режимах]
    J --> G
    J --> H
```

Ключевая идея:
- Поиск по ID/ФИО заявителя переключает вид на карточки отдельных заявителей.
- Поиск по номеру списка/протокола оставляет вид карточек списков.

### Поток блокировки и ручной разблокировки

```mermaid
flowchart LR
    GMC["Решение ШИГ / КУГ"] -->|"3-е неодобрение"| POSTPONED["status=postponed\nrevisionCount=3\npostponedAtISO/postponedUntilISO"]
    POSTPONED --> READY["Срок истек\nготова к разблокировке (unlock-ready)"]
    READY --> NOTIF["Лента уведомлений Фасилитатора\nколокольчик + бейдж"]
    NOTIF -->|"Разблокировать"| FAC["Действие Фасилитатора"]
    FAC --> REV["status=fac_revision\nreactivated=true\nrevisionCount=0"]
```

Ключевые принципы:
- Автоматической реактивации нет: даже после истечения срока заявка остается в `postponed`.
- Разблокировка выполняется только вручную Фасилитатором.
- UI показывает постоянную метку, что заявка была возвращена после периода блокировки.

### Поток документов бизнес-плана (Word versioning)

```mermaid
flowchart LR
    F1[Фасилитатор: первичная подача] --> D1[documents.basePdf + documents.basePhotos]
    F1 --> W1[documents.wordVersions: V1]
    W1 --> G1[ШИГ / КУГ и Комитет читают текущий Word]
    G1 -->|Отклонение Комитета + разблокировка| G2[Фасилитатор загружает новый Word]
    G2 --> W2[registerWordVersion -> V2, V3...]
    W2 --> UI1[Карточки/таблицы: Current Word Version: Vn]
    D1 --> UI2[Отдельные скачивания PDF/фото]
```

Ключевые принципы:
- Версионируется только Word-документ бизнес-плана.
- PDF и фото-комплект фиксируются один раз как базовые вложения.
- Скачивание разделено на 3 действия: текущая Word-версия, фиксированный PDF, фиксированный фото-комплект.

### Поток подписанного договора (после approved)

```mermaid
flowchart LR
    A[Статус заявки = approved] --> B[Фасилитатор открывает pane-approved]
    B --> C[Загрузка файла договора]
    C --> D[registerGrantAgreement]
    D --> E[app.grantAgreement обновлен]
    E --> F[addLog: загрузка/обновление договора]
    E --> G[Кнопка скачивания договора доступна]
```

Ключевые принципы:
- Загрузка доступна только Фасилитатору и только в статусе `approved`.
- Для остальных ролей блок работает в режиме просмотра/скачивания.
- Метаданные договора (кто/когда/какой файл) отображаются в UI и сохраняются в состоянии заявки.

### Поток формирования черновика договора (после approved)

```mermaid
flowchart LR
    A[Статус заявки = approved] --> B[Фасилитатор раскрывает full-width блок договора]
    B --> C[renderGrantContractDraftPanel]
    C --> D[Автополя из app + beneficiary db]
    D --> E[Ручные поля по структуре договора]
    E --> F[formatContractNumberValue -> Ш-******-ДДММГГ]
    F --> G[saveGrantContractDraftFromModal]
    G --> H[app.grantContractDraft.fields]
    H --> I[preview/print/export PDF]
```

Ключевые принципы:
- Блок формы раскрывается по кнопке и рендерится отдельным full-width разделом.
- Порядок полей и групп фиксирован под шаблон договора.
- Номер договора нормализуется в формат `Ш-******-ДДММГГ`.
- Сумма договора всегда берется из approved заявки.

---

## Внешние зависимости

| Библиотека | Версия | Назначение | Загрузка |
|------------|--------|------------|----------|
| Tailwind CSS | latest | Утилитарные CSS-классы | CDN `cdn.tailwindcss.com` |
| Lucide Icons | latest | SVG-иконки | CDN `unpkg.com/lucide@latest` |
| Inter Font | — | Шрифт интерфейса | Google Fonts CDN |

> **Важно:** Все зависимости загружаются с CDN. Для офлайн-работы необходимо скачать их локально.

---

## Безопасность

### Реализованные меры

| Мера | Модуль | Описание |
|------|--------|----------|
| XSS-защита | `utils.js` → `sanitizeText()` | Экранирование `& < > " '` при сохранении пользовательского ввода |
| CSV-инъекция | `utils.js` → `sanitizeCsvField()` | Блокировка формул `= + - @` при экспорте |
| Дедупликация | `facilitator.js` | Блокировка создания заявки при совпадении ИНН/телефона |
| Guard-проверки | Все модули | Предотвращение повторной инициализации |

### Ограничения прототипа

- Нет аутентификации и авторизации на сервере
- Данные хранятся только в памяти (теряются при перезагрузке)
- Глобальный scope (`window.*`) — подходит для прототипа, не для продакшена
