const email = document.getElementById("email");
const phone = document.getElementById("phone");
const firstName = document.getElementById("firstName");
const patronymic = document.getElementById("patronymic");
const surname = document.getElementById("surname");
const comment = document.getElementById("comment");

function once_pay () {
  var widget = new cp.CloudPayments();
    widget.pay('auth', // или 'charge'
        { //options
            publicId: 'pk_3523a43ecc0884c0a8f70cfd3a584', //id из личного кабинета
            description: comment.value, //назначение
            amount: 1, //сумма
            currency: 'RUB', //валюта
            accountId: email.value, //идентификатор плательщика (необязательно)
            invoiceId: '1234567', //номер заказа  (необязательно)
            email: email.value, //email плательщика (необязательно)
            skin: "mini", //дизайн виджета (необязательно)
            data: {
                myProp: 'myProp value',
                email: email.value,
                phone: phone.value,
                firstName: firstName.value,
                middleName: patronymic.value,
                lastName: surname.value,
                comment: comment.value
            },
            payer: { 
                firstName: firstName.value,
                lastName: 'Тестов',
                middleName: 'Тестович',
                birth: '1955-02-24',
                address: 'тестовый проезд дом тест',
                street: 'Lenina',
                city: 'MO',
                country: 'RU',
                phone: phone.value,
                postcode: '345'
            }
        },
        {
            onSuccess: function (options) { // success
                //действие при успешной оплате
            },
            onFail: function (reason, options) { // fail
                //действие при неуспешной оплате
            },
            onComplete: function (paymentResult, options) { //Вызывается как только виджет получает от api.cloudpayments ответ с результатом транзакции.
                //например вызов вашей аналитики Facebook Pixel
            }
        }
    )
};


document.addEventListener('DOMContentLoaded', function () {
  const button = document.getElementById('pay');

  button.addEventListener('click', isChecked);
});




function recurrent_pay () {
  var widget = new cp.CloudPayments();
  var receipt = {
    Items: [//товарные позиции
         {
            label: 'Наименование товара 3', //наименование товара
            price: 300.00, //цена
            quantity: 3.00, //количество
            amount: 900.00, //сумма
            vat: 20, //ставка НДС
            method: 0, // тег-1214 признак способа расчета - признак способа расчета
            object: 0, // тег-1212 признак предмета расчета - признак предмета товара, работы, услуги, платежа, выплаты, иного предмета расчета
        }
    ],
    taxationSystem: 0, //система налогообложения; необязательный, если у вас одна система налогообложения
    email: email.value, //e-mail покупателя, если нужно отправить письмо с чеком
    phone: phone.value, //телефон покупателя в любом формате, если нужно отправить сообщение со ссылкой на чек
    isBso: false, //чек является бланком строгой отчетности
    amounts:
    {
        electronic: 900.00, // Сумма оплаты электронными деньгами
        advancePayment: 0.00, // Сумма из предоплаты (зачетом аванса) (2 знака после запятой)
        credit: 0.00, // Сумма постоплатой(в кредит) (2 знака после запятой)
        provision: 0.00 // Сумма оплаты встречным предоставлением (сертификаты, др. мат.ценности) (2 знака после запятой)
    }
};

  var data = {
    email: email.value,
    phone: phone.value,
    firstName: firstName.value,
    middleName: patronymic.value,
    lastName: surname.value,
    comment: comment.value
  };
  data.CloudPayments = {
  CustomerReceipt: receipt, //чек для первого платежа
  recurrent: {
  interval: 'Month',
  period: 1, 
  customerReceipt: receipt //чек для регулярных платежей
  }
  }; //создание ежемесячной подписки

  widget.charge({ // options
  publicId: 'pk_3523a43ecc0884c0a8f70cfd3a584', //id из личного кабинета
  description: comment.value, //назначение
  amount: 2, //сумма
  currency: 'RUB', //валюта
  invoiceId: '999', //номер заказа  (необязательно)
  accountId: email.value, //идентификатор плательщика (обязательно для создания подписки)
  data: data,
  requireEmail: true
  },
  function (options) { // success
  //действие при успешной оплате
  },
  function (reason, options) { // fail
  //действие при неуспешной оплате
  });
};


function isChecked() {
    if(document.getElementById("reccurentPayment").checked){
        recurrent_pay();
    }
    else{
        once_pay();
    }
};