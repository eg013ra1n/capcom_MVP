// Функция для обновления локального изображения каждые 10 секунд
setInterval(function () {
    document.getElementById('localImage').src = '/local_image?' + new Date().getTime();
}, 10000);

// Функция для обновления удаленного изображения каждые 20 секунд
setInterval(function () {
    document.getElementById('remoteImage').src = '/remote_image?' + new Date().getTime();
}, 20000);

function updateWeatherData() {
    fetch('/weather-data')
        .then(response => response.json())
        .then(data => {
            if (data.data_gmt_time) { 
           
                const parts = data.data_gmt_time.split(/[- :/]/); 
                const time = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]));

                // Прибавляем два часа
                time.setUTCHours(time.getUTCHours() + 2);

                // Форматируем время для отображения
                // Пример форматирования: YYYY-MM-DD HH:MM:SS
                const formattedTime = time.toISOString().replace('T', ' ').substring(0, 19);

                // Обновляем текст элемента с временем
                document.getElementById('data-time').textContent = formattedTime;
            } else {
                console.error('data_gmt_time is missing in the response');
            }
            // Обновление статуса Safe
            const safeStatusDiv = document.querySelector('.safe-status');
            if (data.safe_status) { // Проверяем статус
                safeStatusDiv.textContent = 'SAFE'; // Обновляем текст
                safeStatusDiv.className = 'safe-status safe'; // Применяем стиль для SAFE
                clearInterval(window.safeStatusInterval); // Очищаем интервал для NOT SAFE, если он был установлен
            } else {
                safeStatusDiv.textContent = 'NOT SAFE'; // Обновляем текст для NOT SAFE
                safeStatusDiv.className = 'safe-status not-safe-black'; // Применяем начальный стиль для NOT SAFE
                // Устанавливаем или перезапускаем интервал для мигания
                clearInterval(window.safeStatusInterval); // Сначала очищаем предыдущий интервал, если он существует
                window.safeStatusInterval = setInterval(() => {
                    // Функция для переключения стиля мигания
                    if (safeStatusDiv.classList.contains('not-safe-black')) {
                        safeStatusDiv.className = 'safe-status not-safe-red';
                    } else {
                        safeStatusDiv.className = 'safe-status not-safe-black';
                    }
                }, 2000); // Переключаем стиль каждые 2 секунды
            }

            // Генерация таблицы погоды
            const weatherData = data.weather_data;
            let tableHtml = '<table class="weather-table"><tr>';
            for (const key in weatherData) {
                tableHtml += `<th>${key}</th>`;
            }
            tableHtml += '</tr><tr>';
            for (const key in weatherData) {
                tableHtml += `<td>${weatherData[key]}</td>`;
            }
            tableHtml += '</tr></table>';
            document.getElementById('weather-table-container').innerHTML = tableHtml;
        })
        .catch(error => console.error('Error loading weather data:', error));
}
function toggleSafeStatusStyle(element) {
    if (element.classList.contains('not-safe-black')) {
        element.className = 'safe-status not-safe-red';
    } else {
        element.className = 'safe-status not-safe-black';
    }
}
// Обновляем данные при загрузке страницы и каждые 5 секунд
document.addEventListener('DOMContentLoaded', updateWeatherData);
setInterval(updateWeatherData, 5000);
function changeTab(tabName, containerId) {
    // Скрыть все элементы с классом "tab-content" в указанном контейнере
    var tabcontent, tablinks;
    tabcontent = document.querySelectorAll("#tabs-container-" + containerId + " .tab-content");
    tabcontent.forEach(function (content) {
        content.style.display = "none";
    });

    // Удалить класс "active" у всех вкладок в указанном контейнере
    tablinks = document.querySelectorAll("#tabs-container-" + containerId + " .tab-button");
    tablinks.forEach(function (link) {
        link.classList.remove("active");
    });

    // Показать текущий таб и добавить класс "active" на кнопку, которая открыла таб
    document.getElementById(tabName + '-' + containerId).style.display = "block";
    document.querySelector("#tabs-container-" + containerId + " .tab-button[onclick*='" + tabName + "']").classList.add("active");
}

