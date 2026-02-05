import { test, expect } from '@playwright/test'

test.describe('Page d\'accueil', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('devrait afficher le header avec le logo', async ({ page }) => {
    const logo = page.locator('header img[alt*="VEYRON"], header .logo')
    await expect(logo).toBeVisible()
  })

  test('devrait afficher le menu de navigation', async ({ page }) => {
    await expect(page.getByRole('navigation')).toBeVisible()
    await expect(page.getByText('Homme', { exact: false })).toBeVisible()
    await expect(page.getByText('Femme', { exact: false })).toBeVisible()
  })

  test('devrait afficher le banner de cookies si pas de consentement', async ({ page, context }) => {
    await context.clearCookies()
    await page.reload()
    
    const cookieBanner = page.locator('.cookie-banner')
    await expect(cookieBanner).toBeVisible({ timeout: 5000 })
  })

  test('devrait pouvoir accepter les cookies', async ({ page, context }) => {
    await context.clearCookies()
    await page.reload()
    
    const acceptButton = page.getByRole('button', { name: /accepter/i })
    if (await acceptButton.isVisible({ timeout: 2000 })) {
      await acceptButton.click()
      await expect(page.locator('.cookie-banner')).not.toBeVisible()
    }
  })

  test('devrait afficher le footer avec les liens légaux', async ({ page }) => {
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
    await expect(footer.getByText('CGU')).toBeVisible()
    await expect(footer.getByText('Politique de confidentialité', { exact: false })).toBeVisible()
  })

  test('devrait pouvoir naviguer vers la page produits', async ({ page }) => {
    await page.click('a[href*="/products"], a[href*="/shop"]')
    await expect(page).toHaveURL(/\/(products|shop)/)
  })

  test('devrait afficher le panier dans le header', async ({ page }) => {
    const cartIcon = page.locator('a[href="/cart"], .cart-icon')
    await expect(cartIcon).toBeVisible()
  })

  test('devrait être responsive sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
  })
})
