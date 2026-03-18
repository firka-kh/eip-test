# Данные для статистики и мониторинга

## Актуализация от 14.03.2026

- Для качества данных поле `missingFields[]` хранит ключи, но в интерфейсе отображаются локализованные названия полей (TJ/RU).
- Пользовательские предупреждения унифицированы через `AppNotify`; это не меняет структуру источников данных, но влияет на UX-сценарии.

## Назначение

Документ фиксирует, какие данные уже доступны в текущей системе, какие метрики из них можно строить и какие фильтры нужно внедрить в отдельный инструмент статистики/мониторинга.

Целевая аудитория: команда разработки аналитического/отчетного модуля.

---

## Источники данных

Базовый источник: `window.state`.

Основные коллекции:
- `state.applications`
- `state.protocols`
- `state.registryLists`
- `state.monitoring`

Дополнительные справочники:
- `window.mockDatabase`
- `window.beneficiarySearchDatabase`

Производные/служебные данные в заявке:
- `documents` (Word/PDF/фото, версия Word)
- `grantAgreement` (подписанный скан договора)
- `grantContractDraft` (черновик текста договора)
- `auditLog` (история действий)

---

## Сущности и поля для аналитики

### 1) Заявка (`Application`)

Ключевые поля для статистики:
- Идентификация: `id`, `beneficiaryId`
- Профиль: `name`, `inn`, `contacts`, `beneficiarySnapshot.*`
- Бизнес: `sector`, `amount`
- Процесс: `status`, `date`, `protocolId`
- Доработка: `revisionCount`, `committeeReturnsCount`, `resubmitsToPiuCount`, `reactivated`
- Блокировка: `postponedAtISO`, `postponedUntilISO`, `reactivatedAtISO`, `unlockNoticeProcessedAtISO`
- Качество данных: `missingFields[]`
- Документы: `documents.currentWordVersion`, `documents.basePdf`, `documents.basePhotos`
- Договоры: `grantAgreement.*`, `grantContractDraft.*`

### 2) Протокол (`Protocol`)

Поля:
- `id`, `date`, `exactTime`
- `okCount`, `rejCount`, `totalAmount`
- `apps[]` (ID заявки + решение)

### 3) Входящий реестр (`RegistryList`)

Поля:
- `id`, `source`, `status`, `date`, `exactTime`
- `apps[]`, `totalAmount`
- `protocolId`, `processedAt`

### 4) Мониторинг (`Visit[]` на каждую заявку)

Поля:
- План: `id`, `days`, `status`, `plannedDate`, `daysLeft`
- Факт: `visitDate`, `equipment`, `business`, `income`, `ecoCheck`, `note`, `photos`

---

## Метрики, которые уже можно считать

## A. Верхнеуровневые KPI

- Всего заявок
- Черновики
- На рассмотрении (объединенно: `gmc_review`, `gmc_revision`, `gmc_preparation`, `gmc_ready_for_registry`, `piu_review`, `com_review`)
- Одобрено
- Отклонено
- Отложено (`postponed`)
- Готовы к разблокировке (postponed + unlock-ready)

## B. Воронка по этапам

- `draft -> gmc_review -> piu_review -> gmc_preparation -> gmc_ready_for_registry -> com_review -> approved`
- Конверсии между этапами
- Drop-off по этапам (переход в `rejected`, `postponed`, `fac_revision`)

## C. Качество заявок и доработки

- Среднее `revisionCount`
- Доля заявок с `revisionCount >= 2`
- Количество возвратов из Комитета (`committeeReturnsCount`)
- Количество повторных отправок в ГРП (`resubmitsToPiuCount`)
- Количество/доля заявок в `incomplete_data`
- Топ незаполненных полей из `missingFields[]`

## D. Документный пакет

- Доля полных пакетов (`Word + PDF + 4 фото + подписанный договор`)
- Средняя версия Word (`documents.currentWordVersion`)
- Доля заявок без `basePdf`
- Доля заявок без полного фото-комплекта (не 4)

## E. Договоры

- Доля approved-заявок с черновиком договора (`grantContractDraft.updatedAt`)
- Доля approved-заявок с подписанным договором (`grantAgreement.uploaded`)
- Среднее время от `approved` до загрузки подписанного договора
- Количество обновлений подписанного договора (`grantAgreement.replaceCount`)
- Валидность номера договора по шаблону `Ш-******-ДДММГГ`

## F. Мониторинг

- Покрытие визитов: доля completed по каждому визиту (1/2/3/4)
- Просрочки: `status = active` и плановая дата < сегодня
- Состояние оборудования: `in_stock`, `not_used`, `sold`
- Состояние бизнеса: `active`, `suspended`, `closed`
- Доля `ecoCheck = false`
- Средний доход по визиту и по сектору
- Количество кейсов `equipment = sold` (risk indicator)

