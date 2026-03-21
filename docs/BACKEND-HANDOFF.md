# Спецификация Backend-части (Handoff Package)

Этот документ предназначен для **Backend-разработчиков**, **Архитекторов** и **DevOps-инженеров**.
Текущая реализация проекта (Frontend) работает in-memory (`window.state`). Для перевода в **Production** необходимо реализовать серверную часть согласно изложенным ниже требованиям.

---

## 1. Рекомендуемый стек технологий

- **Язык/Фреймворк**: Node.js (NestJS/Express), Python (FastAPI), Java (Spring Boot) или Go.
- **База данных**: PostgreSQL 14+ (для строгой реляционности и поддержки JSONB).
- **Кэш / Очереди**: Redis (опционально, для сессий и кэширования справочников).
- **Файловое хранилище**: S3-совместимое (MinIO или AWS S3) для хранения сканов и документов.

---

## 2. Архитектура Базы Данных (SQL Схема)

Модель данных из `DATA-MODEL.md` должна быть нормализована. Ниже представлена базовая структура таблиц:

### 2.1. Таблица `users` (Пользователи системы)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID (PK) | Уникальный ID |
| `email` | VARCHAR | Логин |
| `password_hash` | VARCHAR | Хэш пароля (bcrypt/argon2) |
| `role` | ENUM | `facilitator`, `gmc`, `committee`, `finance` |
| `full_name` | VARCHAR | ФИО сотрудника (для `audit_log`) |

### 2.2. Таблица `beneficiaries` (Справочник заявителей)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID (PK) | |
| `inn` | VARCHAR(12) | ИНН (Уникальный индекс) |
| `phone` | VARCHAR(20) | Телефон (Уникальный индекс) |
| `full_name` | VARCHAR | ФИО |
| `metadata` | JSONB | `{ "gender": "...", "address": "...", "category": "..." }` |

### 2.3. Таблица `applications` (Заявки)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | VARCHAR (PK) | Человекочитаемый ID (напр., `10001`) |
| `beneficiary_id` | UUID (FK) | Ссылка на бенефициара |
| `status` | ENUM | `draft`, `gmc_review`, `postponed`, `approved`... |
| `sector` | VARCHAR | Сектор бизнеса |
| `amount` | DECIMAL | Сумма гранта |
| `revision_count`| INT | Счетчик доработок (лимит 3) |
| `postponed_until`| TIMESTAMP | Дата окончания заморовки (3 мес) |
| `protocol_id` | VARCHAR | ID протокола Комитета |

### 2.4. Таблица `documents` (Файлы и версионирование)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID (PK) | |
| `application_id`| VARCHAR (FK)| Ссылка на заявку |
| `type` | ENUM | `word_plan`, `base_pdf`, `photo`, `signed_contract` |
| `version` | INT | Для `word_plan` (1, 2, 3...) |
| `storage_key` | VARCHAR | Путь к файлу в S3 (например: `apps/10001/plan_v2.docx`) |
| `uploaded_by` | UUID (FK) | Кто загрузил (user_id) |

### 2.5. Таблица `audit_logs` (История действий)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID (PK) | |
| `application_id`| VARCHAR (FK)| |
| `actor_id` | UUID (FK) | ID пользователя совершившего действие |
| `action` | VARCHAR | Системный код действия (напр. `STATUS_CHANGED`) |
| `details` | JSONB | Метаданные (с какого на какой статус, комментарий) |
| `created_at` | TIMESTAMP | Время события |

---

## 3. Спецификация REST API (Контракты)

### 3.1. Auth & Сессии

- **POST** `/api/v1/auth/login`
  - Возвращает: `JWT Token` (или устанавливает `HttpOnly Cookie`).
  - Payload токена должен содержать `userId` и `role`.

### 3.2. Заявки (Applications)

- **GET** `/api/v1/applications`
  - Фильтры (Query): `?status=approved,postponed&role=facilitator&sector=IT`
  - Пагинация: `?page=1&limit=50`
- **GET** `/api/v1/applications/:id`
  - Возвращает полную агрегацию (данные, документы, аудит, мониторинг).
- **POST** `/api/v1/applications`
  - Создание черновика. В теле — `beneficiary_id`.
- **PATCH** `/api/v1/applications/:id`
  - Обновление полей заявки (сектор, сумма).

### 3.3. Бизнес-логика (State Machine)

- **POST** `/api/v1/applications/:id/transitions`
  - Перевод заявки по флоу.
  - Body: `{ "target_status": "gmc_review", "comment": "Одобрено" }`
  - *Важно: Бэкенд должен валидировать правила перехода (например, нельзя перейти в `approved` минуя `com_review`).*

### 3.4. Работа с файлами (S3)

- **POST** `/api/v1/applications/:id/documents`
  - `multipart/form-data`.
  - Бэкенд загружает файл в S3, генерирует `storage_key` и сохраняет запись в БД `documents`.
- **GET** `/api/v1/documents/:id/download`
  - Возвращает `Presigned URL` от S3 (срок жизни 15 минут) для безопасного скачивания напрямую с хранилища.

---

## 4. Сложные системные правила (Для реализации на Backend)

Frontend сейчас обрабатывает следующие правила, которые **обязательно** должны быть продублированы и защищены на Backend-уровне:

1. **Блокировка дубликатов (Race Conditions)**:
   - Проверка ИНН и телефона должна работать через SQL-транзакции (`UNIQUE` constraint) для предотвращения параллельного создания дублей.
2. **Версионирование Word**:
   - При загрузке документа с типом `word_plan`, Backend должен инкрементировать `version` (найти `MAX(version)` для текущей заявки и сделать `+1`).
3. **Postponed таймер**:
   - Требуется `CRON` задача (или очередь), которая раз в сутки ищет заявки со статусом `postponed`, у которых `postponed_until` < `NOW()`.
   - Она не должна менять статус, но может проставлять флаг `unlock_ready = true` или отправлять уведомление (WebSocket/Email) Фасилитатору.
4. **Комплектность перед отправкой**:
   - При переходе `draft -> gmc_review` Backend обязан проверить: есть ли у бенефициара все 9 обязательных полей (защита от обхода UI).
5. **Неизменяемость Audit Log**:
   - Ни один пользователь (даже admin) не должен иметь API-метода для редактирования или удаления записей из `audit_logs`.

---

## 5. Инфраструктура и Развертывание (DevOps)

Для запуска системы потребуется следующая архитектура (предлагаемый вариант):

### Серверная структура

1. **Nginx** — Reverse Proxy, SSL-терминация (HTTPS), раздача статики (Frontend сборки).
2. **Backend API (Node/Python)** — stateless сервис, обрабатывающий запросы.
3. **PostgreSQL** — база данных (развернуть с регулярными бэкапами `pg_dump`).
4. **MinIO** — self-hosted S3 для хранения файлов (договоров, планов).

### CI / CD (Пайплайны)

- **Linting & Tests**: Запуск Unit-тестов бизнес-логики (машины состояний) при каждом Merge Request.
- **Dockerization**: Упаковка Backend и Frontend в `Docker`-образы.
- **Deploy**: Автоматическое развертывание (например, через GitHub Actions/GitLab CI) на Staging и Production сервера.
