1) Что делается для запуска
    Бот работает на node.js, библиотека – telegraf. В свойстве "scripts" в 
    package.json файле ничего не указано. 
    В корневом файле бота инициализируется бот посредством команды: 
    new Telegraf(токен, выданный телеграмом).
    Для запуска бота на локальной машине заходим в папку с ботом, открываем
    терминал, вбиваем "node core.js" – рабоатет. 
    Запускал также через отладчик в PHPStorm – тоже работает.
    
2) Как устанавливаются зависимости
    Зависимости установлены через package.json 
    Установленные пакеты подключаются посредством require("установленный пакет").