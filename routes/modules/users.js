const express = require('express')
const router = express.Router()
const userController = require('../../controllers/user-controller')
const upload = require('../../middleware/multer')
//
router.get('/:id/edit', userController.editUser)
router.get('/:id', userController.getUser)
router.put('/:id', upload.single('image'), userController.putUser)
//
module.exports = router