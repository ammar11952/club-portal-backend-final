const jwt = require('jsonwebtoken');

function verifyToken(issuer) {
	return function (req, res, next) {
		const token = req.headers.authorization;

		if (!token) {
			return res.status(401).json({
				message: 'No token provided',
				auth: false,
			});
		}

		jwt.verify(token, process.env.SECRET, (error, decoded) => {
			if (error) {
				return res.status(401).json({
					message: 'Failed to authenticate token',
					auth: false,
				});
			}
			if (issuer !== 'both' && issuer !== decoded.issuer) {
				return res.status(403).json({
					message: 'You do not have access to this resource',
				});
			}

			req.username = decoded.username;
			next();
		});
	};
}

module.exports = verifyToken;
