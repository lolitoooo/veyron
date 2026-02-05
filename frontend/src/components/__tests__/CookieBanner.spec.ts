import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CookieBanner from '../CookieBanner.vue'
import { useCookieStore } from '@/stores/cookies'

describe('CookieBanner', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('devrait afficher le banner si aucun consentement', () => {
    const wrapper = mount(CookieBanner)
    expect(wrapper.find('.cookie-banner').exists()).toBe(true)
  })

  it('ne devrait pas afficher le banner si consentement donné', () => {
    const cookieStore = useCookieStore()
    cookieStore.acceptAll()
    
    const wrapper = mount(CookieBanner)
    expect(wrapper.find('.cookie-banner').exists()).toBe(false)
  })

  it('devrait accepter tous les cookies au clic sur "Tout accepter"', async () => {
    const wrapper = mount(CookieBanner)
    const cookieStore = useCookieStore()
    
    await wrapper.find('button:nth-child(3)').trigger('click')
    
    expect(cookieStore.hasConsented).toBe(true)
    expect(cookieStore.preferences.analytics).toBe(true)
    expect(cookieStore.preferences.marketing).toBe(true)
  })

  it('devrait rejeter tous les cookies au clic sur "Tout refuser"', async () => {
    const wrapper = mount(CookieBanner)
    const cookieStore = useCookieStore()
    
    await wrapper.find('button:nth-child(2)').trigger('click')
    
    expect(cookieStore.hasConsented).toBe(true)
    expect(cookieStore.preferences.analytics).toBe(false)
    expect(cookieStore.preferences.marketing).toBe(false)
    expect(cookieStore.preferences.essential).toBe(true)
  })

  it('devrait ouvrir les paramètres au clic sur "Personnaliser"', async () => {
    const wrapper = mount(CookieBanner)
    const cookieStore = useCookieStore()
    
    await wrapper.find('button:nth-child(1)').trigger('click')
    
    expect(cookieStore.showSettings).toBe(true)
  })

  it('devrait contenir un lien vers la politique des cookies', () => {
    const wrapper = mount(CookieBanner)
    const link = wrapper.find('a[href="/cookies"]')
    
    expect(link.exists()).toBe(true)
    expect(link.text()).toContain('politique')
  })
})
