# Архитектура системы / System Architecture

## Обзор

Система представляет собой **одностраничное веб-приложение** (SPA), работающее полностью на клиенте без серверной части. Все данные хранятся в памяти браузера (`window.state`).

---

## Диаграмма компонентов (UML Component Diagram)

```mermaid
graph TB
    subgraph "Browser — grant.html"
        subgraph "Entry Point"
            APP[app.js<br/>Загрузчик модулей]
        end

        subgraph "Core Layer"
            UTILS[core/utils.js<br/>sanitizeText, addLog,<br/>getCurrentDateTime,<br/>sanitizeCsvField]
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
            PIU[piu.js<br/>loadPiuForm,<br/>finalizePiu]
            COM[committee.js<br/>openCommitteeBatch,<br/>submitCommitteeBatch,<br/>exportProtocolToExcel]
            MON[monitoring.js<br/>generateMonitoringFor,<br/>saveMonitoringVisit,<br/>renderMonitoringList]
        end
    end

    APP -->|1. load| UTILS
    APP -->|2. load| DICT
    APP -->|3. load| SEED_APP
    APP -->|4. load| SEED_MON
    APP -->|5. load| SEED_DATA
    APP -->|6. load| STORE
    APP -->|7. load| RENDER
    APP -->|8. load| FAC
    APP -->|9. load| GMC
    APP -->|10. load| PIU
    APP -->|11. load| COM
    APP -->|12. load| MON

    SEED_DATA --> DICT
    SEED_DATA --> SEED_APP
    SEED_DATA --> SEED_MON
    STORE --> SEED_DATA

    FAC --> STORE
    FAC --> UTILS
    FAC --> RENDER
    GMC --> STORE
    GMC --> UTILS
    GMC --> RENDER
    PIU --> STORE
    PIU --> UTILS
    PIU --> RENDER
    COM --> STORE
    COM --> UTILS
    COM --> RENDER
    MON --> STORE
    MON --> UTILS
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
    app.js->>Modules: 10. features/piu.js
    app.js->>Modules: 11. features/committee.js
    app.js->>Modules: 12. features/monitoring.js
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
    UI["UI Event<br/>(клик кнопки)"] --> FEATURE["Feature Module<br/>(facilitator/gmc/piu/com)"]
    FEATURE --> STATE["window.state<br/>(мутация объекта)"]
    FEATURE --> LOG["addLog()<br/>(аудит)"]
    STATE --> RENDER["renderAllCards()<br/>(перерисовка)"]
    RENDER --> DOM["DOM<br/>(обновление карточек,<br/>бейджей, фильтров)"]
```

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
