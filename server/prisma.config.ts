import { defineConfig } from '@prisma/config'

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL || "mongodb://superbento:superbento_secret@localhost:27017/superbento_erp?authSource=admin"
  }
})

