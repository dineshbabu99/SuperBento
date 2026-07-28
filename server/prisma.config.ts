import { defineConfig } from '@prisma/config'

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://superbento:superbento_secret_change_in_prod@localhost:5432/superbento_erp"
  }
})
