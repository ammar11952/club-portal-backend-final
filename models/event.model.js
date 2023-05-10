const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
	clubId: {
		type: String,
		required: true,
	},

	organizerClub: {
		type: String,
		
	},

	eventName: {
		type: String,
		required: true,
	},

	date: {
		type: String,
		required: true,
	},

	location: {
		type: String,
		required: true,
	},

	picture: {
		type: String,
	},

	awsKey: {
		type: String,
	},

	description: {
		type: String,
	},
});

module.exports = mongoose.model('Event', EventSchema);
