const router = require('express').Router();
const fs = require('fs');
const util = require('util');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });
const unlinkFile = util.promisify(fs.unlink);
const { uploadFile, deleteFile } = require('../utils/s3');
const payment = require('../utils/payment');
const { validateRequest, verifyToken } = require('../middlewares');
const { eventValidator } = require('../validators');
let { Event, Transaction } = require('../models/');

//Gets event details
router.get('/event/:id', (req, res) => {
	Event.findById(req.params.id)
		.then((event) => {
			if (event) res.json({ message: 'Request Successful', data: event });
			else res.json({ message: 'No records found!', data: event });
		})
		.catch((error) => res.status(400).json('Error: ' + error));
});

//Gets events of a club
router.get('/:id', (req, res) => {
	Event.find({ clubId: req.params.id })
		.then((events) => {
			if (events.length)
				res.json({ message: 'Request Successful', data: events });
			else res.status(404).json('Error: No records found!');
		})
		.catch((error) => res.status(400).json('Error: ' + error));
});
//All events of a club
router.get('/', (req, res) => {
	Event.find()
		.then((events) => {
			if (events.length)
				res.json({ message: 'Request Successful', data: events });
			else res.status(404).json('Error: No records found!');
		})
		.catch((error) => res.status(400).json('Error: ' + error));
});

//Search for an event by name
router.get('/search/:keyword', (req, res) => {
	Event.find({ eventName: { $regex: req.params.keyword, $options: 'i' } })
		.then((events) => {
			if (events.length)
				res.json({ message: 'Match found!', data: events });
			else res.json({ message: 'No match found!', data: events });
		})
		.catch((error) => res.status(400).json('Error: ' + error));
});

//Creates an event
router.post('/create', async (req, res) => {
	let eventKey = '',
		eventPicture = '';

	if (req.body.picture == 'yes') {
		const result = await uploadFile(req.file);
		await unlinkFile(req.file.path);
		console.log(result);
		eventPicture = result.Location;
		eventKey = result.Key;
	}

	const newEvent = new Event(req.body);
	newEvent.picture = eventPicture;
	

	newEvent
		.save()
		.then((event) =>
			res.json({ message: 'New Event Created!', data: event })
		)
		.catch((error) => res.status(400).json('Error: ' + error));
});

//Edits event details (except clubId, organizerClub and picture)
router.put('/edit/:id', verifyToken('club'), (req, res) => {
	Event.findOneAndUpdate({ id: req.params.id }, req.body)
		.then((event) => {
			if (event) res.json({ message: 'Event Updated!', data: event });
			else res.status(404).json('Error: Event NOT FOUND!');
		})
		.catch((error) => res.status(400).json('Error: ' + error));
});

//Edits event picture
router.put(
	'/edit-picture/:id',
	upload.single('image'),
	verifyToken('club'),
	async (req, res) => {
		const result = await uploadFile(req.file);
		await unlinkFile(req.file.path);
		console.log(result);

		Event.findOneAndUpdate(
			{ _id: req.params.id },
			{ picture: result.Location },
			{ returnDocument: 'after' }
		)
			.then((event) => {
				deleteFile(event.awsKey);
				res.json({
					message: 'Event Picture Updated!',
					data: event,
				});
			})
			.catch((error) => res.status(400).json('Error: ' + error));
	}
);

//Signs up a member for an event
router.post('/attend', verifyToken('user'), async (req, res) => {
	let chargeDetails;
	let transactionDetails = {
		userId: req.body.userId,
		eventId: req.body.eventId,
		amount: req.body.amount,
		currency: req.body.currency,
	};

	const newTransaction = new Transaction(transactionDetails);

	try {
		chargeDetails = await payment(req.body);
		console.log(chargeDetails);
	} catch (error) {
		res.status(400).json('Error: ' + error);
	}

	newTransaction
		.save()
		.then((transaction) => {
			console.log(transaction);
			res.json({
				message: 'Payment successful!',
				data: chargeDetails,
			});
		})
		.catch((error) => res.status(400).json('Error: ' + error));
});

//Drops a member from the attendees list
router.delete('/cancel-attend/', verifyToken('club'), (req, res) => {
	Transaction.findOneAndDelete({
		userId: req.body.userId,
		eventId: req.body.eventId,
	})
		.then((transaction) => {
			if (transaction)
				res.json({
					message: 'Attendee Deleted!',
				});
			else res.status(404).json('Error: No records found!');
		})
		.catch((error) => res.status(400).json('Error: ' + error));
});

//Deletes an event
router.delete('/delete/:id', verifyToken('club'), (req, res) => {
	Event.findOneAndDelete({ id: req.params.id })
		.then((event) => {
			if (event) {
				deleteFile(event.Key);
				res.json({
					message: 'Event Deleted!',
				});
			} else res.status(404).json('Error: Event NOT FOUND!');
		})
		.catch((error) => res.status(400).json('Error: ' + error));
});

module.exports = router;
