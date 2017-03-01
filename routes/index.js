var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
	res.render('index', { title: 'Regex Game' });
});

router.get('/:page', function (req, res) {
    res.render(req.param('page'), { title: 'Regex Game' });
});

module.exports = router;