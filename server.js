var express = require('express');
app = express();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var passport = require('passport');
var config = require('./config/main');
var jwt = require('jsonwebtoken');
var port = 3000;
var User = require('./models/user');

// use bodyParser to get post request for API use
app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());

//log request to console
app.use(morgan('dev'));

app.use(passport.initialize());

mongoose.connect(config.database, (err, res) => {
	if(err) console.log(err);
	console.log('Database connected');
});

//passport strategy
require('./config/passport')(passport);

//create api routes
var apiRoutes = express.Router();

//Register new user
apiRoutes.post('/register', function(req, res) {
	if(!req.body.email || !req.body.password) {
		res.json({
			success: false,
			message: 'Please enter valid credentials'
		});
	} else {
		var newUser = new User({
			email: req.body.email,
			password: req.body.password
		});

		newUser.save(function(err) {
			if(err) {
				return res.json({
					success: false,
					message: 'Email already exists'
				})
			} else {
				return res.json({
					success: true,
					message: 'Registration successfull.'
				})
			}
		})
	}
});

//authenticate the user and get a JWT
apiRoutes.post('/authenticate', function(req, res) {
	User.findOne({
		email: req.body.email
	}, function(err, user) {
		if(err) throw err;
		if(!user) {
			res.send({
				success: false,
				message: 'Authentication failed'
			})
		} else {
			user.comparePassword(req.body.password, function(err, isMatch) {
				if(isMatch && !err) {
					var token = jwt.sign(user, config.secret, {
						expiresIn: 10080 //sec
					});
					res.json({
						success: true,
						token: 'JWT ' + token
					});
				} else {
					res.send({
						success: false,
						message: 'Password does not match'
					})
				}
			})
		}
	})
});

//protect dashboard route with jwt
apiRoutes.get('/dashboard', passport.authenticate('jwt', {session: false}), function(req, res) {
	res.send('it worked user id is '+req.user._id+'.');
});

//set url for api routes
app.use('/api', apiRoutes);

//home route
app.get('/', (req, res) => {
  res.send('This is home route');
})

app.listen(port);
console.log(`server is running on port ${port}`);
