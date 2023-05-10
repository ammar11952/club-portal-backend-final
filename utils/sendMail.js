const sgMail = require('@sendgrid/mail');

async function sendMail(email, purpose, link) {
	let subject, content;
	sgMail.setApiKey(process.env.SENDGRID_API_KEY);
	if (purpose == 'welcome') {
		subject = 'Welcome!';
		content = 'Welcome to the Club Enrolment Portal!';
	} else if (purpose == 'reset') {
		subject = 'Reset Password';
		content = `If you made a request to reset your password for the Club Enrolment Portal, click on the link below. If you did not make this request, you can just ignore this email.
				<h3><link href=${link}>Click here</link></h3>`;
	} else if (purpose == 'updated') {
		subject = 'Password Updated!';
		content =
			'Your password for the Club Enrolment Portal account has been successfully updated!';
	}

	const msg = {
		to: email,
		from: 'clubenrollmentportal@gmail.com',
		subject: subject,
		//text: 'If you made a request to reset your password for the Club Enrolment Portal, click on the link below. If you did not make this request, you can just ignore this email.\n\n',
		html: content,
	};
	sgMail.send(msg);
}

module.exports = sendMail;
