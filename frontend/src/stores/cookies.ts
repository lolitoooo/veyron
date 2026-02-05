import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface CookiePreferences {
  essential: boolean
  preferences: boolean
  analytics: boolean
  marketing: boolean
}

export const useCookieStore = defineStore('cookies', () => {
  const hasConsented = ref<boolean>(false)
  const showBanner = ref<boolean>(false)
  const showSettings = ref<boolean>(false)
  
  const preferences = ref<CookiePreferences>({
    essential: true,
    preferences: false,
    analytics: false,
    marketing: false
  })

  const STORAGE_KEY = 'veyron_cookie_preferences'
  const CONSENT_KEY = 'veyron_cookie_consent'

  const loadPreferences = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const consented = localStorage.getItem(CONSENT_KEY)
      
      if (stored) {
        preferences.value = JSON.parse(stored)
      }
      
      if (consented) {
        hasConsented.value = true
        showBanner.value = false
      } else {
        showBanner.value = true
      }
    } catch (error) {
      console.error('Erreur lors du chargement des préférences cookies:', error)
    }
  }

  const savePreferences = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences.value))
      localStorage.setItem(CONSENT_KEY, 'true')
      hasConsented.value = true
      showBanner.value = false
      showSettings.value = false
      
      applyPreferences()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des préférences cookies:', error)
    }
  }

  const acceptAll = () => {
    preferences.value = {
      essential: true,
      preferences: true,
      analytics: true,
      marketing: true
    }
    savePreferences()
  }

  const rejectAll = () => {
    preferences.value = {
      essential: true,
      preferences: false,
      analytics: false,
      marketing: false
    }
    savePreferences()
  }

  const openSettings = () => {
    showSettings.value = true
  }

  const closeSettings = () => {
    showSettings.value = false
  }

  const applyPreferences = () => {
    if (preferences.value.analytics) {
      enableAnalytics()
    } else {
      disableAnalytics()
    }

    if (preferences.value.marketing) {
      enableMarketing()
    } else {
      disableMarketing()
    }
  }

  const enableAnalytics = () => {
    console.log('Analytics cookies enabled')
  }

  const disableAnalytics = () => {
    console.log('Analytics cookies disabled')
  }

  const enableMarketing = () => {
    console.log('Marketing cookies enabled')
  }

  const disableMarketing = () => {
    console.log('Marketing cookies disabled')
  }

  loadPreferences()

  return {
    hasConsented,
    showBanner,
    showSettings,
    preferences,
    loadPreferences,
    savePreferences,
    acceptAll,
    rejectAll,
    openSettings,
    closeSettings
  }
})
