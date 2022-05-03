const express = require('express')
const router = express.Router()
const restaurantController = require('../../controllers/apis/restaurant-controller')
const admin = require('./modules/admin')
const { apiErrorHandler } = require('../../middleware/error-handler')
//
router.get('/restaurants', restaurantController.getRestaurants)
router.use('/admin', admin)
router.use('/', apiErrorHandler)
module.exports = router
