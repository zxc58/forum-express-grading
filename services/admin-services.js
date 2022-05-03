const { Restaurant, User, Category } = require('../models')
const { imgurFileHandler } = require('../helpers/file-helpers')
//
const adminController = {
  getRestaurants: (req, cb) => {
    Restaurant.findAll({
      raw: true,
      nest: true,
      include: [Category]
    })
      .then(restaurants => cb(null, { restaurants }))
      .catch(err => cb(err))
  }
}
//
module.exports = adminController
