const express = require('express')
const router = express.Router()
const restaurantController = require('../../controllers/apis/restaurant-controller')
const adminController = require('../../controllers/apis/admin-controller')
router.get('/restaurants', restaurantController.getRestaurants)
router.get('/admin/restaurants', adminController.getRestaurants)
module.exports = router
