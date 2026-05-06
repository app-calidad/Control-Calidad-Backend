import * as userService from '../services/userService.js'
import { buildUsersWorkbook } from '../services/excelService.js'
import { ApiError } from '../utils/ApiError.js'
import { parseId, validateUserPayload } from '../utils/validators.js'

export const getUsers = async (_req, res) => {
  const users = await userService.listUsers()
  res.status(200).json({ data: users })
}

export const getUser = async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) throw ApiError.badRequest('Invalid user id')

  const user = await userService.getUserById(id)
  if (!user) throw ApiError.notFound('User not found')

  res.status(200).json({ data: user })
}

export const createUser = async (req, res) => {
  const { errors, data } = validateUserPayload(req.body || {})
  if (errors.length) throw ApiError.badRequest('Validation failed', errors)

  const user = await userService.createUser(data)
  res.status(201).json({ data: user })
}

export const updateUser = async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) throw ApiError.badRequest('Invalid user id')

  const { errors, data } = validateUserPayload(req.body || {}, { partial: true })
  if (errors.length) throw ApiError.badRequest('Validation failed', errors)
  if (Object.keys(data).length === 0) {
    throw ApiError.badRequest('Provide username and/or email to update')
  }

  const user = await userService.updateUser(id, data)
  res.status(200).json({ data: user })
}

export const deleteUser = async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) throw ApiError.badRequest('Invalid user id')

  await userService.deleteUser(id)
  res.status(200).json({ message: 'User deleted successfully' })
}

export const exportUsers = async (_req, res) => {
  const users = await userService.listUsers()
  const workbook = await buildUsersWorkbook(users)

  const filename = `users-${new Date().toISOString().slice(0, 10)}.xlsx`

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${filename}"`,
  )

  await workbook.xlsx.write(res)
  res.end()
}
