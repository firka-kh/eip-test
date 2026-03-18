(function initSeedDictionaries() {
    if (window.__grantSeedDictionariesLoaded) return;
    window.__grantSeedDictionariesLoaded = true;

    window.selectedForRegistry = window.selectedForRegistry || new Set();

    window.mockDatabase = {
        "10001": { "full-name": "Саидова Мадина Алиевна", "birth-date": "12.03.1998", "gender": "Зан", "contacts": "+992 93 111 2233", "address": "ш. Хуҷанд", "inn": "9876543210", "category": "Корҷӯй", "education": "Миёнаи махсус", "course": "Дӯзандагӣ", "certStatus": "certified" },
        "10002": { "full-name": "Раҳмонов Далер Ҷамшедович", "birth-date": "20.08.1995", "gender": "Мард", "contacts": "+992 90 222 3344", "address": "ш. Душанбе", "inn": "1234567890", "category": "Бекор", "education": "Олӣ", "course": "Кафшергарӣ", "certStatus": "certified" },
        "10003": { "full-name": "Каримов Рустам Бобоевич", "birth-date": "05.11.1990", "gender": "Мард", "contacts": "+992 92 333 4455", "address": "ш. Бохтар", "inn": "2233445566", "category": "Муҳоҷир", "education": "Миёна", "course": "Устои барқ", "certStatus": "pending" },
        "10004": { "full-name": "Иванов Иван Иванович", "birth-date": "15.04.1988", "gender": "Мард", "contacts": "+992 88 444 5566", "address": "ш. Душанбе", "inn": "3344556677", "category": "Корҷӯй", "education": "Олӣ", "course": "Барномасоз", "certStatus": "certified" },
        "10007": { "full-name": "Бобоев Али", "birth-date": "03.09.1991", "gender": "Мард", "contacts": "+992 90 555 1122", "address": "ш. Душанбе", "inn": "5566778899", "category": "Корҷӯй", "education": "Миёнаи махсус", "course": "Кафшергарӣ", "certStatus": "certified" },
        "10008": { "full-name": "Азизова Зарина", "birth-date": "08.12.1996", "gender": "Зан", "contacts": "+992 11 888 9900", "address": "ш. Турсунзода", "inn": "7788990011", "category": "Бевазан", "education": "Миёна", "course": "Ороишгар", "certStatus": "certified" },
        "10010": { "full-name": "Мирзоева Ситора", "birth-date": "25.02.1992", "gender": "Зан", "contacts": "+992 22 000 1122", "address": "ш. Ҳисор", "inn": "9900112233", "category": "Корҷӯй", "education": "Олӣ", "course": "Муҳосиб", "certStatus": "certified" },
        "10013": { "full-name": "Фотимаи Зариф", "birth-date": "18.05.1994", "gender": "Зан", "contacts": "+992 90 123 4567", "address": "ш. Душанбе", "inn": "1122334455", "category": "Бевазан", "education": "Олӣ", "course": "Савдо", "certStatus": "certified" },
        "10017": { "full-name": "Шарипов Сомон", "birth-date": "29.01.1993", "gender": "Мард", "contacts": "+992 93 777 2244", "address": "ш. Хуҷанд", "inn": "3344221100", "category": "Бекор", "education": "Миёна", "course": "Сартарош", "certStatus": "certified" },
        "10020": { "full-name": "Маҳмудов Алишер", "birth-date": "15.06.1990", "gender": "Мард", "contacts": "+992 98 123 4567", "address": "ш. Ваҳдат", "inn": "4455667788", "category": "Бекор", "education": "Олӣ", "course": "Сартарош", "certStatus": "certified" },
        "10021": { "full-name": "Ахмедов Тимур", "birth-date": "10.10.1985", "gender": "Мард", "contacts": "+992 90 987 6543", "address": "ш. Ҳисор", "inn": "1122334455", "category": "Муҳоҷир", "education": "Миёна", "course": "Дӯредгарӣ", "certStatus": "certified" },
        "10022": { "full-name": "Сайфуллоев Олим", "birth-date": "05.05.1993", "gender": "Мард", "contacts": "+992 93 444 5555", "address": "ш. Душанбе", "inn": "2233445566", "category": "Бекор", "education": "Миёна", "course": "Сартарош", "certStatus": "certified" },
        "10030": { "full-name": "Расулов Умед", "birth-date": "14.07.1991", "gender": "Мард", "contacts": "+992 90 111 2233", "address": "ш. Душанбе", "inn": "8877665544", "category": "Корҷӯй", "education": "Олӣ", "course": "Барномасоз", "certStatus": "certified" },
        "10031": { "full-name": "Носирова Нигина", "birth-date": "22.09.1998", "gender": "Зан", "contacts": "+992 93 222 3344", "address": "ш. Хуҷанд", "inn": "4433221100", "category": "Бевазан", "education": "Миёнаи махсус", "course": "Дӯзандагӣ", "certStatus": "certified" },
        "10032": { "full-name": "Қодиров Зафар", "birth-date": "05.12.1989", "gender": "Мард", "contacts": "+992 98 333 4455", "address": "ш. Бохтар", "inn": "1122112211", "category": "Муҳоҷир", "education": "Миёна", "course": "Кафшергарӣ", "certStatus": "certified" },
        "10033": { "full-name": "Сафарова Гулрухсор", "birth-date": "18.03.1995", "gender": "Зан", "contacts": "+992 90 444 5566", "address": "ш. Кӯлоб", "inn": "9988776655", "category": "Бекор", "education": "Олӣ", "course": "Муҳосиб", "certStatus": "pending" },
        "10034": { "full-name": "Умаров Фарҳод", "birth-date": "30.01.1992", "gender": "Мард", "contacts": "+992 92 555 6677", "address": "ш. Исфара", "inn": "5544332211", "category": "Корҷӯй", "education": "Миёнаи махсус", "course": "Устои барқ", "certStatus": "certified" },
        "10035": { "full-name": "Шарипова Лайло", "birth-date": "12.08.1997", "gender": "Зан", "contacts": "+992 93 666 7788", "address": "ш. Ҳисор", "inn": "2233445566", "category": "Бекор", "education": "Олӣ", "course": "Ороишгар", "certStatus": "certified" },
        "10040": { "full-name": "Тоиров Бахтиёр", "birth-date": "25.11.1990", "gender": "Мард", "contacts": "+992 90 777 8899", "address": "ш. Душанбе", "inn": "7788990011", "category": "Муҳоҷир", "education": "Олӣ", "course": "Савдо", "certStatus": "certified" },
        "10042": { "full-name": "Неъматов Сӯҳроб", "birth-date": "08.05.1985", "gender": "Мард", "contacts": "+992 98 888 9900", "address": "ш. Ваҳдат", "inn": "6677889900", "category": "Бекор", "education": "Миёна", "course": "Сартарош", "certStatus": "certified" }
    };

    // Synthetic beneficiaries for broad UI testing across filters and states.
    const syntheticCourses = ['Дӯзандагӣ', 'Кафшергарӣ', 'Муҳосиб', 'Савдо', 'Сартарош', 'Барномасоз'];
    const syntheticCategories = ['Корҷӯй', 'Бекор', 'Муҳоҷир', 'Бевазан'];
    var firstNamesMale = ['Абдуллоҳ', 'Баҳром', 'Ғайрат', 'Давлат', 'Завқӣ', 'Исмоил', 'Комрон', 'Лутфулло', 'Мансур', 'Навруз', 'Олимҷон', 'Парвиз', 'Раҷаб', 'Сирочиддин', 'Тоҳир', 'Умед', 'Фарҳод', 'Ҳасан', 'Шамсиддин', 'Яҳё'];
    var firstNamesFemale = ['Азиза', 'Барно', 'Гулноз', 'Дилафрӯз', 'Зарина', 'Истиқлол', 'Камола', 'Лайло', 'Мадина', 'Нодира', 'Озода', 'Парвина', 'Рухшона', 'Сарвиноз', 'Тахмина', 'Фотима', 'Ҳалима', 'Шаҳло', 'Зебо', 'Ёсуман'];
    var lastNames = ['Аҳмадов', 'Бобоев', 'Ғафуров', 'Давлатов', 'Зоиров', 'Исматов', 'Каримов', 'Лоиқов', 'Мирзоев', 'Набиев', 'Олимов', 'Парвонаев', 'Раҳимов', 'Саидов', 'Турсунов', 'Умаров', 'Фозилов', 'Ҳамидов', 'Шарипов', 'Юсупов'];
    var patronymsMale = ['Алиевич', 'Бобоевич', 'Ғафурович', 'Давлатович', 'Зоирович', 'Исматович', 'Каримович', 'Лоиқович', 'Мирзоевич', 'Набиевич'];
    var patronymsFemale = ['Алиевна', 'Бобоевна', 'Ғафуровна', 'Давлатовна', 'Зоировна', 'Исматовна', 'Каримовна', 'Лоиқовна', 'Мирзоевна', 'Набиевна'];
    for (let i = 1; i <= 130; i++) {
        const id = String(20000 + i);
        const dd = String((i % 28) + 1).padStart(2, '0');
        const mm = String(((i + 2) % 12) + 1).padStart(2, '0');
        const yy = String(1988 + (i % 12));
        const isFemale = i % 2 === 0;
        const ln = lastNames[i % lastNames.length] + (isFemale ? 'а' : '');
        const fn = isFemale ? firstNamesFemale[i % firstNamesFemale.length] : firstNamesMale[i % firstNamesMale.length];
        const pt = isFemale ? patronymsFemale[i % patronymsFemale.length] : patronymsMale[i % patronymsMale.length];
        window.mockDatabase[id] = {
            'full-name': ln + ' ' + fn + ' ' + pt,
            'birth-date': dd + '.' + mm + '.' + yy,
            gender: i % 2 === 0 ? 'Мард' : 'Зан',
            contacts: '+992 90 ' + String(1000000 + i).slice(-7),
            address: 'ш. Душанбе',
            inn: String(7000000000 + i),
            category: syntheticCategories[i % syntheticCategories.length],
            education: i % 3 === 0 ? 'Олӣ' : 'Миёнаи махсус',
            course: syntheticCourses[i % syntheticCourses.length],
            certStatus: i % 7 === 0 ? 'pending' : 'certified'
        };
    }

    for (let i = 1; i <= 30; i++) {
        const id = String(21000 + i);
        const dd = String((i % 28) + 1).padStart(2, '0');
        const mm = String(((i + 4) % 12) + 1).padStart(2, '0');
        const yy = String(1989 + (i % 11));
        const isFemale2 = i % 2 === 0;
        const ln2 = lastNames[(i + 5) % lastNames.length] + (isFemale2 ? 'а' : '');
        const fn2 = isFemale2 ? firstNamesFemale[(i + 3) % firstNamesFemale.length] : firstNamesMale[(i + 3) % firstNamesMale.length];
        const pt2 = isFemale2 ? patronymsFemale[(i + 2) % patronymsFemale.length] : patronymsMale[(i + 2) % patronymsMale.length];
        window.mockDatabase[id] = {
            'full-name': ln2 + ' ' + fn2 + ' ' + pt2,
            'birth-date': dd + '.' + mm + '.' + yy,
            gender: i % 2 === 0 ? 'Мард' : 'Зан',
            contacts: '+992 91 ' + String(2000000 + i).slice(-7),
            address: 'ш. Душанбе',
            inn: String(8000000000 + i),
            category: syntheticCategories[i % syntheticCategories.length],
            education: i % 2 === 0 ? 'Олӣ' : 'Миёнаи махсус',
            course: syntheticCourses[i % syntheticCourses.length],
            certStatus: 'certified'
        };
    }

    // Separate demo dataset used only in the "new application" beneficiary search.
    // It intentionally does not overlap with already loaded application identities.
    window.beneficiarySearchDatabase = {
        '50001': { 'full-name': 'Саидова Фарангис Ҳасановна', 'birth-date': '11.01.1994', gender: 'Зан', contacts: '+992 90 410 1101', address: 'ш. Душанбе', inn: '9100001001', category: 'Корҷӯй', education: 'Олӣ', course: 'Савдо', certStatus: 'certified' },
        '50002': { 'full-name': 'Раҳмонов Шерали Далерович', 'birth-date': '14.02.1991', gender: 'Мард', contacts: '+992 90 410 1102', address: 'ш. Хуҷанд', inn: '9100001002', category: 'Бекор', education: 'Миёнаи махсус', course: 'Кафшергарӣ', certStatus: 'certified' },
        '50003': { 'full-name': 'Каримова Дилноза Рустамовна', 'birth-date': '23.03.1996', gender: 'Зан', contacts: '+992 90 410 1103', address: 'ш. Бохтар', inn: '9100001003', category: 'Бевазан', education: 'Олӣ', course: 'Муҳосиб', certStatus: 'certified' },
        '50004': { 'full-name': 'Ҳасанов Баҳром Сафарович', 'birth-date': '08.04.1993', gender: 'Мард', contacts: '+992 90 410 1104', address: 'ш. Кӯлоб', inn: '9100001004', category: 'Муҳоҷир', education: 'Миёна', course: 'Устои барқ', certStatus: 'pending' },
        '50005': { 'full-name': 'Расулова Нигора Умедовна', 'birth-date': '30.05.1990', gender: 'Зан', contacts: '+992 90 410 1105', address: 'ш. Ҳисор', inn: '9100001005', category: 'Корҷӯй', education: 'Олӣ', course: 'Ороишгар', certStatus: 'certified' },
        '50081': { 'full-name': 'Раҳимов Фирдавс Ҳамидович', 'birth-date': '05.07.1995', gender: 'Мард', contacts: '+992 90 555 0081', address: '', inn: '', category: 'Бекор', education: '', course: 'Ҷӯшкорӣ', certStatus: 'certified' },
        '50082': { 'full-name': 'Назарова Малика Ашуровна', 'birth-date': '', gender: 'Зан', contacts: '+992 90 555 0082', address: 'ш. Бохтар', inn: '9100009082', category: '', education: 'Олӣ', course: '', certStatus: 'certified' },
        '50083': { 'full-name': 'Ҷумаев Абдулло Раҳматович', 'birth-date': '12.11.1988', gender: 'Мард', contacts: '', address: 'ш. Кӯлоб', inn: '', category: 'Муҳоҷир', education: 'Миёна', course: 'Устои барқ', certStatus: 'certified' },
        '50084': {
            'full-name': 'Саидова Маҳина Бахтиёровна',
            'birth-date': '19.08.1997',
            gender: 'Зан',
            contacts: '+992 90 555 0084',
            address: 'ш. Душанбе',
            inn: '9100009084',
            category: 'Бекор',
            education: 'Миёнаи махсус',
            course: 'Дӯзандагӣ',
            certStatus: 'pending',
            trainingSessions: {
                infoSession: true,
                selfKnowledge: false,
                entrepreneurshipBasics: false,
                softSkills: false
            }
        },
        '50085': {
            'full-name': 'Каримов Сорбон Раҳматович',
            'birth-date': '02.01.1992',
            gender: 'Мард',
            contacts: '+992 90 555 0085',
            address: 'ш. Хуҷанд',
            inn: '9100009085',
            category: 'Муҳоҷир',
            education: 'Миёна',
            course: 'Ҷӯшкорӣ',
            certStatus: 'pending',
            trainingSessions: {
                infoSession: true,
                selfKnowledge: true,
                entrepreneurshipBasics: false,
                softSkills: false
            }
        },
        '50086': {
            'full-name': 'Нурматова Гулнора Олимовна',
            'birth-date': '27.04.1994',
            gender: 'Зан',
            contacts: '+992 90 555 0086',
            address: 'ш. Бохтар',
            inn: '9100009086',
            category: 'Корҷӯй',
            education: 'Олӣ',
            course: 'Ороишгар',
            certStatus: 'certified',
            trainingSessions: {
                infoSession: true,
                selfKnowledge: true,
                entrepreneurshipBasics: true,
                softSkills: false
            }
        },
        '50087': {
            'full-name': 'Турсунов Шаҳбоз Комронович',
            'birth-date': '14.10.1991',
            gender: 'Мард',
            contacts: '+992 90 555 0087',
            address: 'ш. Кӯлоб',
            inn: '9100009087',
            category: 'Бекор',
            education: 'Миёнаи махсус',
            course: 'Устои барқ',
            certStatus: 'pending',
            trainingSessions: {
                infoSession: false,
                selfKnowledge: false,
                entrepreneurshipBasics: false,
                softSkills: true
            }
        }
    };

    var searchFirstNamesMale = ['Фирдавсӣ', 'Бахтиёр', 'Ҷамшед', 'Сухроб', 'Анвар', 'Зафар', 'Шоҳин', 'Рустам', 'Далер', 'Тимур', 'Олим', 'Неъмат', 'Комрон', 'Муродалӣ', 'Шарифҷон', 'Аброр', 'Бобоҷон', 'Мирзо', 'Файзалӣ', 'Ҷовидон'];
    var searchFirstNamesFemale = ['Манижа', 'Шабнам', 'Парвина', 'Гулчеҳра', 'Озода', 'Фируза', 'Ҳилола', 'Зулайхо', 'Тахмина', 'Мавлуда', 'Рухшона', 'Дилрабо', 'Зуҳро', 'Наргис', 'Сурайё', 'Лола', 'Мунира', 'Сабина', 'Замира', 'Ситора'];
    var searchLastNames = ['Маҳмудов', 'Ҳакимов', 'Ғанизода', 'Ашуров', 'Тоҷиддинов', 'Муродов', 'Содиқов', 'Назаров', 'Ҷалолов', 'Раҳимов', 'Каримов', 'Сафаров', 'Қосимов', 'Ниёзов', 'Бобоев', 'Ғуломов', 'Турсунов', 'Валиев', 'Зокиров', 'Ваҳобов'];
    var searchPatronymsMale = ['Аҳмадович', 'Раҳматович', 'Содиқович', 'Ҷамшедович', 'Алиевич', 'Зафарович', 'Муродович', 'Сафарович', 'Олимович', 'Неъматович'];
    var searchPatronymsFemale = ['Аҳмадовна', 'Раҳматовна', 'Содиқовна', 'Ҷамшедовна', 'Алиевна', 'Зафаровна', 'Муродовна', 'Сафаровна', 'Олимовна', 'Неъматовна'];
    for (let i = 6; i <= 80; i++) {
        const id = String(50000 + i);
        const dd = String((i % 28) + 1).padStart(2, '0');
        const mm = String(((i + 5) % 12) + 1).padStart(2, '0');
        const yy = String(1987 + (i % 13));
        const isFemale = i % 2 !== 0;
        const lastName = searchLastNames[i % searchLastNames.length] + (isFemale ? 'а' : '');
        const firstName = isFemale ? searchFirstNamesFemale[i % searchFirstNamesFemale.length] : searchFirstNamesMale[i % searchFirstNamesMale.length];
        const patronym = isFemale ? searchPatronymsFemale[i % searchPatronymsFemale.length] : searchPatronymsMale[i % searchPatronymsMale.length];
        window.beneficiarySearchDatabase[id] = {
            'full-name': lastName + ' ' + firstName + ' ' + patronym,
            'birth-date': dd + '.' + mm + '.' + yy,
            gender: i % 2 === 0 ? 'Мард' : 'Зан',
            contacts: '+992 90 41' + String(10000 + i).slice(-5),
            address: i % 2 === 0 ? 'ш. Душанбе' : 'ш. Хуҷанд',
            inn: String(9100001000 + i),
            category: syntheticCategories[i % syntheticCategories.length],
            education: i % 3 === 0 ? 'Олӣ' : 'Миёнаи махсус',
            course: syntheticCourses[i % syntheticCourses.length],
            certStatus: i % 9 === 0 ? 'pending' : 'certified'
        };
    }

    function buildTrainingSessionsByCert(certStatus, numericId) {
        var allPassed = certStatus === 'certified';
        var base = {
            infoSession: allPassed,
            selfKnowledge: allPassed,
            entrepreneurshipBasics: allPassed,
            softSkills: allPassed
        };
        if (allPassed) return base;

        var n = parseInt(String(numericId || '0').replace(/\D/g, ''), 10) || 0;
        if (n % 2 === 0) base.infoSession = true;
        if (n % 3 === 0) base.selfKnowledge = true;
        if (n % 5 === 0) base.entrepreneurshipBasics = true;
        if (n % 7 === 0) base.softSkills = true;
        return base;
    }

    function hydrateTrainingSessions(dbObject) {
        Object.keys(dbObject || {}).forEach(function (id) {
            var rec = dbObject[id];
            if (!rec) return;
            if (!rec.trainingSessions) {
                rec.trainingSessions = buildTrainingSessionsByCert(rec.certStatus, id);
            }
        });
    }

    function buildDemoPassportById(id) {
        var digits = String(id || '').replace(/\D/g, '').padStart(9, '0').slice(-9);
        return 'A' + digits;
    }

    function hydratePassports(dbObject) {
        Object.keys(dbObject || {}).forEach(function (id) {
            var rec = dbObject[id];
            if (!rec) return;
            if (!String(rec.passport || '').trim()) {
                rec.passport = buildDemoPassportById(id);
            }
        });
    }

    hydrateTrainingSessions(window.mockDatabase);
    hydrateTrainingSessions(window.beneficiarySearchDatabase);
    hydratePassports(window.mockDatabase);
    hydratePassports(window.beneficiarySearchDatabase);

    window.seedPerfTemplates = {
        gmc: { el1: 'yes', el2: 'yes', el3: 'yes', q1: '4', q2: '4', q3: '4', q4: '4', q5: '4', q6: '4', q7: '4', q8: '4', q9: '4', q10: '4', q11: '4', q12: '4', q13: '4', q14: '4', q15: '4', comment: 'Ҳамаи ҳуҷҷатҳо дурустанд / Все документы корректны' }
    };
})();