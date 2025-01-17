const db = require('../../models')
const { User, Comment, Restaurant, Favorite, Like, Followship } = db
const { imgurFileHandler } = require('../../helpers/file-helpers')
const { getUser } = require('../../helpers/auth-helpers')
const userServices = require('../../services/user-services')
//
const userController = {
  signUpPage: (req, res) => {
    res.render('signup')
  },
  signUp: (req, res, next) => {
    userServices.signUp(req, (err, data) => {
      if (err) return next(err)
      req.flash('success_messages', '成功註冊帳號！')
      res.redirect('/signin', data)
    })
  },
  signInPage: (req, res) => {
    res.render('signin')
  },
  signIn: (req, res) => {
    req.flash('success_messages', '成功登入！')
    res.redirect('/restaurants')
  },
  logout: (req, res) => {
    req.flash('success_messages', '登出成功！')
    req.logout()
    res.redirect('/signin')
  },
  getUser: (req, res, next) => {
    const paramsId = parseInt(req.params.id)
    if (getUser(req).id === paramsId) {
      return User.findByPk(paramsId, {
        include: [
          { model: Comment, include: { model: Restaurant, attributes: ['id', 'name', 'image'] } },
          { model: Restaurant, as: 'FavoritedRestaurants', attributes: ['id', 'name', 'image'] },
          { model: User, as: 'Followers', attributes: ['id', 'name', 'image'] },
          { model: User, as: 'Followings', attributes: ['id', 'name', 'image'] }
        ]
      })
        .then(user => {
          const resultData = user.toJSON()
          const newComments = []
          console.log(resultData.Comments.length)
          for (; resultData.Comments.length > 0;) {
            newComments.unshift(resultData.Comments.shift())
            for (let j = 0; j < resultData.Comments.length; j++) {
              if (resultData.Comments[j].restaurantId === newComments[0].restaurantId) {
                resultData.Comments.splice(j, 1)
                j--
              }
            }
          }
          resultData.Comments = newComments
          res.render('users/profile', { user: resultData })
        })
        .catch(err => next(err))
    }
    return next(new Error('發生錯誤，無權限的操作'))
  },
  editUser: (req, res, next) => {
    const paramsId = parseInt(req.params.id)
    if (getUser(req).id === paramsId) {
      return User.findByPk(paramsId)
        .then(user => {
          res.render('users/edit', { user: user.toJSON() })
        })
        .catch(err => next(err))
    }
    return next(new Error('發生錯誤，無權限的操作'))
  },
  putUser: (req, res, next) => {
    const paramsId = parseInt(req.params.id)
    const { name } = req.body
    const { file } = req
    if (getUser(req).id === paramsId) {
      return Promise.all([User.findByPk(paramsId), imgurFileHandler(file)])
        .then(([user, filePath]) => {
          return user.update({ name, image: filePath })
        })
        .then(() => {
          req.flash('success_messages', '使用者資料編輯成功')
          res.redirect(`/users/${req.user.id}`)
        })
        .catch(err => next(err))
    }
    return next(new Error('發生錯誤，無權限的操作'))
  },
  addFavorite: (req, res, next) => {
    const { restaurantId } = req.params
    return Promise.all([
      Restaurant.findByPk(restaurantId),
      Favorite.findOne({
        where: {
          userId: req.user.id,
          restaurantId
        }
      })
    ])
      .then(([restaurant, favorite]) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        if (favorite) throw new Error('You have favorited this restaurant!')
        return Favorite.create({
          userId: req.user.id,
          restaurantId
        })
      })
      .then(() => res.redirect(`${req.get('Referrer')}#restaurant${restaurantId}`))
      .catch(err => next(err))
  },
  removeFavorite: (req, res, next) => {
    const { restaurantId } = req.params
    return Favorite.findOne({
      where: {
        userId: req.user.id,
        restaurantId
      }
    })
      .then(favorite => {
        if (!favorite) throw new Error("You haven't favorited this restaurant")

        return favorite.destroy()
      })
      .then(() => res.redirect(`${req.get('Referrer')}#restaurant${restaurantId}`))
      .catch(err => next(err))
  },
  addLike: (req, res, next) => {
    const { restaurantId } = req.params
    const userId = req.user.id
    return Promise.all([
      Like.findOne({
        where: {
          restaurantId,
          userId
        }
      }),
      Restaurant.findByPk(restaurantId)
    ])
      .then(([like, restaurant]) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        if (like) throw new Error('You have liked this restaurant!')
        return Like.create({
          userId,
          restaurantId
        })
      })
      .then(() => res.redirect(`${req.get('Referrer')}#restaurant${restaurantId}`))
      .catch(err => next(err))
  },
  removeLike: (req, res, next) => {
    const { restaurantId } = req.params
    return Like.findOne({
      where: {
        userId: req.user.id,
        restaurantId
      }
    })
      .then(like => {
        if (!like) throw new Error("You haven't liked this restaurant")
        return like.destroy()
      })
      .then(() => res.redirect(`${req.get('Referrer')}#restaurant${restaurantId}`))
      .catch(err => next(err))
  },
  getTopUsers: (req, res, next) => {
    return User.findAll({
      include: [{ model: User, as: 'Followers' }]
    })
      .then(users => {
        const result = users.map(user => ({
          ...user.toJSON(),
          followerCount: user.Followers.length,
          isFollowed: req.user.Followings.some(f => f.id === user.id)
        })).sort((a, b) => b.followerCount - a.followerCount)
        res.render('top-users', { users: result })
      })
      .catch(err => next(err))
  },
  addFollowing: (req, res, next) => {
    const { userId } = req.params
    if (parseInt(userId) === req.user.id) next(new Error('cannot follow yourself'))
    Promise.all([
      User.findByPk(userId),
      Followship.findOne({
        where: {
          followerId: req.user.id,
          followingId: req.params.userId
        }
      })
    ])
      .then(([user, followship]) => {
        if (!user) throw new Error("User didn't exist!")
        if (followship) throw new Error('You are already following this user!')
        return Followship.create({
          followerId: req.user.id,
          followingId: userId
        })
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  },
  removeFollowing: (req, res, next) => {
    Followship.findOne({
      where: {
        followerId: req.user.id,
        followingId: req.params.userId
      }
    })
      .then(followship => {
        if (!followship) throw new Error("You haven't followed this user!")
        return followship.destroy()
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  }
}
//
module.exports = userController