document.addEventListener('DOMContentLoaded', function () {
    changeTab('T1', '1'); // Активирует вкладку T1 в первом элементе сетки
    changeTab('T1', '2'); // Активирует вкладку T1 во втором элементе сетки
});

document.addEventListener('DOMContentLoaded', function () {
    // Для T1
    updateImageHistory('192.168.31.105', 'imageHistoryTableT1');
    setInterval(() => updateImageHistory('192.168.31.105', 'imageHistoryTableT1'), 30000); // Обновлять каждые 30 секунд

    // Для VIVI
    updateImageHistory('10.8.0.3', 'imageHistoryTableVIVI');
    setInterval(() => updateImageHistory('10.8.0.3', 'imageHistoryTableVIVI'), 30000); // Обновлять каждые 30 секунд

    // Для DUKE
  //  updateImageHistory('192.168.31.189', 'imageHistoryTableDUKE');
    //setInterval(() => updateImageHistory('192.168.31.189', 'imageHistoryTableDUKE'), 30000); // Обновлять каждые 30 секунд
});

function updateImageHistory(ip, tableId) {
    fetch(`/get_image_history/${ip}`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.querySelector(`#${tableId} tbody`);
            tableBody.innerHTML = ''; // Очищаем текущие строки таблицы
            data.forEach(item => {
                const dateTime = new Date(item.DateTime);
                const formattedDateTime = dateTime.toLocaleTimeString('en-GB', {
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                }) + ' ' + dateTime.getDate().toString().padStart(2, '0') + '.' + (dateTime.getMonth() + 1).toString().padStart(2, '0');
            
                const row = `
                    <tr>
                        <td>${item.TargetName}</td>
                        <td>${formattedDateTime}</td> <!-- Форматированное время и дата -->
                        <td>${item.Id}</td>
                        <td>${item.Filter}</td>
                        <td>${item.Duration}</td>
                        <td>${item.Type}</td>
                        <td>${item.Stars}</td>
                        <td>${item.HFR}</td>
                        <td>${item.RmsText}</td>
                    </tr>
                `;
                tableBody.innerHTML += row; // Добавляем новую строку в таблицу
            });
        })
        .catch(error => console.error('Error loading image history from', ip, error));
}


function updateScreenshot(ip, elementId) {
    fetch(`/get_screenshot/${ip}`)
        .then(response => response.json())
        .then(data => {
            if (data.image) {
                document.getElementById(elementId).src = 'data:image/png;base64,' + data.image;
            }
        })
        .catch(error => console.error('Error loading image from', ip, error));
}

// Начальное обновление и запуск периодического обновления
updateScreenshot('10.8.0.3', 'vivi-image');
setInterval(() => updateScreenshot('10.8.0.3', 'vivi-image'), 30000);  // Для VIVI
updateScreenshot('192.168.31.105', 't1-image');
setInterval(() => updateScreenshot('192.168.31.105', 't1-image'), 30000);  // Для T1
//updateScreenshot('192.168.31.189', 'duke-image');
//setInterval(() => updateScreenshot('192.168.31.189', 'duke-image'), 30000);  // Для T1


document.addEventListener('DOMContentLoaded', function () {

    updateScreenshot('10.8.0.3', 'vivi-image');
    setInterval(() => updateScreenshot('10.8.0.3', 'vivi-image'), 30000);  // Для VIVI

    updateScreenshot('192.168.31.105', 't1-image');
    setInterval(() => updateScreenshot('192.168.31.105', 't1-image'), 30000);  // Для T1
    
    //updateScreenshot('192.168.31.189', 'duke-image');
    //setInterval(() => updateScreenshot('NEBULA', 'duke-image'), 30000);  // Для T1
});
