// Контент сайта: игры (кассеты на полке), репы (дискеты на столе), ссылки.
// Порядок важен: games[i] -> vhs_i, repos[i] -> floppy_i.

export const games = [
    {
        title: 'OUTLAW', slug: 'outlaw', status: 'в разработке', color: '#c2410c',
        url: 'https://arnoldsavethewest.itch.io/outlaw',
        cover: 'https://img.itch.zone/aW1nLzMyMzE2OTQ1LnBuZw==/original/4yzcbr.png',
        desc: 'Хоррор от первого лица через полицейский бодикам. Ночной патруль, заброшенное здание и «Дом Улыбок». Демо первого акта.',
        tags: 'shooter · psychological horror · windows',
        clippy: 'Бодикам-хоррор. Похоже, вы пытаетесь не спать этой ночью.'
    },
    {
        title: 'What Did i Deserve That', slug: 'what-did-i-deserve-that', status: 'релиз', color: '#be185d',
        url: 'https://arnoldsavethewest.itch.io/what-did-i-deserve-that',
        cover: 'https://img.itch.zone/aW1nLzMxNzcxMTkzLnBuZw==/original/tY4RDO.png',
        desc: 'Алиса выносит мусор в Белграде, а её ночь транслируется в прямой эфир. Чат хочет ещё. Во втором акте за ней охотится Охотник в маске.',
        tags: 'survival · third person · psx · windows',
        clippy: 'Никогда не выносите мусор ночью. Это я вам как скрепка говорю.'
    },
    {
        title: "What be written on you're epitaphy", slug: 'epitaphy-2', status: 'релиз', color: '#6d28d9',
        url: 'https://arnoldsavethewest.itch.io/what-be-written-on-youre-epitaphy',
        cover: 'https://img.itch.zone/aW1nLzIzODI5MjM3LnBuZw==/original/%2BtyFmF.png',
        desc: 'Короткий PSX-хоррор про любовь и мировосприятие. Описание — стихотворение, сюжет — додумывайте сами.',
        tags: 'adventure · horror · psx',
        clippy: '«Любовь и мировосприятие». Глубже, чем мой внутренний мир из одного куска проволоки.'
    },
    {
        title: 'What be written on your epitaphy', slug: 'epitaphy', status: 'релиз', color: '#1d4ed8',
        url: 'https://arnoldsavethewest.itch.io/what-be-written-on-your-epitaphy',
        cover: 'https://img.itch.zone/aW1nLzIxNDY3NzMzLnBuZw==/original/UXhZaP.png',
        desc: 'Журналист бродит по городу с фотоаппаратом и встречает тех, кому это не нравится.',
        tags: 'first person · escape · psx · windows',
        clippy: 'Журналист с фотиком в жутком городе. Похоже, вы пытаетесь сделать селфи. Не надо.'
    },
    {
        title: 'Dark Void', slug: 'dark-void', status: 'релиз', color: '#15803d',
        url: 'https://arnoldsavethewest.itch.io/dark-void',
        cover: 'https://img.itch.zone/aW1nLzIzMjY4MTQzLmpwZw==/original/LafUda.jpg',
        desc: 'Хоррор про подвал. Больше ничего говорить не буду — это подвал.',
        tags: 'horror · windows',
        clippy: '«Самая zestiest игра». Не знаю, что это значит, но верю.'
    },
    {
        title: 'AntiChristQuest', slug: 'antichristquest', status: 'релиз', color: '#991b1b',
        url: 'https://arnoldsavethewest.itch.io/antichristquest',
        cover: 'https://img.itch.zone/aW1nLzIwNTM4OTUxLnBuZw==/original/QQy4Mc.png',
        desc: 'Хоррор-приключение с чёрным юмором, монстрами и религиозным подтекстом. Творческое безумие и постмодерн.',
        tags: 'adventure · horror · psx',
        clippy: 'Похоже, вы пытаетесь попасть в ад. Хотите, помогу оформить заявку?'
    },
    {
        title: 'Post-Traumatic Stress Dissorder', slug: 'ptsd', status: 'заморожен', color: '#57534e',
        url: 'https://arnoldsavethewest.itch.io/post-traumatic-stress-dissorder',
        cover: 'https://img.itch.zone/aW1nLzE1NzAzMDQ2LmpwZw==/original/6rHHK4.jpg',
        desc: 'Survival horror от третьего лица: туманное поле, каменное здание и что-то в темноте.',
        tags: 'survival horror · third person',
        clippy: 'Проект заморожен. Кассета упала. Совпадение? Да.'
    }
];

