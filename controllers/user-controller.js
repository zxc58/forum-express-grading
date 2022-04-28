const bcrypt = require('bcryptjs')
const db = require('../models')
const { User, Comment, Restaurant } = db
const { imgurFileHandler } = require('../helpers/file-helpers')
const {getUser} = require('../helpers/auth-helpers')
//
const userController = {
  signUpPage: (req, res) => {
    res.render('signup')
  },
  signUp: (req, res, next) => {
    if (req.body.password !== req.body.passwordCheck) throw new Error('Passwords do not match!')
    User.findOne({ where: { email: req.body.email } })
      .then(user => {
        if (user) throw new Error('Email already exists!')
        return bcrypt.hash(req.body.password, 10)
      })
      .then(hash => User.create({
        name: req.body.name,
        email: req.body.email,
        password: hash
      }))
      .then(() => {
        req.flash('success_messages', '成功註冊帳號！')
        res.redirect('/signin')
      })
      .catch(err => next(err))
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
      return User.findByPk(paramsId)
        .then(user => {
          res.render('users/profile', { user: user.toJSON() })
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
  }
}
//
module.exports = userController
