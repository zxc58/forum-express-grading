const express = require('express')
const router = express.Router()
//
const passport = require('../../config/passport')
const restaurantController = require('../../controllers/apis/restaurant-controller')
const admin = require('./modules/admin')
const { apiErrorHandler } = require('../../middleware/error-handler')
const userController = require('../../controllers/apis/user-controller')
const { authenticated, authenticatedAdmin } = require('../../middleware/api-auth')
//
router.post('/signin', passport.authenticate('local', { session: false }), userController.signIn)
router.post('/signup', userController.signup)
//
router.get('/restaurants', authenticated, restaurantController.getRestaurants)
router.use('/admin', authenticated, authenticatedAdmin, admin)
router.use('/', apiErrorHandler)
//
module.exports = router
