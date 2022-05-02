const { Restaurant, Category, Comment, User, sequelize } = require('../../models')
const { getUser } = require('../../helpers/auth-helpers')
const restaurantServices = require('../../services/restaurant-services')
//
const restaurantController = {
  getRestaurants: (req, res, next) => {
    restaurantServices.getRestaurants(req, (err, data) => err ? next(err) : res.render('restaurants', data))
  },
  getRestaurant: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: Comment, include: User },
        { model: User, as: 'FavoritedUsers' },
        { model: User, as: 'LikedUsers' }
      ]
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        return restaurant.increment('viewCounts')
      })
      .then(restaurant => {
        const isFavorited = restaurant.FavoritedUsers.some(f => f.id === req.user.id)
        const isLiked = restaurant.LikedUsers.some(f => f.id === req.user.id)
        res.render('restaurant', { restaurant: restaurant.toJSON(), isFavorited, isLiked })
      })

      .catch(err => next(err))
  },
  getDashboard: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: Category,
      nest: true
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        res.render('dashboard', { restaurant: restaurant.toJSON() })
      })
      .catch(err => next(err))
  },
  getFeeds: (req, res, next) => {
    return Promise.all([
      Restaurant.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [Category],
        raw: true,
        nest: true
      }),
      Comment.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [User, Restaurant],
        raw: true,
        nest: true
      })
    ])
      .then(([restaurants, comments]) => {
        res.render('feeds', {
          restaurants,
          comments
        })
      })
      .catch(err => next(err))
  },
  getTopRestaurants: (req, res, next) => {
    const favoritedRestaurants = getUser(req)?.FavoritedRestaurants ? getUser(req).FavoritedRestaurants : []
    const sliceNumber = 10
    return Restaurant.findAll({
      include: {
        model: User,
        as: 'FavoritedUsers',
        attributes: [
          'id'
        ],
        duplicating: false
      },
      attributes: [
        'id', 'name', 'image', 'description',
        [sequelize.fn('COUNT', sequelize.col('FavoritedUsers.id')), 'favoritedCount']
      ],
      group: 'id',
      order: [[sequelize.col('favoritedCount'), 'DESC']],
      limit: sliceNumber
    })
      .then(restaurants => {
        const resultData = restaurants.map(restaurant => ({
          ...restaurant.toJSON(),
          isFavorited: favoritedRestaurants.some(favoriteRestaurant => favoriteRestaurant.id === restaurant.id)
        }))
        res.render('top-restaurants', { restaurants: resultData })
      })
      .catch(err => next(err))
  }
}
module.exports = restaurantController
