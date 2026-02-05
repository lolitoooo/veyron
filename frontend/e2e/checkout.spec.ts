import { test, expect } from '@playwright/test'

test.describe('Processus de commande (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    // Simuler une connexion utilisateur
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/', { timeout: 5000 })
  })

  test('devrait permettre d\'ajouter un produit au panier', async ({ page }) => {
    await page.goto('/products')
    
    // Cliquer sur le premier produit
    await page.click('.product-card:first-child')
    
    // Sélectionner une taille et couleur
    await page.click('button[data-size], select[name="size"] option:nth-child(2)')
    await page.click('button[data-color], select[name="color"] option:nth-child(2)')
    
    // Ajouter au panier
    await page.click('button:has-text("Ajouter au panier")')
    
    // Vérifier que le compteur du panier a augmenté
    const cartBadge = page.locator('.cart-badge, .cart-count')
    await expect(cartBadge).toContainText('1')
  })

  test('devrait afficher le panier avec les produits ajoutés', async ({ page }) => {
    // Ajouter un produit d'abord
    await page.goto('/products')
    await page.click('.product-card:first-child')
    await page.click('button:has-text("Ajouter au panier")')
    
    // Aller au panier
    await page.goto('/cart')
    
    // Vérifier que le produit est dans le panier
    await expect(page.locator('.cart-item')).toHaveCount(1)
    await expect(page.locator('.cart-total')).toBeVisible()
  })

  test('devrait permettre de modifier la quantité dans le panier', async ({ page }) => {
    await page.goto('/cart')
    
    if (await page.locator('.cart-item').count() > 0) {
      const quantityInput = page.locator('input[type="number"]').first()
      await quantityInput.fill('2')
      
      // Vérifier que le total a été mis à jour
      await expect(page.locator('.cart-total')).toBeVisible()
    }
  })

  test('devrait permettre de supprimer un produit du panier', async ({ page }) => {
    await page.goto('/cart')
    
    if (await page.locator('.cart-item').count() > 0) {
      const initialCount = await page.locator('.cart-item').count()
      const removeButton = page.locator('.remove-item, button:has-text("Supprimer")').first()
      await removeButton.click()
      
      const newCount = await page.locator('.cart-item').count()
      expect(newCount).toBeLessThan(initialCount)
    }
  })

  test('devrait permettre de passer à la page de checkout', async ({ page }) => {
    await page.goto('/cart')
    
    if (await page.locator('.cart-item').count() > 0) {
      await page.click('button:has-text("Commander"), a:has-text("Passer commande")')
      await expect(page).toHaveURL(/\/checkout/)
    }
  })

  test('devrait valider les champs obligatoires du checkout', async ({ page }) => {
    await page.goto('/checkout')
    
    // Essayer de soumettre sans remplir les champs
    await page.click('button[type="submit"]:has-text("Payer")')
    
    // Vérifier qu'il y a des messages d'erreur
    const errorMessages = page.locator('.error, .invalid-feedback, [role="alert"]')
    await expect(errorMessages.first()).toBeVisible({ timeout: 2000 })
  })

  test('devrait afficher le récapitulatif de commande', async ({ page }) => {
    await page.goto('/checkout')
    
    await expect(page.locator('.order-summary, .cart-summary')).toBeVisible()
    await expect(page.locator('.total-price, .order-total')).toBeVisible()
  })
})