---

## Фильтры для внедрения в отдельном модуле

Ниже фильтры, которые разработчикам нужно добавить в инструмент статистики/мониторинга.

### 1) Глобальные фильтры (для всех дашбордов)

- Период:
- По `date` заявки
- По `approvalDate` (для approved)
- По `visitDate`/`plannedDate` (для мониторинга)
- Статус заявки (`ApplicationStatus`)
- Роль этапа (`facilitator`, `gmc`, `piu`, `committee`)
- Сектор (`sector`)
- Регион (из `beneficiarySnapshot.address`/базы бенефициаров)
- Пол (из `beneficiarySnapshot.gender`/базы)
- Протокол (`protocolId`)
- Диапазон суммы (`amount`)

### 2) Фильтры по документам

- Есть/нет полного пакета
- Диапазон версии Word (`currentWordVersion`)
- Есть/нет подписанного договора
- Есть/нет черновика договора
- Номер договора:
- Точное совпадение
- По префиксу/маске
- Только невалидные номера

### 3) Фильтры по доработкам и качеству

- `revisionCount` (0, 1, 2, 3)
- Есть возврат из Комитета
- Есть возврат из ГРП
- `incomplete_data` только
- Фильтр по конкретному `missingField`

### 4) Фильтры по мониторингу

- Номер визита (1/2/3/4)
- Статус визита (`pending`, `active`, `completed`)
- Состояние оборудования (`in_stock`, `not_used`, `sold`)
- Состояние бизнеса (`active`, `suspended`, `closed`)
- `ecoCheck` (да/нет)
- Доход:
- Диапазон дохода
- Доход = 0/пустой
- Наличие фото (>= 2)
- Риск-флаг: `equipment = sold` или `ecoCheck = false`

---

## Готовые разрезы (Dimensions)

Обязательные:
- Год/месяц
- Статус
- Сектор
- Регион
- Пол
- Протокол
- Роль/этап

Дополнительные:
- Версия Word
- Наличие подписанного договора
- Наличие черновика договора
- Количество доработок
- Состояние оборудования/бизнеса

---

## Готовые показатели (Measures)

Обязательные:
- `applications_count`
- `approved_count`
- `rejected_count`
- `postponed_count`
- `total_amount`
- `avg_amount`
- `avg_revision_count`
- `full_package_rate`
- `signed_agreement_rate`
- `contract_draft_rate`
- `monitoring_completion_rate`

Дополнительные:
- `avg_days_to_signed_agreement`
- `equipment_sold_cases`
- `eco_non_compliance_rate`
- `avg_income_by_visit`

---

## Минимальная спецификация API для аналитического модуля

Если внедряется отдельный backend-слой, рекомендуется подготовить:

- `GET /analytics/summary`
- возвращает KPI верхнего уровня

- `GET /analytics/funnel`
- возвращает этапы воронки и конверсии

- `GET /analytics/documents`
- возвращает метрики по пакетам документов и договорам

- `GET /analytics/monitoring`
- возвращает метрики по визитам, рискам, доходам

- `GET /analytics/dimensions`
- возвращает справочники фильтров (сектор, регион, пол, статусы, протоколы)

Все endpoints должны принимать единый набор query-фильтров:
- `date_from`, `date_to`
- `status[]`, `sector[]`, `region[]`, `gender[]`
- `protocol_id[]`
- `amount_min`, `amount_max`
- `visit_id[]`, `visit_status[]`, `equipment[]`, `business[]`, `eco_check`

---

## Проверки качества данных перед запуском статистики

- Нормализация суммы (`amount`) в число без пробелов
- Нормализация дат (единый `DD.MM.YYYY` или ISO в ETL)
- Проверка `contractNumber` по regex: `^Ш-\d{6}-\d{6}$`
- Удаление дублей заявок по `id`
- Явная обработка пустых значений (`null`, `""`, `"—"`)
- Для отчетов по `missingFields[]` использовать справочник лейблов, а не показывать технические ключи напрямую.

---

## Ограничения текущей реализации

- Данные in-memory, без постоянного хранилища.
- Исторические срезы возможны только в пределах текущей сессии/seed-данных.
- Часть дат хранится как строки и требует нормализации для BI.

---

## Рекомендованный порядок внедрения

1. Вынести агрегаты KPI и воронку в отдельный сервис статистики.
2. Добавить единый слой нормализации дат/сумм/категорий.
3. Реализовать фильтры из раздела выше как общий query-contract.
4. Подключить дашборды документов и мониторинга.
5. Добавить экспорт CSV/XLSX по любому отфильтрованному срезу.
