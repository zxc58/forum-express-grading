const express = require('express')
const router = express.Router()
//
const passport = require('../../config/passport')
const restaurantController = require('../../controllers/apis/restaurant-controller')
const admin = require('./modules/admin')
const { apiErrorHandler } = require('../../middleware/error-handler')
const userController = require('../../controllers/apis/user-controller')
//
router.post('/signin', passport.authenticate('local', { session: false }), userController.signIn)
//
router.get('/restaurants', restaurantController.getRestaurants)
router.use('/admin', admin)
router.use('/', apiErrorHandler)
//
module.exports = router