export const repos = [
    {
        name: 'OpenCSG', lang: 'C# / C++', color: '#1e3a8a',
        url: 'https://github.com/lalds/OpenCSG',
        desc: 'Открытое геометрическое ядро для RealtimeCSG с поддержкой Linux. Редактор CSG для Unity снова жив.',
        clippy: 'Чинить RealtimeCSG под Linux. Unity Technologies вас не простит.'
    },
    {
        name: 'AGDeepLearn', lang: 'C++ / PyTorch', color: '#7f1d1d',
        url: 'https://github.com/lalds/AGDeepLearn',
        desc: 'RL-агент, который учится air-strafe и bhop в GoldSrc. C++ client DLL ↔ PyTorch через shared memory, 1180+ FPS, 850 юнитов/с.',
        clippy: 'Нейросеть распрыгивает лучше тебя. Я бы так не смогла, у меня нет ног.'
    },
    {
        name: 'WebHTC', lang: 'Python', color: '#14532d',
        url: 'https://github.com/lalds/WebHTC',
        desc: 'Full-body и hand tracking для SteamVR с одной вебки через MediaPipe. Без базовых станций.',
        clippy: 'Фулбоди через вебку? Похоже, вы экономите на Vive-трекерах.'
    },
    {
        name: 'NLThinkingPanel', lang: 'Python', color: '#4c1d95',
        url: 'https://github.com/lalds/NLThinkingPanel',
        desc: 'Discord-бот с AI через OpenRouter, понимающий контекст сервера: кто во что играет, что слушает, о чём говорят.',
        clippy: 'Discord-бот с ИИ. Наконец-то у меня будет конкурент.'
    },
    {
        name: 'WBScraper', lang: 'Python', color: '#9a3412',
        url: 'https://github.com/lalds/WBScraper',
        desc: 'Telegram-бот, который ищет молодых продавцов на Wildberries в обход антифрода.',
        clippy: 'Похоже, вы ищете продавцов на Wildberries. Открыть Excel?'
    }
];

export const links = [
    { name: 'NLPA COLLAB', url: 'https://nlpacollab.neocities.org/' },
    { name: 'itch.io', url: 'https://arnoldsavethewest.itch.io/' },
    { name: 'github', url: 'https://github.com/lalds' },
    { name: 'telegram', url: 'https://t.me/angelserserser' },
    { name: 'youtube', url: 'https://www.youtube.com/@Angelo-b1k7m' }
];

export const quips = {
    greet: 'Привет! Я скрепка. Похоже, вы зашли на личный сайт. Нажмите на монитор — там всё самое важное.',
    idle: [
        'Вы тут уже давно. Может, сохраниться?',
        'Я была в Office 97. Я видела вещи.',
        'Похоже, вы прокрастинируете. Отличный выбор.',
        'Совет дня: Ctrl+S не работает в реальной жизни.',
        'Если долго смотреть в Unity, Unity крашится.',
        'Кассеты на полке — это игры. Дискеты на столе — код. Я — это я.',
        'Кстати, лампу можно выключить. Не советую.',
        'Нашли баг на сайте? Тут за них не платят, это не баг баунти.',
        'Вы слышали этот звук? Нет? Ну и хорошо.',
        'Говорят, в терминале есть игра. Я ничего не говорила.'
    ],
    poke: [
        'Ай!', 'Не тыкай, я сгибаюсь.', 'Я скрепка, а не кнопка.',
        'Ещё раз нажмёшь — открою Word.', 'Похоже, вы пытаетесь меня разогнуть. Не надо.'
    ],
    objects: {
        crt: 'Это компьютер. Нажми, там сайт. Да, сайт внутри сайта.',
        lamp: 'Лампа. Можно выключить. Я предупредила.',
        lampOff: 'Зачем ты это сделал. Включи обратно. Пожалуйста.',
        lampOn: 'Спасибо. Мне было не страшно. Совсем.',
        mug: 'Кофе остыл ещё в 2024. Как и прошлый дизайн сайта.',
        poster: 'NLPA COLLAB. Звучит как секта. Мне нравится.',
        shelf_skull: 'Это Йорик. Он тоже когда-то советовал людям в Word.',
        trashbin: 'Тут лежит сайт 2024 года, сделанный в дипсике. Не доставай.',
        window: 'Там ничего нет. Наверное.',
        keyboard: 'Похоже, вы пытаетесь печатать. Монитор — выше.',
        sticky_0: '«не пушить в main в пятницу». Он пушил.',
        sticky_1: '«доделать KRAINOTOMY». Записка висит с декабря.',
        mouse: 'Мышь. Не та, что под полом. Та, что на столе.',
        figure: 'ТЫ ЭТО ВИДЕЛ?? Я — нет. Забудь.'
    }
};
