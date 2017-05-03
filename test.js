const FanavaGateway = require('./index')

const client = new FanavaGateway()

client.login().then(res => {
    console.log(res);
}).catch(err=>{
    console.log(err.message);
})

const inputs = client.getSimplePaymentForm(2000, 456)
console.log(inputs);