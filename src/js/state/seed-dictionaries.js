(function initSeedDictionaries() {
    if (window.__grantSeedDictionariesLoaded) return;
    window.__grantSeedDictionariesLoaded = true;

    window.selectedForRegistry = window.selectedForRegistry || new Set();

    window.mockDatabase = {
        "10001": { "full-name": "Саидова Мадина Алиевна", "birth-date": "12.03.1998", "gender": "Зан", "contacts": "+992 93 111 2233", "address": "ш. Хуҷанд", "inn": "9876543210", "category": "Корҷӯй", "education": "Миёнаи махсус", "course": "Дӯзандагӣ", "certStatus": "certified" },
        "10002": { "full-name": "Раҳмонов Далер Ҷамшедович", "birth-date": "20.08.1995", "gender": "Мард", "contacts": "+992 90 222 3344", "address": "ш. Душанбе", "inn": "1234567890", "category": "Бекор", "education": "Олӣ", "course": "Кафшергарӣ", "certStatus": "certified" },
        "10003": { "full-name": "Каримов Рустам Бобоевич", "birth-date": "05.11.1990", "gender": "Мард", "contacts": "+992 92 333 4455", "address": "ш. Бохтар", "inn": "2233445566", "category": "Муҳоҷир", "education": "Миёна", "course": "Устои барқ", "certStatus": "pending" },
        "10004": { "full-name": "Иванов Иван Иванович", "birth-date": "15.04.1988", "gender": "Мард", "contacts": "+992 88 444 5566", "address": "ш. Душанбе", "inn": "3344556677", "category": "Корҷӯй", "education": "Олӣ", "course": "Барномасоз", "certStatus": "certified" },
        "10008": { "full-name": "Азизова Зарина", "birth-date": "08.12.1996", "gender": "Зан", "contacts": "+992 11 888 9900", "address": "ш. Турсунзода", "inn": "7788990011", "category": "Бевазан", "education": "Миёна", "course": "Ороишгар", "certStatus": "certified" },
        "10010": { "full-name": "Мирзоева Ситора", "birth-date": "25.02.1992", "gender": "Зан", "contacts": "+992 22 000 1122", "address": "ш. Ҳисор", "inn": "9900112233", "category": "Корҷӯй", "education": "Олӣ", "course": "Муҳосиб", "certStatus": "certified" },
        "10013": { "full-name": "Фотимаи Зариф", "birth-date": "18.05.1994", "gender": "Зан", "contacts": "+992 90 123 4567", "address": "ш. Душанбе", "inn": "1122334455", "category": "Бевазан", "education": "Олӣ", "course": "Савдо", "certStatus": "certified" },
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
    for (let i = 1; i <= 130; i++) {
        const id = String(20000 + i);
        const dd = String((i % 28) + 1).padStart(2, '0');
        const mm = String(((i + 2) % 12) + 1).padStart(2, '0');
        const yy = String(1988 + (i % 12));
        window.mockDatabase[id] = {
            'full-name': 'Тестовый заявитель ' + i,
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
        window.mockDatabase[id] = {
            'full-name': 'Тестовый заявитель ' + (100 + i),
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

    window.seedPerfTemplates = {
        gmc: { el1: 'yes', el2: 'yes', el3: 'yes', q1: '4', q2: '4', q3: '4', q4: '4', q5: '4', q6: '4', q7: '4', q8: '4', q9: '4', q10: '4', q11: '4', q12: '4', q13: '4', q14: '4', q15: '4', comment: 'Ҳамаи ҳуҷҷатҳо дурустанд / Все документы корректны' },
        piuStatus: { 1: 'completed' },
        piuDecision: { 1: 'approve' }
    };
})();