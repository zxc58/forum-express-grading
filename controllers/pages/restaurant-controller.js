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
    if (process.env.NODE_ENV === 'production') {
      req.flash('error_messages', '功功能未完成(postgresql)')
      return res.redirect('/')
    }
    const limit = 10
    const literalString = 'IF (`FavoritedUsers`.`id`-' + getUser(req).id + ',0,1)'
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
        [sequelize.fn('COUNT', sequelize.col('FavoritedUsers.id')), 'favoritedCount'],
        [sequelize.fn('IF', sequelize.col('FavoritedUsers.id'), sequelize.fn('MAX', sequelize.literal(literalString)), 0), 'isFavorited']
      ],
      group: 'Restaurant.id',
      order: [[sequelize.col('favoritedCount'), 'DESC']],
      limit: limit,
      raw: true,
      nest: true
    })
      .then(restaurants => {
        res.render('top-restaurants', { restaurants })
      })
      .catch(err => next(err))
  }
}
module.exports = restaurantController
