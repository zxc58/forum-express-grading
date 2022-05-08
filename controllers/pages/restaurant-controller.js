const { Restaurant, Category, Comment, User, sequelize } = require('../../models')
const { getUser } = require('../../helpers/auth-helpers')
const restaurantServices = require('../../services/restaurant-services')
const { topRestaurantsQuery } = require('../../helpers/sql-helpers')
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
    const limit = 10
    const literalString = process.env.NODE_ENV === 'production' ? `CASE "FavoritedUsers"."id"- ${getUser(req).id} WHEN 0 THEN 1 ELSE 0 END` : 'CASE `FavoritedUsers`.`id`- ' + getUser(req).id + ' WHEN 0 THEN 1 ELSE 0 END'
    return Restaurant.findAll({
      include: {
        model: User,
        as: 'FavoritedUsers',
        attributes: [],
        duplicating: false,
        through: { attributes: [] }
      },
      attributes: [
        'id', 'name', 'image', 'description',
        [sequelize.fn('COUNT', sequelize.col('FavoritedUsers.id')), 'favoritedCount'],
        [sequelize.fn('MAX', sequelize.literal(literalString)), 'isFavorited']
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
