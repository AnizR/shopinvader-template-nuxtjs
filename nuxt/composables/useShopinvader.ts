import { useNuxtApp } from '#app'
import { AuthService } from '~~/services'
import { Settings, User, Cart } from '~~/models'
import { Shopinvader, ShopinvaderServiceList } from '~~/plugins/shopinvader'

export const useShopinvader = (): Shopinvader => {
  return useNuxtApp().$shopinvader
}

export const useShopinvaderServices = (): ShopinvaderServiceList | null => {
  const { services } = useShopinvader()
  return services || null
}

export const useCart = (): Ref<Cart | null> => {
  const { services } = useShopinvader()
  return services?.cart?.getCart() || ref(null)
}

export const useAuth = (): AuthService | null => {
  const { services } = useShopinvader()
  return services?.auth || null
}

/**
 * Get the settings from the API
 * @returns Settings
 */
export const useSettings = (): Settings | null => {
  const { services } = useShopinvader()
  return services?.settings?.options || null
}
