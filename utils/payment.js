const dotenv = require('dotenv');

dotenv.config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function payment(body) {
	try {
		const charge = await stripe.paymentIntents.create({
			amount: body.amount,
			currency: body.currency,
			payment_method: 'pm_card_visa',
			description: 'Payment for ' + body.eventName,
		});

		return {
			id: charge.id,
			amount: charge.amount,
			currency: charge.currency,
			customer: body.cardHolder,
			merchant: body.clubName,
			description: charge.description,
			payment_method: charge.payment_method_types[0],
		};
	} catch (error) {
		return error;
	}
}

module.exports = payment;
