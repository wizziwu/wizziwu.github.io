// ============================================================
// КОНФИГУРАЦИЯ (замените на свои данные из ЛК CloudPayments)
// ============================================================
const CONFIG = {
    publicId: 'pk_3523a43ecc0884c0a8f70cfd3a584', // Ваш Public ID из ЛК
    apiUrl: 'https://api.cloudpayments.ru',         // URL API (не используется в виджете напрямую)
    currency: 'RUB',
    description: 'Пожертвование в благотворительный фонд'
};

// ============================================================
// ИНИЦИАЛИЗАЦИЯ ВИДЖЕТА
// ============================================================
const payments = new cp.CloudPayments({
    // При необходимости можно указать настройки темы виджета
    // skin: 'modern' // 'classic' или 'modern'
});

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Синхронизация чекбокса и радио-селектора рекуррентности
 */
function syncRecurrenceControls() {
    const radioMonthly = document.querySelector('input[name="recurrence"][value="monthly"]');
    const checkbox = document.getElementById('makeRecurrent');

    radioMonthly.addEventListener('change', () => {
        if (radioMonthly.checked) {
            checkbox.checked = true;
        }
    });

    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            radioMonthly.checked = true;
        } else {
            document.querySelector('input[name="recurrence"][value="one-time"]').checked = true;
        }
    });
}

/**
 * Сбор данных из формы
 */
function collectFormData() {
    return {
        amount: parseFloat(document.getElementById('amount').value),
        fullName: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        comment: document.getElementById('comment').value.trim(),
        isRecurrent: document.getElementById('makeRecurrent').checked
    };
}

/**
 * Валидация данных формы
 */
function validateFormData(data) {
    if (!data.amount || data.amount <= 0) {
        return 'Укажите корректную сумму пожертвования';
    }
    if (!data.fullName) {
        return 'Укажите ФИО';
    }
    if (!data.email || !data.email.includes('@')) {
        return 'Укажите корректный email';
    }
    if (!data.phone || data.phone.length < 10) {
        return 'Укажите корректный номер телефона';
    }
    return null; // Ошибок нет
}

/**
 * Отображение сообщения пользователю
 */
function showMessage(text, type = 'success') {
    const el = document.getElementById('resultMessage');
    el.textContent = text;
    el.className = 'result-message ' + type;

    // Автоматическое скрытие через 10 секунд
    setTimeout(() => {
        el.className = 'result-message';
    }, 10000);
}

/**
 * Блокировка/разблокировка кнопок
 */
function setButtonsDisabled(disabled) {
    document.getElementById('payButton').disabled = disabled;
    document.getElementById('quickPayButton').disabled = disabled;
}

// ============================================================
// ФОРМИРОВАНИЕ ПАРАМЕТРОВ ПЛАТЕЖА
// ============================================================

/**
 * Формирует объект параметров для виджета CloudPayments
 * 
 * Ключевые моменты для тестового задания:
 * - Данные из формы (email, phone, ФИО, comment) передаются в metadata,
 *   чтобы они были видны в выгрузке из ЛК.
 * - Для рекуррентных платежей используется объект recurrent с interval: 'Month'.
 * - accountId используется для идентификации плательщика в системе подписок.
 */
function buildPaymentOptions(formData) {
    // Формируем accountId — уникальный идентификатор плательщика
    // Используем email как основу, чтобы подписки были привязаны к плательщику
    const accountId = formData.email;

    // Базовые параметры
    const options = {
        publicId: CONFIG.publicId,
        description: CONFIG.description,
        amount: formData.amount,
        currency: CONFIG.currency,
        accountId: accountId,
        email: formData.email,

        // Metadata — дополнительные данные, которые сохраняются в транзакции
        // и видны в выгрузке из ЛК CloudPayments
        metadata: {
            fullName: formData.fullName,
            phone: formData.phone,
            comment: formData.comment,
            source: 'charity_landing'
        }
    };

    // Если выбрана ежемесячная подписка — добавляем объект recurrent
    // Согласно документации CloudPayments, interval: 'Month' и period: 1
    // означают списание раз в месяц
    if (formData.isRecurrent) {
        options.recurrent = {
            interval: 'Month',  // 'Day' | 'Week' | 'Month'
            period: 1,          // Каждые 1 месяц
            // maxPeriods можно не указывать — подписка будет бессрочной
            // amount: formData.amount — если сумма регулярного платежа должна отличаться
        };
    }

    return options;
}

// ============================================================
// ОСНОВНЫЕ ФУНКЦИИ ОПЛАТЫ
// ============================================================

/**
 * Стандартная оплата через виджет (открывается форма ввода карты)
 */
function payWithWidget() {
    const formData = collectFormData();

    // Валидация
    const validationError = validateFormData(formData);
    if (validationError) {
        showMessage(validationError, 'error');
        return;
    }

    setButtonsDisabled(true);

    const options = buildPaymentOptions(formData);

    // Вызов виджета CloudPayments
    payments.charge(
        options,
        // Успешная оплата
        function (result) {
            setButtonsDisabled(false);

            const isRecurrent = formData.isRecurrent;
            let message = 'Спасибо за ваше пожертвование!';

            if (isRecurrent) {
                message += ' Подписка на ежемесячные платежи успешно создана.';
            }

            // Добавляем информацию о транзакции
            if (result && result.transactionId) {
                message += ` Номер транзакции: ${result.transactionId}`;
            }

            showMessage(message, 'success');

            // Опционально: сброс формы
            // document.getElementById('donationForm').reset();
        },
        // Ошибка оплаты
        function (reason, options) {
            setButtonsDisabled(false);

            let errorText = 'Оплата не прошла. ';

            if (reason && reason.message) {
                errorText += reason.message;
            } else if (reason && reason.code) {
                errorText += `Код ошибки: ${reason.code}`;
            } else {
                errorText += 'Попробуйте ещё раз или используйте другой способ оплаты.';
            }

            showMessage(errorText, 'error');
        }
    );
}

/**
 * Оплата в один клик
 * 
 * Для демонстрации используем тот же виджет, но можно расширить:
 * - Если у пользователя сохранена карта (токен), можно вызвать API /payments/token/charge
 * - Здесь для простоты открываем виджет с предустановленными данными
 */
function quickPay() {
    const formData = collectFormData();

    // Валидация
    const validationError = validateFormData(formData);
    if (validationError) {
        showMessage(validationError, 'error');
        return;
    }

    // Для быстрой оплаты можно использовать тот же виджет,
    // но с минимальным количеством шагов (виджет запомнит данные)
    // В реальном сценарии здесь может быть вызов API с токеном карты

    // Для демонстрации — просто вызываем payWithWidget
    // В production-версии можно:
    // 1. Проверить наличие сохранённого токена для accountId
    // 2. Вызвать API /payments/token/charge с токеном
    // 3. Если токена нет — открыть виджет

    payWithWidget();
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
    // Синхронизация контролов рекуррентности
    syncRecurrenceControls();

    // Обработчик основной кнопки оплаты
    document.getElementById('donationForm').addEventListener('submit', function (e) {
        e.preventDefault();
        payWithWidget();
    });

    // Обработчик кнопки быстрой оплаты
    document.getElementById('quickPayButton').addEventListener('click', function (e) {
        e.preventDefault();
        quickPay();
    });
});
