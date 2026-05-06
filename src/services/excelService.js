import ExcelJS from 'exceljs'

export const buildUsersWorkbook = async (users) => {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Control Calidad Backend'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Users')

  sheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Username', key: 'username', width: 30 },
    { header: 'Email', key: 'email', width: 35 },
    { header: 'Created At', key: 'created_at', width: 25 },
  ]

  sheet.getRow(1).font = { bold: true }
  sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }

  users.forEach((user) => {
    sheet.addRow({
      id: user.id,
      username: user.username,
      email: user.email,
      created_at:
        user.created_at instanceof Date
          ? user.created_at.toISOString()
          : user.created_at,
    })
  })

  return workbook
}
