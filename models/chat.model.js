const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
	userId: {
		type: String,
		required: true,
	},

	clubId: {
		type: String,
		required: true,
	},

	messages: [
		{
			sender: String,
			text: String,
		},
	],
});

module.exports = mongoose.model('Chat', ChatSchema);
